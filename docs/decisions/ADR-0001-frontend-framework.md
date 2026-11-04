---
decision_id: ADR-0001
title: Frontend Framework Selection
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md]
supersedes: null
superseded_by: null
---

# ADR-0001: Frontend Framework Selection

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (Angular) on
> 2026-11-03, fourth in the dependency order `ARCH-005` specified. This ADR has no dependency on
> any other ADR, per `ARCH-TRADEOFF-001` § 1.

## Context and problem

`ARCH-DESIGN-001` § 1.1 defines the frontend client component (rendering the risk list and risk
detail screens, FR-032/FR-033) without naming a technology. A concrete framework must be chosen
to build `UI-DESIGN-001`'s screens and `FE-ARCH-001`'s route/component structure. The question:
which frontend framework should the risk-queue/risk-detail single-role internal tool be built
with — Angular, React, or Vue?

## Options considered

### Option 1: Angular
- Description: full framework (routing, forms, DI, HTTP client built in); the project
  stakeholder's stated preference.
- Pros: opinionated structure suits a small team building a narrowly-scoped MVP; pairs naturally
  with a Java/Spring Boot backend culturally; built-in XSS protection via template sanitization;
  Google-backed long-term support.
- Cons: higher initial scaffolding (CLI, modules, RxJS) than the alternatives.
- Cost/effort to reverse later: moderate — the component/route boundaries `FE-ARCH-001` defines
  are explicitly framework-agnostic (§ 5 there states a different framework would reimplement the
  same boundaries with its own idioms), so a later switch would be a reimplementation, not an
  architectural rework, but is still non-trivial engineering effort.

### Option 2: React
- Description: library, not a framework; router/state management chosen separately.
- Pros: largest ecosystem/hiring pool.
- Cons: more assembly-required for a small MVP team (routing, state management are separate
  decisions this project would then also need to make and maintain).
- Cost/effort to reverse later: same order of magnitude as Option 1.

### Option 3: Vue
- Description: framework with a gentler learning curve than Angular, more batteries-included
  than React.
- Pros: official router/state libraries maintained by the same project.
- Cons: smaller ecosystem than React, less enterprise-Java-adjacent adoption than either
  alternative.
- Cost/effort to reverse later: same order of magnitude as Option 1.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 1: team/ecosystem fit, operational complexity, licensing/cost,
performance at this project's actual scale (a two-view, single-role internal tool), security
posture, and ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3` — not applicable to this
decision point, confirmed in that section).

## Selected decision

**Accepted: Angular.**

## Rationale

`ARCH-TRADEOFF-001` § 1 found none of the three frameworks has a decisive technical edge for this
MVP's scope — licensing is free across all three, performance is not a differentiator at this
scale, and each has adequate security posture when used correctly. Angular's structured
conventions reduce ongoing decision-making overhead for a small team building a narrowly-scoped,
two-screen MVP, and it is the stakeholder's stated preference — treated as a legitimate
tie-breaker specifically because the criteria above do not produce a clear winner on their own,
per `ARCH-TRADEOFF-001`'s own stated reasoning, not because it was named first.

## Consequences and trade-offs

- Commits the team to Angular's CLI/module/RxJS conventions and scaffolding overhead relative to
  React/Vue.
- Makes the frontend's natural cultural pairing with a Java/Spring Boot backend (ADR-0002) a
  non-functional but real team-ergonomics benefit, if ADR-0002 also selects Spring Boot.
- `FE-ARCH-001`'s Angular-flavored illustrative code notes (§ 5 there) become directly applicable
  rather than merely illustrative once this ADR is `Accepted`.
- Forecloses, for the MVP, the larger React hiring pool and Vue's lighter-weight tooling — judged
  an acceptable trade given this MVP's narrow, two-screen scope.

## Related prompts

ARCH-002, ARCH-003 (identified the governance gap this ADR resolves), ARCH-004 (drafted this ADR).

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 1;
`docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md` § 1.1;
`docs/generated/frontend/FE-ARCH-001-frontend-architecture.md` (consumes this decision once
Accepted).

## Superseded or related ADRs

None. Related to ADR-0002 (backend framework) only through team-ergonomics rationale, not a
hard technical dependency — unlike ADR-0002 on ADR-0004, this decision does not require ADR-0002
to be resolved first.
