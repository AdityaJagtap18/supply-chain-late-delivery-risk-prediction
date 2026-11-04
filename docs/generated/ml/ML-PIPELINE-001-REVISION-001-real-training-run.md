---
artifact_id: ML-PIPELINE-001-REVISION-001
title: Real ML-001 Training Run — Artifacts, Risk-Band Thresholds, and a Correctness Fix
source_prompt: IMPLEMENTATION-PLAN-001 Phase 4
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0004, ADR-0007]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session (the same
> "Start Phase 4" instruction that commissioned this work), per `IMPLEMENTATION-PLAN-001.md`'s
> phase table: "replace the stubbed risk score with the real inference call; implement `ML-001`'s
> leakage-free training pipeline if not already done."

# Real ML-001 Training Run — Artifacts, Risk-Band Thresholds, and a Correctness Fix

`ML-PIPELINE-001` (Approved) was a **design document only** — it measured real numbers against
`final_sample.csv` but explicitly created no production code or artifact (its own header says
so). This revision is that code actually running: [`scripts/ml/train_model.py`](../../../scripts/ml/train_model.py)
produced real `artifacts/model.joblib` + `artifacts/encoders.json`, now mounted into
`src/ml-service` and wired into `src/backend`'s real `GET /orders` → real risk scores → real UI.

## 1. What this run reproduces vs. what it takes as given

Reproduced mechanically (the leakage-sensitive part `ML-PIPELINE-001` § 2 flagged as the actual
risk): an 80/20 stratified train/test split (seed 34, same as `ML-PIPELINE-001` § 1, for
comparability), every encoder fit on the training fold only, and an out-of-fold smoothed
target-encoding for `Customer Id` during training (so the classifier is never fit against a
value encoded using that row's own label) with a separate final non-OOF map persisted for
inference.

**Taken as given, not re-derived:** the final 9-feature set (`Type`, `Customer City`,
`Customer Id`, `Customer Zipcode`, `Order City`, `Order Country`, `Order Region`, `Order State`,
`Shipping Mode`) — this is `ML-PIPELINE-001` § 1/§ 3's own measured, Approved conclusion, not
re-opened by re-running its Chi²/Mann-Whitney U significance search from scratch.

## 2. Model selection (implementation-time decision)

**AdaBoostClassifier** (scikit-learn defaults, `random_state=34`) — chosen for its best-measured
recall in `ML-PIPELINE-001` § 4.1's comparison (0.733 there), consistent with `PD-VISION-001`'s
stated priority on catching high-risk orders over raw accuracy. `ML-PIPELINE-001` § 4.2 left this
choice explicitly to "a human ML lead reviewing this artifact" — flagged here as that choice, not
a re-opening of that section's own analysis.

## 3. Real test-set metrics (this run, not `ML-PIPELINE-001`'s numbers)

| Metric | Value |
|---|---|
| PR-AUC | 0.822 |
| ROC-AUC | 0.773 |
| Precision | 0.729 |
| Recall | 0.713 |
| F1 | 0.721 |
| Brier score | 0.204 |
| Confusion matrix | TN 3042 / FP 1434 / FN 1555 / TP 3857 |
| Test set size (scorable) | 9888 of 10000 |
| Customer Id cold-start rate (test set) | 9.7% |

In the same ballpark as `ML-PIPELINE-001` § 4.1's AdaBoost row (recall 0.733 there vs. 0.713
here) — the small difference is expected: this run's feature-selection step was taken as given
rather than re-derived (§ 1), and library versions differ (§ 5). Full metrics, training
timestamp, and library versions are persisted in `artifacts/encoders.json` itself, not only
here, per `ML-PIPELINE-001` § 5's metadata request.

