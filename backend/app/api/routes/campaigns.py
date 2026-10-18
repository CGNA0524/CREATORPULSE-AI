from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import Campaign, Influencer, CampaignPerformance, CampaignInfluencer, Organization, User, AuditLog
from backend.app.schemas.all_schemas import CampaignCreate, CampaignUpdate, CampaignResponse
from backend.app.analytics.kpi import aggregate_kpis, calculate_roas, calculate_cpa

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("", response_model=List[CampaignResponse])
def get_campaigns(
    status_filter: Optional[str] = None,
    platform_filter: Optional[str] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = db.query(Campaign).filter(Campaign.organization_id == org.id)
    if status_filter:
        query = query.filter(Campaign.status == status_filter.upper())
    if platform_filter:
        query = query.filter(Campaign.platform == platform_filter.upper())

    campaigns = query.order_by(Campaign.created_at.desc()).all()
    results = []

    for c in campaigns:
        perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == c.id).all()
        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)
        conv = sum(p.conversions for p in perfs)
        roas = calculate_roas(rev, sp)
        cpa = calculate_cpa(sp, conv)

        results.append(CampaignResponse(
            id=c.id,
            organization_id=c.organization_id,
            name=c.name,
            objective=c.objective,
            platform=c.platform,
            start_date=c.start_date,
            end_date=c.end_date,
            allocated_budget=c.allocated_budget,
            currency=c.currency,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at,
            total_spend=round(sp, 2),
            attributed_revenue=round(rev, 2),
            roas=roas if roas is not None else 0.0,
            conversions=conv,
            cpa=cpa
        ))
    return results


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    camp_in: CampaignCreate,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_camp = Campaign(
        organization_id=org.id,
        name=camp_in.name,
        objective=camp_in.objective.upper(),
        platform=camp_in.platform.upper(),
        start_date=camp_in.start_date,
        end_date=camp_in.end_date,
        allocated_budget=camp_in.allocated_budget,
        currency=camp_in.currency or org.currency or "INR",
        status=camp_in.status.upper(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_camp)
    db.flush()

    if camp_in.influencer_ids:
        for inf_id in camp_in.influencer_ids:
            db.add(CampaignInfluencer(
                campaign_id=new_camp.id,
                influencer_id=inf_id,
                planned_budget=camp_in.allocated_budget / len(camp_in.influencer_ids)
            ))

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="CREATE_CAMPAIGN",
        entity_type="CAMPAIGN",
        entity_id=str(new_camp.id),
        details_json={"name": new_camp.name, "allocated_budget": new_camp.allocated_budget}
    ))
    db.commit()
    db.refresh(new_camp)

    return CampaignResponse(
        id=new_camp.id,
        organization_id=new_camp.organization_id,
        name=new_camp.name,
        objective=new_camp.objective,
        platform=new_camp.platform,
        start_date=new_camp.start_date,
        end_date=new_camp.end_date,
        allocated_budget=new_camp.allocated_budget,
        currency=new_camp.currency,
        status=new_camp.status,
        created_at=new_camp.created_at,
        updated_at=new_camp.updated_at,
        total_spend=0.0,
        attributed_revenue=0.0,
        roas=0.0,
        conversions=0,
        cpa=None
    )


@router.get("/{campaign_id}")
def get_campaign_detail(
    campaign_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.organization_id == org.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == camp.id).all()
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

    # Influencer breakdown
    inf_records = {}
    for p in perfs:
        inf_id = p.influencer_id
        if inf_id not in inf_records:
            inf = db.query(Influencer).filter(Influencer.id == inf_id).first()
            inf_records[inf_id] = {
                "id": inf.id if inf else inf_id,
                "name": inf.name if inf else "Unknown",
                "handle": inf.handle if inf else "",
                "platform": inf.platform if inf else "",
                "niche": inf.niche if inf else "",
                "spend": 0.0,
                "revenue": 0.0,
                "conversions": 0,
                "clicks": 0,
                "impressions": 0,
            }
        inf_records[inf_id]["spend"] += p.spend
        inf_records[inf_id]["revenue"] += p.attributed_revenue
        inf_records[inf_id]["conversions"] += p.conversions
        inf_records[inf_id]["clicks"] += p.clicks
        inf_records[inf_id]["impressions"] += p.impressions

    influencer_breakdown = []
    for inf_data in inf_records.values():
        sp = inf_data["spend"]
        rev = inf_data["revenue"]
        conv = inf_data["conversions"]
        inf_data["roas"] = calculate_roas(rev, sp) or 0.0
        inf_data["cpa"] = calculate_cpa(sp, conv)
        inf_data["spend"] = round(sp, 2)
        inf_data["revenue"] = round(rev, 2)
        influencer_breakdown.append(inf_data)

    influencer_breakdown.sort(key=lambda x: x["revenue"], reverse=True)

    return {
        "campaign": {
            "id": camp.id,
            "name": camp.name,
            "objective": camp.objective,
            "platform": camp.platform,
            "start_date": camp.start_date,
            "end_date": camp.end_date,
            "allocated_budget": camp.allocated_budget,
            "currency": camp.currency,
            "status": camp.status,
            "created_at": camp.created_at,
        },
        "kpis": summary,
        "influencers": influencer_breakdown
    }


@router.patch("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    camp_in: CampaignUpdate,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.organization_id == org.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if camp_in.name is not None:
        camp.name = camp_in.name
    if camp_in.objective is not None:
        camp.objective = camp_in.objective.upper()
    if camp_in.platform is not None:
        camp.platform = camp_in.platform.upper()
    if camp_in.start_date is not None:
        camp.start_date = camp_in.start_date
    if camp_in.end_date is not None:
        camp.end_date = camp_in.end_date
    if camp_in.allocated_budget is not None:
        camp.allocated_budget = camp_in.allocated_budget
    if camp_in.currency is not None:
        camp.currency = camp_in.currency
    if camp_in.status is not None:
        camp.status = camp_in.status.upper()

    camp.updated_at = datetime.utcnow()
    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="UPDATE_CAMPAIGN",
        entity_type="CAMPAIGN",
        entity_id=str(camp.id),
        details_json=camp_in.model_dump(exclude_unset=True)
    ))
    db.commit()
    db.refresh(camp)

    perfs = db.query(CampaignPerformance).filter(CampaignPerformance.campaign_id == camp.id).all()
    sp = sum(p.spend for p in perfs)
    rev = sum(p.attributed_revenue for p in perfs)
    conv = sum(p.conversions for p in perfs)

    return CampaignResponse(
        id=camp.id,
        organization_id=camp.organization_id,
        name=camp.name,
        objective=camp.objective,
        platform=camp.platform,
        start_date=camp.start_date,
        end_date=camp.end_date,
        allocated_budget=camp.allocated_budget,
        currency=camp.currency,
        status=camp.status,
        created_at=camp.created_at,
        updated_at=camp.updated_at,
        total_spend=round(sp, 2),
        attributed_revenue=round(rev, 2),
        roas=calculate_roas(rev, sp) or 0.0,
        conversions=conv,
        cpa=calculate_cpa(sp, conv)
    )


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    camp = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.organization_id == org.id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="DELETE_CAMPAIGN",
        entity_type="CAMPAIGN",
        entity_id=str(camp.id),
        details_json={"name": camp.name}
    ))
    db.delete(camp)
    db.commit()
    return {"message": f"Campaign '{camp.name}' deleted successfully."}
