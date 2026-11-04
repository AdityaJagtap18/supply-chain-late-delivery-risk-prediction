---
Prompt ID: ML-001
Prompt title: ML Pipeline Productionization
Version: "1.0"
Category: 08-ml-model-integration
Status: Draft
---

## Objective

Design (and, where this prompt is executed as an implementation task rather than a design-only
task, build) a **leakage-free** training pipeline for the late-delivery-risk model, derived from
`supply_chain_late_delivery.ipynb` but correcting every numbered concern in
`PROJECT_CONTEXT.md § 3` that applies to training, with a defined evaluation protocol and a
concrete model-persistence/versioning plan. This is the single most important prompt in the
library for making the existing analysis trustworthy — treat it accordingly.

## Required role/persona

Senior ML Engineer with production ML experience (not just notebook data science) — specifically
experience with leakage-safe encoding and evaluation.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) § 3 in full — this prompt exists
*because* of that section; do not proceed without having internalized all 8 concerns.

## Prerequisites

`PRD-001` and `ARCH-001` approved (so the pipeline design knows where it sits in the larger
system and what the MVP actually needs the model to predict).

## Input files and repository paths to inspect

- `supply_chain_late_delivery.ipynb` (the full notebook — now runnable, per `README.md`)
- `docs/PRD.md § 10` (FR-018, FR-021–FR-025 — the existing encoding/training/tuning FRs),
  `§ 20` (GAP-007, GAP-008 specifically), `§ 23` (reported metrics, flagged as likely optimistic)
- `final_sample.csv`, `df_last.csv` (schemas and, if needed, sampled rows)
- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md` (where training fits)

## Detailed execution instructions

1. **Fix the leakage order of operations** (concerns #1 and #2): redesign the pipeline so the
   train/test (or train/validation/test) split happens **first**, and both the statistical
   feature-selection step (Chi²/Mann-Whitney U against the target) and the target-encoding
   fit happen **only on the training fold**, then are applied (not refit) to validation/test
   data. If k-fold cross-validation is used for feature selection or encoding, make sure the
   fold boundaries are respected consistently, not mixed.
2. **Address the `Customer Id` concern** (#3): decide and document one of — (a) drop `Customer
   Id` as a raw identifier feature and replace it with a generalizable aggregate computed
   leakage-safely (e.g., a smoothed/regularized historical late-rate, computed only from prior
   orders relative to each order's timestamp if temporal ordering is available, or via proper
   nested cross-validation if not), or (b) keep it but explicitly document the cold-start
   failure mode (new customer → no encoding → defined fallback value) and get this trade-off
   reviewed rather than silently keeping the original leakage-prone approach.
3. **Address prediction-time feature availability** (#4): for every feature retained, state
   explicitly whether it is known at the MVP's defined prediction time (from `PD-002`/`PRD-001`
   — e.g., at order placement). Drop or flag as "if available" any feature that isn't (this may
   include fields like `Order Status` which could itself be downstream of the thing being
   predicted — audit this specifically, it wasn't checked in the original notebook).
4. **Define the real evaluation protocol** (concerns #6 and #7): report PR-AUC, ROC-AUC,
   precision, recall, F1, a calibration curve/Brier score, and a confusion matrix at a
   business-chosen threshold (not just 0.5) — and explicitly re-run the model comparison from
   the notebook (9 classifiers, at least the Model-1-equivalent encoding) under the corrected,
   leakage-free pipeline, so the resulting numbers are comparable to — and clearly labeled as
   superseding — the notebook's original ones. State explicitly if/how the new recall figure
   differs from the original ~0.86 and why.
5. **Model persistence/versioning plan** (feeds ADR-0007): specify the serialization format
   (e.g., a standard, inspectable format rather than a bespoke pickle with no metadata), what
   metadata travels with the artifact (training data snapshot identifier, feature list, encoder
   state, metric values, training date, library versions — mirroring the `requirements.txt`
   discipline already established for the notebook), and where/how versions are tracked (a
   model registry vs. a versioned file-naming convention — present both as options for
   ADR-0007, do not just assume one).
6. **Dataset provenance** (concern #8): either resolve this (confirm the source dataset's
   license and add an acquisition script/note) or explicitly carry it forward as a blocking
   open item for anyone trying to retrain beyond the committed `final_sample.csv`/`df_last.csv`.

## Technical constraints

- Must produce a result that is comparable to the original notebook's reported figures (same
  target variable, broadly same feature universe minus what's dropped per steps 2–3) so the
  "before/after" leakage-fix comparison in step 4 is meaningful, not apples-to-oranges.
- Must not claim any of the 8 concerns are resolved unless this artifact's own content
  demonstrably resolves them (per `PROJECT_CONTEXT.md § 3`'s "do not claim fixed" rule) — if a
  concern is only partially addressed, say so precisely.

## Expected outputs and deliverables

A pipeline design document (and, if implemented, the corrected pipeline code/notebook or script)
with: the corrected leakage-safe procedure, the full evaluation-metric report (before/after
comparison), the `Customer Id` decision and rationale, the feature-availability audit, and the
model-persistence/versioning proposal.

## Output storage location

`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md` (design doc); if implementation
code is produced as part of this prompt's execution, it belongs under a to-be-created
`src/ml-service/` tree — but per the repository modification safety rules, do not create that
tree until this prompt is explicitly run in "implement" mode with that scope agreed, since the
default mode for this prompt (and this whole library, per the brief it was created under) is
design/documentation, not implementation.

## Validation requirements

- Every one of the 8 numbered concerns in `PROJECT_CONTEXT.md § 3` is explicitly addressed
  (fixed, partially mitigated with rationale, or explicitly carried forward as unresolved) —
  none may be silently skipped.
- The before/after metric comparison in step 4 is present and both sides are clearly labeled.
- The feature-availability audit from step 3 covers every feature retained into the final model.

## Definition of Done

Artifact `status: Draft`; reviewed by a human ML lead who specifically checks the leakage fix
(ideally by independently re-deriving at least one reported metric); `Approved` unlocks `ML-002`
and is the primary input to ADR-0007 (model storage/versioning) and ADR-0004 (ML inference
architecture, together with `ARCH-002`).

## Failure handling and clarification requirements

If fixing the leakage changes the conclusion about which model/encoding is "best" (quite
possible, since leakage inflates performance unevenly across models), do not quietly keep the
original notebook's "XGBoost, Model 1 encoding" conclusion — re-run the comparison and report
whatever the corrected result actually is, even if it contradicts the original narrative.

## Dependencies on other prompts

`PRD-001`, `ARCH-001`.
