---
Prompt ID: FE-001
Prompt title: Frontend Architecture
Version: "1.0"
Category: 07-frontend-development
Status: Draft
---

## Objective

Produce the frontend's module/state/routing architecture for the MVP screens defined in
`UI-001`, consuming the API contract defined in `BE-001`, in a form that is substantially
framework-agnostic in its data-flow design even though an illustrative implementation may
reference the stakeholder's stated Angular preference.

## Required role/persona

Senior Frontend Engineer / Frontend Architect.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`ARCH-001`, `UI-001`, and `BE-001` approved.

## Input files and repository paths to inspect

- `docs/generated/ui-ux/UI-DESIGN-001-design-system-and-screens.md`
- `docs/generated/backend/BE-ARCH-001-api-and-layering.md` (the API contract this frontend
  consumes)
- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`

## Detailed execution instructions

1. Map each `UI-001` screen to a route and define the routing structure (including any
   auth-gated routes, marked "TBD pending ADR-0005" if the auth strategy isn't decided yet).
2. Define the state-management approach needed: what state is server-derived (risk assessments,
   order lists — fetched via `BE-001`'s API) vs. client-only (UI state like selected filters).
   Specify caching/staleness behavior for risk-score data explicitly — a stale risk score shown
   to an ops analyst as current is a correctness problem, not just a UX nicety.
3. Define the component breakdown for each screen (container vs. presentational components, in
   framework-neutral terms), re-using `UI-001`'s component inventory rather than inventing new
   component boundaries that don't map back to it.
4. Specify error/loading/empty-state handling at the data-fetching layer, consistent with what
   `UI-001` specified visually.
5. If/when the frontend-framework ADR (ADR-0001) is accepted, note in this artifact's "Document
   History" which specific framework idioms (e.g., Angular services/RxJS vs. an alternative's
   equivalent) the illustrative examples use, and flag that the *architecture* (module
   boundaries, state ownership, routing structure) is intended to survive a different framework
   choice even if illustrative code would need rewriting.

## Technical constraints

- The module/state/routing *architecture* must not be so framework-specific that it couldn't be
  re-implemented in a different framework without rethinking the boundaries — illustrative code
  snippets may use Angular-flavored syntax, clearly labeled as illustrative.
- Must consume `BE-001`'s API contract exactly as specified — do not silently add fields to a
  request/response that `BE-001` didn't define; if a needed field is missing, flag it back to
  `BE-001` rather than assuming it.

## Expected outputs and deliverables

Route map, state-management design, component breakdown per screen, and data-fetching
error/loading/staleness handling spec.

## Output storage location

`docs/generated/frontend/FE-ARCH-001-frontend-architecture.md`

## Validation requirements

- Every `UI-001` screen has a corresponding route and component breakdown.
- Every data-fetching call maps to a `BE-001`-defined endpoint — no invented endpoints.
- Staleness/caching behavior is explicitly specified for risk-score data (not left implicit).

## Definition of Done

Artifact `status: Draft`; reviewed by a human frontend lead; `Approved` unlocks implementation
planning for `src/frontend/` (which still requires the frontend-framework ADR to be `Accepted`
before any code is written, per
[PROJECT_CONTEXT.md § 4 rule 9](../PROJECT_CONTEXT.md#4-ai-agent-execution-rules)).

## Failure handling and clarification requirements

If `BE-001`'s contract is missing a field this frontend design needs (e.g., no `lastUpdated`
timestamp on a risk assessment, needed for staleness display), stop and record it as a specific,
named gap to send back to `BE-001`'s owner — do not invent the field in this artifact.

## Dependencies on other prompts

`ARCH-001`, `UI-001`, `BE-001`.
