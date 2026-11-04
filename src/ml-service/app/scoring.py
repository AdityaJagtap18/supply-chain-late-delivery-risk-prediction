"""
Applies loaded, never-refit encoders + model to produce a risk score — ML-INFERENCE-001
§ 3's encoding-consistency rule.

Feature-vector assembly convention: target-encoded columns in the fixed order
(customerCity, customerId, customerZipcode, orderCity, orderCountry, orderRegion, orderState),
followed by one-hot columns for `type` then `shippingMode`, in the order each category appears
in the encoder metadata's `dummyEncodingColumns` lists. This convention is provisional — it is
this skeleton's own choice, not yet dictated by any ML-001 training-run artifact, since no such
run has produced a real metadata sidecar yet. It must be revisited against whatever ML-001
actually emits once that pipeline exists; it is not a finalized contract.
"""

from app.model_loader import ModelArtifacts
from app.schemas import Features

_TARGET_ENCODED_FIELDS = (
    "customerCity",
    "customerId",
    "customerZipcode",
    "orderCity",
    "orderCountry",
    "orderRegion",
    "orderState",
)


def build_feature_vector(features: Features, artifacts: ModelArtifacts) -> list[float]:
    vector: list[float] = []

    for field_name in _TARGET_ENCODED_FIELDS:
        value = str(getattr(features, field_name))
        encoding_map = artifacts.target_encoding.get(field_name, {})
        if field_name == "customerId":
            vector.append(encoding_map.get(value, artifacts.customer_id_fallback))
        else:
            # Non-customerId categorical fields with no documented fallback in
            # ML-INFERENCE-001 § 3 — an unseen category here is reported as a per-order
            # failure (see score_order), not silently defaulted.
            if value not in encoding_map:
                raise KeyError(f"{field_name}={value!r} not present in loaded target-encoding map")
            vector.append(encoding_map[value])

    for dummy_field, categories in artifacts.dummy_encoding_columns.items():
        request_value = str(getattr(features, dummy_field))
        for category in categories:
            vector.append(1.0 if request_value == category else 0.0)

    return vector


def score_order(features: Features, artifacts: ModelArtifacts) -> float:
    vector = build_feature_vector(features, artifacts)
    # predict_proba's positive-class column — consistent with ML-PIPELINE-001's binary
    # late-delivery target. Falls back to .predict if the loaded model has no predict_proba.
    if hasattr(artifacts.model, "predict_proba"):
        return float(artifacts.model.predict_proba([vector])[0][1])
    return float(artifacts.model.predict([vector])[0])
