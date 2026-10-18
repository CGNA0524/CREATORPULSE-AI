from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import Influencer, CampaignPerformance, Organization, User, AuditLog
from backend.app.schemas.all_schemas import InfluencerCreate, InfluencerUpdate, InfluencerResponse
from backend.app.analytics.kpi import (
    calculate_roas, calculate_cpa, calculate_conversion_rate, calculate_engagement_rate
)
from backend.app.optimization.curves import estimate_curve_parameters, ExponentialResponseCurve

router = APIRouter(prefix="/influencers", tags=["Influencers"])


@router.get("", response_model=List[InfluencerResponse])
def get_influencers(
    platform: Optional[str] = None,
    niche: Optional[str] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = db.query(Influencer).filter(Influencer.organization_id == org.id)
    if platform:
        query = query.filter(Influencer.platform == platform.upper())
    if niche:
        query = query.filter(Influencer.niche == niche)

    influencers = query.all()
    results = []

    for inf in influencers:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        clicks = sum(p.clicks for p in perfs)
        impr = sum(p.impressions for p in perfs)
        eng = sum(p.engagements for p in perfs)

        results.append(InfluencerResponse(
            id=inf.id,
            organization_id=inf.organization_id,
            name=inf.name,
            handle=inf.handle,
            platform=inf.platform,
            niche=inf.niche,
            follower_count=inf.follower_count,
            audience_quality_score=inf.audience_quality_score,
            created_at=inf.created_at,
            total_spend=round(sp, 2),
            attributed_revenue=round(rev, 2),
            roas=calculate_roas(rev, sp) or 0.0,
            conversions=conv,
            cpa=calculate_cpa(sp, conv),
            conversion_rate=calculate_conversion_rate(conv, clicks),
            engagement_rate=calculate_engagement_rate(eng, impr)
        ))

    results.sort(key=lambda x: x.attributed_revenue or 0.0, reverse=True)
    return results


@router.post("", response_model=InfluencerResponse, status_code=status.HTTP_201_CREATED)
def create_influencer(
    inf_in: InfluencerCreate,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clean_handle = inf_in.handle.strip().lstrip("@")
    existing = db.query(Influencer).filter(
        Influencer.organization_id == org.id,
        Influencer.handle == clean_handle,
        Influencer.platform == inf_in.platform.upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Influencer @{clean_handle} already exists on {inf_in.platform}."
        )

    new_inf = Influencer(
        organization_id=org.id,
        name=inf_in.name,
        handle=clean_handle,
        platform=inf_in.platform.upper(),
        niche=inf_in.niche,
        follower_count=inf_in.follower_count,
        audience_quality_score=inf_in.audience_quality_score,
        created_at=datetime.utcnow()
    )
    db.add(new_inf)
    db.flush()

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="CREATE_INFLUENCER",
        entity_type="INFLUENCER",
        entity_id=str(new_inf.id),
        details_json={"handle": new_inf.handle, "platform": new_inf.platform}
    ))
    db.commit()
    db.refresh(new_inf)

    return InfluencerResponse(
        id=new_inf.id,
        organization_id=new_inf.organization_id,
        name=new_inf.name,
        handle=new_inf.handle,
        platform=new_inf.platform,
        niche=new_inf.niche,
        follower_count=new_inf.follower_count,
        audience_quality_score=new_inf.audience_quality_score,
        created_at=new_inf.created_at,
        total_spend=0.0,
        attributed_revenue=0.0,
        roas=0.0,
        conversions=0,
        cpa=None,
        conversion_rate=None,
        engagement_rate=None
    )


