from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from scipy.optimize import minimize
from backend.app.optimization.curves import ExponentialResponseCurve, estimate_curve_parameters


class InfluencerBudgetProblem:
    def __init__(
        self,
        influencers: List[Dict[str, Any]],
        total_budget: float,
        objective: str = "MAX_REVENUE",
        gross_margin_pct: float = 40.0,
        platform_caps: Optional[Dict[str, float]] = None,
        custom_curves: Optional[Dict[int, Dict[str, float]]] = None,
    ):
        self.influencers = influencers
        self.n = len(influencers)
        self.total_budget = float(total_budget)
        self.objective = objective.upper()
        self.gross_margin = float(gross_margin_pct) / 100.0 if gross_margin_pct else 1.0
        self.platform_caps = platform_caps or {}
        self.custom_curves = custom_curves or {}

        # Build curves and bounds
        self.curves: List[ExponentialResponseCurve] = []
        self.bounds: List[Tuple[float, float]] = []
        self.baseline_budgets: List[float] = []

        for inf in self.influencers:
            inf_id = inf["id"]
            hist_spend = float(inf.get("spend") or 0.0)
            hist_rev = float(inf.get("attributed_revenue") or 0.0)
            hist_roas = (hist_rev / hist_spend) if hist_spend > 0 else 0.0
            score = float(inf.get("audience_quality_score") or 85.0)

            if inf_id in self.custom_curves:
                A = float(self.custom_curves[inf_id]["A"])
                k = float(self.custom_curves[inf_id]["k"])
            else:
                A, k = estimate_curve_parameters(hist_spend, hist_rev, hist_roas, score)

            self.curves.append(ExponentialResponseCurve(A, k))

            # Bounds & eligibility
            is_eligible = inf.get("is_eligible", True)
            if not is_eligible:
                lb, ub = 0.0, 0.0
            elif inf.get("fixed_budget") is not None and inf.get("fixed_budget") > 0:
                fixed = float(inf["fixed_budget"])
                lb, ub = fixed, fixed
            else:
                lb = max(0.0, float(inf.get("min_budget") or 0.0))
                ub = float(inf.get("max_budget")) if inf.get("max_budget") is not None else self.total_budget
                if ub < lb:
                    ub = lb
            self.bounds.append((lb, ub))
            self.baseline_budgets.append(hist_spend)

    def check_feasibility(self) -> Tuple[bool, str]:
        total_min = sum(b[0] for b in self.bounds)
        total_max = sum(b[1] for b in self.bounds)

        if total_min > self.total_budget + 1e-4:
            return (
                False,
                f"Infeasible: Sum of minimum required influencer allocations (₹{total_min:,.2f}) "
                f"exceeds total available budget (₹{self.total_budget:,.2f}). Please decrease minimum limits."
            )
        if total_max < self.total_budget - 1e-4:
            return (
                False,
                f"Infeasible: Sum of maximum allowed influencer allocations (₹{total_max:,.2f}) "
                f"is less than total budget (₹{self.total_budget:,.2f}). Please raise maximum budget caps."
            )

        # Platform caps check
        for platform, cap in self.platform_caps.items():
            platform_min = sum(
                self.bounds[i][0] for i, inf in enumerate(self.influencers)
                if inf.get("platform", "").upper() == platform.upper()
            )
            if platform_min > cap + 1e-4:
                return (
                    False,
                    f"Infeasible: Minimum budget for platform '{platform}' (₹{platform_min:,.2f}) "
                    f"exceeds platform cap (₹{cap:,.2f})."
                )

        return True, "Problem constraints are mathematically feasible."

    def _objective_func(self, b: np.ndarray) -> float:
        total_rev = 0.0
        for i in range(self.n):
            if b[i] > 0:
                total_rev += self.curves[i].revenue(b[i])

        if self.objective == "MAX_CONTRIBUTION":
            # Maximize (m * Revenue - Spend) => minimize (Spend - m * Revenue)
            spend = float(np.sum(b))
            return spend - (self.gross_margin * total_rev)
        else:
            # Maximize Revenue => minimize -Revenue
            return -total_rev

    def _gradient_func(self, b: np.ndarray) -> np.ndarray:
        grad = np.zeros(self.n)
        for i in range(self.n):
            # dR_i/db_i = A_i * k_i * exp(-k_i * b_i)
            mr = self.curves[i].marginal_return(b[i])
            if self.objective == "MAX_CONTRIBUTION":
                # d(b - m*R)/db_i = 1 - m * dR/db
                grad[i] = 1.0 - (self.gross_margin * mr)
            else:
                # d(-R)/db_i = - dR/db
                grad[i] = -mr
        return grad

    def solve(self) -> Dict[str, Any]:
        if self.n == 0:
            return {
                "solver_status": "FAILED",
                "solver_message": "No influencers provided for optimization.",
                "allocations": [],
            }

        is_feasible, feas_msg = self.check_feasibility()
        if not is_feasible:
            return {
                "solver_status": "INFEASIBLE",
                "solver_message": feas_msg,
                "allocations": [],
                "baseline_expected_revenue": 0.0,
                "optimized_expected_revenue": 0.0,
                "revenue_change": 0.0,
                "revenue_change_pct": 0.0,
                "baseline_expected_contribution": 0.0,
                "optimized_expected_contribution": 0.0,
                "contribution_change": 0.0,
                "baseline_roas": 0.0,
                "optimized_roas": 0.0,
                "budget_utilization_pct": 0.0,
                "total_budget": self.total_budget,
                "objective": self.objective,
                "assumptions_note": "Infeasible constraint set. Solver aborted safely.",
            }

        # Initial point x0: project within bounds
        x0 = np.zeros(self.n)
        active_indices = [i for i in range(self.n) if self.bounds[i][1] > 0]
        if active_indices:
            remaining = self.total_budget
            for i in active_indices:
                lb = self.bounds[i][0]
                x0[i] = lb
                remaining -= lb
            if remaining > 0:
                step = remaining / len(active_indices)
                for i in active_indices:
                    add = min(step, self.bounds[i][1] - x0[i])
                    x0[i] += add
            # Normalize to sum exactly to total_budget if possible within bounds
            cur_sum = np.sum(x0)
            if cur_sum > 0:
                x0 = x0 * (self.total_budget / cur_sum)
                x0 = np.clip(x0, [b[0] for b in self.bounds], [b[1] for b in self.bounds])
        else:
            x0 = np.full(self.n, self.total_budget / self.n)

        # Equality constraint: sum(b) = total_budget
        constraints = [
            {
                "type": "eq",
                "fun": lambda b: np.sum(b) - self.total_budget,
                "jac": lambda b: np.ones(self.n),
            }
        ]

        # Platform cap inequality constraints: cap - sum(b_platform) >= 0
        for platform, cap in self.platform_caps.items():
            mask = np.array([
                1.0 if inf.get("platform", "").upper() == platform.upper() else 0.0
                for inf in self.influencers
            ])
            if np.sum(mask) > 0:
                constraints.append({
                    "type": "ineq",
                    "fun": (lambda m, c: lambda b: c - np.dot(m, b))(mask, cap),
                    "jac": (lambda m: lambda b: -m)(mask),
                })

        # Run SciPy SLSQP optimizer
        res = minimize(
            fun=self._objective_func,
            x0=x0,
            jac=self._gradient_func,
            bounds=self.bounds,
            constraints=constraints,
            method="SLSQP",
            options={"maxiter": 200, "ftol": 1e-7, "disp": False},
        )

        opt_b = np.maximum(0.0, res.x)
        solver_status = "SUCCESS" if res.success else ("CONVERGED_WITH_WARNING" if np.isclose(np.sum(opt_b), self.total_budget, rtol=1e-3) else "FAILED")
        solver_msg = res.message if res.message else "Optimal constrained budget allocation discovered successfully."

        # Evaluate Baseline vs. Optimized
        baseline_b = np.array(self.baseline_budgets)
        baseline_sum = np.sum(baseline_b)
        if baseline_sum > 0:
            # Scale baseline proportionally to compare at the same total budget
            scaled_baseline = baseline_b * (self.total_budget / baseline_sum)
        else:
            scaled_baseline = np.full(self.n, self.total_budget / self.n)

        baseline_rev = float(sum(self.curves[i].revenue(scaled_baseline[i]) for i in range(self.n)))
        opt_rev = float(sum(self.curves[i].revenue(opt_b[i]) for i in range(self.n)))

        baseline_contrib = float((self.gross_margin * baseline_rev) - self.total_budget)
        opt_contrib = float((self.gross_margin * opt_rev) - float(np.sum(opt_b)))

        rev_change = opt_rev - baseline_rev
        rev_change_pct = (rev_change / baseline_rev * 100.0) if baseline_rev > 0 else 0.0
        contrib_change = opt_contrib - baseline_contrib

        baseline_roas = (baseline_rev / self.total_budget) if self.total_budget > 0 else 0.0
        opt_roas = (opt_rev / float(np.sum(opt_b))) if np.sum(opt_b) > 0 else 0.0
        utilization = (float(np.sum(opt_b)) / self.total_budget * 100.0) if self.total_budget > 0 else 100.0

        # Allocation per influencer
        allocations = []
        for i in range(self.n):
            inf = self.influencers[i]
            rec_b = float(round(opt_b[i], 2))
            base_b = float(round(scaled_baseline[i], 2))
            b_diff = rec_b - base_b
            b_diff_pct = (b_diff / base_b * 100.0) if base_b > 0 else 0.0

            inf_rev = float(round(self.curves[i].revenue(rec_b), 2))
            inf_contrib = float(round((self.gross_margin * inf_rev) - rec_b, 2))
            inf_roas = float(round(inf_rev / rec_b, 2)) if rec_b > 0 else 0.0
            inf_mr = float(round(self.curves[i].marginal_return(rec_b), 4))
            sat_pct = float(round(self.curves[i].saturation_pct(rec_b), 1))

            lb, ub = self.bounds[i]
            is_binding = False
            constraint_note = None
            if abs(rec_b - ub) < 1.0 and ub < self.total_budget:
                is_binding = True
                constraint_note = "Upper bound binding"
            elif abs(rec_b - lb) < 1.0 and lb > 0:
                is_binding = True
                constraint_note = "Lower bound binding"

            allocations.append({
                "influencer_id": inf["id"],
                "influencer_name": inf["name"],
                "handle": inf["handle"],
                "platform": inf["platform"],
                "niche": inf["niche"],
                "baseline_budget": base_b,
                "recommended_budget": rec_b,
                "budget_change": round(b_diff, 2),
                "budget_change_pct": round(b_diff_pct, 1),
                "expected_revenue": inf_rev,
                "expected_contribution": inf_contrib,
                "expected_roas": inf_roas,
                "marginal_return": inf_mr,
                "saturation_pct": sat_pct,
                "is_binding_constraint": is_binding,
                "constraint_note": constraint_note,
            })

        return {
            "solver_status": solver_status,
            "solver_message": solver_msg,
            "total_budget": self.total_budget,
            "objective": self.objective,
            "baseline_expected_revenue": round(baseline_rev, 2),
            "optimized_expected_revenue": round(opt_rev, 2),
            "revenue_change": round(rev_change, 2),
            "revenue_change_pct": round(rev_change_pct, 2),
            "baseline_expected_contribution": round(baseline_contrib, 2),
            "optimized_expected_contribution": round(opt_contrib, 2),
            "contribution_change": round(contrib_change, 2),
            "baseline_roas": round(baseline_roas, 2),
            "optimized_roas": round(opt_roas, 2),
            "budget_utilization_pct": round(utilization, 2),
            "allocations": allocations,
            "assumptions_note": (
                "Modeled expectations derived from diminishing return response curves R_i(b_i) = A_i(1 - e^{-k_i b_i}) "
                "calibrated against historical performance and audience quality ratings. Forward-looking projections "
                "do not constitute guaranteed returns."
            ),
        }
