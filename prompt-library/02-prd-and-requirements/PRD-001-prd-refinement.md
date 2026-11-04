---
Prompt ID: PRD-001
Prompt title: PRD Refinement for Web Application
Version: "1.0"
Category: 02-prd-and-requirements
Status: Draft
---

## Objective

Extend `docs/PRD.md` — the existing, reverse-engineered PRD of the notebook prototype — with the
additional functional and non-functional requirements needed for the web application defined by
`PD-002`'s MVP scope, **without rewriting or discarding** the existing reverse-engineering
content (§ 1–25 as they stand describe the prototype accurately and remain valid).

## Required role/persona

Technical Business Analyst / Requirements Engineer, fluent in both product requirements and the
ML correctness concerns that must shape the new FRs/NFRs.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) in full, especially § 3 — any new FR
touching the ML pipeline must reference the relevant numbered concern rather than silently
assume it's handled.

## Prerequisites

`PD-002` approved (MVP scope decided).

## Input files and repository paths to inspect

- `docs/PRD.md` (the whole document, especially § 9–11, § 20–21, § 24)
- `docs/generated/product/PD-VISION-001-mvp-scope.md` (PD-002's output)
- `docs/generated/product/PD-REVIEW-001-existing-project-digest.md` (PD-001's output)

## Detailed execution instructions

1. Do not create a second PRD file. This prompt **revises `docs/PRD.md` in place**, following
   the versioning discipline in
   [PROMPT_STANDARDS.md § 3](../PROMPT_STANDARDS.md#3-versioning-rules): if `docs/PRD.md` has no
   metadata block yet, add one (`artifact_id: PRD-DOC-001`, `source_prompt: PRD-001`,
   `status: Draft`) without otherwise disturbing its existing content; if a future revision
   needs to replace already-`Approved` content, that revision creates a new version per the
   same rule rather than editing in place.
2. Add a new top-level section (e.g., "§ 28 — Web Application Requirements (MVP)") rather than
   interleaving new requirements into the existing numbered sections, so the original
   prototype-reverse-engineering content stays intact and separately readable.
3. Translate `PD-002`'s MVP in/out list into new functional requirements using the **same
   FR table format** as the existing `docs/PRD.md § 10` (ID, Name, Description, Actor,
   Preconditions, Trigger, Expected behavior, Postconditions, Priority, Status, Evidence).
   Continue the ID sequence from the highest existing FR number (do not restart at FR-001) and
   use `Status: Planned` for all of them (none of this exists yet).
4. For every new FR that touches ML scoring, cite which of the numbered ML correctness concerns
   in `PROJECT_CONTEXT.md § 3` it depends on being resolved (e.g., "FR-029 (live risk scoring)
   depends on concern #4 — prediction-time feature availability — being resolved by `ML-001`").
5. Add new NFRs for the web application specifically: authentication/session handling, API
   latency targets (even placeholder targets marked "to be set by `ARCH-002`/`DEV-001`"), and
   data-privacy requirements extending `docs/PRD.md § 17`'s existing findings about retained
   quasi-identifiers (`Customer Id`, zip code, lat/long) — state whether the web app's intended
   users (per `PD-002`) require those fields to be masked, aggregated, or role-gated.
6. Update `docs/PRD.md § 24` (Open Questions) by appending new ones raised here, rather than
   replacing the existing list.
7. Add a short "Document History" note near the top of `docs/PRD.md` (new, does not disturb
   existing sections) recording that this prompt extended it, with date and prompt ID/version.

## Technical constraints

- Must not alter any existing FR/NFR/gap entry's content or classification (Implemented/
  Partial/Planned) from the original reverse-engineering pass — only add.
- Must not assume a specific technology stack when writing new FRs (no "the Angular frontend
  shall..." — write actor/behavior language instead, e.g., "the web application shall...").

## Expected outputs and deliverables

An in-place, additive revision of `docs/PRD.md` (new section + appended open questions + a
Document History note), diff-reviewable against its prior content.

## Output storage location

`docs/PRD.md` (existing file, revised in place per the additive rule above — this is the one
prompt in the library whose "generated artifact" is not a new file under `docs/generated/`).

## Validation requirements

- `diff` against the pre-revision `docs/PRD.md` shows only additions, no deletions/edits to
  existing §1–27 content (aside from the new Document History note at the top).
- Every new FR has a unique ID continuing the existing sequence.
- Every new ML-touching FR cites a numbered concern from `PROJECT_CONTEXT.md § 3`.

## Definition of Done

Revision complete with correct additive diff; a human reviewer (ideally the same one who
approved `PD-002`) confirms the new requirements match the approved MVP scope with nothing
silently added or dropped, then updates `docs/PRD.md`'s metadata `status` accordingly.

## Failure handling and clarification requirements

If `PD-002`'s MVP scope is ambiguous about a required FR (e.g., it says "live scoring" without
saying synchronous vs. batch), do not resolve the ambiguity unilaterally — add the FR with
`Status: Planned` and an explicit `Note:` calling out the ambiguity, and list it in the Open
Questions appendix.

## Dependencies on other prompts

`PD-002`.
