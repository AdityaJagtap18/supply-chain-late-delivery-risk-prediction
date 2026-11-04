---
Prompt ID: ARCH-005
Prompt title: Final ADR Acceptance & Database Schema Revision
Version: "1.0"
Category: 03-system-architecture
Status: Draft
---

## Objective

Record the project owner's explicit, already-made decisions — acceptance of all seven ADRs
(ADR-0001–ADR-0007) exactly as drafted by `ARCH-004`, confirmation that no existing MySQL/Oracle
agreement overrides PostgreSQL, confirmation that no existing SSO/IdP requirement overrides
session-based Spring Security, and selection of Option A for the missing `Type` ML feature — and
apply the Option A resolution as an actual (not merely proposed) database schema revision. This
prompt records human decisions; it makes none itself.

## Required role/persona

Senior Software Architect and Repository Engineer.

## Required project context

`prompt-library/PROJECT_CONTEXT.md`, `prompt-library/PROMPT_INDEX.md`,
`docs/generated/architecture/ARCH-DECISIONS-001-summary.md` (what this prompt acts on).

## Prerequisites

`ARCH-004` executed (all seven ADRs exist as `Proposed`; the `Type`-feature proposal exists as a
`Draft`). The project owner has explicitly approved all seven ADR recommendations as drafted, the
PostgreSQL and session-based-auth confirmations, and Option A for the `Type` feature, outside
this prompt — this prompt's job is to record that approval, not to seek or simulate it.

## Input files and repository paths to inspect

All seven `docs/decisions/ADR-000N-*.md` files, `docs/decisions/README.md`,
`docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`,
`docs/generated/database/DB-ARCH-001-schema-design.md`,
`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md`,
`docs/generated/ml/ML-INFERENCE-001-service-contract.md`,
`docs/generated/backend/BE-ARCH-001-api-and-layering.md`,
`docs/generated/architecture/ARCH-DECISIONS-001-summary.md`, `prompt-library/PROMPT_INDEX.md`,
`prompt-library/PROMPT_CHANGELOG.md`.

## Detailed execution instructions

1. Update all seven ADR files' `status` to `Accepted`, in dependency order (ADR-0004, ADR-0002,
   ADR-0005, ADR-0001, ADR-0003, ADR-0006, ADR-0007), each with a dated human-approval record
   stating the decision accepted and this record's position in that order; verify each ADR's
   stated dependency condition (ADR-0004 before ADR-0002; ADR-0002 before ADR-0005) before
   accepting the dependent. Record the MySQL/Oracle confirmation on ADR-0003 and the SSO/IdP
   confirmation on ADR-0005, verbatim as given. Preserve ADR-0006's containerized-vs-serverless
   distinction and ADR-0007's reconsideration trigger as accepted, not altered.
2. Rewrite `DB-ARCH-REVISION-001-type-feature.md` from a proposal into an actual revised-schema
   artifact: a concrete column (name, type, nullability, constraints — none invented beyond what
   the source data supports), migration considerations, backend/ML contract implications
   (confirming the inference contract and model are unchanged), a validation checklist, and
   source-artifact/ADR links. Keep `DB-ARCH-001` itself unmodified. Mark the revision artifact
   `In Review` or `Draft`, never auto-`Approved`; include a review checklist for the project
   owner.
3. Update traceability: `docs/decisions/README.md` (ADRs now `Accepted`, dependency order
   recorded), `prompt-library/PROMPT_INDEX.md` (register this prompt's execution),
   `docs/generated/architecture/README.md`, `docs/generated/database/README.md`, and
   `prompt-library/PROMPT_CHANGELOG.md` if its own standards require an entry for this prompt's
   creation.
4. Produce `docs/generated/architecture/ARCH-FINALIZATION-001.md`: the final acceptance register,
   files touched, validation results, and remaining action items.

## Technical constraints

Do not re-run the `ARCH-003` consistency review. Do not reopen or re-evaluate any accepted
decision, or generate new alternatives. Do not retrain the ML model or change its evaluation
metrics or feature set. Do not begin application source code. Do not modify any unrelated,
already-`Approved` artifact. Do not mark the revised schema artifact `Approved` — that remains a
separate human action.

## Expected outputs and deliverables

Seven ADR files updated to `Accepted`; a rewritten `DB-ARCH-REVISION-001-type-feature.md`
(`In Review`); updated `docs/decisions/README.md`, `prompt-library/PROMPT_INDEX.md`,
`docs/generated/architecture/README.md`, `docs/generated/database/README.md`; a new
`ARCH-FINALIZATION-001.md`.

## Output storage location

`docs/decisions/ADR-NNNN-*.md`; `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`;
`docs/generated/architecture/ARCH-FINALIZATION-001.md`.

## Validation requirements

All seven ADRs show `status: Accepted` with a human-approval record and verified dependency
conditions; the required MySQL/Oracle and SSO/IdP confirmations are recorded verbatim on the
correct ADRs; the revised schema artifact is `In Review`, not `Approved`, and contains a review
checklist; `DB-ARCH-001` is unmodified; the ML inference contract and model are confirmed
unchanged; no unrelated artifact was touched.

## Definition of Done

All items in "Expected outputs" exist; the acceptance register in `ARCH-FINALIZATION-001.md`
accurately reflects every ADR's new status and date; a report to the project owner states files
touched, the final acceptance register, validation results, and remaining action items (chiefly:
the revised schema artifact still needs its own human review before `Approved`).

## Failure handling and clarification requirements

If any ADR's stated dependency condition is not actually satisfied in that ADR's own file when
checked, halt and report rather than accepting it anyway.

## Dependencies on other prompts

ARCH-004 (its drafts and proposal are this prompt's direct input).
