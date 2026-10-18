import numpy as np
from typing import Dict, Any, Tuple


class ExponentialResponseCurve:
    """
    Diminishing return response curve:
    R(b) = A * (1 - exp(-k * b))
    """

    def __init__(self, A: float, k: float):
        if A <= 0:
            raise ValueError("Saturation parameter A must be strictly positive.")
        if k <= 0:
            raise ValueError("Response rate parameter k must be strictly positive.")
        self.A = float(A)
        self.k = float(k)

    def revenue(self, budget: float) -> float:
        if budget <= 0:
            return 0.0
        return float(self.A * (1.0 - np.exp(-self.k * budget)))

    def marginal_return(self, budget: float) -> float:
        """Derivative dR/db = A * k * exp(-k * b)"""
        if budget < 0:
            budget = 0.0
        return float(self.A * self.k * np.exp(-self.k * budget))

    def saturation_pct(self, budget: float) -> float:
        """Percentage of maximum theoretical saturation attained"""
        rev = self.revenue(budget)
        return float(min(100.0, (rev / self.A) * 100.0))


def estimate_curve_parameters(
    historical_spend: float,
    historical_revenue: float,
    roas: float,
    audience_quality_score: float = 85.0
) -> Tuple[float, float]:
    """
    Calibrate illustrative response curve parameters A and k.
    - If historical spend and revenue exist, we anchor the curve around the observed operating point
      assuming the influencer was operating at ~65% of saturation at their historical spend.
    - If historical spend is 0, we use plausible defaults based on audience score.
    """
    if historical_spend > 5000 and historical_revenue > 5000:
        # Assume historical spend corresponds to ~65% saturation:
        # 1 - exp(-k * spend) = 0.65 => k = -ln(0.35) / spend
        k = -np.log(0.35) / historical_spend
        # A * 0.65 = historical_revenue => A = historical_revenue / 0.65
        A = historical_revenue / 0.65
    else:
        # Plausible synthetic priors based on quality score and expected benchmark ROAS ~3.0x
        baseline_spend = 50000.0
        expected_rev = baseline_spend * max(1.5, (audience_quality_score / 25.0))
        k = -np.log(0.40) / baseline_spend
        A = expected_rev / 0.60

    # Ensure bounds on k and A to avoid numerical instability
    A = max(1000.0, float(A))
    k = max(1e-7, min(1e-2, float(k)))
    return A, k
