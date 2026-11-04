---
artifact_id: STD-001
title: Prompt Governance and Standards
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Prompt Governance and Standards

This document is the normative reference for everything in `prompt-library/`. Where this file
and an individual prompt disagree, this file wins unless the prompt explicitly and visibly
overrides it with a stated reason.

## 1. Naming conventions

- **Prompt files:** `<ID>-<kebab-case-short-title>.md`, e.g. `BE-001-backend-architecture.md`.
- **Category folders:** `NN-kebab-case-category-name/`, numbered `01`–`12` to fix a reading
  order (see [PROMPT_INDEX.md](PROMPT_INDEX.md)); the number is for ordering only and is not
  part of any prompt ID.
- **Generated artifact files:** `<ARTIFACT_ID>-<kebab-case-short-title>.md` inside the relevant
  `docs/generated/<domain>/` subfolder, e.g. `docs/generated/backend/BE-ARCH-001-api-layering.md`.

## 2. Prompt ID conventions

Prefix by category, followed by a zero-padded 3-digit sequence number, e.g. `PD-001`, `ARCH-002`.

| Prefix | Category |
|---|---|
| `PD` | Product Discovery |
| `PRD` | Product Requirements |
| `ARCH` | System Architecture |
| `UI` | UI/UX & Design System |
| `DB` | Database Design |
| `BE` | Backend Development |
| `FE` | Frontend Development |
| `ML` | ML Model Integration |
| `QA` | Testing & Quality Assurance |
| `SEC` | Security & Performance |
| `DEV` | Deployment & DevOps |
| `DOC` | Documentation & Maintenance |

**No duplicate prompt IDs, ever**, even across categories. [PROMPT_INDEX.md](PROMPT_INDEX.md) is
the single source of truth for which IDs are taken; check it before assigning a new one.

**Generated artifact IDs** reuse the originating prompt's prefix with a domain qualifier when
useful (e.g., `BE-ARCH-001` for an architecture artifact produced by a `BE-` prompt), and must
also be unique repo-wide. Record every artifact ID in the relevant `docs/generated/<domain>/`
README's artifact table (see each domain README).

## 3. Versioning rules

- Prompts and artifacts both carry a `version:` (prompts) or are tracked by version history in
  their metadata block (artifacts), using `MAJOR.MINOR`:
  - **MINOR** bump: wording/clarity fixes that do not change what the prompt asks for or what an
    artifact concludes.
  - **MAJOR** bump: a change to scope, required inputs, constraints, or (for artifacts) a
    conclusion/decision change.
- A prompt's version bump must be logged in [PROMPT_CHANGELOG.md](PROMPT_CHANGELOG.md) with the
  date and reason.
- An artifact revision must never silently replace an `Approved` artifact. Instead:
  1. Create a new file/version (e.g., append `-v2` or increment a version folder, consistent
     within that domain).
  2. Mark the old artifact's status `Superseded` and add a `superseded_by:` field pointing to
     the new artifact's ID.
  3. The new artifact's metadata must include `supersedes:` pointing back.

## 4. Prompt quality standards

