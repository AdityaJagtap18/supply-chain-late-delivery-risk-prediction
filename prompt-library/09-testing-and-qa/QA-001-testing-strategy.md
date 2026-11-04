---
Prompt ID: QA-001
Prompt title: Testing Strategy
Version: "1.0"
Category: 09-testing-and-qa
Status: Draft
---

## Objective

Produce a testing strategy covering unit, integration, end-to-end, and ML-specific validation
(the latter being distinct from — and necessary in addition to — conventional software testing,
since a correctly-running pipeline can still silently produce a statistically wrong model).

## Required role/persona

QA/Test Architect, with enough ML literacy to specify ML-specific test types (not just "test the
API").

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`ARCH-001`, `BE-001`, `FE-001`, and `ML-002` approved.

## Input files and repository paths to inspect

- `docs/generated/backend/BE-ARCH-001-api-and-layering.md`
- `docs/generated/frontend/FE-ARCH-001-frontend-architecture.md`
- `docs/generated/ml/ML-INFERENCE-001-service-contract.md`
- `docs/PRD.md § 18` (existing Error Handling and Edge Cases findings — the notebook currently
  has zero exception handling; this strategy must ensure the web app doesn't inherit that)

## Detailed execution instructions

1. Define unit-test scope per layer (backend service/repository logic, frontend
   components/state, ML feature-transformation functions) with a stated minimum coverage
   expectation and which parts are exempt and why (e.g., generated code).
2. Define integration-test scope: backend-to-database, backend-to-ML-inference-service (using
   `ML-002`'s finalized contract — including the error/fallback behavior it specifies, which
   must be integration-tested, not just unit-tested with mocks).
3. Define end-to-end test scope for the MVP's primary user journey (from `UI-001`/`FE-001`):
   at minimum, the full path from an order existing in the database to a risk score rendering
   correctly in the UI, including the loading/error/empty states `UI-001` specified.
4. Define **ML-specific validation**, distinct from conventional tests:
   - A **training-pipeline regression test**: given a fixed input snapshot, the pipeline from
     `ML-001` must produce metrics within an agreed tolerance of a recorded baseline — this
     catches silent leakage regressions (e.g., someone reintroducing pre-split encoding) by
     making an unexplained metric jump a flagged failure, not a celebrated improvement.
   - A **feature-availability contract test**: assert that the request schema `ML-002` defines
     contains no field absent from `ML-001`'s cleared-for-inference list (automatable as a
     schema diff).
   - A **data-drift smoke test** (even a simple one): compare summary statistics of live
     production inputs (once there are any) against the training-data distribution, flagging
     large deviations — tie this explicitly to the dataset-provenance concern in
     `PROJECT_CONTEXT.md § 3` item 8.
5. Explicitly define what is **out of scope** for QA-001 and belongs to `SEC-001` instead
   (security-specific testing, e.g., auth bypass, injection) to avoid duplicate/overlapping test
   plans.

## Technical constraints

- Must not assume a specific test framework tied to an unapproved technology choice beyond what
  `ARCH-002`/accepted ADRs have settled — where framework names are used for concreteness, mark
  them as illustrative pending the relevant ADR.
- The ML-specific validation items (step 4) are mandatory inclusions, not optional — a generic
  "testing strategy" that omits them does not satisfy this prompt's objective.

## Expected outputs and deliverables

A testing-strategy document covering all four layers above, each with scope, tooling
(illustrative), and a stated coverage/acceptance bar.

## Output storage location

`docs/generated/testing/QA-STRATEGY-001-testing-strategy.md`

## Validation requirements

- All three ML-specific validation items in step 4 are present and each ties back to a specific
  named concern in `PROJECT_CONTEXT.md § 3` or a specific contract from `ML-001`/`ML-002`.
- No test scope overlaps `SEC-001`'s stated scope without cross-reference.

## Definition of Done

Artifact `status: Draft`; reviewed by a human QA lead; `Approved` status feeds into `DEV-001`'s
CI/CD pipeline design (which test suites gate a deploy).

## Failure handling and clarification requirements

If a coverage/acceptance bar can't be set without knowing the team's actual tooling/CI budget,
state a reasonable default explicitly marked as a placeholder recommendation rather than leaving
the field blank.

## Dependencies on other prompts

`ARCH-001`, `BE-001`, `FE-001`, `ML-002`.
