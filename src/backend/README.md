# `src/backend` — Java Spring Boot API

**Status:** Phase 5 complete and verified (2026-11-03) — `SEC-THREATMODEL-001`'s concrete
requirements (input validation, audit logging, login/general rate limiting, a least-privilege
DB role migration) and `QA-STRATEGY-001`'s backend test scope, both with real passing tests. See
[`QA-STRATEGY-001-REVISION-001`](../../docs/generated/testing/QA-STRATEGY-001-REVISION-001-phase5-execution.md)
for the full record.

**Phase 5 additions:**
- **`com.supplychain.backend.auth.LoginRateLimiter`/`GeneralRateLimitFilter`** — REQ-RATE-001
  (10 attempts/15min per username, in `AuthController`) and REQ-RATE-002 (120 req/min per IP, a
  `OncePerRequestFilter` before Spring Security's auth filter).
- **`OrderController`** — `riskBand`/`status` query-param allow-lists (`400` on an unrecognized
  value, REQ-INPUT-001) and an `AUDIT` logger (REQ-AUDIT-001/002/003 — per-order lines for detail/
  history lookups, list-level only for the queue endpoint, never a quasi-identifier value).
- **`AuthController.LoginRequest`** — `@NotBlank @Size(max=255)` via the new
  `spring-boot-starter-validation` dependency (REQ-INPUT-003).
- **`application.yml`** — a 30-minute session timeout (REQ-AUTH-002, an explicitly flagged
  placeholder) and `management.endpoint.health.show-details: when-authorized`, so an
  authenticated caller sees `/actuator/health`'s real `db` component status
  (`DEV-STRATEGY-001` S5.3's "backend readiness = can reach DB") while an anonymous caller still
  only sees the aggregate `UP`/`DOWN`.
- **`SystemController`** — `GET /system/model-versions` now also returns `lastScoredAt`
  (`DEV-STRATEGY-001` S5.3's batch-job "time since last successful run" signal).
- **`scripts/db/004_least_privilege_app_role.sql`** — REQ-AUTHZ-002's least-privilege role,
  applied and verified against a real `postgres` container; deliberately not switched into local
  dev's default credentials (see that file's own header).
- **New tests:** `RiskBandThresholdsTest`, `BatchScoringServiceIntegrationTests` +
  `BatchScoringUnreachableMlServiceTests` (the ML-INFERENCE-001 S5 failure-path integration tests
  QA-STRATEGY-001 S2 calls out by name), `SecurityRequirementsIntegrationTests`. Full suite: 20
  tests, 0 failures, 0 errors, verified in Docker.

**Phase 1 connectivity proofs (still present, unchanged in behavior):**
- **Step 2** — a real PostgreSQL read/write round-trip, via `POST /api/ping` and
  `GET /api/ping` (`com.supplychain.backend.ping`). Its table (`ping_record`) is a connectivity
  proof, not a domain entity — not part of `DB-ARCH-001`/`DB-ARCH-REVISION-001`. Now created by
  `scripts/db/000_ping_table.sql`, not Hibernate auto-DDL (see below).
- **Step 7** — a health check, via Spring Boot Actuator's `/actuator/health` (only `health` is
  exposed).
- **Step 3** — a real network call to the separate ML inference service, via
  `GET /api/ml-check` (`com.supplychain.backend.mlcheck`), a **diagnostic endpoint**, not
  FR-031's real batch-scoring integration. Verified live against the real `ml-service` container.

**Phase 3 additions:**
- **`com.supplychain.backend.auth`** — `POST`/`DELETE /auth/sessions` (BE-ARCH-001 S2.1/2.2),
  session-based auth via Spring Security (`SecurityConfig`), `app_user.credential_reference`
  storing a BCrypt hash (a concrete choice this phase made against that column's deliberately
  abstract design). Every endpoint except the two Phase 1 diagnostics above and
  `POST /auth/sessions` itself requires an authenticated session.
- **`com.supplychain.backend.domain`** — JPA entities/repositories for `customer`, `order`
  (incl. `payment_type`), `shipment`, `risk_assessment` — mapped onto the real tables
  `scripts/db/001_init_schema.sql` created in Phase 2, not auto-generated.
- **`com.supplychain.backend.orders`** — `GET /orders` (FR-032 risk queue, with `riskBand`/
  `status` filters and risk-descending sort, unscored orders last), `GET /orders/{orderId}`
  (FR-033 detail), `GET /orders/{orderId}/risk-assessments` (history), `GET
  /system/model-versions` — all real reads, no stubbed HTTP layer. The risk *scores* themselves
  come from `scripts/db/002_seed_phase3.sql`'s seeded rows (`model_version:
  "stub-seed-data-phase3"`), never a fabricated value computed in this layer.
- **`hibernate.ddl-auto` changed from `update` to `validate`** (`application.yml`) — the
  reconsideration Phase 1's own comment there flagged as overdue "before Phase 2". Schema
  ownership is now entirely `scripts/db/*.sql`; Hibernate only validates entity mappings against
  it at startup.
- **A known, surfaced contract ambiguity, not silently resolved:** `BE-ARCH-001` S2.3 states
  `GET /orders`'s `status` filter defaults to `"open"`, but none of the four `order_status`
  values the source data actually carries (`COMPLETE`/`PENDING_PAYMENT`/`PROCESSING`/`CLOSED`)
  is literally `"open"`. This implementation treats `status` as an optional exact-match filter
  with no default applied when absent — see `OrderService`'s class/method comments.

**Phase 4 additions:**
- **`com.supplychain.backend.scoring`** — the real FR-031 batch-scoring job.
  `BatchScoringService` assembles each order's 9-feature `ML-INFERENCE-001` request from
  `order`/`shipment`/`customer_location` (a new internal-only `CustomerLocation` entity —
  CONS-004 still holds, nothing new is exposed over HTTP), calls the real `ml-service` via the
  existing `MlServiceClient`, and persists one new `risk_assessment` row per order the service
  actually scored. `RiskBandThresholds` finalizes `BE-ARCH-001` S3.3's open score→band TBD
  (High ≥ 0.70, Medium [0.40, 0.70), Low < 0.40 — flagged as a first-cut implementation-time
  decision, not a calibrated one). `POST /system/batch-scoring` triggers one run on demand
  (authenticated, same as every other endpoint); `BATCH_SCORING_CADENCE_CRON` remains `TBD` — no
  scheduler is wired. See
  [`ML-PIPELINE-001-REVISION-001`](../../docs/generated/ml/ML-PIPELINE-001-REVISION-001-real-training-run.md)
  §§ 4-6 for the full record, including why this doesn't reopen CONS-004.
- **`Order.java`** gained `getOrderCountry()`/`getOrderState()` getters (the columns were
  already mapped; only the Phase 3 getters were missing) — needed by `BatchScoringService` to
  build the full feature vector.

**Not yet implemented:** a scheduled (cron-driven) batch run — `BATCH_SCORING_CADENCE_CRON` is
still `TBD` per `ARCH-CONSISTENCY-001` CONS-005; today's trigger is on-demand only
(`POST /system/batch-scoring`), a `DEV-001` operational concern for later.

**Build:** `docker build .` here, or `docker compose up --build` from `infra/docker/`. Tests use
an in-memory H2 database under a `test` Spring profile so the build doesn't require a live
PostgreSQL instance; runtime (via Docker Compose) always uses real PostgreSQL per `ADR-0003` —
H2 does not substitute for the step 2 proof, which still requires running against the actual
`postgres` container.

**Verified (2026-11-03):** the full test suite (`BackendApplicationTests`,
`MlCheckControllerTests`, `OrderApiIntegrationTests` — the last exercising the real auth gate,
login, `GET /orders`, `GET /orders/{orderId}`, and logout against H2) passed inside a Maven
container. Then, against a **fresh** real `postgres` volume with
`scripts/run_migration.sh` applied: `docker compose up --build` brought up all four containers;
Hibernate's `ddl-auto: validate` passed at startup (confirming every Phase 3 entity matches the
migrated schema exactly); `curl` confirmed `GET /orders` is `401` unauthenticated, `200` after
`POST /auth/sessions` with the seeded `analyst`/`analyst123` test credential, correctly
risk-sorted with the unscored order last; `GET /orders/{orderId}` and
`GET /orders/{orderId}/risk-assessments` returned the seeded detail/history data;
`DELETE /auth/sessions` returned `204` and the same cookie was rejected (`401`) afterward; and
`GET /api/ping`/`GET /actuator/health` were re-checked with no regression. See
`infra/docker/README.md` for the local `.env` setup this required.

**Phase 4 verified (2026-11-03), real inference end to end:** with real `model.joblib`/
`encoders.json` mounted into `ml-service` (`modelLoaded: true`) and `scripts/db/003_seed_phase4_real_categories.sql`
applied, `POST /system/batch-scoring` (authenticated) returned
`{"succeeded":true,"scoredCount":5,"skippedUnseenCategory":0,"skippedIncompleteData":0,"totalOrders":5}`
— all 5 seeded orders scored by the real model, zero skipped. `GET /orders` afterward showed
real `riskScore`/`riskBand` values (e.g. `0.734`/`High` for order 3) and `GET
/system/model-versions` returned the real `modelVersion` (`adaboost-v1-20261103`), not the
Phase 3 stub string. `GET /orders/{orderId}/risk-assessments` showed both the new real row and
the old stub row, confirming the append-only audit trail works across the stub→real transition.
Re-verified in the real browser (see `src/frontend/README.md`), including clicking the UI's
"Run Batch Scoring" button itself.

**Owns:** authentication/session handling (FR-034, NFR-WEB-001), serving the risk list/detail
contracts to the frontend, all persistent-store access, orchestrating the batch risk-scoring job
(FR-031), and enforcing the quasi-identifier display decision once a privacy reviewer makes it
(NFR-WEB-003) — per
[ADR-0002](../../docs/decisions/ADR-0002-backend-framework.md) (Java Spring Boot, Accepted) and
[ADR-0005](../../docs/decisions/ADR-0005-authentication-strategy.md) (session-based Spring
Security, Accepted).

**Must not own:** fitting/refitting ML encoders, training the model, or feature-selection
decisions — those belong to the offline training pipeline, outside this directory entirely.

**Talks to:** PostgreSQL (`infra/docker`'s database service) for persistence, and the ML
inference service (`src/ml-service`) over a network call for scoring — never serves the ML
inference service's role itself, per
[ADR-0004](../../docs/decisions/ADR-0004-ml-inference-architecture.md) (separate Python service,
Accepted).

See [docs/implementation/IMPLEMENTATION-PLAN-001.md](../../docs/implementation/IMPLEMENTATION-PLAN-001.md)
for the first concrete coding task assigned to this component.
