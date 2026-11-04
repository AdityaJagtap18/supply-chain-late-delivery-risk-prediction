---
artifact_id: IMPL-ROADMAP-DOC
title: Implementation Roadmap (Process Workflow, Not a Technology Plan)
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Implementation Roadmap

This is the recommended **process workflow** for turning the SupplyChainOptimization notebook
prototype into a web application, expressed as stages of prompt-library execution and human
review — not a technology-specific project plan (no dates/estimates are given, since those
depend on decisions not yet made; see [docs/decisions/README.md](decisions/README.md)).

For the roadmap specific to the *existing notebook prototype's own* technical debt (independent
of the web-application effort), see [docs/PRD.md § 21](PRD.md#21-product-roadmap) — that roadmap
and this one are complementary: PRD §21's Phase 1–2 (fixing the notebook's reproducibility and
leakage issues) is largely what `ML-001` (Stage 6 below) formalizes and executes properly.

## Stage 1 — Project understanding

- Inspect existing work: `docs/PRD.md`, `docs/PRD_VALIDATION.md`, `docs/architecture/*`.
- Establish project context: [prompt-library/PROJECT_CONTEXT.md](../prompt-library/PROJECT_CONTEXT.md).
- Identify gaps and assumptions: run
  [PD-001](../prompt-library/01-product-discovery/PD-001-existing-project-review.md).

**Gate to Stage 2:** `PD-001`'s digest artifact exists and has been read by whoever runs
`PD-002`.

## Stage 2 — Product definition

- Product vision and MVP scope: [PD-002](../prompt-library/01-product-discovery/PD-002-product-vision-mvp.md).
- Refined requirements: [PRD-001](../prompt-library/02-prd-and-requirements/PRD-001-prd-refinement.md).

**Gate to Stage 3:** `PD-002` and `PRD-001` artifacts are `Approved` by a human product owner.

## Stage 3 — Architecture

- High-level architecture: [ARCH-001](../prompt-library/03-system-architecture/ARCH-001-technical-architecture-design.md).
- Trade-off evaluation: [ARCH-002](../prompt-library/03-system-architecture/ARCH-002-architecture-tradeoff-evaluation.md).
- Component design: feeds directly from `ARCH-001`.
- Database design: [DB-001](../prompt-library/05-database-design/DB-001-database-architecture.md).
- API design: [BE-001](../prompt-library/06-backend-development/BE-001-backend-architecture.md)
  (also started in this stage even though it's listed under "Backend Development" category —
  its *design* output is an architecture artifact; its *implementation* is Stage 5).
- ADR approval: human reviewers convert `ARCH-002`'s recommendations into ADRs under
  `docs/decisions/`, and accept (or reject) each one — see
  [docs/decisions/README.md § Anticipated decisions backlog](decisions/README.md#anticipated-decisions-backlog).

**Gate to Stage 4:** `ARCH-001`, `DB-001`, `BE-001` artifacts `Approved`; ADR-0001–0003 and
ADR-0005 at least drafted (not necessarily all `Accepted` yet, but no longer just backlog
placeholders).

## Stage 4 — UX and interface

- Design system: [UI-001](../prompt-library/04-ui-ux-design/UI-001-design-system.md).
- User journeys: already drafted in `docs/architecture/user-journeys.md`; `UI-001` makes the
  proposed (not-yet-implemented) journey concrete at the screen level.
- Wireframes / screen specifications: produced within `UI-001`'s artifact.

**Gate to Stage 5:** `UI-001` artifact `Approved`; `FE-001` (next stage) can then proceed.

## Stage 5 — Application implementation

- Frontend architecture: [FE-001](../prompt-library/07-frontend-development/FE-001-frontend-architecture.md).
- Backend, authentication, database integration: implementation of what `BE-001`/`DB-001`/the
  accepted auth-strategy ADR (ADR-0005) specified.
- **This is the first stage where code under `src/` is created** — and only once the relevant
  ADRs (frontend framework, backend framework, database, auth strategy) are `Accepted`, per
  [prompt-library/PROJECT_CONTEXT.md § 4, rule 9](../prompt-library/PROJECT_CONTEXT.md#4-ai-agent-execution-rules).
  Until then, `src/frontend/`, `src/backend/`, `src/ml-service/` deliberately do not exist in
  this repository.

**Gate to Stage 6:** a working backend + frontend skeleton implementing the MVP's
non-ML-dependent flows (even with a stubbed risk score) exists and passes `QA-001`'s unit/
integration gates for those layers.

## Stage 6 — ML integration

- Leakage-free training pipeline: [ML-001](../prompt-library/08-ml-model-integration/ML-001-pipeline-productionization.md) —
  this is where the correctness concerns in
  [prompt-library/PROJECT_CONTEXT.md § 3](../prompt-library/PROJECT_CONTEXT.md#3-known-ml-correctness-concerns--carry-forward-do-not-claim-fixed)
  must actually get fixed, not just documented as known.
- Model evaluation: the before/after metric comparison `ML-001` requires.
- Model persistence: `ML-001`'s persistence/versioning plan, authorized by ADR-0007.
- Inference service: [ML-002](../prompt-library/08-ml-model-integration/ML-002-inference-integration.md),
  authorized by ADR-0004.
- Application integration: the stubbed risk score from Stage 5 is replaced with the real
  inference call per `ML-002`'s contract.

**Gate to Stage 7:** `ML-001`'s before/after metrics are reviewed and accepted as the new
baseline (explicitly superseding the original notebook's reported figures, per
`docs/PRD.md § 23`'s caveat); `ML-002`'s contract is implemented and integration-tested.

## Stage 7 — Validation and release

- Testing: [QA-001](../prompt-library/09-testing-and-qa/QA-001-testing-strategy.md) executed in
  full, including its ML-specific validation suite.
- Security: [SEC-001](../prompt-library/10-security-and-performance/SEC-001-security-threat-modeling.md),
  authorized by ADR-0005 where applicable.
- Performance: validated against whatever NFR targets `PRD-001`/`ARCH-002` set.
- Deployment: [DEV-001](../prompt-library/11-deployment-and-devops/DEV-001-deployment-devops-strategy.md),
  authorized by ADR-0006.
- Monitoring: the health-check/monitoring spec from `DEV-001`'s runbook goes live.

**Gate to "done" (MVP release):** all of the above artifacts `Approved`; all relevant ADRs
`Accepted`; `QA-001`'s gates green in CI; `SEC-001`'s requirements implemented and verified.

## Ongoing, cross-cutting

- [DOC-001](../prompt-library/12-documentation-and-maintenance/DOC-001-documentation-maintenance.md)
  runs periodically (recommended: after each stage gate above) to keep the traceability system
  itself trustworthy — see [prompt-library/LIBRARY_VALIDATION.md](../prompt-library/LIBRARY_VALIDATION.md)
  for the system's own validation state.
