"""
QA-STRATEGY-001 S4.1's training-pipeline regression test: re-runs the real training pipeline
against the committed `final_sample.csv` and checks its recall/accuracy against the baseline
already persisted in `artifacts/encoders.json` (itself a real, measured run -- see
`ML-PIPELINE-001-REVISION-001` S3 -- not the design document's hypothetical numbers), within a
+-2pp tolerance in EITHER direction. An unexplained upward jump must fail this test, not be
celebrated: per QA-STRATEGY-001 S4.1, a sudden accuracy/recall improvement is far more likely to
mean a leakage regression (an encoder re-fit on the wrong fold, a column slipping back into the
feature set) than a genuine model improvement, since nothing about the data or methodology is
expected to have changed between runs with the same seed.

Comparing against the persisted baseline, not a hardcoded number in this file, means the test
stays meaningful after a deliberate, reviewed retrain (whoever retrains intentionally also
refreshes `artifacts/encoders.json`, which becomes the new baseline for this test).
"""

import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT / "scripts" / "ml"))

from train_model import SOURCE_CSV, train_and_evaluate  # noqa: E402

TOLERANCE_PERCENTAGE_POINTS = 2.0
BASELINE_ENCODERS_PATH = REPO_ROOT / "artifacts" / "encoders.json"


def _load_baseline_metrics() -> dict:
    if not BASELINE_ENCODERS_PATH.is_file():
        pytest.skip(f"No baseline artifact at {BASELINE_ENCODERS_PATH} to regress against.")
    with open(BASELINE_ENCODERS_PATH, encoding="utf-8") as f:
        return json.load(f)["metrics"]


@pytest.mark.skipif(not SOURCE_CSV.is_file(), reason=f"Training dataset not present at {SOURCE_CSV}")
def test_retraining_recall_and_accuracy_stay_within_tolerance_of_baseline():
    baseline_metrics = _load_baseline_metrics()
    baseline_recall = baseline_metrics["recall"]
    baseline_accuracy = (
        baseline_metrics["confusionMatrix"]["tn"]
        + baseline_metrics["confusionMatrix"]["tp"]
    ) / baseline_metrics["testSetSize"]

    _model, fresh_metrics, _encoders_metadata = train_and_evaluate()
    fresh_recall = fresh_metrics["recall"]
    fresh_accuracy = (
        fresh_metrics["confusionMatrix"]["tn"] + fresh_metrics["confusionMatrix"]["tp"]
    ) / fresh_metrics["testSetSize"]

    recall_delta_pp = (fresh_recall - baseline_recall) * 100
    accuracy_delta_pp = (fresh_accuracy - baseline_accuracy) * 100

    assert abs(recall_delta_pp) <= TOLERANCE_PERCENTAGE_POINTS, (
        f"Recall moved {recall_delta_pp:+.2f}pp from baseline {baseline_recall:.4f} to "
        f"{fresh_recall:.4f} -- outside the +-{TOLERANCE_PERCENTAGE_POINTS}pp tolerance. An "
        "unexplained jump in either direction needs investigation before this baseline is "
        "updated, not a widened tolerance."
    )
    assert abs(accuracy_delta_pp) <= TOLERANCE_PERCENTAGE_POINTS, (
        f"Accuracy moved {accuracy_delta_pp:+.2f}pp from baseline {baseline_accuracy:.4f} to "
        f"{fresh_accuracy:.4f} -- outside the +-{TOLERANCE_PERCENTAGE_POINTS}pp tolerance."
    )
