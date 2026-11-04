---
Prompt ID: ARCH-003
Prompt title: Cross-Artifact Architecture Consistency Review
Version: "1.0"
Category: 03-system-architecture
Status: Draft
---

## Objective

Conduct a comprehensive consistency review of all existing approved project artifacts before
implementation begins. Do not design a new architecture from scratch. Evaluate the existing
approved documents and identify inconsistencies, missing decisions, technical conflicts, and
implementation blockers.

## Required role/persona

Principal Software Architect and Independent Technical Reviewer.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), [PROMPT_INDEX.md](../PROMPT_INDEX.md).

## Prerequisites

None structurally, but intended to run once a meaningful batch of architecture/design/ML/testing/
security/deployment artifacts exist — run here immediately after `DEV-001` and the first
`DOC-001` audit both completed.

## Input files and repository paths to inspect

`docs/PRD.md`, `docs/TECHNICAL_DESIGN.md`, `docs/IMPLEMENTATION_ROADMAP.md`,
`docs/generated/product/`, `docs/generated/architecture/`, `docs/generated/ui-ux/`,
`docs/generated/database/`, `docs/generated/backend/`, `docs/generated/frontend/`,
`docs/generated/ml/`, `docs/generated/testing/`, `docs/generated/security/`,
`docs/generated/deployment/`, `docs/decisions/`, `prompt-library/PROJECT_CONTEXT.md`,
`prompt-library/PROMPT_INDEX.md`. Inspect the actual documents, not just filenames or summaries.

## Detailed execution instructions

Review along 12 dimensions: (1) product requirements vs. UI functionality; (2) user journeys
vs. frontend modules; (3) frontend architecture vs. backend API contracts; (4) backend services
vs. database schema; (5) database design vs. PRD requirements; (6) ML training pipeline vs.
inference service; (7) prediction inputs vs. features available at prediction time; (8) security
architecture vs. authentication/authorization requirements; (9) testing strategy vs.
functional/non-functional requirements; (10) deployment architecture vs. selected technology
stack; (11) architecture decisions vs. approved technical documents; (12) implementation roadmap
vs. actual dependencies. Identify contradictory technologies/APIs/data models/terminology,
missing endpoints/contracts, undocumented assumptions, decisions marked Approved without a
required ADR, dependencies on unapproved technology decisions, whether the ML pipeline can
actually integrate into the application, remaining leakage/validation concerns, and MVP-scope
consistency.

## Technical constraints

Do not modify existing approved documents. Do not create or approve ADRs automatically. Do not
make technology decisions on behalf of the project owner. Distinguish confirmed inconsistencies
from assumptions/missing information. Do not invent evidence. Link every finding to the relevant
documents and sections.

## Expected outputs and deliverables

1. `docs/generated/architecture/ARCH-CONSISTENCY-001.md`
2. `docs/generated/architecture/ARCH-BLOCKERS-001.md`
3. `docs/generated/product/REQUIREMENTS-TRACEABILITY-001.md`

Each finding: Finding ID, affected documents, description, severity (Critical/High/Medium/Low),
evidence, recommended resolution, whether human approval is required.

## Output storage location

As listed above (three separate files, two different domains).

## Validation requirements

All 12 dimensions addressed. Final report concludes with: overall architecture consistency,
critical implementation blockers, decisions still awaiting approval, documents requiring
revision, and a readiness verdict of READY / READY WITH CONDITIONS / NOT READY. Strict,
evidence-based — no finding without a citation to actual document text.

## Definition of Done

All three deliverables produced; every finding categorized by severity with a recommended
resolution and an explicit human-approval flag; a readiness verdict stated.

## Failure handling and clarification requirements

A finding implying two prompts/artifacts made incompatible decisions is reported as a
cross-artifact conflict requiring both owners' attention; this prompt does not attempt to
resolve it.

## Dependencies on other prompts

None formally; most useful after `DEV-001` and periodically thereafter, alongside `DOC-001`.
