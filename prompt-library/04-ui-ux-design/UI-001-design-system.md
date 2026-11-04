---
Prompt ID: UI-001
Prompt title: UI/UX Design System & Key Screens
Version: "1.0"
Category: 04-ui-ux-design
Status: Draft
---

## Objective

Produce a design-system specification (tokens, component inventory, interaction patterns) and
wireframe-level specifications for the screens needed to satisfy the MVP user journey — risk
score retrieval and review by the primary persona defined in `PD-002`.

## Required role/persona

Senior Product Designer / UX Architect.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`PRD-001` and `ARCH-001` approved.

## Input files and repository paths to inspect

- `docs/generated/product/PD-VISION-001-mvp-scope.md` (primary persona, MVP scope)
- `docs/PRD.md § 28` (web app FRs), `§ 14` (user journeys — the "ops analyst acts on a risk
  score" proposed journey, now being made concrete)
- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md` (what the frontend
  component is and isn't responsible for)

## Detailed execution instructions

1. Confirm the MVP's primary persona and their actual working context (desk-based ops analyst
   reviewing a queue of orders? a dashboard glanced at periodically? an alert-driven workflow?)
   — this must come from `PD-002`, not be invented here.
2. Design the information hierarchy for a single order's risk view: what is the single most
   important number/signal (the risk score or flag), what supporting context does the user need
   to act on it (per `docs/PRD.md`'s feature-importance findings — shipping mode, customer
   history), and what action can the user actually take from this screen (per MVP scope — note
   if "take action" is itself out of MVP scope and the screen is read-only).
3. Specify, at minimum: a risk-score/flag visual treatment (and its states — high/medium/low risk,
   or however the MVP's output is framed per `PRD-001`), an order list/queue view if in MVP
   scope, and empty/loading/error states for both.
4. Define a design-token set (color roles — not literal hex tied to a specific brand unless one
   exists for this project; spacing scale; type scale) sufced to be implementable by `FE-001`
   regardless of which frontend framework `ARCH-002`/an ADR eventually selects.
5. Include accessibility requirements explicitly (contrast ratios for risk-level color coding —
   critical since this is literally a system communicating risk, and color-only encoding of
   risk level would fail colorblind users; always pair color with text/icon).

## Technical constraints

- Must not assume a specific frontend framework's component library (no "use Angular Material's
  X component") — describe the component's behavior/appearance; `FE-001` maps it to a concrete
  library once the frontend framework ADR is accepted.
- Must stay within the MVP scope from `PD-002` — do not design screens for deferred features.

## Expected outputs and deliverables

A design-system spec (tokens + component inventory) and wireframe-level specs (described
structurally — layout regions, content, states — Mermaid or structured text, not binary image
files) for each in-scope MVP screen.

## Output storage location

`docs/generated/ui-ux/UI-DESIGN-001-design-system-and-screens.md`

## Validation requirements

- Every screen specified maps to an in-scope MVP FR from `docs/PRD.md § 28`; no out-of-scope
  screen is included.
- Risk level is never encoded by color alone anywhere in the spec.
- No frontend-framework-specific component name appears.

## Definition of Done

Artifact `status: Draft`; reviewed by a human designer/product owner against MVP scope and
accessibility requirements; set to `Approved` once confirmed, unlocking `FE-001` to proceed in
parallel with `BE-001`.

## Failure handling and clarification requirements

If the MVP scope doesn't specify whether the primary user works from a queue or a single-order
lookup, do not default to one silently — flag it back to `PD-002`'s owner as a scope gap before
finalizing the information hierarchy in step 2.

## Dependencies on other prompts

`PRD-001`, `ARCH-001`.
