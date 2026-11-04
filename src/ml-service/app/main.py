"""
ML inference service (ADR-0004, Accepted — separate Python service). Phase 1 skeleton scope
only: load persisted artifacts (target-flow step 4), accept exactly the nine-feature contract
(step 5), return a real prediction when a model is loaded, and expose a health check (step 7).
Does not implement the batch-scheduling side of FR-031 (ML-INFERENCE-001 § 4's batch
integration pattern) — this service only answers requests it's given; who calls it and how
often is the backend's and DEV-STRATEGY-001's concern, not this skeleton's.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.model_loader import ModelArtifacts, load_artifacts
from app.schemas import HealthResponse, ModelInfoResponse, OrderResult, ScoreRequest, ScoreResponse
from app.scoring import score_order

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_artifacts: ModelArtifacts | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _artifacts
    _artifacts = load_artifacts()
    if _artifacts is None:
        logger.warning(
            "Starting with no model loaded. /score will report model unavailable for every "
            "request rather than fabricate a prediction, per IMPLEMENTATION-PLAN-001.md."
        )
    yield


app = FastAPI(title="SupplyChainOptimization ML Inference Service", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="UP", modelLoaded=_artifacts is not None)


@app.get("/model-info")
def model_info():
    """UI-003 Phase 6: read-only training-run metadata (never a live metric; see each field's
    own real source in `artifacts/encoders.json`, written once by `train_model.py`)."""
    if _artifacts is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": "model_unavailable",
                "detail": "No model/encoder artifacts are loaded, so no model-info is available.",
            },
        )
    return ModelInfoResponse(
        modelVersion=_artifacts.model_version,
        trainedAt=_artifacts.trained_at,
        sourceFile=_artifacts.source_file,
        modelAlgorithm=_artifacts.model_algorithm,
        featureList=_artifacts.feature_list,
        metrics=_artifacts.metrics,
        categoryFrequencies=_artifacts.category_frequencies,
        libraryVersions=_artifacts.library_versions,
    )


@app.post("/score")
def score(request: ScoreRequest):
    if _artifacts is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": "model_unavailable",
                "detail": (
                    "No model/encoder artifacts are loaded. This is an honest failure, not a "
                    "bug: no ML-001 training run has produced these artifacts yet. See "
                    "src/ml-service/README.md."
                ),
            },
        )

    results: list[OrderResult] = []
    for order in request.orders:
        try:
            risk_score = score_order(order.features, _artifacts)
        except KeyError:
            # Per-order failure (ML-INFERENCE-001 § 5): omit this order from `results`, not the
            # whole batch — the contract's own documented meaning for "not updated this cycle"
            # is a missing entry, not an invented extra response field. Logged server-side only.
            logger.warning("Order %s failed to score (unseen category) — omitted, not faked.", order.orderId)
            continue
        results.append(
            OrderResult(
                orderId=order.orderId,
                riskScore=risk_score,
                modelVersion=_artifacts.model_version,
                confidence=None,
            )
        )

    return ScoreResponse(results=results)