@router.get("/{influencer_id}")
def get_influencer_detail(
    influencer_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    inf = db.query(Influencer).filter(Influencer.id == influencer_id, Influencer.organization_id == org.id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")

    perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).order_by(CampaignPerformance.date.asc()).all()
    sp = sum(p.spend for p in perfs)
    rev = sum(p.attributed_revenue for p in perfs)
    conv = sum(p.conversions for p in perfs)
    clicks = sum(p.clicks for p in perfs)
    impr = sum(p.impressions for p in perfs)
    eng = sum(p.engagements for p in perfs)

    roas = calculate_roas(rev, sp) or 0.0

    # Calibrate response curve
    A, k = estimate_curve_parameters(sp, rev, roas, inf.audience_quality_score)
    curve = ExponentialResponseCurve(A, k)
    marginal_return_current = curve.marginal_return(sp)
    saturation = curve.saturation_pct(sp)

    # Generate response curve points for visual curve preview
    curve_points = []
    max_b = max(100000.0, sp * 2.0)
    for b_pt in range(0, int(max_b) + 1, int(max_b / 20)):
        curve_points.append({
            "budget": b_pt,
            "expected_revenue": round(curve.revenue(b_pt), 2),
            "marginal_return": round(curve.marginal_return(b_pt), 4)
        })

    return {
        "influencer": {
            "id": inf.id,
            "name": inf.name,
            "handle": inf.handle,
            "platform": inf.platform,
            "niche": inf.niche,
            "follower_count": inf.follower_count,
            "audience_quality_score": inf.audience_quality_score,
            "created_at": inf.created_at,
        },
        "metrics": {
            "spend": round(sp, 2),
            "revenue": round(rev, 2),
            "roas": roas,
            "conversions": conv,
            "clicks": clicks,
            "impressions": impr,
            "engagements": eng,
            "cpa": calculate_cpa(sp, conv),
            "conversion_rate": calculate_conversion_rate(conv, clicks),
            "engagement_rate": calculate_engagement_rate(eng, impr),
        },
        "response_model": {
            "saturation_A": round(A, 2),
            "response_rate_k": f"{k:.8f}",
            "current_marginal_return": round(marginal_return_current, 4),
            "current_saturation_pct": round(saturation, 1),
            "curve_points": curve_points,
            "methodology": "Exponential diminishing return model R(b) = A(1 - exp(-k*b)) calibrated to historical operating point."
        }
    }


@router.patch("/{influencer_id}", response_model=InfluencerResponse)
def update_influencer(
    influencer_id: int,
    inf_in: InfluencerUpdate,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inf = db.query(Influencer).filter(Influencer.id == influencer_id, Influencer.organization_id == org.id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")

    if inf_in.name is not None:
        inf.name = inf_in.name
    if inf_in.handle is not None:
        inf.handle = inf_in.handle.strip().lstrip("@")
    if inf_in.platform is not None:
        inf.platform = inf_in.platform.upper()
    if inf_in.niche is not None:
        inf.niche = inf_in.niche
    if inf_in.follower_count is not None:
        inf.follower_count = inf_in.follower_count
    if inf_in.audience_quality_score is not None:
        inf.audience_quality_score = inf_in.audience_quality_score

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="UPDATE_INFLUENCER",
        entity_type="INFLUENCER",
        entity_id=str(inf.id),
        details_json=inf_in.model_dump(exclude_unset=True)
    ))
    db.commit()
    db.refresh(inf)

    perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).all()
    sp = sum(p.spend for p in perfs)
    rev = sum(p.attributed_revenue for p in perfs)
    conv = sum(p.conversions for p in perfs)
    clicks = sum(p.clicks for p in perfs)
    impr = sum(p.impressions for p in perfs)
    eng = sum(p.engagements for p in perfs)

    return InfluencerResponse(
        id=inf.id,
        organization_id=inf.organization_id,
        name=inf.name,
        handle=inf.handle,
        platform=inf.platform,
        niche=inf.niche,
        follower_count=inf.follower_count,
        audience_quality_score=inf.audience_quality_score,
        created_at=inf.created_at,
        total_spend=round(sp, 2),
        attributed_revenue=round(rev, 2),
        roas=calculate_roas(rev, sp) or 0.0,
        conversions=conv,
        cpa=calculate_cpa(sp, conv),
        conversion_rate=calculate_conversion_rate(conv, clicks),
        engagement_rate=calculate_engagement_rate(eng, impr)
    )


@router.get("/{influencer_id}/performance")
def get_influencer_performance(
    influencer_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    inf = db.query(Influencer).filter(Influencer.id == influencer_id, Influencer.organization_id == org.id).first()
    if not inf:
        raise HTTPException(status_code=404, detail="Influencer not found")

    perfs = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id).order_by(CampaignPerformance.date.asc()).all()
    records = []
    for p in perfs:
        roas = calculate_roas(p.attributed_revenue, p.spend)
        records.append({
            "date": p.date.strftime("%Y-%m-%d"),
            "spend": round(p.spend, 2),
            "revenue": round(p.attributed_revenue, 2),
            "roas": roas if roas is not None else 0.0,
            "impressions": p.impressions,
            "clicks": p.clicks,
            "conversions": p.conversions,
            "cpa": calculate_cpa(p.spend, p.conversions)
        })
    return records
