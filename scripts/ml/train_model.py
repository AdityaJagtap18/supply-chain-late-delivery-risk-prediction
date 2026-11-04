"""
ML-001's offline training pipeline. Produces the two artifacts `src/ml-service` already expects
(ADR-0007, Accepted — file-based for MVP): `artifacts/model.joblib` and `artifacts/encoders.json`.

Lives outside `src/ml-service` on purpose: per ARCH-DESIGN-001 / BE-ARCH-001, the inference
service only *applies* a persisted model and must never fit or refit anything (ML-INFERENCE-001
§ 3). Training is a separate, offline concern -- this script is a developer-run utility, the same
role `scripts/db/*.sql` plays for the database (see scripts/README.md).

Reproduces ML-PIPELINE-001 § 1's methodology for comparability with its documented results
(same source file, same split seed), but does NOT re-run § 2/3's statistical feature-selection
search from scratch -- that selection (Type, Customer City, Customer Id, Customer Zipcode,
Order City, Order Country, Order Region, Order State, Shipping Mode) is already a measured,
documented conclusion in that approved artifact, not a new decision made here. What this script
is responsible for getting right is the mechanical part ML-PIPELINE-001 flagged as genuinely
leakage-sensitive: fitting every encoder on the train fold only, and giving Customer Id
(high-cardinality, cold-start-prone) an out-of-fold encoding during training so the classifier
is never fit on self-leaked values.

Usage:
    pip install -r scripts/ml/requirements.txt
    python scripts/ml/train_model.py
"""

from __future__ import annotations

import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import AdaBoostClassifier
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import KFold, train_test_split

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_CSV = REPO_ROOT / "final_sample.csv"
ARTIFACTS_DIR = REPO_ROOT / "artifacts"

SPLIT_SEED = 34  # matches ML-PIPELINE-001 S1's own split, for direct comparability
TEST_SIZE = 0.2
TARGET_COLUMN = "Late_delivery_risk"

# ML-PIPELINE-001 S2/S3's already-measured, approved feature selection. Column-name map from the
# raw CSV header to the ML-INFERENCE-001 S1 wire-contract field names (Features in schemas.py).
# Order here is cosmetic; scoring.py's _TARGET_ENCODED_FIELDS tuple is the order that matters,
# and is matched explicitly below rather than assumed from this dict's iteration order.
CSV_TO_FEATURE_FIELD = {
    "Type": "type",
    "Customer City": "customerCity",
    "Customer Id": "customerId",
    "Customer Zipcode": "customerZipcode",
    "Order City": "orderCity",
    "Order Country": "orderCountry",
    "Order Region": "orderRegion",
    "Order State": "orderState",
    "Shipping Mode": "shippingMode",
}

# Must match app/scoring.py's _TARGET_ENCODED_FIELDS exactly -- this is the feature-vector
# assembly order the loaded model's coefficients/splits are trained against.
TARGET_ENCODED_FIELDS = (
    "customerCity",
    "customerId",
    "customerZipcode",
    "orderCity",
    "orderCountry",
    "orderRegion",
    "orderState",
)
DUMMY_FIELDS = ("type", "shippingMode")

# Smoothing strength ("prior orders" equivalent) -- heavier for Customer Id per
# ML-PIPELINE-001 S3's cold-start discussion of its high cardinality.
SMOOTHING_CUSTOMER_ID = 50.0
SMOOTHING_OTHER = 10.0
OOF_FOLDS = 5


def smoothed_target_encode(
    train_values: pd.Series, train_target: pd.Series, smoothing: float, global_mean: float
) -> dict[str, float]:
    """Fits a smoothed mean-target encoding map on the given (train-fold-only) rows."""
    stats = train_target.groupby(train_values).agg(["count", "mean"])
    smoothed = (stats["count"] * stats["mean"] + smoothing * global_mean) / (stats["count"] + smoothing)
    return {str(k): float(v) for k, v in smoothed.items()}


