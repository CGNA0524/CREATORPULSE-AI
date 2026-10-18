from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization
from backend.app.models.models import Campaign, Influencer, CampaignPerformance, Organization
from backend.app.predictive.regressors import train_and_evaluate_regressors

router = APIRouter(prefix="/predictive", tags=["Predictive Analytics"])


@router.get("/benchmark")
def get_predictive_benchmark(
    target: str = Query("attributed_revenue", pattern="^(attributed_revenue|conversions|clicks|spend)$"),
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    """
    Train Ridge, Random Forest, and Gradient Boosting against a DummyRegressor baseline
    on actual campaign performance records.
    """
    query = (
        db.query(
            CampaignPerformance.spend,
            CampaignPerformance.impressions,
            CampaignPerformance.reach,
            CampaignPerformance.engagements,
            CampaignPerformance.clicks,
            CampaignPerformance.conversions,
            CampaignPerformance.attributed_revenue,
            Influencer.audience_quality_score,
            Influencer.follower_count
        )
        .join(Campaign, CampaignPerformance.campaign_id == Campaign.id)
        .join(Influencer, CampaignPerformance.influencer_id == Influencer.id)
        .filter(Campaign.organization_id == org.id)
    )
    rows = query.all()

    data = [
        {
            "spend": float(r.spend or 0.0),
            "impressions": int(r.impressions or 0),
            "reach": int(r.reach or 0),
            "engagements": int(r.engagements or 0),
            "clicks": int(r.clicks or 0),
            "conversions": int(r.conversions or 0),
            "attributed_revenue": float(r.attributed_revenue or 0.0),
            "audience_quality_score": float(r.audience_quality_score or 85.0),
            "follower_count": int(r.follower_count or 0),
        }
        for r in rows
    ]

    result = train_and_evaluate_regressors(data, target_metric=target)
    return result