**112 of 10000 test rows (1.1%) were excluded from these metrics**, not scored with a fabricated
default: each had a `City`/`Region`/`State`/`Country` value absent from the training fold's
encoding map, which is exactly the "unseen category → per-order failure" behavior
`ML-INFERENCE-001` § 3/§ 5 already specifies for the live service (`app/scoring.py` raises
`KeyError`, `app/main.py` omits that order from `/score`'s response). This is expected, not a
bug — the real service will exhibit the same per-order gap for a never-before-seen order
location, and does so honestly (see § 5 below) rather than hiding it.

## 4. Risk-band thresholds (finalizes `BE-ARCH-001` § 3.3's open TBD)

`BE-ARCH-001` § 3.3 and `UI-DESIGN-001` § 3.1 both left score→band thresholding `TBD`, calling it
"`ML-001`/`ML-002`'s job." [`RiskBandThresholds.java`](../../../src/backend/src/main/java/com/supplychain/backend/scoring/RiskBandThresholds.java)
makes that call now: **High ≥ 0.70, Medium ∈ [0.40, 0.70), Low < 0.40** — round numbers chosen to
land close to the Phase 3 stub seed data's own implicit boundaries, so the UI's band mix doesn't
jump discontinuously between stub and real data. This is a first cut, not a calibrated
cost-benefit analysis of false positives vs. false negatives — a product/UX owner should revisit
it against the real score distribution above.

## 5. Batch-scoring wiring (finalizes part of `BE-ARCH-001` § 3.4/§ 5's open scope question)

[`BatchScoringService`](../../../src/backend/src/main/java/com/supplychain/backend/scoring/BatchScoringService.java)
implements `ML-INFERENCE-001` § 4's recommended batch pattern for real: one synchronous call to
`POST /score` with every order's assembled features, writing one new `risk_assessment` row per
order the ML service actually returned a result for. Per § 5's error/fallback behavior:
- **Whole-batch failure** (ML service unreachable or non-2xx): the run aborts with zero writes;
  the previous cycle's scores remain the latest ones.
- **Per-order failure**, two distinct causes, both logged and both leaving that order simply
  un-updated this cycle (never a fabricated score): (a) missing `shipment`/`customer_location`
  data to build a feature vector at all, counted separately as `skippedIncompleteData`; (b) the
  ML service omitting that order from its response (unseen category), counted as
  `skippedUnseenCategory`.

A real trigger endpoint, `POST /system/batch-scoring`, was added
([`BatchScoringController`](../../../src/backend/src/main/java/com/supplychain/backend/scoring/BatchScoringController.java))
— `BE-ARCH-001` left this endpoint's existence itself as an open scope question; this phase's
concrete choice is a single authenticated synchronous POST, run on demand. **Still not decided
here:** `BATCH_SCORING_CADENCE_CRON` remains `TBD` (`ARCH-CONSISTENCY-001` CONS-005) — no
scheduler triggers this automatically; that is `DEV-001`'s operational concern. The frontend's
"Run Batch Scoring" button, disabled by `UI-DESIGN-001-REVISION-001` for lack of a committed
endpoint, is now wired to this real one (see that document's addendum).

## 6. `customer_location` read, internally only

`BatchScoringService` reads `customer_location.customer_city`/`customer_zipcode` to build the
`customerCity`/`customerZipcode` features `ML-INFERENCE-001` § 1 requires. This does **not**
reopen `CONS-004`/`BE-ARCH-001`'s decision that no HTTP response exposes these fields: no
controller returns them, and `latitude`/`longitude` are not mapped by the new `CustomerLocation`
entity at all. [`scripts/db/003_seed_phase4_real_categories.sql`](../../../scripts/db/003_seed_phase4_real_categories.sql)
populates this table for the three Phase 3 seed customers (it was never populated before) and
corrects the five seeded orders' illustrative `order_city`/`order_country`/`order_region`/
`order_state` values (e.g. "Chicago"/"USA"/"Midwest"/"IL") to real category values copied from
`final_sample.csv` — the illustrative ones were fine for Phase 3's stubbed-score purpose, but
every one of them is an unseen category to the real trained encoder, which would have made every
seeded order honestly unscorable and defeated end-to-end verification.

## 7. A real correctness bug found and fixed during this work

An early version of `train_model.py` read `final_sample.csv` with `encoding="latin-1"` on the
mistaken belief the file was Latin-1 (misdiagnosed from a terminal-rendering artifact, not an
actual decode failure). The file is valid UTF-8; reading it as Latin-1 double-decoded multi-byte
UTF-8 characters (e.g. "São Paulo" → "SÃ£o Paulo"), which would have silently corrupted every
accented international `City`/`State`/`Country` category's encoding-map key. Caught by
inspecting `artifacts/encoders.json`'s own keys before use, confirmed byte-for-byte against the
source file, and fixed before any artifact built from the corrupted read was mounted into
`ml-service` or used for the metrics in § 3 above.

## 8. Still open (not this revision's job)

| Open item | Owner |
|---|---|
| Calibrating risk-band thresholds against real business risk tolerance | Product/UX, revisiting § 4 |
| `BATCH_SCORING_CADENCE_CRON` (scheduled, not on-demand, execution) | `DEV-001` |
| Per-prediction confidence/calibration (`ML-INFERENCE-001` § 2's reserved `confidence` field) | A future `ML-001`/`ML-002` revision |
| `Order Item Profit Ratio`/`Order Profit Per Order` business-confirmation (still excluded) | Business stakeholder, per `ML-PIPELINE-001` § 3 |
