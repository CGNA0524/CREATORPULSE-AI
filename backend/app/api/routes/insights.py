from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import Insight, Campaign, Influencer, CampaignPerformance, OptimizationRun, Organization, User, AuditLog
from backend.app.schemas.all_schemas import InsightResponse
from backend.app.analytics.kpi import aggregate_kpis
from backend.app.insights.rule_engine import generate_deterministic_insights

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("", response_model=List[InsightResponse])
def get_insights(
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    campaign_id: Optional[int] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = db.query(Insight).filter(Insight.organization_id == org.id)
    if status_filter:
        query = query.filter(Insight.status == status_filter.upper())
    else:
        # Default show ACTIVE insights
        query = query.filter(Insight.status.in_(["ACTIVE", "REVIEWED"]))
    if category_filter:
        query = query.filter(Insight.category == category_filter.upper())
    if campaign_id:
        query = query.filter(Insight.campaign_id == campaign_id)

    return query.order_by(Insight.created_at.desc()).all()


@router.post("/generate", response_model=List[InsightResponse])
def generate_insights_now(
    campaign_id: Optional[int] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    """
    Refresh and generate latest evidence-grounded insights from live performance and optimization data.
    """
    # 1. Fetch performance records
    query = (
        db.query(CampaignPerformance)
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .filter(Campaign.organization_id == org.id)
    )
    if campaign_id:
        query = query.filter(CampaignPerformance.campaign_id == campaign_id)
    perfs = query.all()

    records = [
        {
            "spend": p.spend,
            "attributed_revenue": p.attributed_revenue,
            "impressions": p.impressions,
            "reach": p.reach,
            "engagements": p.engagements,
            "clicks": p.clicks,
            "conversions": p.conversions
        }
        for p in perfs
    ]
    kpi_summary = aggregate_kpis(records)

    # 2. Influencer metrics
    influencers = db.query(Influencer).filter(Influencer.organization_id == org.id).all()
    inf_list = []
    for inf in influencers:
        inf_perfs = [p for p in perfs if p.influencer_id == inf.id]
        sp = sum(p.spend for p in inf_perfs)
        rev = sum(p.attributed_revenue for p in inf_perfs)
        conv = sum(p.conversions for p in inf_perfs)
        clicks = sum(p.clicks for p in inf_perfs)
        inf_list.append({
            "id": inf.id,
            "name": inf.name,
            "handle": inf.handle,
            "platform": inf.platform,
            "niche": inf.niche,
            "spend": sp,
            "attributed_revenue": rev,
            "roas": (rev / sp) if sp > 0 else 0.0,
            "conversions": conv,
            "cpa": (sp / conv) if conv > 0 else None,
            "audience_quality_score": inf.audience_quality_score,
        })

    # 3. Latest optimization result
    latest_run = (
        db.query(OptimizationRun)
        .filter(OptimizationRun.organization_id == org.id)
        .order_by(OptimizationRun.created_at.desc())
        .first()
    )
    opt_dict = None
    if latest_run and latest_run.solver_status == "SUCCESS":
        opt_dict = {
            "solver_status": latest_run.solver_status,
            "total_budget": latest_run.total_budget,
            "baseline_expected_revenue": latest_run.baseline_expected_revenue,
            "optimized_expected_revenue": latest_run.optimized_expected_revenue,
            "revenue_change": latest_run.optimized_expected_revenue - latest_run.baseline_expected_revenue,
            "revenue_change_pct": (
                ((latest_run.optimized_expected_revenue - latest_run.baseline_expected_revenue) / latest_run.baseline_expected_revenue * 100.0)
                if latest_run.baseline_expected_revenue > 0 else 0.0
            ),
            "allocations": []
        }

    # Generate insights
    new_insights_data = generate_deterministic_insights(
        kpi_summary=kpi_summary,
        influencers=inf_list,
        campaigns=[],
        optimization_result=opt_dict
    )

    created_insights = []
    for ins in new_insights_data:
        # Check if already exists with same title
        existing = db.query(Insight).filter(
            Insight.organization_id == org.id,
            Insight.title == ins["title"],
            Insight.status == "ACTIVE"
        ).first()
        if not existing:
            new_ins = Insight(
                organization_id=org.id,
                campaign_id=campaign_id,
                category=ins["category"],
                title=ins["title"],
                explanation=ins["explanation"],
                evidence_json=ins["evidence_json"],
                recommended_action=ins["recommended_action"],
                quality_score=ins["quality_score"],
                status="ACTIVE"
            )
            db.add(new_ins)
            created_insights.append(new_ins)

    db.commit()
    return db.query(Insight).filter(Insight.organization_id == org.id, Insight.status == "ACTIVE").all()


@router.post("/{insight_id}/review")
def review_insight(
    insight_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    ins = db.query(Insight).filter(Insight.id == insight_id, Insight.organization_id == org.id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Insight not found")
    ins.status = "REVIEWED"
    db.commit()
    return {"message": "Insight marked as reviewed."}


@router.post("/{insight_id}/dismiss")
def dismiss_insight(
    insight_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    ins = db.query(Insight).filter(Insight.id == insight_id, Insight.organization_id == org.id).first()
    if not ins:
        raise HTTPException(status_code=404, detail="Insight not found")
    ins.status = "DISMISSED"
    db.commit()
    return {"message": "Insight dismissed."}
