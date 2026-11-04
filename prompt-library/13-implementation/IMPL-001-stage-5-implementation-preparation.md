---
Prompt ID: IMPL-001
Prompt title: Stage 5 Implementation Preparation
Version: "1.0"
Category: 13-implementation
Status: Draft
---

> **Note on category.** `13-implementation` is a new category, not one of the twelve
> `PROMPT_STANDARDS.md § 2` originally defined — this prompt is genuinely cross-cutting (it
> touches frontend, backend, ML, and deployment all at once, as the Stage 3→5 transition itself)
> and does not belong under any single existing prefix. This is noted explicitly, as a standards
> extension, rather than silently forcing an `IMPL` prompt under e.g. `11-deployment-and-devops`.

## Objective

Prepare the repository for actual application development using the seven `Accepted` ADRs and
the approved architecture artifacts — the transition from design to implementation. Finalize the
project owner's approval of the `payment_type` database revision, verify Stage 5's entry gate,
prepare (not populate) the `src/`/`infra/`/`scripts/`/`tests/` workspace, and define exactly one
first implementation milestone (proving the four main components can communicate).

## Required role/persona

Senior Full-Stack Architect and Technical Lead.

## Required project context

`prompt-library/PROJECT_CONTEXT.md`, `docs/IMPLEMENTATION_ROADMAP.md` (Stage 5's gate),
`docs/generated/architecture/ARCH-FINALIZATION-001.md` and
`ARCH-DESIGN-002-finalized-architecture.md` (what this prompt acts on).

## Prerequisites

`ARCH-005` executed (all seven ADRs `Accepted`). The project owner has explicitly approved all
five items of `DB-ARCH-REVISION-001-type-feature.md` § 7's review checklist, outside this
prompt — this prompt records that approval, it does not seek or simulate it.

## Input files and repository paths to inspect

`docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`,
`docs/generated/database/DB-ARCH-001-schema-design.md`, all seven `docs/decisions/ADR-000N-*.md`
files, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/PRD.md`, `docs/TECHNICAL_DESIGN.md`,
`docs/decisions/README.md`, `docs/generated/architecture/ARCH-FINALIZATION-001.md`,
`docs/generated/architecture/ARCH-DESIGN-002-finalized-architecture.md`,
`docs/generated/architecture/ARCH-BLOCKERS-001.md`,
`docs/generated/architecture/ARCH-CONSISTENCY-001.md`, repository root listing (to confirm
whether `src/` exists before assuming anything about it).

## Detailed execution instructions

1. Record the project owner's approval of `DB-ARCH-REVISION-001`'s five checklist items; change
   its status `In Review` → `Approved`; add a dated human-approval record; update
   `docs/generated/database/README.md` and the architecture blocker/consistency artifacts' own
   closure notes. Keep `DB-ARCH-001` unmodified.
2. Verify Stage 5's entry gate directly against the current content of every file listed above —
   all seven ADRs `Accepted`, technology choices agreeing with the finalized architecture, the
   database revision `Approved`, both Critical blockers closed, no `src/` assumed to exist
   without checking. Record results in an implementation-readiness report.
3. Carry forward `ARCH-CONSISTENCY-001`'s CONS-004–007 findings as tracked, non-blocking
   considerations — implement the existing backend contract, do not invent a production batch
   cadence or expose a manual trigger, treat the manual-refresh affordance as a minor backlog
   item, and do not invent customer-history fields.
4. Prepare (not populate) `src/frontend/`, `src/backend/`, `src/ml-service/`, `infra/docker/`,
   `scripts/`, `tests/`, and a root `.env.example` — ownership documentation and an environment
   inventory only, no application scaffold or boilerplate code.
5. Define exactly one first implementation milestone: proving the four main components can
   communicate (frontend ↔ backend ↔ database, backend ↔ ML service, health checks), with an
   honest "model unavailable" fallback if artifacts are missing — never a fabricated prediction.
6. Produce `docs/implementation/IMPLEMENTATION-READINESS-001.md` and
   `docs/implementation/IMPLEMENTATION-PLAN-001.md`; update the relevant README/index files and
   the prompt-library index.

## Technical constraints

Do not reopen or revise any `Accepted` ADR. Do not re-run the cross-artifact consistency review.
Do not implement the dashboard, the batch scheduler, or any feature beyond the first milestone.
Do not train a new ML model or change its metrics/features. Do not invent a cloud provider,
orchestrator, production cadence, or API field. Do not modify any unrelated `Approved` document.
Do not generate placeholder application code merely to populate a directory.

## Expected outputs and deliverables

`DB-ARCH-REVISION-001-type-feature.md` at `status: Approved`; the prepared workspace directories
and `.env.example`; `docs/implementation/IMPLEMENTATION-READINESS-001.md`; `docs/implementation/
IMPLEMENTATION-PLAN-001.md`; updated traceability across `docs/generated/database/README.md`,
`docs/generated/architecture/README.md`, `docs/generated/architecture/ARCH-BLOCKERS-001.md`,
`docs/generated/architecture/ARCH-CONSISTENCY-001.md`, and `prompt-library/PROMPT_INDEX.md`.

## Output storage location

`docs/implementation/IMPLEMENTATION-READINESS-001.md`;
`docs/implementation/IMPLEMENTATION-PLAN-001.md`; `src/*/README.md`; `infra/docker/README.md`;
`scripts/README.md`; `tests/README.md`; `.env.example` at the repository root.

## Validation requirements

Stage 5's entry gate is verified against current file content, not assumed; the database
revision's approval is recorded with a dated note; both Critical blockers' closure is recorded
directly in `ARCH-BLOCKERS-001.md`; the workspace contains no application code; the first
milestone's definition of done includes the honest-failure-on-missing-artifacts case.

## Definition of Done

All items in "Expected outputs" exist; the readiness report's validation-results table is
checked against the actual current files, not restated from an earlier session's memory; the
plan names an exact first coding task and explicit conditions for moving past Phase 1; execution
stops after these deliverables — no phase of implementation work begins automatically.

## Failure handling and clarification requirements

If any Stage 5 entry-gate condition is found not actually satisfied when checked (e.g. an ADR
that is not in fact `Accepted` in its own file), halt and report rather than proceeding as if it
were met.

## Dependencies on other prompts

ARCH-005 (its ADR acceptances and database-revision proposal are this prompt's direct input).
