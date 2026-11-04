---
decision_id: ADR-0006
title: Deployment Architecture
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, DEV-001, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md]
supersedes: null
superseded_by: null
---

# ADR-0006: Deployment Architecture

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision on 2026-11-03,
> sixth in the dependency order `ARCH-005` specified: **containerized deployment for the
> application components, with serverless remaining an option specifically for the
> batch-scoring job** — the two are accepted as distinct, not collapsed into one blanket answer,
> per this ADR's own "Selected decision" below. **No specific cloud provider or orchestrator is
> selected by this acceptance** — that remains open, exactly as `ARCH-TRADEOFF-001` § 6 and
> `DEV-STRATEGY-001` already stated, and this ADR does not introduce one.

## Context and problem

`DEV-STRATEGY-001` designed an environment topology and CI/CD pipeline without naming a
deployment platform, per ADR-0006 being open. The question: containerized deployment, a
Platform-as-a-Service (PaaS), or serverless/function-based deployment — and, per `ARCH-004`'s
explicit instruction, **this decision must preserve the distinction between the always-on
application components (frontend/backend) and the periodic batch-scoring job**, not collapse
both into one blanket answer.

## Options considered

### Option 1: Containerized deployment
- Description: Docker images on any orchestrator, for the frontend/backend/database (and ML
  inference service, per ADR-0004) components.
- Pros: most portable across cloud providers regardless of which framework wins ADR-0001/0002/
  0003; widely understood; most control and long-term portability.
- Cons: highest upfront setup (orchestration, networking) of the three.
- Cost/effort to reverse later: moderate — containers are themselves a portability mechanism,
  which lowers the cost of later changing the underlying orchestrator/cloud provider.

### Option 2: Platform-as-a-Service (PaaS)
- Description: a managed platform handling more of the infrastructure directly.
- Pros: fastest path to a running environment, least infrastructure code, for a small MVP team.
- Cons: some platform lock-in; typically higher per-unit compute cost than raw containers.
- Cost/effort to reverse later: higher than Option 1, due to platform-specific configuration.

### Option 3: Serverless/function-based deployment
- Description: pay-per-invocation functions.
- Pros: good fit specifically for the batch-scoring job (FR-031), a periodic, bounded-duration
  workload; potentially genuinely cheap at low invocation frequency.
- Cons: an awkward fit for the always-on backend API's request handling, which this evaluation
  does not recommend it for.
- Cost/effort to reverse later: moderate, scoped to whichever component it's applied to.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 6: team/ecosystem fit, operational complexity, licensing/cost,
performance at this project's scale, security posture, and ML-correctness-requirement fit (not
applicable — deployment architecture does not affect encoding/training correctness).

## Selected decision

**Accepted: containerized deployment for the frontend/backend/database (and ML inference
service) components, with serverless specifically evaluated as an option for the batch-scoring
job (FR-031) alone — not one blanket answer across all components.** The distinction between
the always-on application components' deployment and the batch job's execution mechanism is
preserved as accepted, not merged into a single choice; the specific cloud provider or
orchestrator for either is not decided by this ADR.

## Rationale

Per `ARCH-TRADEOFF-001` § 6, this is the one backlog item where "one answer for everything" is
itself likely the wrong framing: FR-031's periodic, bounded nature genuinely fits serverless's
cost/operational profile better than it fits the always-on frontend/backend, while the always-on
components benefit more from containerized portability than from a PaaS's lock-in trade-off.
This ADR preserves that nuance deliberately, per `ARCH-004`'s explicit instruction not to
collapse the application-deployment and batch-job-execution distinction.

## Consequences and trade-offs

- Means `DEV-STRATEGY-001`'s environment topology (§ 1) and runbook (§ 5) can proceed with
  containerized deployment for the three always-on units, while the batch job orchestration
  (§ 4) remains free to evaluate a scheduled-container-vs-serverless choice independently —
  consistent with how `DEV-STRATEGY-001` already described the batch job as portable across
  "a cron-triggered container, or the serverless option."
- Requires the team to own image hardening and patching cadence for the containerized
  components (a cost `DEV-STRATEGY-001` § 5.3's health-check spec already anticipates).
- Does not commit to a specific cloud provider or orchestrator — that remains unresolved, as
  `ARCH-TRADEOFF-001` § 6 and `DEV-STRATEGY-001` both already state.

## Related prompts

ARCH-002, DEV-001, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 6;
`docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md` § 1, § 4, § 5.

## Superseded or related ADRs

None directly, though the ML inference service's deployment unit is affected by ADR-0004's
outcome (which component exists to deploy).
