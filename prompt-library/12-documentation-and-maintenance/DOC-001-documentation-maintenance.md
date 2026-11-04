---
Prompt ID: DOC-001
Prompt title: Documentation & Artifact Lifecycle Maintenance
Version: "1.0"
Category: 12-documentation-and-maintenance
Status: Draft
---

## Objective

Periodically audit the prompt library, generated artifacts, and ADRs for staleness, orphaned
references, missing metadata, and broken links — keeping the traceability system in
[docs/decisions/README.md](../../docs/decisions/README.md) actually trustworthy over time rather
than accurate only at initial setup.

## Required role/persona

Documentation/Knowledge-Management Engineer.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), and specifically an up-to-date read
of [PROMPT_INDEX.md](../PROMPT_INDEX.md) at the time of each audit run (not a cached memory of
it from a previous run).

## Prerequisites

None structurally, but it is most useful run after a batch of prompt executions (e.g., after
each of the Stage 3–7 milestones in
[docs/IMPLEMENTATION_ROADMAP.md](../../docs/IMPLEMENTATION_ROADMAP.md)), not continuously.

## Input files and repository paths to inspect

- Everything under `prompt-library/` and `docs/generated/`, plus `docs/decisions/`.
- `docs/PRD.md`, `docs/TECHNICAL_DESIGN.md`, `docs/IMPLEMENTATION_ROADMAP.md`.

## Detailed execution instructions

1. **Metadata audit:** for every file under `docs/generated/`, confirm it has the required
   metadata block (per [prompt-library/README.md § Artifact metadata](../README.md#artifact-metadata))
   with a non-empty `artifact_id`, `source_prompt`, and `prompt_version`. Flag any that don't.
2. **ID uniqueness audit:** confirm no two prompts share a Prompt ID and no two artifacts share
   an `artifact_id`, across the whole repository, not just within one category folder.
3. **Link audit:** check every Markdown relative link inside `prompt-library/` and
   `docs/decisions/` resolves to a file that actually exists. Flag broken links with their
   source file and line.
4. **Status consistency audit:** flag any artifact whose `status: Approved` cites a
   `source_prompt` whose own `Status` (in `PROMPT_INDEX.md`) is still `Draft` — an artifact
   should not plausibly be more "finished" than the prompt that produced it, and a mismatch
   usually means the index wasn't updated.
5. **Orphan audit:** flag any artifact under `docs/generated/` that is not referenced by
   `PROMPT_INDEX.md`'s "Expected artifact" / "Artifact location" columns for its `source_prompt`,
   and any ADR not referenced from `docs/decisions/README.md`'s backlog or linked from a
   generated artifact's `related_decisions`.
6. **Placeholder audit:** flag any prompt or artifact that is empty, contains only boilerplate
   with no project-specific content, or still contains template placeholder text (e.g., `<...>`
   markers from `docs/decisions/ADR-001-template.md` left unfilled in a file that is *not*
   itself the template).
7. Produce an audit report listing every finding by category (1–6 above), each with a concrete
   file reference, and a short recommendation.

## Technical constraints

- This prompt only audits; it does not itself fix findings (no silent edits to other artifacts'
  content or status) — fixes are follow-up actions performed by whoever owns the flagged file,
  per the normal review workflow.
- Must be re-runnable idempotently — running it twice with no changes in between should produce
  the same findings.

## Expected outputs and deliverables

A dated audit report with findings grouped by category and a short recommendation per finding.

## Output storage location

`docs/generated/<domain>/DOC-AUDIT-NNN-<date>.md`, where `<domain>` is chosen by majority of
findings' subject matter (default to `docs/generated/product/` if findings are
library-wide rather than domain-specific); increment `NNN` per audit run.

## Validation requirements

- Every one of the six audit categories in step 1–6 is addressed in the report, even if a
  category has zero findings (state "no findings" explicitly rather than omitting the section).

## Definition of Done

Audit report produced; each finding is either fixed by its owning artifact's maintainer (with
that fix logged in the normal versioning/changelog mechanisms) or explicitly accepted as a known
issue with a reason recorded.

## Failure handling and clarification requirements

If an audit finds a conflict that implies two prompts/artifacts made incompatible decisions
(e.g., `BE-001` and `ML-002` disagree on a contract field — see the failure-handling note in
`ML-002`), report it as a cross-artifact conflict requiring both owners' attention; do not
attempt to resolve it within this audit.

## Dependencies on other prompts

None (runs periodically across the whole library rather than once in the dependency chain).
