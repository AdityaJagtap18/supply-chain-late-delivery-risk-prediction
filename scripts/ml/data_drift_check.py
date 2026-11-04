"""
QA-STRATEGY-001 S4.3's data-drift smoke test: "compare category frequencies of live
batch-scoring inputs vs. training distribution." That section's own status note said this
"activates once BE-ARCH-001 S2.7's batch job is actually running against real orders" -- it now
is (BatchScoringService, Phase 4) -- so this script is that activation, not a redesign.

What it does: pulls every order currently scorable by BatchScoringService (same
order+shipment+customer_location join that service uses -- see
src/backend/.../BatchScoringService.java#buildFeatures), computes each categorical feature's
live frequency distribution, and compares it against the training-fold distribution persisted
in artifacts/encoders.json's `categoryFrequencies` (added in this same phase specifically so this
script would have a real baseline to diff against, not just the encoded mean values
`targetEncoding` carries).

Drift metric: total variation distance (TVD) per field, in [0, 1] -- half the sum of absolute
frequency differences across every category seen in either distribution (a category present in
one distribution and absent from the other counts as its full frequency, not ignored). This is a
smoke test, not a CI gate with an approved threshold: QA-STRATEGY-001 never assigns one, so
DEFAULT_DRIFT_THRESHOLD below is an explicitly illustrative placeholder (same spirit as this
project's other placeholder thresholds -- rate limits, session timeout) for a human or a future
alerting rule to revisit, not a validated business decision.

Usage:
    pip install -r scripts/ml/requirements-drift.txt
    python scripts/ml/data_drift_check.py [--threshold 0.15] [--fail-on-drift]

Connects using the same POSTGRES_* environment variables infra/docker/.env already defines for
the backend; local-dev defaults match that file so this runs with no extra setup against a
docker-compose'd database.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import psycopg2

REPO_ROOT = Path(__file__).resolve().parents[2]
ENCODERS_PATH = REPO_ROOT / "artifacts" / "encoders.json"

# DB column -> categoryFrequencies field name (matches train_model.py's category_frequencies()
# field set: every TARGET_ENCODED_FIELDS entry except customerId, plus both DUMMY_FIELDS).
LIVE_QUERY = """
    SELECT
        o.payment_type AS type,
        cl.customer_city AS "customerCity",
        cl.customer_zipcode AS "customerZipcode",
        o.order_city AS "orderCity",
        o.order_country AS "orderCountry",
        o.order_region AS "orderRegion",
        o.order_state AS "orderState",
        s.shipping_mode AS "shippingMode"
    FROM "order" o
    JOIN shipment s ON s.order_id = o.order_id
    JOIN customer_location cl ON cl.customer_id = o.customer_id
"""

DEFAULT_DRIFT_THRESHOLD = 0.15  # Placeholder -- not a confirmed business tolerance. See module docstring.


def load_baseline_frequencies() -> dict[str, dict[str, float]]:
    if not ENCODERS_PATH.is_file():
        print(f"No artifact at {ENCODERS_PATH} -- run train_model.py first.", file=sys.stderr)
        sys.exit(1)
    with open(ENCODERS_PATH, encoding="utf-8") as f:
        encoders = json.load(f)
    if "categoryFrequencies" not in encoders:
        print(
            f"{ENCODERS_PATH} has no 'categoryFrequencies' -- it predates this check. "
            "Re-run train_model.py to refresh the artifact with that baseline.",
            file=sys.stderr,
        )
        sys.exit(1)
    return encoders["categoryFrequencies"]


def fetch_live_rows() -> list[dict[str, str]]:
    connection = psycopg2.connect(
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=os.environ.get("POSTGRES_PORT", "5433"),
        dbname=os.environ.get("POSTGRES_DB", "supplychain_dev"),
        user=os.environ.get("POSTGRES_USER", "supplychain_dev"),
        password=os.environ.get("POSTGRES_PASSWORD", "changeme_local_only"),
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(LIVE_QUERY)
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    finally:
        connection.close()


def live_frequencies(rows: list[dict[str, str]], field: str) -> dict[str, float]:
    values = [str(row[field]) for row in rows if row[field] is not None]
    if not values:
        return {}
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    total = len(values)
    return {value: count / total for value, count in counts.items()}


def total_variation_distance(baseline: dict[str, float], live: dict[str, float]) -> float:
    categories = set(baseline) | set(live)
    return 0.5 * sum(abs(baseline.get(c, 0.0) - live.get(c, 0.0)) for c in categories)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_DRIFT_THRESHOLD,
        help=f"Per-field TVD above which a field is flagged (default: {DEFAULT_DRIFT_THRESHOLD}, "
        "an illustrative placeholder, not an approved business tolerance).",
    )
    parser.add_argument(
        "--fail-on-drift",
        action="store_true",
        help="Exit 1 if any field's TVD exceeds --threshold (for wiring into an alert/cron job).",
    )
    args = parser.parse_args()

    baseline_frequencies = load_baseline_frequencies()
    live_rows = fetch_live_rows()

    if not live_rows:
        print("No scorable orders (order+shipment+customer_location) found live -- nothing to compare.")
        return 0

    print(f"Comparing {len(live_rows)} live scorable order(s) against the training distribution.\n")
    flagged_fields = []
    for field, baseline in sorted(baseline_frequencies.items()):
        live = live_frequencies(live_rows, field)
        tvd = total_variation_distance(baseline, live)
        unseen_live_categories = sorted(set(live) - set(baseline))
        flag = " <-- FLAGGED" if tvd > args.threshold else ""
        print(f"{field}: TVD={tvd:.4f}{flag}")
        if unseen_live_categories:
            print(f"  live categories absent from training: {unseen_live_categories}")
        if tvd > args.threshold:
            flagged_fields.append(field)

    if flagged_fields:
        print(
            f"\n{len(flagged_fields)} field(s) exceeded the {args.threshold} TVD placeholder "
            f"threshold: {flagged_fields}. This is a smoke-test signal for human review, not a "
            "confirmed business tolerance breach -- see this script's module docstring."
        )
    else:
        print(f"\nNo field exceeded the {args.threshold} TVD placeholder threshold.")

    if args.fail_on_drift and flagged_fields:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
