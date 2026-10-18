from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import Scenario, Organization, User, AuditLog
from backend.app.schemas.all_schemas import (
    ScenarioCreate, ScenarioResponse, OptimizationRequest,
    OptimizationResponse, ScenarioCompareRequest
)
from backend.app.api.routes.optimization import prepare_influencers_payload
from backend.app.optimization.solver import InfluencerBudgetProblem

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.post("/simulate")
def simulate_scenario(
    sim_req: OptimizationRequest,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    """
    Run on-the-fly What-If simulation without saving to database.
    """
    inf_list = prepare_influencers_payload(db, org.id, sim_req.campaign_id, sim_req.influencer_constraints)
    margin = sim_req.gross_margin_pct if sim_req.gross_margin_pct is not None else (org.gross_margin_pct or 40.0)

    problem = InfluencerBudgetProblem(
        influencers=inf_list,
        total_budget=sim_req.total_budget,
        objective=sim_req.objective,
        gross_margin_pct=margin,
        platform_caps=sim_req.platform_caps
    )
    result = problem.solve()
    return result


@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(
    campaign_id: Optional[int] = None,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    query = db.query(Scenario).filter(Scenario.organization_id == org.id)
    if campaign_id:
        query = query.filter(Scenario.campaign_id == campaign_id)
    return query.order_by(Scenario.created_at.desc()).all()


@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_scenario(
    scenario_in: ScenarioCreate,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_scenario = Scenario(
        organization_id=org.id,
        campaign_id=scenario_in.campaign_id,
        name=scenario_in.name,
        description=scenario_in.description,
        assumptions_json=scenario_in.assumptions,
        baseline_results_json=scenario_in.baseline_results,
        scenario_results_json=scenario_in.scenario_results,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_scenario)
    db.flush()

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="CREATE_SCENARIO",
        entity_type="SCENARIO",
        entity_id=str(new_scenario.id),
        details_json={"name": new_scenario.name}
    ))
    db.commit()
    db.refresh(new_scenario)
    return new_scenario


@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(
    scenario_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    scen = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == org.id).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scen


@router.delete("/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scen = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == org.id).first()
    if not scen:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(scen)
    db.commit()
    return {"message": f"Scenario '{scen.name}' deleted successfully."}


@router.post("/compare")
def compare_scenarios(
    compare_req: ScenarioCompareRequest,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    scenarios = (
        db.query(Scenario)
        .filter(Scenario.id.in_(compare_req.scenario_ids), Scenario.organization_id == org.id)
        .all()
    )
    if not scenarios:
        raise HTTPException(status_code=404, detail="No matching scenarios found to compare.")

    comparison = []
    for s in scenarios:
        assumptions = s.assumptions_json or {}
        scenario_res = s.scenario_results_json or {}
        baseline_res = s.baseline_results_json or {}

        tot_b = assumptions.get("total_budget", 0.0)
        proj_rev = scenario_res.get("optimized_expected_revenue") or scenario_res.get("expected_revenue", 0.0)
        base_rev = baseline_res.get("baseline_expected_revenue") or baseline_res.get("expected_revenue", 0.0)
        rev_gain = proj_rev - base_rev

        comparison.append({
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "total_budget": tot_b,
            "objective": assumptions.get("objective", "MAX_REVENUE"),
            "projected_revenue": round(proj_rev, 2),
            "baseline_revenue": round(base_rev, 2),
            "projected_gain": round(rev_gain, 2),
            "projected_roas": round(proj_rev / tot_b, 2) if tot_b > 0 else 0.0,
            "platform_caps": assumptions.get("platform_caps", {}),
            "created_at": s.created_at,
        })
    return comparison
