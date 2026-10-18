# CreatorPulse AI — Product Requirements Document (PRD)

## 1. Executive Summary
**Product Name:** CreatorPulse AI  
**Tagline:** Measure Creator Impact. Optimize Every Marketing Rupee.  
**Category:** Full-Stack Enterprise SaaS, Decision Intelligence, Marketing Science, Constrained Mathematical Optimization.

Marketing organizations currently allocate millions in influencer budgets using vanity metrics (likes, raw followers) and gut feel. CreatorPulse AI bridges the gap between creator partnerships and measurable financial performance by providing:
1. **Authoritative Marketing Analytics:** Verifiable calculation of ROAS, CPA, conversion rates, and net contribution.
2. **Scientific Budget Optimization:** Constrained non-linear optimization using SciPy (SLSQP) over calibrated diminishing-return response curves.
3. **Interactive Scenario Simulation:** Real-time What-If scenario planning with database persistence and side-by-side strategy comparisons.
4. **Evidence-Grounded AI Insights:** Automated decision intelligence rooted strictly in empirical evidence without LLM metric hallucination.

---

## 2. User Personas & Workflows

### 2.1 Performance Marketing Lead / CMO
- **Goal:** Understand aggregate marketing efficiency and answer "What is our true portfolio ROAS?"
- **Workflow:** Opens the Executive Dashboard, evaluates revenue trends and platform concentration risks, and exports audit-ready CSV reports for board presentations.

### 2.2 Influencer Campaign Manager
- **Goal:** Allocate fixed campaign budgets (e.g. ₹35,00,000) among 10–20 creator candidates to maximize conversions.
- **Workflow:** Uses the Budget Optimization page, configures creator minimum/maximum bounds and platform caps, runs the SLSQP solver, reviews marginal returns, and applies recommended budget shifts.

### 2.3 Growth Analyst
- **Goal:** Model alternative market scenarios (e.g. what happens if YouTube spend is capped at 30% or overall budget increases by 20%?).
- **Workflow:** Modifies sliders in the What-If Simulator, triggers real-time recalculations, saves the scenario, and compares projected outcomes against the baseline.

---

## 3. Functional Requirements

### 3.1 Authentication & Multi-Tenancy
- Email/Password authentication with bcrypt password hashing.
- Signed JWT access tokens stored in HttpOnly cookies and supported via Bearer headers.
- Multi-tenant workspace data isolation enforced on all SQL queries.

### 3.2 Relational Database Architecture
- 15 normalized tables supporting campaigns, creators, daily performance, attribution records, optimization runs, allocations, scenarios, imports, and audit logs.
- Automated migrations managed via Alembic.

### 3.3 Data Ingestion Pipeline
- Multi-format file ingestion supporting CSV and Excel (`.xlsx`).
- Pre-commit schema validation, type verification, negative number checks, and conversion funnel sanity checks (`conversions <= clicks`).
- Detailed row-by-row error logging and downloadable error reports.

### 3.4 Scientific Budget Optimization
- Exponential diminishing-return curve: $R_i(b_i) = A_i(1 - e^{-k_i b_i})$.
- Objective options: `MAX_REVENUE` and `MAX_CONTRIBUTION`.
- Strict budget conservation constraint: $\sum b_i = B$.
- Bound constraints: $L_i \le b_i \le U_i$, fixed allocations, and platform budget caps.
- Feasibility pre-check with informative error feedback on infeasible parameters.

---

## 4. Non-Functional Requirements
- **Reliability:** Backend test suite passing with 100% success rate.
- **Independence:** Frontend and Backend deployable to completely separate hosting providers without coupling.
- **Precision:** Financial calculations rounded safely and guarded against division by zero.
- **Security:** CSRF prevention, parameter sanitation, and zero plaintext secret storage.
