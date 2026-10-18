from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.deps import get_current_organization, get_current_user
from backend.app.models.models import (
    Campaign, Influencer, CampaignPerformance, OptimizationRun,
    OptimizationAllocation, Organization, User, AuditLog
)
from backend.app.schemas.all_schemas import (
    OptimizationRequest, OptimizationResponse, AllocationRecommendation
)
from backend.app.optimization.solver import InfluencerBudgetProblem

router = APIRouter(prefix="/optimization", tags=["Optimization"])


def prepare_influencers_payload(
    db: Session,
    org_id: int,
    campaign_id: Optional[int] = None,
    influencer_constraints: Optional[list] = None
) -> List[dict]:
    query = db.query(Influencer).filter(Influencer.organization_id == org_id)
    influencers = query.all()

    constraints_map = {}
    if influencer_constraints:
        for c in influencer_constraints:
            constraints_map[c.influencer_id] = c

    inf_list = []
    for inf in influencers:
        perf_query = db.query(CampaignPerformance).filter(CampaignPerformance.influencer_id == inf.id)
        if campaign_id:
            perf_query = perf_query.filter(CampaignPerformance.campaign_id == campaign_id)
        perfs = perf_query.all()

        sp = sum(p.spend for p in perfs)
        rev = sum(p.attributed_revenue for p in perfs)

        c = constraints_map.get(inf.id)
        min_b = c.min_budget if c else 0.0
        max_b = c.max_budget if c else None
        eligible = c.is_eligible if c else True
        fixed_b = c.fixed_budget if c else None

        inf_list.append({
            "id": inf.id,
            "name": inf.name,
            "handle": inf.handle,
            "platform": inf.platform,
            "niche": inf.niche,
            "spend": sp,
            "attributed_revenue": rev,
            "audience_quality_score": inf.audience_quality_score,
            "min_budget": min_b,
            "max_budget": max_b,
            "is_eligible": eligible,
            "fixed_budget": fixed_b,
        })
    return inf_list


@router.post("/validate")
def validate_optimization_feasibility(
    opt_req: OptimizationRequest,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    inf_list = prepare_influencers_payload(db, org.id, opt_req.campaign_id, opt_req.influencer_constraints)
    problem = InfluencerBudgetProblem(
        influencers=inf_list,
        total_budget=opt_req.total_budget,
        objective=opt_req.objective,
        gross_margin_pct=opt_req.gross_margin_pct or org.gross_margin_pct or 40.0,
        platform_caps=opt_req.platform_caps
    )
    is_feasible, msg = problem.check_feasibility()
    return {
        "is_feasible": is_feasible,
        "message": msg,
        "total_budget": opt_req.total_budget,
        "influencer_count": len(inf_list)
    }


@router.post("/run", response_model=OptimizationResponse)
def run_optimization(
    opt_req: OptimizationRequest,
    org: Organization = Depends(get_current_organization),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inf_list = prepare_influencers_payload(db, org.id, opt_req.campaign_id, opt_req.influencer_constraints)
    margin = opt_req.gross_margin_pct if opt_req.gross_margin_pct is not None else (org.gross_margin_pct or 40.0)

    problem = InfluencerBudgetProblem(
        influencers=inf_list,
        total_budget=opt_req.total_budget,
        objective=opt_req.objective,
        gross_margin_pct=margin,
        platform_caps=opt_req.platform_caps
    )

    opt_result = problem.solve()

    if opt_result.get("solver_status") == "INFEASIBLE":
        return OptimizationResponse(
            run_id=None,
            total_budget=opt_req.total_budget,
            objective=opt_req.objective,
            solver_status="INFEASIBLE",
            solver_message=opt_result["solver_message"],
            baseline_expected_revenue=0.0,
            optimized_expected_revenue=0.0,
            revenue_change=0.0,
            revenue_change_pct=0.0,
            baseline_expected_contribution=0.0,
            optimized_expected_contribution=0.0,
            contribution_change=0.0,
            baseline_roas=0.0,
            optimized_roas=0.0,
            budget_utilization_pct=0.0,
            allocations=[],
            assumptions_note=opt_result["assumptions_note"]
        )

    # Persist in OptimizationRun
    opt_run = OptimizationRun(
        campaign_id=opt_req.campaign_id,
        organization_id=org.id,
        total_budget=opt_req.total_budget,
        objective=opt_req.objective,
        constraints_json={
            "gross_margin_pct": margin,
            "platform_caps": opt_req.platform_caps or {},
        },
        baseline_expected_revenue=opt_result["baseline_expected_revenue"],
        optimized_expected_revenue=opt_result["optimized_expected_revenue"],
        baseline_expected_contribution=opt_result["baseline_expected_contribution"],
        optimized_expected_contribution=opt_result["optimized_expected_contribution"],
        solver_status=opt_result["solver_status"],
        solver_message=opt_result["solver_message"]
    )
    db.add(opt_run)
    db.flush()

    # Save allocations
    for alloc in opt_result["allocations"]:
        db.add(OptimizationAllocation(
            optimization_run_id=opt_run.id,
            influencer_id=alloc["influencer_id"],
            baseline_budget=alloc["baseline_budget"],
            recommended_budget=alloc["recommended_budget"],
            expected_revenue=alloc["expected_revenue"],
            expected_contribution=alloc["expected_contribution"],
            marginal_return=alloc["marginal_return"]
        ))

    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="RUN_OPTIMIZATION",
        entity_type="OPTIMIZATION_RUN",
        entity_id=str(opt_run.id),
        details_json={
            "total_budget": opt_req.total_budget,
            "objective": opt_req.objective,
            "revenue_gain": opt_result["revenue_change"]
        }
    ))
    db.commit()

    allocations_out = [AllocationRecommendation(**a) for a in opt_result["allocations"]]

    return OptimizationResponse(
        run_id=opt_run.id,
        total_budget=opt_result["total_budget"],
        objective=opt_result["objective"],
        solver_status=opt_result["solver_status"],
        solver_message=opt_result["solver_message"],
        baseline_expected_revenue=opt_result["baseline_expected_revenue"],
        optimized_expected_revenue=opt_result["optimized_expected_revenue"],
        revenue_change=opt_result["revenue_change"],
        revenue_change_pct=opt_result["revenue_change_pct"],
        baseline_expected_contribution=opt_result["baseline_expected_contribution"],
        optimized_expected_contribution=opt_result["optimized_expected_contribution"],
        contribution_change=opt_result["contribution_change"],
        baseline_roas=opt_result["baseline_roas"],
        optimized_roas=opt_result["optimized_roas"],
        budget_utilization_pct=opt_result["budget_utilization_pct"],
        allocations=allocations_out,
        assumptions_note=opt_result["assumptions_note"]
    )


