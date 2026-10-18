# CreatorPulse AI
### Influencer Marketing ROI Analytics & Intelligent Budget Optimization Platform

[![CI Pipeline](https://github.com/creatorpulse/creatorpulse-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/creatorpulse/creatorpulse-ai)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![SciPy Optimization](https://img.shields.io/badge/Optimization-SciPy%20SLSQP-8CAAE6.svg?logo=scipy&logoColor=black)](https://scipy.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Tagline:** Measure Creator Impact. Optimize Every Marketing Rupee.

---

## Table of Contents

1. [What is CreatorPulse AI All About?](#1-what-is-creatorpulse-ai-all-about)
2. [What Does CreatorPulse AI Do? (Key Features)](#2-what-does-creatorpulse-ai-do-key-features)
3. [The Four Core Engineering Pillars](#3-the-four-core-engineering-pillars)
4. [Mathematical Optimization Formulation](#4-mathematical-optimization-formulation)
5. [System Architecture & Monorepo Separation](#5-system-architecture--monorepo-separation)
6. [Tech Stack](#6-tech-stack)
7. [Getting Started & Local Setup](#7-getting-started--local-setup)
   - [Prerequisites](#prerequisites)
   - [Step 1: Backend Setup (FastAPI & SQLite/PostgreSQL)](#step-1-backend-setup-fastapi--sqlitepostgresql)
   - [Step 2: Frontend Setup (Next.js 15 App Router)](#step-2-frontend-setup-nextjs-15-app-router)
   - [Default Demo Credentials](#default-demo-credentials)
8. [Docker Full-Stack Deployment](#8-docker-full-stack-deployment)
9. [Automated Testing & Verification](#9-automated-testing--verification)
10. [Engineering Documentation Index](#10-engineering-documentation-index)
11. [Technical Interview Q&A Summary](#11-technical-interview-qa-summary)
12. [License & Acknowledgements](#12-license--acknowledgements)

---

## 1. What is CreatorPulse AI All About?

Modern digital marketing teams, direct-to-consumer (D2C) brands, and marketing agencies spend millions on influencer marketing, yet struggle with fundamental operational challenges:

- **Vanity Metrics Over Business Value:** Brand decisions are frequently driven by superficial metrics (follower counts, likes, and reach) rather than verifiable bottom-line revenue, conversion rates, and sustainable Customer Acquisition Cost (CPA).
- **The Linear Spend Fallacy:** Marketers intuitively assume that doubling spend with a top-performing creator will double revenue. In reality, **audience fatigue and diminishing returns** inevitably set in. Spending past a creator's saturation point destroys Return On Ad Spend (ROAS).
- **Gut-Feel Budget Distribution:** Marketing budgets are conventionally allocated using subjective intuition, basic spreadsheets, or arbitrary proportional splits, leading to massive capital inefficiency.
- **Unverified "AI" Claims:** Many marketing analytics tools introduce generative AI that hallucinates performance metrics or suggests ungrounded budget moves without verifiable mathematical proof.

### The Mission

**CreatorPulse AI** transforms influencer marketing from an intuition-driven gamble into a **rigorous, mathematically constrained capital allocation discipline**.

It bridges the gap between **commercial marketing analytics** and **scientific operations research**:
1. It attributes real sales conversions and revenue to creators and multi-platform campaigns.
2. It models creator-specific diminishing returns using non-linear response curves ($R_i(b_i) = A_i(1 - e^{-k_i b_i})$).
3. It utilizes numerical optimization (**SciPy SLSQP**) to calculate the exact rupee allocation that maximizes revenue or net contribution under real-world budget constraints.
4. It provides growth teams with an interactive **What-If Scenario Simulator** and **evidence-grounded decision intelligence** backed by verifiable database records.

---

## 2. What Does CreatorPulse AI Do? (Key Features)

CreatorPulse AI delivers a comprehensive, production-grade SaaS platform covering the complete marketing lifecycle:

### 1. Executive Performance Dashboard
- **Real-Time Portfolio KPIs:** Instantly monitor Total Marketing Spend, Attributed Revenue, Blended ROAS (e.g. `3.08x`), Conversions, Blended CPA (e.g. `₹307`), and Net Commercial Contribution.
- **Time-Series Revenue & Spend Trends:** Interactive dual-axis charts visualizing daily and weekly performance dynamics.
- **Platform Breakdown:** Comprehensive spend vs. revenue split across Instagram, YouTube, and TikTok.
- **Creator Leaderboards:** High-performer and bottom-performer rankings based on net contribution and ROAS.

### 2. Campaign Management & Roster Tracking
- Create, manage, and monitor multi-creator marketing campaigns.
- Track contracted fees, production costs, status lifecycles (*Draft*, *Active*, *Paused*, *Completed*), and allocated budgets.
- Drill down into campaign-specific creator rosters and attributed revenue streams.

### 3. Creator Intelligence & Response Curves
- Profile influencers with platform metrics, Audience Quality Scores (AQS), and historical performance.
- Visualize individual **diminishing-return response curves** plotting spent budget against expected revenue.
- View **marginal return rates** ($dR/db$) to identify exactly when a creator has reached audience saturation.

### 4. Scientific Budget Optimization Engine
- Constrained non-linear optimization powered by **SciPy SLSQP**.
- Solves for the optimal capital distribution across eligible creators subject to:
  - Exact budget conservation ($\sum b_i = B$).
  - Creator-level minimum and maximum budget bounds ($L_i \le b_i \le U_i$).
  - Platform-level budget concentration caps ($\sum_{i \in \text{Platform}} b_i \le C_p$).
- Compares the **Current Baseline** against the **Recommended Allocation**, highlighting expected revenue delta, contribution gain, and binding constraints.

### 5. Interactive What-If Scenario Simulator
- Live slider controls to modify total campaign budget, creator bounds, platform caps, and product gross margin percentages.
- Triggers on-the-fly backend solver execution (`/api/v1/scenarios/simulate`).
- Persists scenarios to the database and renders side-by-side comparison matrices to evaluate trade-offs before deploying capital.

### 6. Evidence-Grounded AI Insights
- Deterministic decision intelligence engine that detects anomalies, saturation risks, and efficiency opportunities.
- Every insight contains:
  - A descriptive business title and actionable recommendation.
  - A structured JSON evidence payload with verified empirical metrics from the database.
  - Confidence scoring and comparison periods.
  - Interactive **Review** and **Dismiss** workflow with persistent state tracking.

### 7. Predictive Analytics & Machine Learning
- scikit-learn regression models (*Ridge*, *Random Forest*, *Gradient Boosting*) trained to predict expected revenue.
- Strictly benchmarked against a `DummyRegressor` baseline on held-out test splits with MAE, RMSE, and $R^2$ scores to ensure real predictive lift without fabricated claims.

### 8. Enterprise Data Management & CSV/Excel ETL
- Robust file ingestion supporting both `.csv` and `.xlsx` performance records.
- Column mapping, live data preview, and pre-commit validation.
- Enforces strict funnel sanity checks (e.g., $\text{conversions} \le \text{clicks} \le \text{impressions}$, non-negative monetary figures).
- Detailed error logging with row-level rejection reasons and downloadable import error reports.

### 9. Multi-Tenant Security & Role-Based Access Control (RBAC)
- Multi-organization tenant isolation (every query filtered by active organization).
- Secure password hashing using `bcrypt` and stateless JWT Bearer/Cookie authentication.
- Audit logging tracking sensitive configuration and budget updates.

---

## 3. The Four Core Engineering Pillars

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CREATORPULSE AI                               │
└─────────────────────────────────────────────────────────────────────────┘
         │                       │                     │             │
         ▼                       ▼                     ▼             ▼
┌──────────────────┐   ┌──────────────────┐   ┌───────────────┐ ┌───────────────┐
│ 1. Analytics     │   │ 2. SciPy SLSQP   │   │ 3. What-If    │ │ 4. Evidence   │
│ Engine           │   │ Optimizer        │   │ Simulator     │ │ AI Insights   │
├──────────────────┤   ├──────────────────┤   ├───────────────┤ ├───────────────┤
│ • Weighted ROAS  │   │ • Diminishing    │   │ • Real-time   │ │ • Structured  │
│ • CPA / CVR / ER │   │   Return Curves  │   │   Sliders     │   │   JSON Evidence │
│ • Net Margin %   │   │ • Conservation   │   │ • Scenario    │ │ • Deterministic │
│ • Strict Math    │   │ • Binding Bounds │   │   Comparison  │ │   Rule Engine   │
└──────────────────┘   └──────────────────┘   └───────────────┘ └───────────────┘
```

1. **Deterministic Analytics:** Strict weighted ratio formulas ($\sum \text{Revenue} / \sum \text{Spend}$). Ratios are never averaged.
2. **Operations Research:** Numerical optimization with analytical Jacobian derivatives replaces heuristic creator ranking.
3. **Interactive Simulation:** Growth teams stress-test allocations across varied budget limits and margin assumptions.
4. **Verifiable Decision Intelligence:** AI insights are grounded in database evidence, guaranteeing zero hallucinated figures.

---

## 4. Mathematical Optimization Formulation

Unlike basic tools that merely rank influencers by past ROAS, CreatorPulse AI models **non-linear audience saturation** and solves a constrained optimization problem.

### 1. Concave Diminishing-Return Response Curve
For each influencer $i$, the expected attributed revenue $R_i(b_i)$ as a function of allocated budget $b_i$ follows a concave exponential curve:

$$R_i(b_i) = A_i \left(1 - e^{-k_i b_i}\right)$$

Where:
- $b_i$: Budget allocated to influencer $i$ (in ₹ INR).
- $A_i$: Saturation parameter (the theoretical maximum revenue achievable from creator $i$'s audience).
- $k_i$: Response-rate parameter (governs how quickly the creator approaches saturation).

The instantaneous **marginal return** ($dR/db$) represents the incremental revenue earned per additional rupee spent:

$$\frac{d R_i}{d b_i} = A_i k_i e^{-k_i b_i}$$

### 2. Optimization Objectives
The marketing lead can select between two optimization goals:

- **Maximize Expected Revenue:**
  $$\max_{b_1, \dots, b_n} \sum_{i=1}^{n} R_i(b_i)$$

- **Maximize Net Contribution After Marketing Spend:**
  $$\max_{b_1, \dots, b_n} \sum_{i=1}^{n} \left[ m \cdot R_i(b_i) - b_i \right]$$
  *(where $m \in (0, 1]$ is the product gross margin percentage, e.g. 0.40).*

### 3. Constraints
The optimization is formulated as a minimization of $-f(b)$ using SciPy's Sequential Least Squares Programming (**SLSQP**) solver:

1. **Exact Budget Conservation (Equality Constraint):**
   $$\sum_{i=1}^{n} b_i = B \implies \sum_{i=1}^{n} b_i - B = 0$$
2. **Individual Creator Allocation Bounds (Box Constraints):**
   $$L_i \le b_i \le U_i \quad \forall i \in \{1, \dots, n\}$$
3. **Platform Concentration Caps (Inequality Constraints):**
   $$\sum_{i \in \text{Platform}_p} b_i \le C_p \quad \forall p \in \{\text{Instagram}, \text{YouTube}, \text{TikTok}\}$$

### 4. Analytical Gradient (Jacobian)
To guarantee high convergence speed and numerical stability, the exact analytical gradient is supplied to SciPy:

$$\nabla (-f(b))_i = -A_i k_i e^{-k_i b_i}$$

---

## 5. System Architecture & Monorepo Separation

CreatorPulse AI uses an independently deployable monorepo architecture:

```text
CREATORPULSE AI/
│
├── frontend/                         # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/                      # 16 App Router Routes
│   │   │   ├── page.tsx              # Public Landing Page
│   │   │   ├── login/page.tsx        # Sign In (with One-Click Demo Login)
│   │   │   ├── register/page.tsx     # Organization Registration
│   │   │   ├── dashboard/page.tsx    # Executive ROI Dashboard
│   │   │   ├── campaigns/            # Campaign Management & Roster Drilldown
│   │   │   ├── influencers/          # Influencer Intelligence & Response Curves
│   │   │   ├── analytics/            # Funnel & Multi-Campaign Comparison
│   │   │   ├── optimization/         # SciPy SLSQP Budget Optimizer
│   │   │   ├── simulator/            # Interactive What-If Simulator
│   │   │   ├── insights/             # Verified AI Insights
│   │   │   ├── reports/              # Custom Reports & ML Benchmarks
│   │   │   ├── data-management/      # CSV/Excel Ingestion & Validation
│   │   │   └── settings/             # Workspace & Financial Parameters
│   │   ├── components/               # UI components, layout shell, Recharts
│   │   ├── lib/                      # Centralized API client & formatters
│   │   └── types/                    # TypeScript interfaces
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── backend/                          # FastAPI REST API Backend
│   ├── app/
│   │   ├── api/routes/               # Modular route handlers
│   │   │   ├── auth.py               # JWT authentication & user profiles
│   │   │   ├── dashboard.py          # Portfolio KPIs & trend aggregations
│   │   │   ├── campaigns.py          # Campaign CRUD & roster analytics
│   │   │   ├── influencers.py        # Creator intelligence & response curves
│   │   │   ├── analytics.py          # Funnel metrics & cross-comparisons
│   │   │   ├── optimization.py       # SciPy SLSQP execution & allocation
│   │   │   ├── scenarios.py          # What-if simulation & persistence
│   │   │   ├── insights.py           # Deterministic decision rules
│   │   │   ├── predictive.py         # scikit-learn model evaluation
│   │   │   ├── imports.py            # CSV/Excel upload & validation
│   │   │   └── reports.py            # Export generation
│   │   ├── core/                     # Config, database engine, security
│   │   ├── models/                   # 15 normalized SQLAlchemy models
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   ├── analytics/                # Pure KPI math formulas
│   │   ├── optimization/             # Response curves & SciPy solver
│   │   ├── predictive/               # scikit-learn regression models
│   │   ├── insights/                 # Structured evidence rule engine
│   │   └── services/                 # File ingestion ETL & export logic
│   ├── alembic/                      # Database schema migrations
│   ├── tests/                        # Pytest unit & integration test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── data/                             # Synthetic datasets (900 daily records)
├── scripts/                          # Seed & synthetic data generation scripts
├── docs/                             # Complete engineering specifications
├── docker-compose.yml                # Multi-container local orchestration
└── README.md
```

---

## 6. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **Next.js 15** (App Router), **React 19**, **TypeScript** (Strict Mode) |
| **Styling & UI** | **Tailwind CSS** (Dark Mode Theme: `#0B1020`, Card: `#151D2E`, Accents: `#8B5CF6`, `#22D3EE`), Lucide React |
| **Data Visualization** | **Recharts** (Interactive Area, Bar, Line, and Dual-Axis Charts) |
| **Backend Framework** | **FastAPI** 0.115+, **Uvicorn**, **Pydantic v2** |
| **Mathematical Optimization** | **SciPy** (SLSQP Constrained Minimization, Analytical Jacobian) |
| **Machine Learning** | **scikit-learn** (Ridge, Random Forest, Gradient Boosting, DummyRegressor), **NumPy**, **Pandas** |
| **Database & ORM** | **PostgreSQL 16** (Production), **SQLite** (Local Zero-Config Fallback), **SQLAlchemy 2.0**, **Alembic** |
| **Authentication & Security**| Stateless JWT Bearer & HTTP-only Cookies, **bcrypt** password hashing, tenant isolation |
| **ETL & Data Processing** | **Pandas**, **openpyxl**, transactional validation pipelines |
| **DevOps & Containers** | **Docker**, **Docker Compose**, **GitHub Actions CI** |

---

## 7. Getting Started & Local Setup

### Prerequisites
- **Python:** 3.11+ installed (`py -3.11` or `python3.11`)
- **Node.js:** 20+ and `npm` installed
- **Git**

---

### Step 1: Backend Setup (FastAPI & SQLite/PostgreSQL)

1. Open PowerShell or Terminal and navigate to the project root:
   ```powershell
   cd "CREATORPULSE AI"
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   cd backend
   py -3.11 -m venv .venv
   .\.venv\Scripts\activate
   ```
   *(On macOS/Linux: `python3.11 -m venv .venv && source .venv/bin/activate`)*

3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```powershell
   cp .env.example .env
   ```
   *(Default configuration uses SQLite `sqlite:///./creatorpulse.db` out of the box).*

5. Run database migrations:
   ```powershell
   alembic upgrade head
   ```

6. Seed the database with demo enterprise data:
   ```powershell
   python ..\scripts\seed_database.py
   ```

7. Start the FastAPI backend server:
   ```powershell
   # From the project root with PYTHONPATH set:
   $env:PYTHONPATH="."
   .\backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - **Interactive Swagger Docs:** [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
   - **Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 2: Frontend Setup (Next.js 15 App Router)

1. Open a **second terminal** and navigate to the `frontend/` directory:
   ```powershell
   cd "CREATORPULSE AI\frontend"
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Configure frontend environment variables:
   ```powershell
   cp .env.example .env.local
   ```
   *(Verifies `NEXT_PUBLIC_API_URL=http://localhost:8000`).*

4. Start the Next.js development server:
   ```powershell
   npm run dev
   ```
   - **Frontend Application:** [http://localhost:3000](http://localhost:3000)

---

### Default Demo Credentials

The database is pre-seeded with an enterprise workspace (**PulseBrands Global**) containing 3 multi-platform campaigns, 12 creators, and 900 daily performance rows:

| Field | Value |
| :--- | :--- |
| **Email** | `admin@creatorpulse.ai` |
| **Password** | `Admin@123456` |
| **Workspace** | `PulseBrands Global` |

*Tip:* You can also click the **"One-Click Demo Sign In"** button on the login screen to sign in automatically.

---

## 8. Docker Full-Stack Deployment

To run PostgreSQL 16, the FastAPI backend, and the Next.js frontend in isolated production containers:

```bash
docker-compose up --build
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **PostgreSQL Database:** `localhost:5432` (User: `postgres`, DB: `creatorpulse`)

---

## 9. Automated Testing & Verification

### Backend Pytest Suite (17/17 Tests Passing)
Run the automated test suite covering unit formulas, aggregations, solver constraints, and API endpoints:

```powershell
cd backend
.\.venv\Scripts\pytest.exe -v
```

**Test Coverage Highlights:**
- `test_kpi_formulas`: Verifies zero denominator handling for ROAS, CPA, CPC, CPM, and CVR.
- `test_aggregate_ratios`: Strictly verifies that portfolio ratios divide total sums and never average individual rates.
- `test_response_curves`: Verifies concave asymptotic limits and analytical derivatives.
- `test_scipy_optimization_equality`: Enforces budget conservation ($\sum b_i = B$) and bound adherence.
- `test_infeasible_constraints`: Ensures solver returns informative error diagnostics when lower bounds exceed budget.
- `test_etl_importer`: Validates CSV ingestion and rejects invalid funnels ($\text{conversions} > \text{clicks}$).
- `test_auth_flow`: Verifies bcrypt password hashing, token issuance, and protected endpoint authorization.

### Frontend Production Build Verification
Verify that all 16 Next.js App Router routes compile with zero TypeScript errors:

```powershell
cd frontend
npm run build
```

---

## 10. Engineering Documentation Index

Full technical specifications, formulas, and architecture guides are located in the [`docs/`](./docs) folder:

- [`docs/PRD.md`](./docs/PRD.md) — Product Requirements Document, persona definitions, and acceptance criteria.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System architecture, data flow diagrams, and monorepo boundaries.
- [`docs/DATA_DICTIONARY.md`](./docs/DATA_DICTIONARY.md) — Schema definitions for all 15 relational tables.
- [`docs/ANALYTICS_METHODOLOGY.md`](./docs/ANALYTICS_METHODOLOGY.md) — Precise mathematical definitions for all marketing KPIs.
- [`docs/OPTIMIZATION_METHODOLOGY.md`](./docs/OPTIMIZATION_METHODOLOGY.md) — Diminishing returns curves and SciPy SLSQP solver formulation.
- [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) — Complete REST API endpoint contracts.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — Independent deployment guides for Vercel, Render, Railway, and Docker.
- [`docs/TESTING.md`](./docs/TESTING.md) — Testing strategy and QA acceptance reports.

---

## 11. Technical Interview Q&A Summary

### Q1: Why SciPy SLSQP instead of simply ranking creators by historical ROAS?
> **Answer:** Ranking creators by historical ROAS makes a naive **linear assumption**—that spending more will continue yielding returns at the exact same rate. In reality, creators experience audience fatigue and saturation. Spending ₹10 Lakhs with an already saturated creator causes severe capital waste. The SLSQP algorithm uses analytical gradients to allocate capital where the instantaneous marginal return ($dR/db$) is highest until diminishing returns equalize across active creators, strictly honoring total budget and individual limits.

### Q2: How does CreatorPulse AI prevent generative AI hallucinations in decision intelligence?
> **Answer:** The decision intelligence engine is **100% deterministic**. Python code computes verified performance metrics, historical comparisons, and optimization deltas directly against the relational database. It formats these into a verified structured JSON evidence payload. Any natural language explanation is strictly derived from this evidence payload, ensuring zero hallucinated metrics.

### Q3: Why is ratio averaging prohibited in the analytics engine?
> **Answer:** Averaging campaign or creator ratios (such as $\text{Average}(\text{ROAS}_1, \text{ROAS}_2)$) produces mathematically invalid, unweighted metrics that overweight low-spend outliers and distort financial reality. CreatorPulse AI enforces strict weighted calculations: $\text{ROAS} = \sum \text{Revenue} / \sum \text{Spend}$, ensuring true commercial fidelity.

### Q4: How is data isolation maintained in multi-tenant environments?
> **Answer:** Through relational foreign keys (`organization_id`) and FastAPI dependency injection (`get_current_organization`). Every database query across campaigns, creators, performance logs, and scenarios is automatically scoped to the authenticated user's active organization.

---

## 12. License & Acknowledgements

- **License:** Distributed under the [MIT License](./LICENSE).
- **Author:** Built with engineering precision for enterprise portfolio demonstration, final-year major engineering projects, and technical interviews.
