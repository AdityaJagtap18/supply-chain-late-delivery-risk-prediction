"""
Request/response schemas, matching ML-INFERENCE-001-service-contract.md §§ 1-2 exactly.
extra="forbid" on Features rejects a request with a missing or extra feature key, per
IMPLEMENTATION-PLAN-001.md target-flow step 5 ("accepts the exact nine-feature request" — and,
implicitly, rejects one that isn't).
"""

from pydantic import BaseModel, ConfigDict


class Features(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    customerCity: str
    customerId: int
    customerZipcode: str
    orderCity: str
    orderCountry: str
    orderRegion: str
    orderState: str
    shippingMode: str


class OrderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    orderId: int
    features: Features


class ScoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    orders: list[OrderRequest]


class OrderResult(BaseModel):
    orderId: int
    riskScore: float
    modelVersion: str
    confidence: float | None = None


class ScoreResponse(BaseModel):
    results: list[OrderResult]


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool


class ConfusionMatrix(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int


class OfflineMetrics(BaseModel):
    prAuc: float
    rocAuc: float
    precision: float
    recall: float
    f1: float
    brierScore: float
    confusionMatrix: ConfusionMatrix
    testSetSize: int
    testSetRowsExcludedUnseenCategory: int


class ModelInfoResponse(BaseModel):
    """UI-003 Phase 6: everything in `encoders.json` that isn't already part of ML-INFERENCE-001's
    scoring contract -- read-only training-run metadata, never recomputed here."""

    modelVersion: str
    trainedAt: str | None
    sourceFile: str | None
    modelAlgorithm: str | None
    featureList: list[str] | None
    metrics: OfflineMetrics | None
    categoryFrequencies: dict[str, dict[str, float]] | None
    libraryVersions: dict[str, str] | None
