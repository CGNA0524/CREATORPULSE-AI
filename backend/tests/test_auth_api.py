import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.security import hash_password, verify_password

client = TestClient(app)


def test_password_hashing():
    plain = "SecurePassword123!"
    hashed = hash_password(plain)
    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_health_and_ready():
    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "healthy"

    r_ready = client.get("/ready")
    assert r_ready.status_code == 200
    assert r_ready.json()["status"] == "ready"


def test_register_and_login_flow():
    email = "test_analyst@creatorpulse.ai"
    password = "TestPassword@123"

    # Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Test Analyst", "email": email, "password": password}
    )
    # Could be 200 or 400 if already created in previous run
    assert reg_res.status_code in (200, 400)

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email
    assert data["user"]["role"] in ("owner", "admin")

    # Get current user with token
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
