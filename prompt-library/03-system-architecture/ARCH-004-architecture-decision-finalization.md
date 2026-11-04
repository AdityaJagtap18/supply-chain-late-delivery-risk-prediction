---
Prompt ID: ARCH-004
Prompt title: Architecture Decision Finalization & Implementation Gate
Version: "1.0"
Category: 03-system-architecture
Status: Draft
---

## Objective

Resolve the architecture governance blocker identified by `ARCH-003` (BLOCK-001: zero ADRs
exist). Draft the seven proposed ADRs (ADR-0001–ADR-0007) from `ARCH-TRADEOFF-001`'s
recommendations. Prepare a focused resolution proposal for `ARCH-003`'s other Critical blocker
(BLOCK-002: the missing `Type` ML feature in the database schema). Move the project toward
implementation without re-opening a broad architecture review.

## Required role/persona

Principal Software Architect and Technical Decision Documentation Engineer.

## Required project context

`prompt-library/PROJECT_CONTEXT.md`, `prompt-library/PROMPT_INDEX.md`,
`docs/generated/architecture/ARCH-BLOCKERS-001.md` (what this prompt resolves).

## Prerequisites

`ARCH-003` executed (its blockers are this prompt's input).

## Input files and repository paths to inspect

`docs/decisions/README.md`, `docs/decisions/ADR-001-template.md`,
`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md`,
`docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`,
`docs/generated/database/DB-ARCH-001-schema-design.md`,
`docs/generated/backend/BE-ARCH-001-api-and-layering.md`,
`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md`,
`docs/generated/ml/ML-INFERENCE-001-service-contract.md`,
`docs/generated/security/SEC-THREATMODEL-001-threat-model.md`,
`docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md`,
`docs/IMPLEMENTATION_ROADMAP.md`, `prompt-library/PROJECT_CONTEXT.md`,
`prompt-library/PROMPT_INDEX.md`.

## Detailed execution instructions

1. Draft seven ADR files from `ARCH-TRADEOFF-001`'s recommendations, using
   `ADR-001-template.md`'s structure, all `status: Proposed`. Resolve ADR-0004 before finalizing
   ADR-0002; keep ADR-0005 contingent on the backend-framework decision; preserve the
   application-deployment vs. batch-job-execution distinction in ADR-0006.
2. Investigate (against actual repository data) and propose a resolution for the missing `Type`
   feature: `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`, evaluating data
   availability, entity mapping, migration impact, backend contract impact, ML retraining
   requirements, and effect on existing evaluation results, with a recommendation. Do not execute
   a new training run unless explicitly in scope (it is not, here).
3. Produce `docs/generated/architecture/ARCH-DECISIONS-001-summary.md` summarizing all seven ADR
   recommendations, their dependencies, what requires human approval, the `Type` resolution,
   which decisions gate scaffolding, and which can wait.
4. Update `docs/decisions/README.md` and `prompt-library/PROMPT_INDEX.md` traceability; carry
   forward (not resolve) `ARCH-003`'s non-blocking findings (CONS-004–007) as a backlog.

## Technical constraints

Never set an ADR's status to `Accepted`. Never silently modify an existing `Approved` artifact.
Do not execute a new model training run unless the repository contains a reproducible training
setup and it is explicitly in scope. Do not re-open the full `ARCH-003` consistency review. Do
not begin writing application source code.

## Expected outputs and deliverables

Seven ADR files; `DB-ARCH-REVISION-001-type-feature.md`; `ARCH-DECISIONS-001-summary.md`; updated
`docs/decisions/README.md` and `prompt-library/PROMPT_INDEX.md`.

## Output storage location

`docs/decisions/ADR-NNNN-*.md`; `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`;
`docs/generated/architecture/ARCH-DECISIONS-001-summary.md`.

## Validation requirements

Seven ADRs exist with `status: Proposed`; every ADR links to its source trade-off section and
downstream artifacts; the `Type` proposal references all affected artifacts; no status falsely
represented as `Accepted`; a human-approval checklist is explicit.

## Definition of Done

All items in "Expected outputs" exist; no existing `Approved` artifact was silently modified; a
report states files touched, the recommended stack, ADRs awaiting acceptance, the `Type`
recommendation, exact decisions required from the project owner, and whether the project can
proceed to implementation after those decisions.

## Failure handling and clarification requirements

Any new cross-artifact conflict discovered while drafting an ADR is reported, not silently
resolved, and not treated as license to re-open the broader `ARCH-003` review.

## Dependencies on other prompts

ARCH-003 (its blockers are this prompt's direct input).
