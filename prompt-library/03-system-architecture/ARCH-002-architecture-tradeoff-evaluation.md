---
Prompt ID: ARCH-002
Prompt title: Architecture Trade-off Evaluation
Version: "1.0"
Category: 03-system-architecture
Status: Draft
---

## Objective

For each decision point listed in `ARCH-001`'s output and
[docs/decisions/README.md](../../docs/decisions/README.md)'s anticipated-decisions backlog,
produce a scored, criteria-based comparison of at least two real options — including, but not
limited to, the stakeholder's stated preferred direction (Angular / Spring Boot + Spring
Security / Python ML service / PostgreSQL-or-MySQL) — so each can be turned into an ADR by a
human decision-maker. **This prompt evaluates options; it does not decide.**

## Required role/persona

Senior Solutions Architect with breadth across frontend, backend, data, and ML-serving
ecosystems (or, if executed by a team, one sub-evaluation per decision point by the most
relevant specialist, reconciled into one artifact).

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) in full.

## Prerequisites

`ARCH-001` approved (component boundaries and decision points are defined).

## Input files and repository paths to inspect

- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md` (`ARCH-001`'s output)
- `docs/decisions/README.md` (anticipated-decisions backlog)
- `docs/PRD.md § 28` (web app requirements, including any latency/scale NFRs set there)

## Detailed execution instructions

1. For each backlog item in `docs/decisions/README.md` (frontend framework, backend framework,
   database, ML inference architecture, authentication strategy, deployment architecture, model
   storage/versioning), produce a comparison table with at minimum these criteria: team/ecosystem
   fit, operational complexity, licensing/cost, performance characteristics relevant to this
   project's actual scale (50,000-row sample today; note explicitly if the comparison would
   differ at a larger scale), security posture, and **how well it supports the ML correctness
   requirements in `PROJECT_CONTEXT.md § 3`** (e.g., does the ML-inference-architecture option
   make it easy or hard to keep training-time and inference-time feature computation identical
   and leakage-free?).
2. Always include the stakeholder's stated preferred option in the comparison, but evaluate it
   on the same criteria as every alternative — do not give it a free pass or pre-ordain it as
   the winner. If it wins, say why, on the criteria, not because it was stated first.
3. For the ML inference architecture decision specifically, evaluate at least: (a) a separate
   Python inference service called by the backend (the stated direction), (b) an embedded
   model-serving approach inside the backend (e.g., via a Java ML runtime or a model exported to
   a backend-native format), and (c) a managed/hosted model-serving platform. Weigh this against
   the maintainability concerns already flagged in `docs/PRD.md § 19/§20` about the existing
   notebook's lack of a persisted, versioned model artifact.
4. Produce a **recommendation** per decision point (not a decision) — clearly labeled
   "Recommended, pending human approval via ADR", with a one-paragraph rationale per
   recommendation.
5. Do not write the ADRs yourself in this artifact. This artifact feeds them; a human (or a
   subsequent, explicitly separate step) drafts the ADRs from
   [docs/decisions/ADR-001-template.md](../../docs/decisions/ADR-001-template.md) using this
   artifact as the "Options considered" and "Evaluation criteria" source.

## Technical constraints

- Every option evaluated must be real and currently viable (no deprecated/unmaintained
  libraries) — if uncertain about an option's current state, say so rather than asserting
  freshness you haven't checked.
- Must not silently narrow any comparison to only the stakeholder's stated preference plus one
  strawman alternative — at least one option must be a genuine, well-regarded alternative.

## Expected outputs and deliverables

One comparison artifact covering all 7 backlog decision points, each with a scored table and a
labeled, non-binding recommendation.

## Output storage location

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md`

## Validation requirements

- All 7 backlog items from `docs/decisions/README.md` are covered.
- Every decision point has ≥ 2 genuinely evaluated options.
- No recommendation is phrased as a final decision ("we will use X"); all use
  "Recommended, pending approval" language.
- Every ML-related recommendation explicitly addresses at least one of the 8 numbered concerns
  in `PROJECT_CONTEXT.md § 3`.

## Definition of Done

Artifact created `status: Draft`; a human architect reviews it and either approves it as the
input to drafting ADRs, or sends it back with specific requested re-evaluation. Drafting and
accepting the actual ADRs is a separate, explicit follow-up step, not part of this prompt's
Definition of Done.

## Failure handling and clarification requirements

If a decision point's evaluation genuinely depends on information only the business stakeholder
has (e.g., existing enterprise licensing agreements that would make one database option free and
another costly), state this as a blocking input gap for that specific decision point rather than
guessing a cost figure.

## Dependencies on other prompts

`ARCH-001`.
