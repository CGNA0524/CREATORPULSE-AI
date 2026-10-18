# CreatorPulse AI — Backend Service

FastAPI Python 3.11 service hosting the mathematical optimization engine, analytics calculations, predictive models, database access, and authentication.

## Tech Stack
- **Framework:** FastAPI, Uvicorn
- **ORM & Migrations:** SQLAlchemy 2.0, Alembic
- **Optimization:** SciPy (`scipy.optimize.minimize` SLSQP)
- **Data & ML:** NumPy, Pandas, scikit-learn
- **Security:** Bcrypt, PyJWT

## Running Locally (PowerShell)
```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python ..\scripts\seed_database.py
uvicorn backend.app.main:app --reload --port 8000
```

## Running Tests
```powershell
.\.venv\Scripts\pytest.exe -v
```

## Production Docker Deployment
```bash
docker build -t creatorpulse-backend .
docker run -p 8000:8000 --env-file .env creatorpulse-backend
```
