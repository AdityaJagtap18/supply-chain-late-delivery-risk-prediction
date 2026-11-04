---
decision_id: ADR-0007
title: Model Storage and Versioning
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, ML-001, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md, docs/generated/database/DB-ARCH-001-schema-design.md, docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md]
supersedes: null
superseded_by: null
---

# ADR-0007: Model Storage and Versioning

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (file-based
> persistence for MVP) on 2026-11-03, seventh and last in the dependency order `ARCH-005`
> specified. The reconsideration trigger stated below (revisit once automated retraining becomes
> a recurring activity) is preserved as accepted, not removed — this ADR does not become
> permanent by being accepted; it is accepted *for MVP*, with that trigger intact.

## Context and problem

`ML-PIPELINE-001` § 5 requires the trained model and its fitted encoders to be persisted with
specific metadata (training-data snapshot identifier, feature list, encoding maps, metrics,
training date, library versions, cold-start fallback value), and presents two storage options
without pre-deciding between them. `DB-ARCH-001` § 2.7's `risk_assessment.model_version` column
(`NOT NULL`) depends on this decision producing *some* resolvable version identifier, whichever
storage mechanism is chosen. The question: file-based persistence, or a model registry (e.g.,
MLflow)?

## Options considered

### Option 1: File-based persistence
- Description: the model artifact in a native serialization format (e.g., XGBoost's own
  `.json`/`.ubj`, or `joblib` for a scikit-learn pipeline) plus a JSON metadata sidecar file.
- Pros: simplest possible fit for FR-029/FR-030's baseline requirement ("a saved model file is
  sufficient" per `PD-VISION-001`); lowest operational complexity — no additional service to run;
  free.
- Cons: does not, by itself, track which training run (code/data version) produced a given
  model beyond what the metadata sidecar records manually.
- Cost/effort to reverse later: low — `DEV-STRATEGY-001` § 3 already designed the hot-swappable
  "current production model version" pointer mechanism around this option specifically, so
  migrating to a registry later would mean replacing that pointer mechanism, not redesigning the
  inference service's loading contract.

### Option 2: Model registry (e.g., MLflow)
- Description: a dedicated service/tool tracking model versions, their training runs, and
  metadata.
- Pros: better fit once there is more than one model version to track, or once a defined
  retraining cadence (currently out of MVP scope per `PD-VISION-001`'s Out-of-scope table)
  becomes real; can add its own access-control layer once multiple models/users need
  differentiating.
- Cons: adds a service to run/maintain, disproportionate to MVP's explicitly single-model-version
  scope.
- Cost/effort to reverse later: low to adopt later (additive), since nothing about file-based
  persistence precludes introducing a registry on top of it subsequently.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 7: team/ecosystem fit, operational complexity, licensing/cost,
performance (not a differentiator), security posture, and ML-correctness-requirement fit
(`PROJECT_CONTEXT.md § 3` concern #5, reproducibility).

## Selected decision

**Accepted: file-based persistence for MVP, with an explicit note to revisit once retraining
becomes a recurring activity** (that reconsideration trigger remains in force after acceptance).

## Rationale

`PD-VISION-001` scoped FR-029/FR-030 to "baseline fidelity only... a model registry/versioning
system is not required for MVP." A registry's reproducibility benefit (tracking which training
run produced a given model) is real but tied to a retraining cadence this MVP explicitly does not
have yet (Phase 4 per `docs/PRD.md § 21`). Recommending a registry now would be scope creep
beyond what `PD-002` approved, per `ARCH-TRADEOFF-001` § 7.

## Consequences and trade-offs

- `DEV-STRATEGY-001` § 3's hot-swappable model-deployment design (independent publication of the
  model artifact plus a separately-updated "current production model version" pointer) becomes
  the authorized mechanism once this ADR is accepted, rather than merely a recommendation.
- `ML-PIPELINE-001` § 5's metadata-sidecar requirement becomes the sole mechanism for tracking
  which training run produced a given model — there is no registry-level audit trail as a
  backstop; the metadata file's completeness and the discipline of never silently overwriting it
  matter more under this choice than they would under a registry.
- Explicitly revisit this ADR the moment automated retraining is scoped into a future phase
  (`docs/PRD.md § 21` Phase 4), per `ARCH-TRADEOFF-001` § 7's own note — this is a deliberate,
  stated reconsideration trigger, not an open-ended "someday."

## Related prompts

ARCH-002, ML-001, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 7;
`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md` § 5;
`docs/generated/database/DB-ARCH-001-schema-design.md` § 2.7;
`docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md` § 3.

## Superseded or related ADRs

None.
