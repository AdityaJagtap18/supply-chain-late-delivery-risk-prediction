---
artifact_id: ARCH-TRADEOFF-001
title: Architecture Trade-off Evaluation — Stack Options
source_prompt: ARCH-002
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007]
---

# Architecture Trade-off Evaluation — Stack Options

Produced by executing [ARCH-002](../../../prompt-library/03-system-architecture/ARCH-002-architecture-tradeoff-evaluation.md)
against [ARCH-DESIGN-001](ARCH-DESIGN-001-high-level-architecture.md) (Approved) and
`docs/decisions/README.md`'s 7-item anticipated-decisions backlog.

**This artifact evaluates options; it does not decide.** Every recommendation below is labeled
"Recommended, pending human approval via ADR" and is not a final decision. No ADR is drafted
here — per ARCH-002's scope, drafting/accepting ADR-0001–0007 is a separate, explicit follow-up
step.

**Scale baseline used throughout:** the only concrete data in this repository today is
`final_sample.csv`/`df_last.csv` at 50,000 rows. Where a comparison's outcome would plausibly
differ at a materially larger production scale (full raw-dataset ingestion, higher request
volume), that is called out explicitly rather than silently assumed away.

**Licensing/cost input gap (applies across all 7 items below).** Every option compared here is
open-source and free to use at the license level. Total cost of ownership beyond that — existing
enterprise support contracts, negotiated cloud-provider agreements, in-house Java/.NET/Python
licensing deals, or a mandated cloud vendor — depends on information only the business
stakeholder has. This is **not guessed** anywhere below; the "Licensing/cost" criterion is scored
only on open-source license terms and general market cost patterns (e.g., managed-service
pricing tiers), and each table flags where a stakeholder-specific cost figure would change the
picture.

---

## 1. Frontend framework (ADR-0001)

Options: **Angular** (stated preference) vs. **React** vs. **Vue**.

