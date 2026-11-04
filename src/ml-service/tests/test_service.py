"""
Tests the two paths IMPLEMENTATION-PLAN-001.md's milestone cares about: the honest
"model unavailable" failure when artifacts are missing (the expected state in this repository
today, since no ML-001 training run has produced them yet), and a genuine prediction when a
real (if tiny, synthetic) model + encoder fixture is present — proving the loading/scoring code
itself works, without claiming the repository has a real trained model.
"""

import importlib
import json
import os

import joblib
import pytest
from fastapi.testclient import TestClient


class _DummyModel:
    """Picklable stand-in for a real trained classifier — not a real model."""

    def predict_proba(self, X):
        return [[0.3, 0.7] for _ in X]


def _reload_app():
    import app.main as main_module

    importlib.reload(main_module)
    return main_module


def test_health_and_score_report_model_unavailable_when_artifacts_missing(tmp_path, monkeypatch):
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(tmp_path / "does-not-exist.joblib"))
    monkeypatch.setenv("ENCODER_ARTIFACT_PATH", str(tmp_path / "does-not-exist.json"))
    main_module = _reload_app()

    with TestClient(main_module.app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json() == {"status": "UP", "modelLoaded": False}

        score = client.post(
            "/score",
            json={
                "orders": [
                    {
                        "orderId": 1,
                        "features": {
                            "type": "DEBIT",
                            "customerCity": "Springfield",
                            "customerId": 847,
                            "customerZipcode": "12345",
                            "orderCity": "Springfield",
                            "orderCountry": "USA",
                            "orderRegion": "West",
                            "orderState": "CA",
                            "shippingMode": "Standard Class",
                        },
                    }
                ]
            },
        )
        assert score.status_code == 503
        assert score.json()["error"] == "model_unavailable"


def test_score_with_loaded_artifacts_returns_a_real_prediction(tmp_path, monkeypatch):
    model_path = tmp_path / "model.joblib"
    encoders_path = tmp_path / "encoders.json"
    joblib.dump(_DummyModel(), model_path)
    encoders_path.write_text(
        json.dumps(
            {
                "modelVersion": "test-fixture-v1",
                "targetEncoding": {
                    "customerCity": {"Springfield": 0.11},
                    "customerId": {"847": 0.22},
                    "customerZipcode": {"12345": 0.05},
                    "orderCity": {"Springfield": 0.11},
                    "orderCountry": {"USA": 0.07},
                    "orderRegion": {"West": 0.09},
                    "orderState": {"CA": 0.08},
                },
                "dummyEncodingColumns": {
                    "type": ["CASH", "DEBIT", "PAYMENT"],
                    "shippingMode": ["First Class", "Same Day", "Standard Class"],
                },
                "customerIdFallback": 0.124,
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(model_path))
    monkeypatch.setenv("ENCODER_ARTIFACT_PATH", str(encoders_path))
    main_module = _reload_app()

    with TestClient(main_module.app) as client:
        health = client.get("/health")
        assert health.json() == {"status": "UP", "modelLoaded": True}

        score = client.post(
            "/score",
            json={
                "orders": [
                    {
                        "orderId": 42,
                        "features": {
                            "type": "DEBIT",
                            "customerCity": "Springfield",
                            "customerId": 847,
                            "customerZipcode": "12345",
                            "orderCity": "Springfield",
                            "orderCountry": "USA",
                            "orderRegion": "West",
                            "orderState": "CA",
                            "shippingMode": "Standard Class",
                        },
                    }
                ]
            },
        )
        assert score.status_code == 200
        body = score.json()
        assert body["results"] == [
            {"orderId": 42, "riskScore": 0.7, "modelVersion": "test-fixture-v1", "confidence": None}
        ]


def test_score_rejects_extra_feature_field(tmp_path, monkeypatch):
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(tmp_path / "does-not-exist.joblib"))
    monkeypatch.setenv("ENCODER_ARTIFACT_PATH", str(tmp_path / "does-not-exist.json"))
    main_module = _reload_app()

    with TestClient(main_module.app) as client:
        score = client.post(
            "/score",
            json={
                "orders": [
                    {
                        "orderId": 1,
                        "features": {
                            "type": "DEBIT",
                            "customerCity": "Springfield",
                            "customerId": 847,
                            "customerZipcode": "12345",
                            "orderCity": "Springfield",
                            "orderCountry": "USA",
                            "orderRegion": "West",
                            "orderState": "CA",
                            "shippingMode": "Standard Class",
                            "latitude": 12.34,
                        },
                    }
                ]
            },
        )
        assert score.status_code == 422


def test_score_rejects_missing_feature_field(tmp_path, monkeypatch):
    monkeypatch.setenv("MODEL_ARTIFACT_PATH", str(tmp_path / "does-not-exist.joblib"))
    monkeypatch.setenv("ENCODER_ARTIFACT_PATH", str(tmp_path / "does-not-exist.json"))
    main_module = _reload_app()

    with TestClient(main_module.app) as client:
        score = client.post(
            "/score",
            json={
                "orders": [
                    {
                        "orderId": 1,
                        "features": {
                            "type": "DEBIT",
                            "customerCity": "Springfield",
                            "customerId": 847,
                            "customerZipcode": "12345",
                            "orderCity": "Springfield",
                            "orderCountry": "USA",
                            "orderRegion": "West",
                            # orderState omitted
                            "shippingMode": "Standard Class",
                        },
                    }
                ]
            },
        )
        assert score.status_code == 422
