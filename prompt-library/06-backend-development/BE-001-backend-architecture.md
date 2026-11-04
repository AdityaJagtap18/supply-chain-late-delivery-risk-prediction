---
Prompt ID: BE-001
Prompt title: Backend Architecture & API Design
Version: "1.0"
Category: 06-backend-development
Status: Draft
---

## Objective

Produce the backend's internal layering (controller/service/repository or equivalent) and a
concrete API contract (endpoints, request/response shapes, status/error codes) for the MVP's
FRs, consuming `DB-001`'s schema and exposing the contract `FE-001` and `ML-002` will build
against.

## Required role/persona

Senior Backend Engineer / API Designer.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`ARCH-001` and `DB-001` approved.

## Input files and repository paths to inspect

- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`
- `docs/generated/database/DB-ARCH-001-schema-design.md`
- `docs/PRD.md § 28` (web app FRs)

## Detailed execution instructions

1. Define the backend's internal layers and their responsibilities in framework-neutral terms
   (API/controller layer, application/service layer, data-access layer, and an explicit
   "ML inference client" boundary — the backend calls out to whatever `ML-002` defines, it does
   not embed model logic itself, consistent with `ARCH-001`'s component boundaries).
2. Produce a concrete API contract: one endpoint per MVP FR at minimum (e.g.,
   `GET /orders/{id}/risk-assessment`, `GET /orders?riskLevel=high`, matching whatever `PD-002`
   actually scoped — queue view vs. single lookup). For each endpoint specify: method, path,
   auth requirement (reference the auth-strategy ADR backlog item — if not yet decided, mark
   the endpoint's auth requirement as "TBD pending ADR-0005"), request params/body, response
   schema (map directly to `DB-001`'s entities, do not invent new field names casually),
   success and error status codes, and example payloads.
3. Explicitly define the **contract with the ML inference boundary**: what the backend sends to
   get a risk assessment (which features, in what shape) and what it gets back (score, class,
   model version, confidence/calibration info if available per `PROJECT_CONTEXT.md § 3` item 7).
   This contract is the shared surface `ML-002` must also honor — do not let this prompt and
   `ML-002` independently invent two different contracts.
4. State how the backend will persist a risk assessment via `DB-001`'s schema (write path) and
   retrieve historical ones (read path), including the model-version field.
5. Note explicitly where this design depends on an ADR not yet accepted (backend framework,
   auth strategy) and what changes if the alternative option were chosen instead — i.e., keep
   the API contract itself framework-independent even if illustrative code snippets use the
   stated-preference framework for concreteness.

## Technical constraints

- The API contract itself (paths, payload shapes, status codes) must be implementable in any
  mainstream backend framework — do not bake in a framework-specific constraint (e.g., a
  Spring-specific annotation behavior) as part of the *contract*; framework-specific
  implementation notes may be included as a clearly separated, illustrative appendix only.
- Must not duplicate or contradict `DB-001`'s schema — reuse its entity/field names.

## Expected outputs and deliverables

Backend layering diagram, full API contract (OpenAPI-style table or YAML), and the ML-inference
boundary contract shared with `ML-002`.

## Output storage location

`docs/generated/backend/BE-ARCH-001-api-and-layering.md`

## Validation requirements

- Every MVP FR from `docs/PRD.md § 28` maps to at least one endpoint.
- Every endpoint's response schema traces to a `DB-001` entity/field.
- The ML-inference boundary contract in this artifact is byte-for-byte the same shape referenced
  by `ML-002`'s artifact once that exists (checked when `ML-002` is executed).

## Definition of Done

Artifact `status: Draft`; reviewed by a human backend lead; `Approved` unlocks `FE-001` and
`ML-002`. Feeds ADR-0002 (backend framework) and ADR-0005 (auth strategy) together with
`ARCH-002`'s comparison.

## Failure handling and clarification requirements

If an MVP FR cannot be satisfied without a decision this prompt isn't authorized to make (e.g.,
real-time push vs. polling for risk alerts, which affects whether a WebSocket/SSE endpoint is
needed), flag it explicitly as a scope question back to `PD-002`/`ARCH-001`'s owners rather than
silently picking the simpler option.

## Dependencies on other prompts

`ARCH-001`, `DB-001`.
