# Prompt Library — ShipGuard

This directory is the **Prompt Library**: one of three interconnected systems established to
support turning the existing [ShipGuard analysis notebook](../supply_chain_late_delivery.ipynb)
prototype into a full web application, without prematurely committing to technology choices or
skipping the engineering judgment a human reviewer needs to apply.

The three systems, and how they connect, are documented in full in
[docs/decisions/README.md § Traceability](../docs/decisions/README.md#traceability) and
restated here briefly:

```text
Prompt (this directory)
  |
  v
AI Execution  — a prompt is run, with PROJECT_CONTEXT.md loaded
  |
  v
Generated Artifact  — written to docs/generated/<domain>/, status: Draft
  |
  v
Human Review  — checked against the prompt's Validation requirements / Definition of Done
  |
  v
Approved Artifact  — status: Approved (never set by an AI agent — see PROMPT_STANDARDS.md)
  |
  v
Architecture Decision Record  — only when the artifact's conclusion commits to something
  |                               costly to reverse (see PROMPT_STANDARDS.md § 7)
  v
Implementation  — only after the relevant ADR is Accepted
```

## Before using anything in this directory

1. Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) — current, verified project state, known ML
   correctness concerns, and the AI agent execution rules. **Mandatory, every time.**
2. Read [PROMPT_STANDARDS.md](PROMPT_STANDARDS.md) — naming, versioning, review workflow,
   traceability rules.
3. Check [PROMPT_INDEX.md](PROMPT_INDEX.md) for the full catalog, each prompt's status, and its
   dependencies — do not run a prompt whose dependencies aren't satisfied.

## Directory layout

```text
prompt-library/
├── README.md                  (this file)
├── PROMPT_INDEX.md             Catalog of every prompt: ID, status, dependencies, artifact location
├── PROJECT_CONTEXT.md          Mandatory pre-read: current state, ML concerns, agent rules
├── PROMPT_STANDARDS.md         Governance: naming, IDs, versioning, review workflow
├── PROMPT_CHANGELOG.md         Log of every prompt created/changed, with date and reason
├── LIBRARY_VALIDATION.md       Validation report for this library itself (run after setup)
│
├── 01-product-discovery/
├── 02-prd-and-requirements/
├── 03-system-architecture/
├── 04-ui-ux-design/
├── 05-database-design/
├── 06-backend-development/
├── 07-frontend-development/
├── 08-ml-model-integration/
├── 09-testing-and-qa/
├── 10-security-and-performance/
├── 11-deployment-and-devops/
├── 12-documentation-and-maintenance/
└── 13-implementation/         Cross-cutting Stage 5 transition prompts (added by IMPL-001;
                                see that prompt's own note on this category extension)
```

## Artifact metadata

Every artifact a prompt produces, wherever it lives under `docs/`, must open with this YAML
front-matter block:

```yaml
---
artifact_id: BE-ARCH-001
title: Backend Architecture Design
source_prompt: BE-001
prompt_version: "1.0"
status: Draft
created_date: YYYY-MM-DD
related_decisions: []
---
```

- `status` is one of `Draft`, `In Review`, `Approved`, `Superseded`.
- `related_decisions` lists ADR IDs once one exists for this artifact; `[]` until then.
- On revision, add `supersedes:` / is referenced by the new artifact's `supersedes:` field — see
  [PROMPT_STANDARDS.md § 3](PROMPT_STANDARDS.md#3-versioning-rules).

## Where generated artifacts go

Each prompt's own "Output storage location" field is authoritative, but the general mapping is:

| Prompt category | Output location |
|---|---|
| Product Discovery | `docs/generated/product/` |
| PRD & Requirements | `docs/PRD.md` (the existing, canonical PRD — revised in place per its own versioning rules, not a new file per run) |
| System Architecture | `docs/generated/architecture/`, with a decision's authorization captured in `docs/TECHNICAL_DESIGN.md` once Accepted |
| UI/UX Design | `docs/generated/ui-ux/` |
| Database Design | `docs/generated/database/` |
| Backend Development | `docs/generated/backend/` |
| Frontend Development | `docs/generated/frontend/` |
| ML Model Integration | `docs/generated/ml/` |
| Testing & QA | `docs/generated/testing/` |
| Security & Performance | `docs/generated/security/` |
| Deployment & DevOps | `docs/generated/deployment/` |
| Documentation & Maintenance | varies — see `DOC-001` |

## Current status (as of 2026-11-03)

This library was just established. **No prompt has been executed yet** beyond the retroactive,
pre-system PRD work already in `docs/PRD.md` (see
[PROJECT_CONTEXT.md § 2](PROJECT_CONTEXT.md#2-existing-documentation--do-not-duplicate-read-first)).
The recommended first prompt to run is **`PD-001`** — see
[LIBRARY_VALIDATION.md § Recommended first prompt](LIBRARY_VALIDATION.md) for why.
