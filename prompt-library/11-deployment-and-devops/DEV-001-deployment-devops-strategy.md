---
Prompt ID: DEV-001
Prompt title: Deployment & DevOps Strategy
Version: "1.0"
Category: 11-deployment-and-devops
Status: Draft
---

## Objective

Produce an environment topology, CI/CD pipeline design, and deployment runbook covering all
three deployable units (frontend, backend, ML inference service) and the database, integrating
`QA-001`'s test gates and `SEC-001`'s hardening requirements.

## Required role/persona

DevOps/Platform Engineer.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`ARCH-001`, `BE-001`, `FE-001`, `ML-002`, and `SEC-001` approved.

## Input files and repository paths to inspect

- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`
- `docs/generated/testing/QA-STRATEGY-001-testing-strategy.md`
- `docs/generated/security/SEC-THREATMODEL-001-threat-model.md`
- `docs/generated/ml/ML-INFERENCE-001-service-contract.md` (sync-vs-batch decision affects
  deployment topology directly)

## Detailed execution instructions

1. Define environment topology (e.g., dev/staging/production, or whatever tiers are
   appropriate for this project's actual scale — do not over-engineer a topology sized for a
   much larger team/system than this one) for each deployable unit.
2. Define the CI/CD pipeline stages, explicitly wiring in `QA-001`'s test suites as gates (which
   suite blocks which stage) and `SEC-001`'s requirements (e.g., dependency scanning, secrets
   handling) as pipeline steps, not just narrative requirements.
3. Address the ML model specifically: how a new model version (per `ML-001`'s
   persistence/versioning plan) gets deployed — is it bundled with the inference service's
   deployment, or deployed independently (hot-swappable) — and how that choice interacts with
   the `risk_assessment.model_version` field in `DB-001`'s schema (a deployed model version must
   always be resolvable back to a row that used it).
4. If `ML-002` recommended batch scoring rather than synchronous inference, define the batch
   job's scheduling/orchestration and failure-handling (what happens to the application if a
   scheduled batch run fails — stale-but-available scores, or a visible staleness warning per
   `FE-001`'s staleness handling design).
5. Produce a deployment runbook: steps to deploy each unit, rollback procedure, and a basic
   health-check/monitoring spec (what signals indicate the system — including the ML
   inference boundary specifically — is unhealthy, not just "the server is up").

## Technical constraints

- Must not assume a specific cloud provider or orchestration platform as a requirement — this
  is exactly ADR-0006's open decision; present the design so it's portable across the realistic
  candidates `ARCH-002` evaluated, calling out where a specific choice would materially change a
  step.
- Must not size the topology/pipeline for a scale this project doesn't have — ground every
  capacity-related choice in the project's actual known scale (a 50,000-row dataset, an MVP
  with one primary persona) and say so explicitly, rather than defaulting to generic
  enterprise-scale boilerplate.

## Expected outputs and deliverables

Environment topology diagram, CI/CD pipeline stage list with gates, model-deployment/versioning
procedure, and a deployment runbook with rollback and health-check specs.

## Output storage location

`docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md`

## Validation requirements

- Every `QA-001` test suite and `SEC-001` requirement that's meant to gate deployment is
  explicitly wired into a named pipeline stage (not just mentioned in passing).
- The model-versioning procedure is consistent with `DB-001`'s `risk_assessment.model_version`
  field and `ML-001`'s persistence plan — no silent divergence.
- No specific cloud provider is required without being flagged as pending ADR-0006.

## Definition of Done

Artifact `status: Draft`; reviewed by a human platform engineer; `Approved` status is the
primary input to ADR-0006 (deployment architecture) and is the last design artifact needed
before any `src/` implementation work begins (per Stage 5–7 of
[docs/IMPLEMENTATION_ROADMAP.md](../../docs/IMPLEMENTATION_ROADMAP.md)).

## Failure handling and clarification requirements

If the team's actual operational capacity (who's on call, existing infra budget) materially
changes which topology/tooling choice is reasonable and that information isn't available in any
repository document, state the assumption made and flag it as needing stakeholder confirmation
rather than silently picking the most sophisticated option.

## Dependencies on other prompts

`ARCH-001`, `BE-001`, `FE-001`, `ML-002`, `SEC-001`.
