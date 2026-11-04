# Prompt Changelog

Every creation or change to a prompt in this library is logged here, newest first. This is
separate from artifact history (which lives in each artifact's own metadata block per
[PROMPT_STANDARDS.md § 3](PROMPT_STANDARDS.md#3-versioning-rules)) — this file tracks the
**prompts themselves**, not what they produced.

## 2026-11-03 — Initial library creation

Created the prompt-library, generated-artifact, and ADR infrastructure for the first time (no
prior prompt system existed in this repository). All 15 initial prompts created at `version 1.0`,
`status: Draft`:

| Prompt ID | Title | Version | Reason |
|---|---|---|---|
| PD-001 | Existing Project & PRD Review | 1.0 | Initial authoring |
| PD-002 | Product Vision & MVP Definition | 1.0 | Initial authoring |
| PRD-001 | PRD Refinement for Web Application | 1.0 | Initial authoring |
| ARCH-001 | Technical Architecture Design | 1.0 | Initial authoring |
| ARCH-002 | Architecture Trade-off Evaluation | 1.0 | Initial authoring |
| UI-001 | UI/UX Design System | 1.0 | Initial authoring |
| DB-001 | Database Architecture & Schema Design | 1.0 | Initial authoring |
| BE-001 | Backend Architecture & API Design | 1.0 | Initial authoring |
| FE-001 | Frontend Architecture | 1.0 | Initial authoring |
| ML-001 | ML Pipeline Productionization | 1.0 | Initial authoring |
| ML-002 | ML Inference Service Integration | 1.0 | Initial authoring |
| QA-001 | Testing Strategy | 1.0 | Initial authoring |
| SEC-001 | Security & Threat Modeling | 1.0 | Initial authoring |
| DEV-001 | Deployment & DevOps Strategy | 1.0 | Initial authoring |
| DOC-001 | Documentation & Artifact Lifecycle Maintenance | 1.0 | Initial authoring |

No prompt has been executed yet (this is a same-session setup, not a usage log). The existing
`docs/PRD.md` and `docs/architecture/*.md` files pre-date this library and were produced by an
earlier, informal analysis pass — they are **not** attributed to any prompt ID above; see
[PROJECT_CONTEXT.md § 2](PROJECT_CONTEXT.md#2-existing-documentation--do-not-duplicate-read-first).

**Template for future entries:**

```markdown
## YYYY-MM-DD — <short description>

| Prompt ID | Title | Old version | New version | Reason |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |
```
