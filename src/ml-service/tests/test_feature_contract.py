"""
QA-STRATEGY-001 S4.2's feature-availability contract test: "an automatable schema diff between
ML-INFERENCE-001 S1's request schema and ML-PIPELINE-001 S1's retained feature set." Diffs the
two *executable* records of that contract -- app/schemas.py's Features model (what this service
actually accepts) and scripts/ml/train_model.py's CSV_TO_FEATURE_FIELD (what the training
pipeline actually selected and trained on) -- not the markdown prose describing them, which can
drift from the code without this test noticing.

A mismatch here means either the service would reject every request the trained model actually
needs, or the pipeline is training on (or dropping) a feature the wire contract doesn't know
about -- exactly the silent-drift failure mode this test exists to catch.
"""

import importlib.util
from pathlib import Path

from app.schemas import Features

REPO_ROOT = Path(__file__).resolve().parents[3]
TRAIN_SCRIPT = REPO_ROOT / "scripts" / "ml" / "train_model.py"


def _load_train_model_module():
    spec = importlib.util.spec_from_file_location("train_model", TRAIN_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_inference_schema_matches_training_pipeline_retained_features():
    train_model = _load_train_model_module()
    pipeline_features = set(train_model.CSV_TO_FEATURE_FIELD.values())
    service_features = set(Features.model_fields.keys())

    assert pipeline_features == service_features, (
        "ML-INFERENCE-001 S1's request schema and ML-PIPELINE-001 S1's retained feature set "
        "have drifted apart. "
        f"In training pipeline but not in service schema: {pipeline_features - service_features}; "
        f"in service schema but not in training pipeline: {service_features - pipeline_features}"
    )
