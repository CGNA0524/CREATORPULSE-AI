import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization
from backend.app.models.models import Campaign, Influencer, CampaignPerformance, OptimizationRun, OptimizationAllocation, Organization
from backend.app.analytics.kpi import calculate_roas, calculate_cpa, calculate_conversion_rate

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/campaigns/export")
def export_campaigns_csv(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(Campaign.organization_id == org.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Campaign ID", "Campaign Name", "Platform", "Objective", "Allocated Budget", "Total Spend", "Revenue", "ROAS", "Conversions", "CPA", "Status"])

    for c in campaigns:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == c.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        roas = calculate_roas(rev, sp) or 0.0
        cpa = calculate_cpa(sp, conv) or 0.0

        writer.writerow([
            c.id, c.name, c.platform, c.objective, c.allocated_budget,
            round(sp, 2), round(rev, 2), f"{roas:.2f}x", conv, f"₹{cpa:.2f}", c.status
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=creatorpulse_campaigns_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/influencers/export")
def export_influencers_csv(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    influencers = db.query(Influencer).filter(Influencer.organization_id == org.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Influencer ID", "Name", "Handle", "Platform", "Niche", "Followers", "Audience Score", "Total Spend", "Revenue", "ROAS", "Conversions", "CPA", "CVR%"])

    for inf in influencers:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        clicks = sum(p.clicks for p in perfs)
        roas = calculate_roas(rev, sp) or 0.0
        cpa = calculate_cpa(sp, conv) or 0.0
        cvr = calculate_conversion_rate(conv, clicks) or 0.0

        writer.writerow([
            inf.id, inf.name, f"@{inf.handle}", inf.platform, inf.niche,
            inf.follower_count, inf.audience_quality_score,
            round(sp, 2), round(rev, 2), f"{roas:.2f}x", conv, f"₹{cpa:.2f}", f"{cvr:.2f}%"
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=creatorpulse_influencers_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@router.get("/optimization/export")
def export_latest_optimization_csv(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    latest_run = (
        db.query(OptimizationRun)
        .filter(OptimizationRun.organization_id == org.id)
        .order_by(OptimizationRun.created_at.desc())
        .first()
    )
    if not latest_run:
        raise HTTPException(status_code=404, detail="No optimization run found to export.")

    allocations = (
        db.query(OptimizationAllocation)
        .filter(OptimizationAllocation.optimization_run_id == latest_run.id)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Run ID", latest_run.id,
        "Total Budget", f"₹{latest_run.total_budget:,.2f}",
        "Objective", latest_run.objective,
        "Projected Revenue", f"₹{latest_run.optimized_expected_revenue:,.2f}",
        "Baseline Revenue", f"₹{latest_run.baseline_expected_revenue:,.2f}",
    ])
    writer.writerow([])
    writer.writerow(["Influencer Handle", "Platform", "Baseline Budget", "Recommended Budget", "Budget Shift", "Expected Revenue", "Expected Contribution", "Marginal Return"])

    for a in allocations:
        inf = db.query(Influencer).filter(Influencer.id == a.influencer_id).first()
        handle = f"@{inf.handle}" if inf else "Unknown"
        platform = inf.platform if inf else ""
        diff = a.recommended_budget - a.baseline_budget

        writer.writerow([
            handle, platform, round(a.baseline_budget, 2), round(a.recommended_budget, 2),
            round(diff, 2), round(a.expected_revenue, 2), round(a.expected_contribution, 2),
            round(a.marginal_return, 4)
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=creatorpulse_optimization_run_{latest_run.id}.csv"}
    )
