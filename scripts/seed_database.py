import os
import sys
import csv
from datetime import datetime, date

# Add project root to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.core.database import Base, engine, SessionLocal
from backend.app.core.security import hash_password
from backend.app.models.models import (
    User, Organization, OrganizationMembership, Campaign, Influencer,
    CampaignPerformance, OptimizationRun, OptimizationAllocation,
    Scenario, Insight, AuditLog
)
from backend.app.optimization.solver import InfluencerBudgetProblem
from backend.app.analytics.kpi import aggregate_kpis
from backend.app.insights.rule_engine import generate_deterministic_insights


def seed_database():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_user = db.query(User).filter(User.email == "admin@creatorpulse.ai").first()
        if existing_user:
            print("Database already contains admin user. Re-seeding tables if needed...")

        # 1. Create Organization
        org = db.query(Organization).filter(Organization.name == "PulseBrands Global").first()
        if not org:
            org = Organization(
                name="PulseBrands Global",
                currency="INR",
                gross_margin_pct=40.0,
                created_at=datetime.utcnow()
            )
            db.add(org)
            db.flush()
            print(f"Created organization: {org.name} (ID: {org.id})")

        # 2. Create Admin User
        if not existing_user:
            admin_user = User(
                name="Marketing Lead",
                email="admin@creatorpulse.ai",
                password_hash=hash_password("Admin@123456"),
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.flush()

            # Membership
            membership = OrganizationMembership(
                organization_id=org.id,
                user_id=admin_user.id,
                role="owner"
            )
            db.add(membership)
            print(f"Created admin user: {admin_user.email} (Password: Admin@123456)")
        else:
            admin_user = existing_user

        # 3. Load Influencers
        inf_csv_path = os.path.join(BASE_DIR, "data", "sample_influencers.csv")
        influencers_map = {}
        if os.path.exists(inf_csv_path):
            with open(inf_csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    handle = row["handle"].strip()
                    existing_inf = db.query(Influencer).filter(
                        Influencer.organization_id == org.id,
                        Influencer.handle == handle
                    ).first()
                    if not existing_inf:
                        new_inf = Influencer(
                            organization_id=org.id,
                            name=row["name"],
                            handle=handle,
                            platform=row["platform"].upper(),
                            niche=row["niche"],
                            follower_count=int(row["follower_count"]),
                            audience_quality_score=float(row["audience_quality_score"])
                        )
                        db.add(new_inf)
                        db.flush()
                        influencers_map[handle] = new_inf
                    else:
                        influencers_map[handle] = existing_inf
            print(f"Loaded {len(influencers_map)} influencers.")

        # 4. Load Campaigns
        camp_csv_path = os.path.join(BASE_DIR, "data", "sample_campaigns.csv")
        campaigns_map = {}
        if os.path.exists(camp_csv_path):
            with open(camp_csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cname = row["name"].strip()
                    existing_c = db.query(Campaign).filter(
                        Campaign.organization_id == org.id,
                        Campaign.name == cname
                    ).first()
                    if not existing_c:
                        new_c = Campaign(
                            organization_id=org.id,
                            name=cname,
                            objective=row["objective"].upper(),
                            platform=row["platform"].upper(),
                            start_date=datetime.strptime(row["start_date"], "%Y-%m-%d").date(),
                            end_date=datetime.strptime(row["end_date"], "%Y-%m-%d").date() if row.get("end_date") else None,
                            allocated_budget=float(row["allocated_budget"]),
                            currency=row["currency"],
                            status=row["status"].upper()
                        )
                        db.add(new_c)
                        db.flush()
                        campaigns_map[cname] = new_c
                    else:
                        campaigns_map[cname] = existing_c
            print(f"Loaded {len(campaigns_map)} campaigns.")

        # 5. Load Performance Data
        perf_csv_path = os.path.join(BASE_DIR, "data", "sample_performance.csv")
        perf_count = db.query(CampaignPerformance).count()
        if perf_count == 0 and os.path.exists(perf_csv_path):
            records = []
            with open(perf_csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    camp = campaigns_map.get(row["campaign_name"].strip())
                    inf = influencers_map.get(row["influencer_handle"].strip())
                    if camp and inf:
                        records.append(CampaignPerformance(
                            campaign_id=camp.id,
                            influencer_id=inf.id,
                            date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
                            spend=float(row["spend"]),
                            impressions=int(row["impressions"]),
                            reach=int(row["reach"]),
                            engagements=int(row["engagements"]),
                            clicks=int(row["clicks"]),
                            conversions=int(row["conversions"]),
                            attributed_revenue=float(row["attributed_revenue"])
                        ))
            db.bulk_save_objects(records)
            db.commit()
            print(f"Seeded {len(records)} campaign performance records.")

        # 6. Precompute baseline Optimization Run & Allocations
        primary_camp = db.query(Campaign).filter(Campaign.organization_id == org.id).first()
        if primary_camp:
            # Query influencers with total spend and revenue
            inf_list = []
            for inf in db.query(Influencer).filter(Influencer.organization_id == org.id).all():
                perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).all()
                inf_spend = sum(p.spend for p in perfs)
                inf_rev = sum(p.attributed_revenue for p in perfs)
                inf_list.append({
                    "id": inf.id,
                    "name": inf.name,
                    "handle": inf.handle,
                    "platform": inf.platform,
                    "niche": inf.niche,
                    "spend": inf_spend,
                    "attributed_revenue": inf_rev,
                    "audience_quality_score": inf.audience_quality_score,
                    "min_budget": 20000.0,
                    "max_budget": 600000.0,
                    "is_eligible": True,
                })

            total_b = primary_camp.allocated_budget or 3500000.0
            problem = InfluencerBudgetProblem(
                influencers=inf_list,
                total_budget=total_b,
                objective="MAX_REVENUE",
                gross_margin_pct=40.0
            )
            opt_res = problem.solve()

            opt_run = OptimizationRun(
                campaign_id=primary_camp.id,
                organization_id=org.id,
                total_budget=total_b,
                objective="MAX_REVENUE",
                constraints_json={"min_budget_default": 20000, "max_budget_default": 600000},
                baseline_expected_revenue=opt_res["baseline_expected_revenue"],
                optimized_expected_revenue=opt_res["optimized_expected_revenue"],
                baseline_expected_contribution=opt_res["baseline_expected_contribution"],
                optimized_expected_contribution=opt_res["optimized_expected_contribution"],
                solver_status=opt_res["solver_status"],
                solver_message=opt_res["solver_message"]
            )
            db.add(opt_run)
            db.flush()

            for alloc in opt_res["allocations"]:
                db.add(OptimizationAllocation(
                    optimization_run_id=opt_run.id,
                    influencer_id=alloc["influencer_id"],
                    baseline_budget=alloc["baseline_budget"],
                    recommended_budget=alloc["recommended_budget"],
                    expected_revenue=alloc["expected_revenue"],
                    expected_contribution=alloc["expected_contribution"],
                    marginal_return=alloc["marginal_return"]
                ))
            db.commit()
            print(f"Generated baseline optimization run #{opt_run.id} with {len(opt_res['allocations'])} allocations.")

            # 7. Seed Initial Scenario
            scenario = Scenario(
                organization_id=org.id,
                campaign_id=primary_camp.id,
                name="Q4 Festive Scaling (+20% Budget)",
                description="What-if simulation increasing total campaign budget to ₹4,200,000 with a 35% cap on Instagram spend.",
                assumptions_json={
                    "total_budget": 4200000.0,
                    "objective": "MAX_REVENUE",
                    "gross_margin_pct": 40.0,
                    "platform_caps": {"INSTAGRAM": 1800000.0}
                },
                baseline_results_json={"expected_revenue": opt_res["baseline_expected_revenue"], "roas": opt_res["baseline_roas"]},
                scenario_results_json={"expected_revenue": opt_res["optimized_expected_revenue"] * 1.18, "roas": opt_res["optimized_roas"]}
            )
            db.add(scenario)
            db.commit()
            print(f"Seeded initial what-if scenario: '{scenario.name}'")

            # 8. Generate Evidence-Grounded AI Insights
            all_perfs = db.query(CampaignPerformance).all()
            kpi_data = [
                {
                    "spend": p.spend,
                    "attributed_revenue": p.attributed_revenue,
                    "impressions": p.impressions,
                    "reach": p.reach,
                    "engagements": p.engagements,
                    "clicks": p.clicks,
                    "conversions": p.conversions
                }
                for p in all_perfs
            ]
            kpi_summary = aggregate_kpis(kpi_data)

            # Compute creator-level summary for insights
            for inf_dict in inf_list:
                s = inf_dict["spend"]
                r = inf_dict["attributed_revenue"]
                inf_dict["roas"] = (r / s) if s > 0 else 0.0

            insights = generate_deterministic_insights(
                kpi_summary=kpi_summary,
                influencers=inf_list,
                campaigns=[{"id": primary_camp.id, "name": primary_camp.name}],
                optimization_result=opt_res
            )

            for ins in insights:
                db.add(Insight(
                    organization_id=org.id,
                    campaign_id=primary_camp.id,
                    category=ins["category"],
                    title=ins["title"],
                    explanation=ins["explanation"],
                    evidence_json=ins["evidence_json"],
                    recommended_action=ins["recommended_action"],
                    quality_score=ins["quality_score"],
                    status="ACTIVE"
                ))
            db.commit()
            print(f"Generated {len(insights)} verified AI insights.")

        # 9. Audit Log
        db.add(AuditLog(
            organization_id=org.id,
            user_id=admin_user.id,
            action="INITIAL_SEED",
            entity_type="SYSTEM",
            entity_id="ALL",
            details_json={"message": "Initial database tables and synthetic dataset seeded."}
        ))
        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
