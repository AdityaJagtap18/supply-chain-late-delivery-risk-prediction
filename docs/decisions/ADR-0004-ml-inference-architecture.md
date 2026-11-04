---
decision_id: ADR-0004
title: ML Inference Architecture
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, ML-002, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md, docs/generated/ml/ML-INFERENCE-001-service-contract.md, docs/generated/backend/BE-ARCH-001-api-and-layering.md]
supersedes: null
superseded_by: null
---

# ADR-0004: ML Inference Architecture

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (a separate
> Python inference service, Option (a)) on 2026-11-03, as the first of seven ADRs accepted that
> day, per the dependency order `ARCH-005` specified (this ADR first, since ADR-0002 depends on
> it). This status change was made by `ARCH-005` strictly on the project owner's explicit
> instruction, not as an AI-generated recommendation — the recommendation itself was drafted
> earlier by `ARCH-004`; only the act of accepting it is recorded here.

**Sequencing note (resolved):** this ADR was accepted before ADR-0002 (backend framework), per
`ARCH-TRADEOFF-001` § 2's finding that Spring Boot's backend recommendation is contingent on this
decision's outcome. [ADR-0002](ADR-0002-backend-framework.md) records this ADR's acceptance as
satisfying that dependency.

## Context and problem

`ARCH-DESIGN-001` § 1.3 leaves whether the ML inference boundary is in-process with the backend
or a separate networked service explicitly undecided, by design. `ML-INFERENCE-001` (Approved)
already finalized the request/response *contract* assuming this decision's outcome does not
change that contract's shape — but did not decide where that boundary physically runs. The
question: should the ML inference boundary be (a) a separate Python service, (b) embedded
in-process in the backend (e.g., via ONNX export), or (c) a managed/hosted model-serving
platform?

## Options considered

### Option 1 (a): Separate Python inference service
- Description: the stakeholder's stated direction; a standalone service, called by the backend,
  reusing the same Python/pandas/scikit-learn/XGBoost stack as the offline training pipeline.
- Pros: training-time and inference-time feature computation can reuse the exact same code with
  no translation step, directly reducing the risk of a silent train/inference mismatch
  (`PROJECT_CONTEXT.md § 3` concern #4); natural fit with the already-Python offline training
  pipeline.
- Cons: one more deployable service to run, monitor, and version; requires securing an
  additional network boundary (service-to-service auth, per `SEC-THREATMODEL-001` § 1 boundary
  ③); adds a network hop (minor for a batch, not synchronous, workload per `ML-INFERENCE-001` § 4).
- Cost/effort to reverse later: moderate — the backend's dedicated "ML inference client
  boundary" (`BE-ARCH-001` § 1) is explicitly designed to absorb this choice, so reversing it
  means changing what that one interface calls, not a backend-wide rework.

### Option 2 (b): Embedded in-process (e.g., ONNX export + a backend-native runtime)
- Description: the trained model/encoders are exported to a portable format and served inside
  the backend process itself.
- Pros: no additional service to deploy/monitor; avoids the network hop entirely.
- Cons: requires an export step and a second runtime to validate numerically matches the
  Python-trained model; introduces an ongoing risk of export-format drift as scikit-learn/XGBoost
  versions change — a real, not hypothetical, risk against `PROJECT_CONTEXT.md § 3` concern #4,
  since this design document's own encoding-consistency mechanism (`ML-INFERENCE-001` § 3) is
  built around Python code being reused verbatim, not re-implemented in another runtime.
- Cost/effort to reverse later: moderate, same reasoning as Option 1.

### Option 3 (c): Managed/hosted model-serving platform
- Description: a cloud provider's model-endpoint product.
- Pros: lowest self-managed operational complexity.
- Cons: introduces a vendor dependency; typically consumption-based pricing whose exact figure
  depends on request volume and vendor/contract terms not known to this evaluation; sends order
  data (including quasi-identifier-adjacent fields per `ML-INFERENCE-001` § 1) to a third party —
  a material consideration against `SEC-THREATMODEL-001` § 1 boundary ③'s Information Disclosure
  row, which already notes this option specifically as the one this project's threat model flags.
- Cost/effort to reverse later: high — vendor lock-in and data-residency considerations compound
  reversal cost.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 4: team/ecosystem fit, operational complexity, licensing/cost,
performance at this project's batch (not synchronous) scale, security posture, and
ML-correctness-requirement fit against `PROJECT_CONTEXT.md § 3` concern #4 specifically.

## Selected decision

**Accepted: Option (a), a separate Python inference service.**

## Rationale

This is the one decision point where the stakeholder's stated direction has a genuine,
criteria-based edge rather than being a tie-break, per `ARCH-TRADEOFF-001` § 4: it reuses the
same language/library stack as the offline training pipeline, directly reducing the risk of a
silent train/inference mismatch (concern #4) — a risk Option (b) introduces by construction and
Option (c) only avoids if the vendor happens to support native scikit-learn/XGBoost artifact
hosting (unverified). The added operational surface area of a second service is real, but
`ML-INFERENCE-001` § 4's confirmed batch (not real-time) integration pattern means the latency
cost is minor for MVP. Accepting this also resolves the dependency flagged under ADR-0002 below.

## Consequences and trade-offs

- Requires securing an additional network boundary (service-to-service authentication, TLS —
  `SEC-THREATMODEL-001` § 3/§ 4, contingent notes already written assuming this outcome).
- Confirms `BE-ARCH-001` § 3's inference boundary contract is a network call, not an in-process
  function call — `ML-002`'s job to specify the exact transport (HTTP/gRPC), not yet done.
- Resolves ADR-0002's stated dependency: a separate Python service makes Spring Boot's backend
  recommendation free-standing (no cross-language schema-consistency argument against it).
- Adds one more deployable unit to `DEV-STRATEGY-001` § 1's environment topology — already
  accounted for there (the "ML inference boundary" row exists in every tier).

## Related prompts

ARCH-002, ML-002, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 4;
`docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md` § 1.3;
`docs/generated/ml/ML-INFERENCE-001-service-contract.md` (whole artifact, contract already
written compatibly with this outcome);
`docs/generated/backend/BE-ARCH-001-api-and-layering.md` § 1, § 3;
`docs/generated/security/SEC-THREATMODEL-001-threat-model.md` § 1 boundary ③.

## Superseded or related ADRs

ADR-0002 (backend framework) is explicitly contingent on this ADR's acceptance, per
`ARCH-TRADEOFF-001` § 2 and restated in ADR-0002 below.