def oof_encode_customer_id(
    train_values: pd.Series, train_target: pd.Series, smoothing: float, global_mean: float
) -> pd.Series:
    """
    Out-of-fold smoothed target encoding for the training rows themselves, so the classifier is
    never fit against a Customer Id value encoded using that same row's own label (self-leakage).
    This is a training-time technique only -- the final artifact persists a single map fit on the
    whole training fold (see smoothed_target_encode), used as-is at inference time.
    """
    encoded = pd.Series(index=train_values.index, dtype=float)
    kfold = KFold(n_splits=OOF_FOLDS, shuffle=True, random_state=SPLIT_SEED)
    for fit_idx, holdout_idx in kfold.split(train_values):
        fit_map = smoothed_target_encode(
            train_values.iloc[fit_idx], train_target.iloc[fit_idx], smoothing, global_mean
        )
        encoded.iloc[holdout_idx] = train_values.iloc[holdout_idx].map(fit_map).fillna(global_mean)
    return encoded


def build_feature_matrix(
    df: pd.DataFrame,
    target_encoding: dict[str, dict[str, float]],
    customer_id_fallback: float,
    dummy_categories: dict[str, list[str]],
    *,
    customer_id_override: pd.Series | None = None,
    strict: bool = True,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Mirrors app/scoring.py's build_feature_vector exactly: target-encoded fields in
    TARGET_ENCODED_FIELDS order, then one-hot dummies for `type` then `shippingMode`.
    `customer_id_override` lets the training call substitute the OOF-encoded column instead of
    re-deriving it from `target_encoding` (which is the final, non-OOF map).

    Returns (matrix, valid_mask). With strict=True (the only mode used for the training fold,
    which by construction cannot contain an unseen category of itself), an unseen category
    raises KeyError immediately -- same behavior as app/scoring.py's production path, which
    treats an unseen non-customerId category as a per-order failure rather than a silent
    default (ML-INFERENCE-001 S3). With strict=False (used only to evaluate the held-out test
    fold), an unseen category is NOT fabricated into a default: that row is marked invalid in
    `valid_mask` and excluded from the returned matrix, so test-set metrics are never computed
    over rows the real service would have refused to score.
    """
    n = len(df)
    valid_mask = np.ones(n, dtype=bool)
    columns = []
    for field in TARGET_ENCODED_FIELDS:
        if field == "customerId" and customer_id_override is not None:
            columns.append(customer_id_override.to_numpy())
            continue
        csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == field)
        encoding_map = target_encoding[field]
        values = df[csv_column].astype(str)
        if field == "customerId":
            columns.append(values.map(encoding_map).fillna(customer_id_fallback).to_numpy())
        else:
            encoded = values.map(encoding_map)
            if encoded.isna().any():
                if strict:
                    unseen = sorted(set(values[encoded.isna()]))
                    raise KeyError(f"{field}: unseen categories at encode time: {unseen}")
                valid_mask &= ~encoded.isna().to_numpy()
                encoded = encoded.fillna(0.0)  # placeholder only; row is excluded via valid_mask
            columns.append(encoded.to_numpy())

    for dummy_field in DUMMY_FIELDS:
        csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == dummy_field)
        values = df[csv_column].astype(str)
        for category in dummy_categories[dummy_field]:
            columns.append((values == category).astype(float).to_numpy())

    matrix = np.column_stack(columns)
    return matrix[valid_mask], valid_mask


def category_frequencies(train_df: pd.DataFrame) -> dict[str, dict[str, float]]:
    """
    Normalized category frequency distributions on the training fold, for every categorical
    field except `customerId` (too high-cardinality for a frequency-table baseline -- its
    cold-start rate is already tracked separately via `customerIdColdStartFractionInTestSet`).
    Persisted so `data_drift_check.py` (QA-STRATEGY-001 S4.3) has a real training-time baseline
    to diff live batch-scoring inputs against, instead of only the encoded mean values that
    `targetEncoding` carries.
    """
    frequencies: dict[str, dict[str, float]] = {}
    for field in tuple(f for f in TARGET_ENCODED_FIELDS if f != "customerId") + DUMMY_FIELDS:
        csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == field)
        counts = train_df[csv_column].astype(str).value_counts(normalize=True)
        frequencies[field] = {str(k): float(v) for k, v in counts.items()}
    return frequencies


def train_and_evaluate(source_csv: Path = SOURCE_CSV) -> tuple[AdaBoostClassifier, dict, dict]:
    """
    Runs the full leakage-free training/evaluation pipeline against `source_csv` and returns
    `(model, metrics, encoders_metadata)` without writing any artifact to disk -- `main()` below
    is the only caller that persists the result. Split out so QA-STRATEGY-001 S4.1's training-
    pipeline regression test can re-run this deterministically and compare its metrics against
    the already-persisted baseline without clobbering `artifacts/model.joblib`/`encoders.json`.
    """
    if not source_csv.is_file():
        print(f"Source dataset not found at {source_csv}", file=sys.stderr)
        sys.exit(1)

    # The source CSV is valid UTF-8 (verified byte-for-byte) -- pandas' default encoding
    # decodes accented City/State/Country names (e.g. "São Paulo") correctly. An earlier version
    # of this script mis-diagnosed a terminal-display artifact as an encoding bug and read this
    # file as latin-1 instead, which double-decoded the UTF-8 bytes into garbled text (e.g.
    # "SÃ£o Paulo") -- confirmed and reverted before any artifact produced from it was used.
    df = pd.read_csv(source_csv)
    feature_columns = list(CSV_TO_FEATURE_FIELD.keys())
    df = df.dropna(subset=feature_columns + [TARGET_COLUMN]).reset_index(drop=True)

    y = df[TARGET_COLUMN].astype(int)
    train_df, test_df, y_train, y_test = train_test_split(
        df, y, test_size=TEST_SIZE, random_state=SPLIT_SEED, stratify=y
    )
    train_df = train_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)
    y_train = y_train.reset_index(drop=True)
    y_test = y_test.reset_index(drop=True)

    global_mean = float(y_train.mean())

    # --- Fit every encoder on the training fold only ---
    target_encoding: dict[str, dict[str, float]] = {}
    for field in TARGET_ENCODED_FIELDS:
        if field == "customerId":
            continue  # handled separately below (final map + OOF training column)
        csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == field)
        target_encoding[field] = smoothed_target_encode(
            train_df[csv_column].astype(str), y_train, SMOOTHING_OTHER, global_mean
        )

    customer_id_csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == "customerId")
    customer_id_values = train_df[customer_id_csv_column].astype(str)
    # Final, non-OOF map -- this is what the artifact persists for inference-time lookups.
    target_encoding["customerId"] = smoothed_target_encode(
        customer_id_values, y_train, SMOOTHING_CUSTOMER_ID, global_mean
    )
    # OOF-encoded column used only to build this training run's own feature matrix, so the
    # classifier never sees a Customer Id value encoded with its own label folded in.
    customer_id_oof = oof_encode_customer_id(customer_id_values, y_train, SMOOTHING_CUSTOMER_ID, global_mean)

    dummy_categories: dict[str, list[str]] = {}
    for dummy_field in DUMMY_FIELDS:
        csv_column = next(c for c, f in CSV_TO_FEATURE_FIELD.items() if f == dummy_field)
        dummy_categories[dummy_field] = sorted(train_df[csv_column].astype(str).unique())

    X_train, _ = build_feature_matrix(
        train_df, target_encoding, global_mean, dummy_categories, customer_id_override=customer_id_oof
    )
    X_test, test_valid_mask = build_feature_matrix(
        test_df, target_encoding, global_mean, dummy_categories, strict=False
    )
    y_test_scorable = y_test[test_valid_mask].reset_index(drop=True)
    excluded_test_rows = int((~test_valid_mask).sum())
    if excluded_test_rows:
        print(
            f"Excluded {excluded_test_rows}/{len(test_df)} test rows from evaluation: unseen "
            "City/Region/State/Country category not in the training fold's encoding map -- "
            "the real service would refuse to score these too (ML-INFERENCE-001 S3), not "
            "fabricate a value for them."
        )

    # --- Model selection: an implementation-time decision, not a re-opening of ML-001's own
    # analysis (ML-PIPELINE-001 S4.2 explicitly leaves this to "a human ML lead reviewing this
    # artifact"). AdaBoost is chosen here for its best-measured recall (0.733 in that document),
    # consistent with PD-VISION-001's stated priority on catching high-risk orders over overall
    # accuracy. Flagged here, not silent, so a reviewer can override it. ---
    model = AdaBoostClassifier(random_state=SPLIT_SEED)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    tn, fp, fn, tp = confusion_matrix(y_test_scorable, y_pred).ravel()
    metrics = {
        "prAuc": float(average_precision_score(y_test_scorable, y_proba)),
        "rocAuc": float(roc_auc_score(y_test_scorable, y_proba)),
        "precision": float(precision_score(y_test_scorable, y_pred)),
        "recall": float(recall_score(y_test_scorable, y_pred)),
        "f1": float(f1_score(y_test_scorable, y_pred)),
        "brierScore": float(brier_score_loss(y_test_scorable, y_proba)),
        "confusionMatrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "testSetSize": int(len(y_test_scorable)),
        "testSetRowsExcludedUnseenCategory": excluded_test_rows,
    }
    print("Test-set metrics:", json.dumps(metrics, indent=2))

    model_version = f"adaboost-v1-{datetime.now(timezone.utc).strftime('%Y%m%d')}"

    cold_start_test_rows = test_df[customer_id_csv_column].astype(str)
    cold_start_fraction = float((~cold_start_test_rows.isin(target_encoding["customerId"])).mean())

    encoders_metadata = {
        "modelVersion": model_version,
        "targetEncoding": target_encoding,
        "dummyEncodingColumns": dummy_categories,
        "customerIdFallback": global_mean,
        # Extra provenance fields beyond model_loader.py's 4 required keys -- ignored by the
        # loader (it only checks for the required subset), kept here per ML-PIPELINE-001 S5's
        # request for a documented, reproducible training record alongside the artifact.
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "sourceFile": source_csv.name,
        "splitSeed": SPLIT_SEED,
        "testSize": TEST_SIZE,
        "featureList": list(CSV_TO_FEATURE_FIELD.values()),
        "modelAlgorithm": "AdaBoostClassifier",
        "metrics": metrics,
        "customerIdColdStartFractionInTestSet": cold_start_fraction,
        # QA-STRATEGY-001 S4.3's data-drift smoke test baseline (scripts/ml/data_drift_check.py).
        "categoryFrequencies": category_frequencies(train_df),
        "libraryVersions": {
            "python": platform.python_version(),
            "scikitLearn": sklearn.__version__,
            "pandas": pd.__version__,
            "numpy": np.__version__,
        },
    }
    return model, metrics, encoders_metadata


def main() -> None:
    model, metrics, encoders_metadata = train_and_evaluate()

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    joblib.dump(model, ARTIFACTS_DIR / "model.joblib")
    with open(ARTIFACTS_DIR / "encoders.json", "w", encoding="utf-8") as f:
        json.dump(encoders_metadata, f, indent=2)

    print(f"\nWrote {ARTIFACTS_DIR / 'model.joblib'}")
    print(f"Wrote {ARTIFACTS_DIR / 'encoders.json'} (modelVersion={encoders_metadata['modelVersion']})")


if __name__ == "__main__":
    main()
