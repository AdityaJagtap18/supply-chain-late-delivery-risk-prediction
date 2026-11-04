---
Prompt ID: ML-002
Prompt title: ML Inference Service Integration
Version: "1.0"
Category: 08-ml-model-integration
Status: Draft
---

## Objective

Design the inference-service contract (the same contract `BE-001` calls, and must match
byte-for-byte) and the integration pattern between the backend and the ML inference boundary,
using the model artifact and feature pipeline defined by `ML-001`.

## Required role/persona

ML Engineer with service-integration experience.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), especially § 3 item 4
(prediction-time feature availability) — the inference contract must only require inputs that
are genuinely available at call time.

## Prerequisites

`ML-001` approved (leakage-free pipeline and persistence plan exist); `BE-001` approved (so the
backend side of the contract is known).

## Input files and repository paths to inspect

- `docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md` (`ML-001`'s output — feature list,
  persistence format)
- `docs/generated/backend/BE-ARCH-001-api-and-layering.md` (the ML-inference boundary contract
  `BE-001` already sketched — this prompt finalizes it, not reinvents it)

## Detailed execution instructions

1. Finalize the request schema for a scoring call: exactly the features `ML-001` determined are
   both predictive *and* available at prediction time — cross-check this list field-by-field
   against `ML-001`'s feature-availability audit, not against the original notebook's full
   feature set.
2. Finalize the response schema: risk score/probability, class (if a threshold is applied
   server-side vs. left to the caller — decide and state which), **model version** (matching
   `DB-001`'s `risk_assessment.model_version` field so the two designs stay consistent), and a
   calibration/confidence indicator if `ML-001`'s evaluation protocol produced one.
3. Decide and document how encoding (e.g., the leakage-safe target-encoding maps from `ML-001`)
   is applied at inference time: it must use the **exact fitted mapping from training**, never
   be refit at inference time — state explicitly how that fitted state travels with the model
   artifact per `ML-001`'s persistence plan, so this isn't silently re-introducing leakage by a
   different path.
4. Evaluate, concretely (not just defer to `ARCH-002`), the two realistic integration patterns
   for *this* project's scale: (a) synchronous HTTP call from backend to a separate inference
   service per request, and (b) batch/offline scoring written to the `risk_assessment` table on
   a schedule, with the backend only ever reading pre-computed scores. State which fits the MVP
   scope from `PD-002` (does the MVP need a score the instant an order is placed, or is a
   nightly batch acceptable?) and recommend accordingly — this materially feeds ADR-0004.
5. Define error/fallback behavior: what the backend does if the inference service is
   unavailable or returns low-confidence output (fail the request? serve a stale cached score
   with a staleness flag, consistent with `FE-001`'s staleness handling?).

## Technical constraints

- The request/response schema defined here must be identical to the ML-inference-boundary
  contract already sketched in `BE-001`'s artifact — if a change is needed, it must be recorded
  as an explicit amendment to `BE-001`'s artifact (new version), not a silent divergence.
- Must not introduce a feature into the request schema that `ML-001`'s availability audit didn't
  clear.

## Expected outputs and deliverables

Finalized request/response contract, encoding-consistency mechanism description, integration
pattern recommendation (sync vs. batch) with rationale tied to MVP scope, and
error/fallback behavior spec.

## Output storage location

`docs/generated/ml/ML-INFERENCE-001-service-contract.md`

## Validation requirements

- Every request field is traceable to `ML-001`'s cleared-for-inference feature list.
- The response schema's `model_version` field matches `DB-001`'s schema field name exactly.
- The integration-pattern recommendation explicitly cites the MVP scope decision it's based on.

## Definition of Done

Artifact `status: Draft`; reviewed by both an ML lead and the backend lead (two-sided review,
since this is a shared contract); `Approved` unlocks `QA-001` and `DEV-001`'s ML-specific
sections, and is the primary input to ADR-0004 (ML inference architecture).

## Failure handling and clarification requirements

If `BE-001`'s sketch of the ML-inference contract and this prompt's finalized version disagree
on a field, do not silently resolve it in this artifact alone — flag it as a cross-prompt
conflict requiring both leads' sign-off before either artifact is marked `Approved`.

## Dependencies on other prompts

`ML-001`, `BE-001`.
