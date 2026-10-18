# CreatorPulse AI — Scientific Budget Optimization Methodology

This document details the mathematical formulation, response curve theory, and SciPy implementation powering `backend/app/optimization/solver.py`.

---

## 1. Non-Linear Diminishing Returns

In influencer marketing, additional spend with a single creator yields progressively smaller incremental returns as audience fatigue and frequency saturation set in.

CreatorPulse AI models expected attributed revenue for creator $i$ using the strictly concave exponential diminishing-return response curve:
$$R_i(b_i) = A_i \cdot \left(1 - e^{-k_i b_i}\right)$$

Where:
- $b_i$: Budget allocated to influencer $i$ ($b_i \ge 0$).
- $A_i > 0$: Revenue saturation ceiling (theoretical upper asymptote).
- $k_i > 0$: Response rate parameter governing how rapidly returns saturate.

### Marginal Return Derivative
The first derivative represents the instantaneous return per incremental rupee spent:
$$\frac{d R_i}{d b_i} = A_i k_i e^{-k_i b_i}$$

At zero spend ($b_i = 0$), the initial marginal return is $A_i k_i$. As budget increases, the marginal return diminishes exponentially toward zero.

---

## 2. Mathematical Optimization Formulation

Let $B$ represent the total available campaign budget and $n$ the number of eligible influencers.

### 2.1 Primary Objectives
1. **Maximize Total Attributed Revenue (`MAX_REVENUE`):**
   $$\max_{b_1, \ldots, b_n} \sum_{i=1}^n R_i(b_i) \iff \min_{b} -\sum_{i=1}^n A_i(1 - e^{-k_i b_i})$$

2. **Maximize Net Contribution After Marketing Spend (`MAX_CONTRIBUTION`):**
   $$\max_{b_1, \ldots, b_n} \sum_{i=1}^n \left[m \cdot R_i(b_i) - b_i\right] \iff \min_{b} \sum_{i=1}^n \left[b_i - m \cdot R_i(b_i)\right]$$
   where $m \in (0, 1]$ is the modeled product gross margin percentage.

### 2.2 Constraints
1. **Budget Conservation (Equality Constraint):**
   $$\sum_{i=1}^n b_i = B$$

2. **Influencer Allocation Bounds:**
   $$L_i \le b_i \le U_i \quad \forall i \in \{1, \ldots, n\}$$
   - If influencer is ineligible: $L_i = U_i = 0$.
   - If fixed commitment: $L_i = U_i = F_i$.

3. **Platform Channel Caps (Inequality Constraints):**
   $$\sum_{i \in \text{Platform}_p} b_i \le C_p \iff C_p - \sum_{i \in \text{Platform}_p} b_i \ge 0$$

---

## 3. Solver Implementation: SciPy SLSQP

The optimization problem is solved using `scipy.optimize.minimize` with the **Sequential Least Squares Programming (SLSQP)** method.

### Analytical Gradients (Jacobian)
To maximize numerical precision and convergence speed, exact analytical gradients are provided directly to the solver:
- For `MAX_REVENUE`:
  $$\nabla_i f(b) = -A_i k_i e^{-k_i b_i}$$
- For `MAX_CONTRIBUTION`:
  $$\nabla_i f(b) = 1 - m \cdot A_i k_i e^{-k_i b_i}$$

### Feasibility Verification
Before launching the solver, the problem constraints are rigorously validated:
$$\sum_{i=1}^n L_i \le B \le \sum_{i=1}^n U_i$$
If $\sum L_i > B$, the engine immediately halts and returns an informative explanation to the user rather than failing silently or relaxing constraints.
