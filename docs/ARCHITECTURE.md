# CreatorPulse AI — System Architecture

## 1. High-Level Monorepo Architecture

CreatorPulse AI is architected as an independently deployable monorepository. Strict separation of concerns is maintained between the presentation tier (`frontend/`) and the business & mathematical engine (`backend/`).

```
+-------------------------------------------------------------------------+
|                              CLIENT BROWSER                             |
|       (Next.js 15 App Router, React 19, Tailwind CSS, Recharts)         |
+-------------------------------------------------------------------------+
                                    |
                    REST JSON APIs  |  (CORS / HttpOnly Cookie / JWT)
                                    v
+-------------------------------------------------------------------------+
|                            FASTAPI BACKEND                              |
|                                                                         |
|  +--------------------+  +---------------------+  +------------------+  |
|  | Authentication &   |  | Marketing Analytics |  | Constrained      |  |
|  | Tenant Isolation   |  | Engine (KPIs,       |  | SciPy SLSQP      |  |
|  | (Bcrypt, PyJWT)    |  | Aggregations)       |  | Optimizer        |  |
|  +--------------------+  +---------------------+  +------------------+  |
|                                                                         |
|  +--------------------+  +---------------------+  +------------------+  |
|  | ETL Import Service |  | Evidence-Grounded   |  | scikit-learn     |  |
|  | (CSV, OpenPyXL)    |  | AI Insights Engine  |  | ML Benchmarks    |  |
|  +--------------------+  +---------------------+  +------------------+  |
+-------------------------------------------------------------------------+
                                    |
                       SQLAlchemy 2.0 ORM Engine
                                    v
+-------------------------------------------------------------------------+
|                          RELATIONAL DATABASE                            |
|             PostgreSQL 16 (Production) / SQLite (Local Dev)             |
|                  Managed Schema Migrations with Alembic                 |
+-------------------------------------------------------------------------+
```

---

## 2. Component Decoupling & Independent Deployability

### 2.1 Presentation Tier (`frontend/`)
- Built using **Next.js 15** with standalone output compilation.
- Communicates with the backend exclusively over standard HTTP/JSON via `NEXT_PUBLIC_API_URL`.
- Does not contain database drivers, optimization libraries, or server-side secrets.
- Can be deployed to **Vercel**, **AWS Amplify**, or **Cloudflare Pages**.

### 2.2 Computation Tier (`backend/`)
- Built with **Python 3.11** and **FastAPI**.
- Hosts the authoritative business logic:
  - Analytics calculation modules (`backend/app/analytics/`)
  - Response curve mathematics & SciPy solver (`backend/app/optimization/`)
  - Predictive modeling pipelines (`backend/app/predictive/`)
  - File ingestion parser (`backend/app/services/etl_importer.py`)
- Can be deployed to **Render**, **Railway**, **Fly.io**, or **AWS ECS/Fargate**.

### 2.3 Data Persistence Tier
- Driven by **SQLAlchemy 2.0** supporting both connection-pooled **PostgreSQL** in production and lightweight **SQLite** for development.
- Database migrations generated and verified using **Alembic**.

---

## 3. Data Flow & Security Model

1. **Authentication:** User logs in at `/login`. FastAPI issues a cryptographically signed HS256 JWT access token set as an HttpOnly, SameSite cookie and returned in the JSON payload.
2. **Tenant Isolation:** Every protected API query filters records by the active user's `organization_id`. Cross-tenant data leakage is structurally impossible.
3. **Execution Guardrails:** File uploads are parsed in-memory, validated against strict business rules, and wrapped in database transactions to prevent partial commits.
