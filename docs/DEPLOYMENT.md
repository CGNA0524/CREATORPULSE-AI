# CreatorPulse AI — Independent Deployment Guide

CreatorPulse AI is engineered with strict separation between the frontend and backend, enabling independent deployments on different cloud providers.

---

## 1. Local Development Setup (Windows PowerShell)

### 1.1 Backend Setup
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python ..\scripts\seed_database.py
uvicorn backend.app.main:app --reload --port 8000
```
- API is live at `http://localhost:8000`
- OpenAPI Swagger docs: `http://localhost:8000/api/v1/docs`

### 1.2 Frontend Setup
```powershell
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
- Web Application is live at `http://localhost:3000`

---

## 2. Docker Compose Full-Stack Deployment

To run PostgreSQL, the FastAPI backend, and the Next.js frontend together in isolated containers:
```bash
docker-compose up --build
```
Services started:
- PostgreSQL 16: `localhost:5432`
- FastAPI Backend: `http://localhost:8000`
- Next.js Frontend: `http://localhost:3000`

---

## 3. Independent Cloud Deployment

### 3.1 Frontend Deployment (Vercel / Cloudflare Pages)
- **Directory:** `./frontend`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: URL of the deployed FastAPI backend (e.g. `https://api.creatorpulse.ai`).

### 3.2 Backend Deployment (Render / Railway / AWS ECS)
- **Directory:** `./backend`
- **Runtime:** Python 3.11 or Docker (`backend/Dockerfile`)
- **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `DATABASE_URL`: Managed PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/db`).
  - `SECRET_KEY`: High-entropy 32+ character random string for JWT signing.
  - `CORS_ORIGINS`: Comma-separated allowed frontend origins (e.g. `https://app.creatorpulse.ai`).
  - `ENVIRONMENT`: `production`

### 3.3 Managed Database Setup & Migrations
On the production PostgreSQL instance:
1. Provide connection string to the backend as `DATABASE_URL`.
2. Run database migrations:
   ```bash
   alembic upgrade head
   ```
3. Optionally seed demo data:
   ```bash
   python scripts/seed_database.py
   ```