@router.get("/runs")
def list_optimization_runs(
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    runs = (
        db.query(OptimizationRun)
        .filter(OptimizationRun.organization_id == org.id)
        .order_by(OptimizationRun.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "campaign_id": r.campaign_id,
            "total_budget": r.total_budget,
            "objective": r.objective,
            "solver_status": r.solver_status,
            "baseline_expected_revenue": r.baseline_expected_revenue,
            "optimized_expected_revenue": r.optimized_expected_revenue,
            "revenue_gain": round(r.optimized_expected_revenue - r.baseline_expected_revenue, 2),
            "created_at": r.created_at,
        }
        for r in runs
    ]


@router.get("/runs/{run_id}")
def get_optimization_run_detail(
    run_id: int,
    org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    run = (
        db.query(OptimizationRun)
        .filter(OptimizationRun.id == run_id, OptimizationRun.organization_id == org.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Optimization run not found")

    allocations = (
        db.query(OptimizationAllocation)
        .filter(OptimizationAllocation.optimization_run_id == run.id)
        .all()
    )

    alloc_data = []
    for a in allocations:
        inf = db.query(Influencer).filter(Influencer.id == a.influencer_id).first()
        diff = a.recommended_budget - a.baseline_budget
        diff_pct = (diff / a.baseline_budget * 100.0) if a.baseline_budget > 0 else 0.0
        alloc_data.append({
            "influencer_id": a.influencer_id,
            "influencer_name": inf.name if inf else "Unknown",
            "handle": inf.handle if inf else "",
            "platform": inf.platform if inf else "",
            "niche": inf.niche if inf else "",
            "baseline_budget": a.baseline_budget,
            "recommended_budget": a.recommended_budget,
            "budget_change": round(diff, 2),
            "budget_change_pct": round(diff_pct, 1),
            "expected_revenue": a.expected_revenue,
            "expected_contribution": a.expected_contribution,
            "marginal_return": a.marginal_return,
        })

    return {
        "run": {
            "id": run.id,
            "campaign_id": run.campaign_id,
            "total_budget": run.total_budget,
            "objective": run.objective,
            "baseline_expected_revenue": run.baseline_expected_revenue,
            "optimized_expected_revenue": run.optimized_expected_revenue,
            "revenue_change": round(run.optimized_expected_revenue - run.baseline_expected_revenue, 2),
            "solver_status": run.solver_status,
            "solver_message": run.solver_message,
            "created_at": run.created_at,
        },
        "allocations": alloc_data
    }
