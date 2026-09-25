import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_ports_endpoint():
    response = client.get("/api/ports")
    assert response.status_code == 200
    data = response.json()
    assert "ports" in data
    assert "current_port" in data


def test_telemetry_recent_endpoint():
    response = client.get("/api/telemetry/recent?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)
