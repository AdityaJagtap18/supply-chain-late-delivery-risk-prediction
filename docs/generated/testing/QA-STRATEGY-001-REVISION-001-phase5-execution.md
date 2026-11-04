---
artifact_id: QA-STRATEGY-001-REVISION-001
title: Phase 5 Execution Record — Validation and Release
source_prompt: IMPLEMENTATION-PLAN-001 Phase 5
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0003, ADR-0004, ADR-0005, ADR-0007]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session (the same
> "Start Phase 5" instruction that commissioned this work), per `IMPLEMENTATION-PLAN-001.md`'s
> phase table: "`QA-001`'s full test suite, `SEC-001`'s requirements, `DEV-001`'s deployment
> runbook."

# Phase 5 Execution Record — Validation and Release

`QA-STRATEGY-001` (still `Draft`), `SEC-THREATMODEL-001` (`Approved`), and `DEV-STRATEGY-001`
(`Approved`) were all design documents before this phase — none had corresponding production
code or tests. This revision is that implementation, verified for real against running
containers/databases, not just compiled.

## 1. Security requirements (`SEC-THREATMODEL-001`)

| Requirement | Implementation | Verified |
|---|---|---|
| REQ-INPUT-001 (query-param enum validation) | `OrderController`'s `riskBand`/`status` allow-lists, `400` on an unrecognized value | `SecurityRequirementsIntegrationTests` (unit/integration) |
| REQ-INPUT-003 (request-body validation) | `AuthController.LoginRequest`'s `@NotBlank @Size(max=255)` via `spring-boot-starter-validation` | Same test class |
| REQ-AUTH-002 (bounded session lifetime) | `server.servlet.session.timeout: 30m` (`application.yml`) — flagged placeholder, no team policy exists yet | Config only; not independently timing-tested |
| REQ-AUDIT-001/002/003 (audit logging, no quasi-identifiers) | `OrderController`'s `AUDIT` logger: per-order lines for `getOrderDetail`/`getRiskHistory`, list-level (not per-row) for `listOrders`, never a quasi-identifier value | Real log lines captured during the full test run (e.g. `user=analyst action=listOrders riskBand=null status=null resultCount=1`) |
| REQ-RATE-001 (login rate limiting) | `LoginRateLimiter` (10 attempts / 15 min, per username), wired into `AuthController` | `SecurityRequirementsIntegrationTests#loginIsRateLimitedAfterTooManyAttempts` — real `429` after the 11th failed attempt |
| REQ-RATE-002 (general API rate limiting) | `GeneralRateLimitFilter` (120 req/min, per IP), a `OncePerRequestFilter` before `UsernamePasswordAuthenticationFilter` | Exercised indirectly by the full test suite; not separately load-tested (explicitly out of `QA-STRATEGY-001` S5's scope — "rate-limit-value-testing" is `SEC-001` adversarial territory) |
| REQ-AUTHZ-002 (least-privilege DB role) | [`scripts/db/004_least_privilege_app_role.sql`](../../../scripts/db/004_least_privilege_app_role.sql) — `supplychain_app` role, CRUD-only on the 9 real tables, no DDL | Applied for real against a fresh `postgres` container (`BEGIN`/`DO`/`GRANT`×4/`COMMIT`, no errors). **Not switched into local dev's `.env`** — deliberate, documented in the migration's own header (no real data/other tenant locally; this is the staging/production artifact) |
| REQ-TLS-001/002/003 | Not implemented locally (HTTP is deliberate for `localhost` development) | Deployment-environment concern, `DEV-STRATEGY-001`'s job, not re-litigated here |

**Residual/open, not resolved by this phase:** the three items `SEC-THREATMODEL-001` S7 already
left open, plus REQ-TLS-*'s deployment-time applicability.

## 2. Testing (`QA-STRATEGY-001`)

### 2.1 Backend (`src/backend`)

- **Unit:** `RiskBandThresholdsTest` (3 tests, band-boundary assertions).
- **Integration — ML-inference failure modes (S2's explicit instruction: "must be
  integration-tested... a mock that always succeeds can't catch a fallback-path regression"):**
  `BatchScoringServiceIntegrationTests` (whole-batch HTTP-500 failure writes nothing; per-order
  omission is skipped, not fabricated; missing `customer_location` aborts before calling the ML
  service) and `BatchScoringUnreachableMlServiceTests` (connection-refused case, separate Spring
  context since `@DynamicPropertySource` is fixed per context). Both use a real
  `com.sun.net.httpserver.HttpServer` fake upstream, this project's own established pattern from
  `MlCheckControllerTests` — not a new mocking dependency.
  - **Real bug found and fixed while building this:** the fake server's 200-success responses
    had no `Content-Type` header, defaulting to `application/octet-stream`; Spring's
    `RestClient.bodyTo()` refuses to deserialize that as JSON
    (`UnknownContentTypeException`). The pre-existing `MlCheckControllerTests` never hit this
    because its fake server only ever returns the 503 path, which reads raw bytes and never
    calls `.bodyTo()`. Fixed by setting `Content-Type: application/json` on every response path.
    Caught by actually running the suite in Docker, not by inspection.
- **Integration — security (S2's "auth-enforcement, functional correctness, not adversarial"):**
  `SecurityRequirementsIntegrationTests` (7 tests — unauthenticated `401` on the new
  batch-scoring endpoint, login-body validation `400`s, query-param enum validation, and the
  real rate-limit `429`).
- **Full suite result (Docker, `mvn -B test`):** 20 tests, 0 failures, 0 errors.

### 2.2 ML service (`src/ml-service`) — S4.2's feature-availability contract test

`test_feature_contract.py` diffs two **executable** records, not markdown prose: `app/schemas.py`'s
`Features` model (`ML-INFERENCE-001` S1's actual wire contract) against
`scripts/ml/train_model.py`'s `CSV_TO_FEATURE_FIELD` (`ML-PIPELINE-001` S1's actual retained
feature set). A mismatch would mean the service rejects every request the trained model needs, or
the pipeline trains on a feature the contract doesn't know about. Importing `train_model.py` pulls
in pandas/numpy (not a runtime dependency of `ml-service` itself, by design — see its
`requirements.txt`'s own comment), so pandas/numpy were added to `requirements-dev.txt` only
(test-only, never shipped in the service's Docker image). **Result:** 5/5 tests pass (4
pre-existing + this one).

### 2.3 ML pipeline (`scripts/ml`) — S4.1 regression test and S4.3 data-drift smoke test

- **S4.1 training-pipeline regression test** (`scripts/ml/tests/test_training_regression.py`):
  re-runs the real pipeline against the committed `final_sample.csv` and compares recall/accuracy
  against the baseline already persisted in `artifacts/encoders.json` (a real measured run, not
  `ML-PIPELINE-001`'s design-doc hypothetical numbers), within a ±2pp tolerance in **either**
  direction — an unexplained upward jump fails this test too, per S4.1's own instruction, since
  it is far more likely to signal a reintroduced leak than a genuine improvement. Required
  splitting `train_model.py`'s file-writing (`main()`) from its pure compute
  (`train_and_evaluate()`), so the regression test can re-run training without clobbering the
  committed artifacts. **Result:** 1/1 passes (fresh run reproduces the exact persisted metrics
  byte-for-byte — this pipeline is deterministic given the fixed seed).
- **S4.3 data-drift smoke test** (`scripts/ml/data_drift_check.py`): that section's own status
  was "design only... activates once `BE-ARCH-001` S2.7's batch job is actually running against
  real orders" — it now is (`BatchScoringService`, Phase 4), so this is that activation. Computes
  live per-field category frequency distributions from the same order+shipment+
  customer_location join `BatchScoringService` uses, compares each against the training-fold
  distribution (a new `categoryFrequencies` field added to `encoders.json` by `train_model.py`
  specifically to give this script a real baseline), and flags any field whose total-variation
  distance exceeds an explicitly-labeled placeholder threshold (0.15 — no business tolerance has
  been set anywhere in this project's documents). **Verified against a real `postgres` container**
  with the Phase 3/4 seed data (5 orders): correctly connected, computed real frequencies, and
  flagged 7 of 8 fields as drifted — expected and correct, since 5 hand-written seed orders look
  nothing like a 40,000-row training distribution; this is exactly the signal this smoke test
  exists to surface, not a bug. `--fail-on-drift` exit-code behavior also verified (exit `1`).

### 2.4 Frontend (`src/frontend`) — S1's frontend unit-test scope

**No test infrastructure existed before this phase at all** — no Karma/Jasmine devDependencies,
no `tsconfig.spec.json`, no `test` architect target in `angular.json`, zero `.spec.ts` files. All
added from scratch:
- `angular.json`'s `test` target (`@angular-devkit/build-angular:karma`), `tsconfig.spec.json`,
  and the Karma/Jasmine devDependencies.
- `risk-level-badge.component.spec.ts` — the High/Medium/Low states and, specifically, the
  null/undefined/unrecognized-band "stale/Unscored" fourth state that must never silently render
  as "Low" (`UI-DESIGN-001` S3.1).
- `risk-dashboard-page.component.spec.ts` — the staleness-display distinction between "Last
  Scored: &lt;timestamp&gt;" and "No scores available", using a stubbed `OrderService` (no real
  HTTP call).
- **Result:** 10/10 pass. Verified inside a plain `node:20-bookworm` container as root, which
  has no usable Chrome sandbox — using Angular's own built-in `ChromeHeadlessNoSandbox` launcher
  (already shipped in `@angular-devkit/build-angular`'s default Karma config; no extra
  `karma.conf.js` needed, since supplying one would have *replaced* that built-in config instead
  of extending it — confirmed by reading the builder's own source, after two intermediate
  attempts that produced "no adapter" and "0 of 0 tests" failures respectively).
- E2E scenarios (S3's seven) and the frontend coverage-bar placeholders (S6) are **not**
  implemented this phase — no E2E tooling (Cypress/Playwright) exists in this repository yet;
  carried forward, not claimed done.

### 2.5 Not implemented this phase, carried forward honestly

- `QA-STRATEGY-001` S3's seven E2E scenarios (no E2E tooling in the repo).
- S6's numeric coverage-bar enforcement (80%/60-70%/90%) — no coverage gate is wired into CI;
  Karma's `karma-coverage` plugin is present as a devDependency but not yet asserted against.
- A migration-version health check (`DEV-STRATEGY-001` S5.3's "database = migrations at expected
  version") — this project has no migration-versioning tool (Flyway/Liquibase); migrations are
  plain, manually-sequenced `scripts/db/*.sql` files with no runtime-queryable "current version."
  Not fabricated here as a false signal.

## 3. Deployment/health (`DEV-STRATEGY-001`)

- **Backend readiness = can reach DB** (S5.3): `management.endpoint.health.show-details:
  when-authorized` added to `application.yml` so an authenticated caller sees the real `db`
  component's `UP`/`DOWN` (Spring Boot's auto-configured `DataSourceHealthIndicator`), while an
  anonymous caller (a load balancer) still only sees the aggregate status — not a new
  capability, just surfacing one Spring Boot already provides. **Verified for real**: against a
  live `postgres` + `backend` container pair, anonymous `GET /actuator/health` returned
  `{"status":"UP"}`; the same request with a valid session cookie returned the full
  `{"status":"UP","components":{"db":{"status":"UP",...},...}}` breakdown.
- **ML-inference-boundary readiness = can load current model artifact:** already satisfied by
  `ml-service`'s pre-existing `GET /health` (`modelLoaded: bool`) — no change needed this phase.
- **Batch job = "time since last successful run":** `GET /system/model-versions` now also
  returns `lastScoredAt` (previously only `activeModelVersion`) — the raw signal
  `DEV-STRATEGY-001` S5.3 asks for; no alerting threshold is implemented, since the batch cadence
  itself (`BATCH_SCORING_CADENCE_CRON`) remains `TBD`. **Verified**: `GET /system/model-versions`
  returned `{"activeModelVersion":"adaboost-v1-20261103","lastScoredAt":"2026-11-03T10:02:45...Z"}`
  against real data.
- **Database = migrations at expected version:** not implemented — see § 2.5 above.

## 4. Summary — what Phase 5 actually closes out

Every `SEC-THREATMODEL-001` requirement with a concrete, functionally-testable shape (REQ-INPUT-*,
REQ-AUDIT-*, REQ-RATE-*, REQ-AUTHZ-002, REQ-AUTH-002) now has real code and, where meaningfully
testable short of adversarial testing (explicitly `SEC-001`'s own territory, not `QA-001`'s), a
real passing test. `QA-STRATEGY-001`'s three ML-specific validation items (S4.1/4.2/4.3) all now
exist as real, runnable artifacts, not design placeholders — including S4.3, whose own prior
status note said it could not exist until the real batch job did. `DEV-STRATEGY-001`'s S5.3
health-check table is satisfied except the migration-version signal, which has no honest
implementation available in this project's current tooling. Frontend testing exists for the
first time, covering S1's two named items; S3's E2E scenarios and S6's coverage gate are the
largest remaining, explicitly-flagged gaps.