Every prompt must be independently executable by someone who has only read
[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and the prompt itself — it must not assume tacit
knowledge from a conversation. Concretely, every prompt must specify, at minimum, the 15 fields
listed in § 6 below, and:

- Its **Objective** must name a concrete deliverable, not a vague activity ("produce a reviewed
  database schema with ER diagram and migration-readiness notes", not "think about the
  database").
- Its **Execution instructions** must reference actual repository paths, not generic advice.
- It must **not duplicate** another prompt's purpose. If two prompts would produce overlapping
  artifacts, one must explicitly depend on and extend the other's output instead.
- It must **never fabricate** scope under constraint (e.g., a frontend prompt is not permitted
  to invent backend API contracts; it depends on `BE-001`'s output instead).

## 5. Prompt review and approval workflow

Prompts and artifacts each carry a status, but the two status vocabularies differ slightly
because a prompt is a reusable instruction and an artifact is a produced document.

**Prompt status values:**
- `Planned` — listed in the index, not yet written out in full.
- `Draft` — written, not yet reviewed.
- `Reviewed` — a human has read it and confirmed it meets the quality standards in § 4.
- `Approved` — a human has confirmed it is ready for repeated use; changes to an `Approved`
  prompt require a version bump (§ 3) and a changelog entry.

**Artifact status values:** `Draft`, `In Review`, `Approved`, `Superseded` (see each artifact's
metadata block, and § 3 above for the versioning mechanics).

**Approval workflow:**
1. An agent (AI or human) executes a `Reviewed`-or-higher prompt and produces an artifact with
   status `Draft`.
2. A human reviewer reads the artifact against the prompt's "Validation requirements" and
   "Definition of Done".
3. The reviewer either requests changes (artifact stays `Draft`, feedback recorded in the
   artifact or in a linked note) or sets status to `In Review` → `Approved`.
4. **An AI agent must never set an artifact's status to `Approved` itself** — this is always a
   human action, consistent with [PROJECT_CONTEXT.md § 4 rule 7](PROJECT_CONTEXT.md).
5. If the artifact's conclusion requires a technical/product decision (see § 7 below), an ADR is
   created referencing the artifact, and the ADR's own approval (Accepted) is what authorizes
   implementation — not the artifact's `Approved` status by itself.

## 6. Required prompt fields (all 15, in this order)

1. Unique Prompt ID
2. Prompt title
3. Version
4. Category
5. Status
6. Objective
7. Required role/persona
8. Required project context
9. Prerequisites
10. Input files and repository paths to inspect
11. Detailed execution instructions
12. Technical constraints
13. Expected outputs and deliverables
14. Output storage location
15. Validation requirements
16. Definition of Done
17. Failure handling and clarification requirements
18. Dependencies on other prompts

(Numbered for readability; the brief's required list has 15 conceptual items, several of which
are split above into their natural sub-parts — every prompt file in this library uses this exact
field set and order.)

## 7. Traceability rules — when an ADR is required vs. not

Not every prompt execution requires an ADR, and not every artifact requires approval before
experimentation. Use this rule:

- **ADR required** when the artifact's conclusion **commits the project to a specific
  technology, framework, library, data store, or architectural pattern that would be costly to
  reverse** (e.g., "use PostgreSQL", "use Spring Security's JWT filter chain", "store the model
  as an MLflow-registered artifact"). These map to the "Potential future decisions" list in
  [docs/decisions/README.md](../docs/decisions/README.md).
- **ADR not required** for: exploratory analysis, documentation, test-writing, diagrams that
  describe the *current* system rather than propose a *future* one, or any artifact explicitly
  scoped as "options analysis" rather than "selected decision" (e.g., `ARCH-002`'s trade-off
  table is an ADR *input*, not itself a decision).
- **Approval not required before experimentation** for throwaway spikes/prototypes explicitly
  labeled as such in the artifact's metadata (`status: Draft`, with a note that it is a spike).
  Approval **is** required before that spike's conclusion is cited as the basis for an ADR or for
  implementation work.

Every artifact's metadata block includes a `related_decisions: []` field. Populate it with ADR
IDs once one exists; leave it `[]` otherwise — never pre-fill it with an ID for an ADR that
doesn't exist yet.

## 8. Context-loading rules

See [PROJECT_CONTEXT.md § 5](PROJECT_CONTEXT.md#5-context-loading-checklist-for-a-new-prompt-execution)
for the authoritative checklist. Every prompt's own "Required project context" field must point
back to that checklist rather than restate it.

## 9. Repository modification safety rules

1. Never delete or truncate an existing file to "start fresh" — if a document needs replacing,
   follow the versioning rule in § 3.
2. Never modify `docs/PRD.md`, `docs/PRD_VALIDATION.md`, or anything under `docs/architecture/`
   without explicit justification recorded in the modifying artifact (these pre-date this prompt
   system and represent completed, reviewed analysis — see
   [PROJECT_CONTEXT.md § 2](PROJECT_CONTEXT.md#2-existing-documentation--do-not-duplicate-read-first)).
3. Never create files under `src/` until an implementation-stage prompt is explicitly approved
   to begin coding — this prompt library's purpose is documentation/decision infrastructure, not
   application code (see the repository-level instruction this library was created under).
4. Any prompt execution that would overwrite a file must first check that file's current status
   (if it has a metadata block) and refuse to silently overwrite an `Approved` artifact.
5. Every generated artifact must include the metadata block defined in
   [prompt-library/README.md § Artifact metadata](README.md#artifact-metadata), with
   `source_prompt` and `prompt_version` always populated.