| Criterion | Angular | React | Vue |
|---|---|---|---|
| Team/ecosystem fit | Full framework (routing, forms, DI, HTTP client built in); opinionated structure suits a team with a Java/enterprise background, which pairs naturally with the stated Spring Boot backend preference | Library, not a framework; largest ecosystem/hiring pool; more assembly-required (router, state management chosen separately) | Framework with a gentler learning curve than Angular; smaller ecosystem than React, growing but behind both alternatives in enterprise-Java-adjacent adoption |
| Operational complexity | Higher initial scaffolding (CLI, modules, RxJS) but consistent conventions reduce long-term drift across a small MVP team | Lower initial scaffolding; more decisions deferred to the team (routing library, state library), which is a cost for a small MVP team, not a benefit | Comparable to React but with more batteries-included defaults (official router/state libraries maintained by the same project) |
| Licensing/cost | MIT, free | MIT, free | MIT, free |
| Performance (at this project's scale) | Adequate for a risk list/detail UI serving at most a few thousand concurrent rows rendered; no evidence this MVP's scale stresses any of the three differently | Same — not a differentiator at this scale | Same — not a differentiator at this scale |
| Security posture | Built-in XSS protection via template sanitization; Google-backed long-term support cadence | Requires more explicit care (e.g., `dangerouslySetInnerHTML` misuse is a known footgun) but equally capable when used correctly; Meta-backed | Built-in template sanitization comparable to Angular; smaller core team backing long-term support |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Not applicable — frontend choice has no bearing on target-encoding leakage, feature-selection leakage, or any of the 8 numbered concerns, which are all data/model-layer issues | Not applicable, same reasoning | Not applicable, same reasoning |

**Recommended, pending human approval via ADR: Angular.** Rationale: on every criterion that
actually differentiates the three for this MVP's scope (a two-view, single-role internal tool),
none shows a decisive technical edge — this is a genuinely close comparison. Angular's structured
conventions reduce ongoing decision-making overhead for a small team building a narrowly-scoped
MVP, and it is the stakeholder's stated preference, which this evaluation treats as a legitimate
tie-breaker only because the criteria above do not produce a clear winner on their own merits —
not because it was stated first (per ARCH-002's own constraint).

## 2. Backend framework (ADR-0002)

Options: **Java Spring Boot** (stated preference) vs. **Node.js/NestJS** vs. **Python/FastAPI**.

| Criterion | Spring Boot | NestJS | FastAPI |
|---|---|---|---|
| Team/ecosystem fit | Mature enterprise ecosystem; Spring Security (ADR-0005) is a natural pairing; large hiring pool in enterprise contexts | TypeScript-first; shares a language with an Angular/React/Vue frontend, which can reduce context-switching for a small team | Python-native, which is the same language as the ML inference boundary (ADR-0004) regardless of in-process vs. separate-service outcome — a genuine integration-simplicity argument if the ML boundary ends up in-process |
| Operational complexity | Heavier runtime (JVM) and more ceremony (annotations, bean wiring) than the alternatives; well-understood deployment patterns | Lighter runtime, familiar Node deployment patterns, less ceremony than Spring but more structure than a bare Express app | Lightest of the three to stand up; async-first; smaller production-hardening track record for large enterprise deployments than Spring Boot specifically |
| Licensing/cost | Apache 2.0, free | MIT, free | MIT, free |
| Performance (at this project's scale) | JVM throughput is more than sufficient for a single-role MVP's request volume; no evidence this project needs Spring Boot's horizontal-scale strengths at 50,000-row scale | Equally sufficient at this scale | Equally sufficient at this scale; async I/O is a minor advantage if the batch-scoring job (FR-031) ends up calling a separate ML service over the network |
| Security posture | Spring Security is a mature, widely audited authN/authZ library — directly relevant to FR-034/NFR-WEB-001 | Comparable community security tooling (Passport.js, guards) but less of a single unified security framework than Spring Security | Comparable via libraries (e.g., `fastapi-users`, OAuth2 helpers) but, again, less unified than Spring Security |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | If the ML inference boundary (ADR-0004) is a separate Python service, Spring Boot's backend must still guarantee it sends the backend's schema consistently to that service — no language-level help with leakage-free encoding, since encoding is owned by the offline training pipeline regardless of backend language | Same reasoning — no language-level differentiator | If the ML inference boundary ends up in-process (same language), FastAPI (or any Python backend) removes a serialization/schema-drift risk at the backend↔inference boundary that a Java backend calling a Python service would otherwise carry — a genuine, if narrow, advantage tied to concern #4 (prediction-time feature availability: fewer places for the feature contract to silently diverge) |

**Recommended, pending human approval via ADR: Java Spring Boot, *contingent on* ADR-0004's
outcome.** Rationale: if ADR-0004 selects a separate Python ML inference service (the
stakeholder's stated direction for that decision), Spring Boot's enterprise maturity and its
natural pairing with Spring Security make it a reasonable choice with no clear technical
disadvantage versus the alternatives at this project's scale. However, this recommendation is
explicitly **not independent of ADR-0004**: if the ML inference boundary is instead embedded
in-process, a Python backend (FastAPI) removes a schema-consistency risk that a cross-language
boundary would otherwise introduce. This dependency should be resolved in ADR-0004 before
ADR-0002 is finalized, or both ADRs should be drafted together and cross-referenced.

## 3. Database (ADR-0003)

Options: **PostgreSQL** vs. **MySQL** (both stakeholder-stated candidates).

| Criterion | PostgreSQL | MySQL |
|---|---|---|
| Team/ecosystem fit | Equally mature; slightly stronger default tooling for JSON/semi-structured columns, which may matter if `order_attributes` (per `ARCH-DESIGN-001`'s frontend contract) ends up stored as a flexible document rather than a fixed schema | Equally mature; very widely deployed, large hiring pool |
| Operational complexity | Comparable; both have mature managed-hosting options across major cloud providers | Comparable |
| Licensing/cost | PostgreSQL License (permissive, free) | GPL v2 (community edition, free) with a dual-licensed commercial edition (Oracle) — the free community edition is sufficient for this project's scope; no feature in this MVP's scope requires the commercial edition |
| Performance (at this project's scale) | More than sufficient for order-record storage and risk-score read/write at 50,000-row scale; not a differentiator here | Same — not a differentiator at this scale |
| Security posture | Row-level security is a built-in, first-class feature — directly useful if NFR-WEB-003's quasi-identifier masking (`Latitude`/`Longitude`, `Customer Id`) is implemented as a database-level policy rather than purely in application code | Comparable access-control features exist but row-level security is less of a first-class, native feature than PostgreSQL's |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Not applicable — the database stores order records and scores; it does not perform encoding or training, so none of the 8 numbered concerns are affected by this choice | Not applicable, same reasoning |

**Blocking input gap:** if the business already has an existing enterprise licensing or managed-
hosting agreement specific to one of these two (e.g., a negotiated Oracle/MySQL support contract,
or a cloud provider's managed-Postgres commitment), that would be a legitimate tie-breaker this
evaluation cannot see — flagged here rather than guessed, per ARCH-002's failure-handling clause.

**Recommended, pending human approval via ADR: PostgreSQL.** Rationale: the two options are
operationally comparable at this project's scale, but PostgreSQL's native row-level security is
a direct, concrete fit for NFR-WEB-003's still-open quasi-identifier display question — it gives
whoever resolves that privacy decision a database-level enforcement option that MySQL does not
offer as natively. This is a real, criteria-based edge, not a restatement of the stated
preference (both options were stated preferences; this breaks the tie between them).

## 4. ML inference architecture (ADR-0004)

Options: **(a)** a separate Python inference service called by the backend (the stakeholder's
stated direction), **(b)** an embedded model-serving approach inside the backend (e.g., the
model exported to a backend-native/portable format such as ONNX and served via a Java ML
runtime), **(c)** a managed/hosted model-serving platform (e.g., a cloud provider's model-
endpoint product).

| Criterion | (a) Separate Python service | (b) Embedded in backend (e.g., ONNX + Java runtime) | (c) Managed/hosted serving platform |
|---|---|---|---|
| Team/ecosystem fit | Natural fit — the offline training pipeline (feeds `ML-001`) is already Python-based (pandas/scikit-learn/XGBoost); a Python serving service reuses that language and libraries directly | Requires an export step (e.g., XGBoost → ONNX) and a second runtime to validate numerically matches the Python-trained model; adds a translation layer the team must maintain | Offloads serving infrastructure to a vendor; team still needs to package the model/encoders in the platform's expected format |
| Operational complexity | One more deployable service to run, monitor, and version alongside the backend; genuinely adds operational surface area versus (b) | Lower operational surface area (one fewer service to deploy) but higher one-time integration complexity (export/validation tooling) and ongoing risk of export-format drift as scikit-learn/XGBoost versions change | Lowest self-managed operational complexity, but introduces a vendor dependency and a new operational skill (platform-specific deployment/monitoring) |
| Licensing/cost | Free (open-source serving frameworks); infra cost of running an extra service | Free (ONNX Runtime and similar are open-source); no extra service-hosting cost beyond the backend itself | Typically consumption-based pricing (per-request or per-hour-provisioned) — a real, non-trivial recurring cost whose exact figure depends on request volume this evaluation cannot project and on vendor/contract terms only the business stakeholder has |
| Performance (at this project's scale) | Adequate; network hop between backend and inference service adds latency, but FR-031 is a batch job (per `PD-VISION-001`'s MVP scope), not a synchronous user-facing call, so this is a minor concern for MVP specifically | Avoids the network hop entirely; marginal benefit for a batch workload, more relevant if a future live-scoring API (explicitly out of scope for MVP) is ever built | Varies by platform; typically provisioned for elastic scale, which this MVP's batch workload does not need |
| Security posture | Requires securing an additional network boundary (service-to-service auth) | No additional network boundary; attack surface stays within the backend's existing security boundary | Vendor-managed security for the serving layer itself, but introduces a new trust boundary (the vendor) and typically requires sending order data (including the retained quasi-identifiers from § 17) to a third party — a material consideration for NFR-WEB-003/GAP-013 that options (a) and (b) do not raise |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Keeping the training-time and inference-time feature computation identical (concern #4) is most natural here, since the same Python/scikit-learn code that fits the encoders can be reused verbatim at inference time, with no translation step that could silently diverge | Carries a real risk against concern #4: an ONNX export of the fitted encoders/model must be verified to numerically match the Python original, or the inference path could silently diverge from what was validated during training — this is an extra verification burden this option introduces that (a) does not have | Depends entirely on whether the platform can host the *exact* fitted scikit-learn/XGBoost artifacts natively (many can) or requires its own export/translation step (then inherits (b)'s risk); evaluated here as "depends," not scored definitively, since this varies by specific vendor |

**Recommended, pending human approval via ADR: (a) a separate Python inference service.**
Rationale: this is the one decision point where the stakeholder's stated direction has a genuine,
criteria-based edge rather than being a tie-break — it reuses the same language/library stack as
the offline training pipeline, which directly reduces the risk of a silent train/inference
mismatch (`PROJECT_CONTEXT.md § 3` concern #4), a risk option (b) introduces by construction and
option (c) only avoids if the chosen vendor happens to support native scikit-learn/XGBoost
artifact hosting (unverified here). The added operational surface area of a second service is a
real cost, but FR-031's batch (not real-time) framing means the latency downside is minor for
MVP. This recommendation also resolves the dependency flagged under ADR-0002.

## 5. Authentication strategy (ADR-0005)

Options: **session-based authentication via Spring Security** (stated direction, tied to the
stakeholder's backend-framework preference) vs. **stateless token/JWT-based authentication** vs.
**OAuth2/OIDC-based SSO integration**.

| Criterion | Session-based (Spring Security) | Stateless JWT | OAuth2/OIDC SSO |
|---|---|---|---|
| Team/ecosystem fit | Direct, well-documented fit if ADR-0002 selects Spring Boot; Spring Security's session management is mature and widely used | Framework-agnostic; works equally well regardless of ADR-0002's outcome | Requires an identity provider (existing or new); fit depends on whether the business already runs one — unknown here |
| Operational complexity | Requires server-side session storage (ties into the persistent data store, ADR-0003); simplest to reason about for a single-role MVP | No server-side session state to manage, which simplifies horizontal scaling the backend has no current need for at MVP scale; adds token-refresh/expiry logic | Highest complexity of the three for an MVP — requires integrating with or standing up an identity provider, which is disproportionate to a single-role, single-application MVP |
| Licensing/cost | Free (Spring Security itself); no external IdP cost | Free (standard libraries exist in every ecosystem) | Free if an existing enterprise IdP is reused; a new cost if one must be stood up — a stakeholder-specific unknown, not guessed here |
| Performance (at this project's scale) | Not a differentiator at a single-role MVP's request volume | Not a differentiator | Not a differentiator, but adds a network round-trip to the IdP on login, irrelevant to day-to-day use |
| Security posture | Mature, well-audited; session fixation/CSRF protections are built in and well-understood | Requires careful handling of token revocation/expiry (a stateless token can't be instantly invalidated the way a server-side session can, without extra infrastructure) | Strongest posture *if* an existing enterprise IdP already enforces the organization's password/MFA policy — otherwise this benefit is theoretical, not realized, for MVP |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Not applicable — authentication strategy has no bearing on any of the 8 numbered ML concerns | Not applicable, same reasoning | Not applicable, same reasoning |

**Blocking input gap:** whether the business already operates an identity provider (for SSO) is
a fact only the business stakeholder has; this evaluation does not assume one exists.

**Recommended, pending human approval via ADR: session-based authentication via Spring
Security**, contingent on ADR-0002 selecting Spring Boot (see § 2 above). Rationale: NFR-WEB-004
already scopes MVP to a single role with no multi-user authorization complexity — the scaling
and statelessness benefits of JWT, and the centralized-identity benefit of OAuth2/OIDC, both solve
problems this MVP does not have yet. If ADR-0002 instead selects a non-Java backend, this
recommendation does not hold without re-evaluation on that backend's own equivalent tooling.

## 6. Deployment architecture (ADR-0006)

Options: **containerized deployment** (e.g., Docker images on any orchestrator) vs. **a
Platform-as-a-Service (PaaS)** vs. **serverless/function-based deployment**.

| Criterion | Containerized | PaaS | Serverless |
|---|---|---|---|
| Team/ecosystem fit | Most portable across cloud providers; widely understood regardless of which frontend/backend/database wins ADR-0001–0003 | Fastest path to a running environment with the least infrastructure code, at the cost of some platform lock-in | Good fit for the batch-scoring job (FR-031) specifically, which is a periodic, bounded-duration workload — less natural fit for the backend API's always-on request handling |
| Operational complexity | Highest upfront setup (orchestration, networking) but most control and portability long-term | Lowest upfront complexity for a small MVP team | Low for the batch job; would be an awkward fit if applied to the always-on backend/frontend instead |
| Licensing/cost | Open-source tooling (Docker, orchestrators) is free; cloud compute cost is usage-based regardless of provider — exact figures depend on provider/contract, a stakeholder-specific unknown | Typically higher per-unit compute cost than raw containers in exchange for less operational burden — a real trade-off, not a free win | Pay-per-invocation, which could be genuinely cheap for a low-frequency batch job (FR-031) specifically |
| Performance (at this project's scale) | More than sufficient; no evidence this MVP's scale needs container-orchestration-level elasticity | Sufficient for a single-role MVP's load | Sufficient for a periodic batch job; cold-start latency is irrelevant to a scheduled job the way it would matter for a synchronous user-facing call |
| Security posture | Requires the team to own image hardening, patching cadence, and network policy | Vendor manages more of the underlying security surface, at the cost of less direct control | Vendor manages the execution environment entirely; smallest attack surface per function, but more components (functions) to individually secure/configure if used broadly |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Not applicable — deployment architecture does not affect encoding/training correctness, only where the (already-designed) components run | Not applicable, same reasoning | Not applicable, same reasoning |

**Recommended, pending human approval via ADR: containerized deployment for the frontend/backend/
database components, with serverless specifically considered as an option for the batch-scoring
job (FR-031) alone** — not a single blanket recommendation across all components. Rationale: this
is the one backlog item where "one answer for everything" is itself likely the wrong framing;
FR-031's periodic, bounded nature genuinely fits serverless's cost/operational profile better than
it fits the always-on frontend/backend, while the always-on components benefit more from
containerized portability than from a PaaS's lock-in trade-off. This nuance should be preserved
rather than collapsed into one ADR answer.

## 7. Model storage and versioning (ADR-0007)

Options: **file-based persistence** (e.g., `joblib`/`pickle`/ONNX files on disk or object
storage) vs. **a model registry** (e.g., MLflow or a comparable tool).

| Criterion | File-based | Model registry (e.g., MLflow) |
|---|---|---|
| Team/ecosystem fit | Simplest possible fit for FR-029/FR-030's baseline requirement ("a saved model file is sufficient" per `PD-VISION-001`) | Better fit once there is more than one model version to track, or once `docs/PRD.md § 11`'s recommended "defined model-retraining cadence" (currently out of scope for MVP) becomes real |
| Operational complexity | Lowest — no additional service to run | Adds a service (or managed offering) to run/maintain; disproportionate to MVP's explicitly single-model-version scope |
| Licensing/cost | Free | Free (open-source core) for self-hosted; a managed offering would add cost — not assumed here |
| Performance (at this project's scale) | Not a differentiator; loading one model/encoder pair from disk or object storage is not a bottleneck at this scale | Not a differentiator either, just more infrastructure for the same outcome at MVP's current scope |
| Security posture | Access control is whatever the surrounding storage (filesystem/object-storage permissions) provides | Can add its own access-control layer on top, which is a benefit only once there are multiple models/users to differentiate between — not yet relevant at MVP scope |
| ML-correctness-requirement fit (`PROJECT_CONTEXT.md § 3`) | Directly supports FR-029/FR-030 as scoped; does not, by itself, address concern #5 (reproducibility of results) — that requires whatever process produces the file to itself be leakage-free and reproducible, which is `ML-001`'s job regardless of storage choice | A registry can record which training run (and which code/data version) produced a given model, which is a stronger fit for concern #5's reproducibility concern *once* retraining is a recurring activity — but PD-002's MVP scope explicitly defers "automated retraining" (`PD-VISION-001` Out-of-scope table), so this benefit is not yet needed |

**Recommended, pending human approval via ADR: file-based persistence for MVP, with an explicit
note that this should be revisited the moment retraining becomes a recurring activity (Phase 4 per
`docs/PRD.md § 21`).** Rationale: `PD-VISION-001` scoped FR-026/FR-028 (now FR-029/FR-030) to
"baseline fidelity only... a model registry/versioning system is not required for MVP" — a
registry's benefits are real but tied to a retraining cadence this MVP explicitly does not have.
Recommending a registry now would be scope creep beyond what `PD-002` approved.

---

## Summary table

| Decision point | Recommended (pending ADR) | Contingent on |
|---|---|---|
| ADR-0001 Frontend framework | Angular | — |
| ADR-0002 Backend framework | Java Spring Boot | ADR-0004's outcome (see § 2) |
| ADR-0003 Database | PostgreSQL | — |
| ADR-0004 ML inference architecture | (a) Separate Python inference service | — |
| ADR-0005 Authentication strategy | Session-based via Spring Security | ADR-0002 selecting Spring Boot |
| ADR-0006 Deployment architecture | Containerized (app components); serverless considered for FR-031's batch job specifically | — |
| ADR-0007 Model storage/versioning | File-based for MVP; revisit at Phase 4 | — |

**None of the above is a decision.** Each row is this artifact's non-binding input to a
human-drafted, human-accepted ADR, per `docs/decisions/README.md`'s traceability chain
(`Prompt → AI Execution → Generated Artifact → Human Review → Approved Artifact → ADR →
Implementation`).
