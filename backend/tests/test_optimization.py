import pytest
import numpy as np
from backend.app.optimization.curves import ExponentialResponseCurve, estimate_curve_parameters
from backend.app.optimization.solver import InfluencerBudgetProblem


def test_exponential_response_curve():
    A = 500000.0
    k = 0.00002
    curve = ExponentialResponseCurve(A, k)

    # At zero budget, revenue is 0
    assert curve.revenue(0.0) == 0.0

    # Monotonically increasing
    rev_50k = curve.revenue(50000.0)
    rev_100k = curve.revenue(100000.0)
    assert rev_100k > rev_50k

    # Revenue strictly below saturation A
    assert rev_100k < A

    # Marginal return strictly diminishing: dR/db(50k) > dR/db(100k)
    mr_50k = curve.marginal_return(50000.0)
    mr_100k = curve.marginal_return(100000.0)
    assert mr_50k > mr_100k > 0.0


def test_optimization_budget_conservation():
    influencers = [
        {"id": 1, "name": "Inf 1", "handle": "inf1", "platform": "INSTAGRAM", "niche": "Tech", "spend": 50000, "attributed_revenue": 180000, "audience_quality_score": 90, "min_budget": 5000, "max_budget": 200000},
        {"id": 2, "name": "Inf 2", "handle": "inf2", "platform": "YOUTUBE", "niche": "Tech", "spend": 40000, "attributed_revenue": 160000, "audience_quality_score": 88, "min_budget": 5000, "max_budget": 200000},
        {"id": 3, "name": "Inf 3", "handle": "inf3", "platform": "INSTAGRAM", "niche": "Beauty", "spend": 30000, "attributed_revenue": 90000, "audience_quality_score": 82, "min_budget": 5000, "max_budget": 200000},
    ]

    total_budget = 250000.0
    problem = InfluencerBudgetProblem(influencers, total_budget=total_budget, objective="MAX_REVENUE")
    result = problem.solve()

    assert result["solver_status"] in ("SUCCESS", "CONVERGED_WITH_WARNING")
    # Verify exact budget conservation
    sum_recommended = sum(a["recommended_budget"] for a in result["allocations"])
    assert abs(sum_recommended - total_budget) < 1.0

    # Verify each influencer is within bounds
    for alloc in result["allocations"]:
        assert alloc["recommended_budget"] >= 5000.0 - 0.01
        assert alloc["recommended_budget"] <= 200000.0 + 0.01


def test_optimization_infeasible_detection():
    influencers = [
        {"id": 1, "name": "Inf 1", "handle": "inf1", "platform": "INSTAGRAM", "niche": "Tech", "spend": 50000, "attributed_revenue": 180000, "min_budget": 60000},
        {"id": 2, "name": "Inf 2", "handle": "inf2", "platform": "YOUTUBE", "niche": "Tech", "spend": 40000, "attributed_revenue": 160000, "min_budget": 50000},
    ]
    # Total minimum is 110,000, but available budget is only 80,000
    problem = InfluencerBudgetProblem(influencers, total_budget=80000.0)
    result = problem.solve()

    assert result["solver_status"] == "INFEASIBLE"
    assert "exceeds total available budget" in result["solver_message"]


def test_optimization_platform_caps():
    influencers = [
        {"id": 1, "name": "Inf 1", "handle": "inf1", "platform": "INSTAGRAM", "niche": "Fashion", "spend": 50000, "attributed_revenue": 200000, "min_budget": 0},
        {"id": 2, "name": "Inf 2", "handle": "inf2", "platform": "INSTAGRAM", "niche": "Fashion", "spend": 50000, "attributed_revenue": 220000, "min_budget": 0},
        {"id": 3, "name": "Inf 3", "handle": "inf3", "platform": "YOUTUBE", "niche": "Tech", "spend": 50000, "attributed_revenue": 150000, "min_budget": 0},
    ]

    total_budget = 200000.0
    # Instagram capped at 80,000
    caps = {"INSTAGRAM": 80000.0}
    problem = InfluencerBudgetProblem(influencers, total_budget=total_budget, platform_caps=caps)
    result = problem.solve()

    assert result["solver_status"] in ("SUCCESS", "CONVERGED_WITH_WARNING")
    instagram_sum = sum(
        a["recommended_budget"] for a in result["allocations"] if a["platform"] == "INSTAGRAM"
    )
    assert instagram_sum <= 80000.0 + 1.0
