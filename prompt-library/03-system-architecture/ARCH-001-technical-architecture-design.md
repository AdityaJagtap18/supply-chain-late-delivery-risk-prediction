---
Prompt ID: ARCH-001
Prompt title: Technical Architecture Design
Version: "1.0"
Category: 03-system-architecture
Status: Draft
---

## Objective

Produce a **technology-agnostic** high-level architecture for the web application: layers,
components, their responsibilities, and the boundaries/contracts between them (frontend ↔
backend ↔ ML inference service ↔ database) — deliberately deferring *which* framework/database
fills each box to `ARCH-002` and the domain-specific prompts.

## Required role/persona

Senior Solutions Architect.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) in full.

## Prerequisites

`PRD-001` approved (web-app requirements exist).

## Input files and repository paths to inspect

- `docs/PRD.md` (the new "§ 28 — Web Application Requirements" section from `PRD-001`, plus
  § 12 Data/API spec, § 15 System Architecture — the existing notebook pipeline diagram)
- `docs/architecture/pipeline-architecture.md`, `docs/architecture/user-journeys.md`
- `docs/generated/product/PD-VISION-001-mvp-scope.md`

## Detailed execution instructions

1. Define the component boundaries needed to satisfy the MVP FRs from `docs/PRD.md § 28`:
   typically a frontend client, a backend API/application layer, an ML inference boundary
   (explicitly call out whether it is in-process with the backend or a separate service — do
   not assume the stated "Python ML inference service" preference is final; present it as one
   option that `ARCH-002` will evaluate), and a persistent data store.
2. For each component, specify: its responsibility, what it must **not** be responsible for
   (to avoid scope bleed into another component), and the contract (request/response shape in
   the abstract, not a concrete API spec — that's `BE-001`) it exposes to its neighbors.
3. Explicitly design how the existing notebook's analytical pipeline
   (`docs/architecture/pipeline-architecture.md`) maps onto this new architecture: which parts
   become the offline training pipeline (feeding `ML-001`) vs. the online inference path
   (feeding `ML-002`) vs. retired entirely. Do not let the new architecture silently reinvent
   something the notebook already does well (e.g., the feature-selection logic), nor silently
   carry forward something flagged as a defect in `docs/PRD.md § 20` (e.g., the pre-split
   target-encoding leakage) without flagging it as "must be fixed before productionization —
   see `PROJECT_CONTEXT.md § 3`".
4. Produce one Mermaid component diagram and one Mermaid sequence diagram for the MVP's primary
   user journey (risk-score retrieval), in the same style as
   `docs/architecture/user-journeys.md`.
5. Explicitly list every point in this architecture that constitutes a decision needing an ADR
   per [PROMPT_STANDARDS.md § 7](../PROMPT_STANDARDS.md#7-traceability-rules--when-an-adr-is-required-vs-not),
   and cross-reference the anticipated-decisions backlog in
   [docs/decisions/README.md](../../docs/decisions/README.md) — do not invent new decision
   points that aren't already backlogged without adding them to that backlog too.

## Technical constraints

- No specific frontend framework, backend framework, database product, or cloud provider may be
  named as a requirement in this artifact — name them only as "candidate, to be evaluated by
  ARCH-002" if mentioned at all.
- Must preserve, not silently fix, every open ML-correctness concern from
  `PROJECT_CONTEXT.md § 3` — this prompt designs where the fix *will* happen (e.g., "the offline
  training pipeline, not the inference service, is responsible for leakage-free encoding fit"),
  it does not perform the fix.

## Expected outputs and deliverables

An architecture document with component responsibilities/boundaries, two Mermaid diagrams, and
an explicit list of decision points requiring an ADR.

## Output storage location

`docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`. Once this artifact (or
a revision of it) is `Approved`, its content is mirrored into `docs/TECHNICAL_DESIGN.md` (which
starts as a placeholder — see that file) by whoever approves it, with a note of which artifact
version it mirrors.

## Validation requirements

- No concrete technology name appears as a requirement (grep for likely product names — Spring,
  Angular, React, Postgres, MySQL, MongoDB, etc. — any hit must be qualified as "candidate,
  pending ARCH-002").
- Every component's contract is specified abstractly (data shape/responsibility), not as a
  concrete REST/GraphQL spec.
- Every decision point raised here is cross-referenced in `docs/decisions/README.md`'s backlog.

## Definition of Done

Artifact created `status: Draft`; reviewed by a human architect against the validation
requirements above; `status: Approved` only after that review, at which point
`docs/TECHNICAL_DESIGN.md` is updated to mirror it.

## Failure handling and clarification requirements

If the MVP scope from `PRD-001`/`PD-002` cannot be satisfied without a specific technology
constraint (e.g., a stated "must integrate with an existing Spring Boot system" hard constraint
rather than a preference), stop and flag this explicitly as a scope conflict between
`PD-002`/`PRD-001` and the technology-agnostic mandate of this prompt, rather than silently
breaking the technology-agnostic constraint.

## Dependencies on other prompts

`PRD-001`.
