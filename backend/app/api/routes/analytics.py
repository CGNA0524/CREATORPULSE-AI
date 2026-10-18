from typing import Optional, List, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization
from backend.app.models.models import Organization, Campaign, Influencer, CampaignPerformance
from backend.app.analytics.kpi import (
    aggregate_kpis, calculate_roas, calculate_cpa, calculate_conversion_rate,
    calculate_engagement_rate, calculate_cpc, calculate_cpm
)
from backend.app.schemas.all_schemas import PlatformComparisonItem, FunnelMetrics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def get_analytics_overview(
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    influencer_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = (
        db.query(CampaignPerformance)
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .join(Influencer, CampaignPerformance.influencer_id == Influencer.id)
        .filter(Campaign.organization_id == org.id)
    )
    if campaign_id:
        query = query.filter(CampaignPerformance.campaign_id == campaign_id)
    if platform:
        query = query.filter(Influencer.platform == platform.upper())
    if influencer_id:
        query = query.filter(CampaignPerformance.influencer_id == influencer_id)
    if start_date:
        query = query.filter(CampaignPerformance.date >= start_date)
    if end_date:
        query = query.filter(CampaignPerformance.date <= end_date)

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
    summary = aggregate_kpis(records)
    summary["currency"] = org.currency or "INR"
    return summary


@router.get("/campaign-comparison")
def get_campaign_comparison(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(Campaign.organization_id == org.id).all()
    results = []
    for c in campaigns:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == c.id).all()
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
        kpi = aggregate_kpis(records)
        results.append({
            "campaign_id": c.id,
            "campaign_name": c.name,
            "platform": c.platform,
            "objective": c.objective,
            "allocated_budget": c.allocated_budget,
            "status": c.status,
            **kpi
        })
    results.sort(key=lambda x: x["attributed_revenue"], reverse=True)
    return results


@router.get("/platform-comparison", response_model=List[PlatformComparisonItem])
def get_platform_comparison(
    campaign_id: Optional[int] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    platforms = ["INSTAGRAM", "YOUTUBE", "TIKTOK"]
    results = []

    for p in platforms:
        query = (
            db.query(CampaignPerformance)
            .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
            .join(Influencer, CampaignPerformance.influencer_id == Influencer.id)
            .filter(Campaign.organization_id == org.id, Influencer.platform == p)
        )
        if campaign_id:
            query = query.filter(CampaignPerformance.campaign_id == campaign_id)

        perfs = query.all()
        inf_count = (
            db.query(Influencer)
            .filter(Influencer.organization_id == org.id, Influencer.platform == p)
            .count()
        )

        sp = sum(row.spend for row in perfs)
        rev = sum(row.attributed_revenue for row in perfs)
        conv = sum(row.conversions for row in perfs)

        results.append(PlatformComparisonItem(
            platform=p,
            spend=round(sp, 2),
            revenue=round(rev, 2),
            roas=calculate_roas(rev, sp) or 0.0,
            conversions=conv,
            cpa=calculate_cpa(sp, conv),
            influencer_count=inf_count
        ))

    return results


@router.get("/funnel", response_model=FunnelMetrics)
def get_marketing_funnel(
    campaign_id: Optional[int] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = (
        db.query(CampaignPerformance)
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .filter(Campaign.organization_id == org.id)
    )
    if campaign_id:
        query = query.filter(CampaignPerformance.campaign_id == campaign_id)

    perfs = query.all()
    impr = sum(p.impressions for p in perfs)
    reach = sum(p.reach for p in perfs)
    eng = sum(p.engagements for p in perfs)
    clicks = sum(p.clicks for p in perfs)
    conv = sum(p.conversions for p in perfs)

    ctr = (clicks / impr * 100.0) if impr > 0 else None
    eng_rate = (eng / impr * 100.0) if impr > 0 else None
    cvr = (conv / clicks * 100.0) if clicks > 0 else None

    return FunnelMetrics(
        impressions=impr,
        reach=reach,
        engagements=eng,
        clicks=clicks,
        conversions=conv,
        ctr_pct=round(ctr, 2) if ctr is not None else None,
        engagement_rate_pct=round(eng_rate, 2) if eng_rate is not None else None,
        click_to_conv_pct=round(cvr, 2) if cvr is not None else None
    )
