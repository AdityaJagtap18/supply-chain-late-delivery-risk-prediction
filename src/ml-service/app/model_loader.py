"""
Loads the persisted model and encoders (ADR-0007, Accepted — file-based for MVP). Never fits or
refits anything here — per ML-INFERENCE-001-service-contract.md § 3, fitted state is loaded
as-is, never recomputed at inference time.

If the artifact files are not present, this module reports that explicitly (ModelArtifacts is
None) rather than substituting a fabricated model — per IMPLEMENTATION-PLAN-001.md's instruction
not to substitute a fake model when artifacts are missing. As of this skeleton's creation, no
ML-001 training run has produced these artifacts yet, so this path is expected to be exercised
honestly (model unavailable), not treated as a bug.
"""

import json
import logging
import os
from dataclasses import dataclass
from typing import Any

import joblib

logger = logging.getLogger(__name__)


@dataclass
class ModelArtifacts:
    model: Any
    model_version: str
    target_encoding: dict[str, dict[str, float]]
    dummy_encoding_columns: dict[str, list[str]]
    customer_id_fallback: float
    # UI-003 Phase 6: the rest of encoders.json, already written by train_model.py and already
    # read into `metadata` below -- kept here too so GET /model-info can report it without a
    # second file read or any new computation. Never refit or recomputed; loaded as-is.
    trained_at: str | None = None
    source_file: str | None = None
    model_algorithm: str | None = None
    feature_list: list[str] | None = None
    metrics: dict[str, Any] | None = None
    category_frequencies: dict[str, dict[str, float]] | None = None
    library_versions: dict[str, str] | None = None


def load_artifacts() -> ModelArtifacts | None:
    """
    Returns None, with a logged reason, if either artifact file is missing or unreadable —
    never raises past this point and never returns a partially-fabricated result.
    """
    model_path = os.environ.get("MODEL_ARTIFACT_PATH", "./artifacts/model.joblib")
    encoders_path = os.environ.get("ENCODER_ARTIFACT_PATH", "./artifacts/encoders.json")

    if not os.path.isfile(model_path):
        logger.warning("Model artifact not found at %s — service will report model unavailable.", model_path)
        return None
    if not os.path.isfile(encoders_path):
        logger.warning("Encoder artifact not found at %s — service will report model unavailable.", encoders_path)
        return None

    try:
        model = joblib.load(model_path)
        with open(encoders_path, encoding="utf-8") as f:
            metadata = json.load(f)
    except Exception:
        logger.exception("Failed to load model/encoder artifacts — service will report model unavailable.")
        return None

    required_keys = {"modelVersion", "targetEncoding", "dummyEncodingColumns", "customerIdFallback"}
    missing = required_keys - metadata.keys()
    if missing:
        logger.error("Encoder metadata missing required keys %s — service will report model unavailable.", missing)
        return None

    return ModelArtifacts(
        model=model,
        model_version=metadata["modelVersion"],
        target_encoding=metadata["targetEncoding"],
        dummy_encoding_columns=metadata["dummyEncodingColumns"],
        customer_id_fallback=metadata["customerIdFallback"],
        trained_at=metadata.get("trainedAt"),
        source_file=metadata.get("sourceFile"),
        model_algorithm=metadata.get("modelAlgorithm"),
        feature_list=metadata.get("featureList"),
        metrics=metadata.get("metrics"),
        category_frequencies=metadata.get("categoryFrequencies"),
        library_versions=metadata.get("libraryVersions"),
    )
