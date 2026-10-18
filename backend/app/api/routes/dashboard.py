from typing import Optional, List, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization
from backend.app.models.models import Organization, Campaign, Influencer, CampaignPerformance
from backend.app.analytics.kpi import aggregate_kpis, calculate_roas, calculate_cpa, calculate_conversion_rate

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_filtered_query(
    db: Session,
    org_id: int,
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    query = (
        db.query(CampaignPerformance)
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .join(Influencer, CampaignPerformance.influencer_id == Influencer.id)
        .filter(Campaign.organization_id == org_id)
    )
    if campaign_id:
        query = query.filter(CampaignPerformance.campaign_id == campaign_id)
    if platform:
        query = query.filter(Influencer.platform == platform.upper())
    if start_date:
        query = query.filter(CampaignPerformance.date >= start_date)
    if end_date:
        query = query.filter(CampaignPerformance.date <= end_date)
    return query


@router.get("/summary")
def get_dashboard_summary(
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    perfs = get_filtered_query(db, org.id, campaign_id, platform, start_date, end_date).all()
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


@router.get("/trends")
def get_dashboard_trends(
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = (
        db.query(
            CampaignPerformance.date,
            func.sum(CampaignPerformance.spend).label("spend"),
            func.sum(CampaignPerformance.attributed_revenue).label("revenue"),
            func.sum(CampaignPerformance.impressions).label("impressions"),
            func.sum(CampaignPerformance.clicks).label("clicks"),
            func.sum(CampaignPerformance.conversions).label("conversions")
        )
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .join(Influencer, CampaignPerformance.influencer_id == Influencer.id)
        .filter(Campaign.organization_id == org.id)
    )
    if campaign_id:
        query = query.filter(CampaignPerformance.campaign_id == campaign_id)
    if platform:
        query = query.filter(Influencer.platform == platform.upper())
    if start_date:
        query = query.filter(CampaignPerformance.date >= start_date)
    if end_date:
        query = query.filter(CampaignPerformance.date <= end_date)

    rows = query.group_by(CampaignPerformance.date).order_by(CampaignPerformance.date.asc()).all()

    trends = []
    for r in rows:
        sp = float(r.spend or 0.0)
        rev = float(r.revenue or 0.0)
        roas = calculate_roas(rev, sp)
        trends.append({
            "date": r.date.strftime("%Y-%m-%d"),
            "spend": round(sp, 2),
            "revenue": round(rev, 2),
            "roas": roas if roas is not None else 0.0,
            "impressions": int(r.impressions or 0),
            "clicks": int(r.clicks or 0),
            "conversions": int(r.conversions or 0),
        })
    return trends


@router.get("/top-campaigns")
def get_top_campaigns(
    limit: int = 5,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(Campaign.organization_id == org.id).all()
    results = []
    for c in campaigns:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == c.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        roas = calculate_roas(rev, sp)
        results.append({
            "id": c.id,
            "name": c.name,
            "platform": c.platform,
            "status": c.status,
            "allocated_budget": c.allocated_budget,
            "spend": round(sp, 2),
            "revenue": round(rev, 2),
            "roas": roas if roas is not None else 0.0,
            "conversions": conv,
            "cpa": calculate_cpa(sp, conv)
        })
    results.sort(key=lambda x: x["revenue"], reverse=True)
    return results[:limit]


@router.get("/top-influencers")
def get_top_influencers(
    limit: int = 5,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    influencers = db.query(Influencer).filter(Influencer.organization_id == org.id).all()
    results = []
    for inf in influencers:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        clicks = sum(p.clicks for p in perfs)
        impr = sum(p.impressions for p in perfs)
        eng = sum(p.engagements for p in perfs)
        roas = calculate_roas(rev, sp)

        results.append({
            "id": inf.id,
            "name": inf.name,
            "handle": inf.handle,
            "platform": inf.platform,
            "niche": inf.niche,
            "followers": inf.follower_count,
            "quality_score": inf.audience_quality_score,
            "spend": round(sp, 2),
            "revenue": round(rev, 2),
            "roas": roas if roas is not None else 0.0,
            "conversions": conv,
            "cpa": calculate_cpa(sp, conv),
            "cvr": calculate_conversion_rate(conv, clicks)
        })
    results.sort(key=lambda x: x["revenue"], reverse=True)
    return results[:limit]
