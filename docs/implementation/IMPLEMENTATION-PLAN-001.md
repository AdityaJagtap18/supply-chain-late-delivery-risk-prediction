---
artifact_id: IMPLEMENTATION-PLAN-001
title: Stage 5 Implementation Plan — First Milestone and Phase Sequencing
source_prompt: IMPL-001
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005, ADR-0006, ADR-0007]
---

# Stage 5 Implementation Plan — First Milestone and Phase Sequencing

Produced by executing `IMPL-001`. This plan defines **only** the first milestone (proving the
four components can communicate) and the phase sequence after it; it does not build the
dashboard, the batch scheduler, or any feature beyond that milestone — per `IMPL-001`'s own
scope boundary.

## 1. First implementation milestone — component communication proof

**Goal:** prove the four main components can talk to each other, end to end, with a real
(not fabricated) prediction if model artifacts are available.

**Target flow (in order):**

1. The Angular frontend can reach the Spring Boot backend (a trivial authenticated request
   round-trips).
2. The Spring Boot backend can connect to PostgreSQL (a trivial read/write round-trips).
3. The Spring Boot backend can call the separate Python inference service over the network.
4. The Python service can load the existing model and encoder artifacts from the mounted path.
5. The inference service accepts a request matching the exact nine-feature contract
   (`ML-INFERENCE-001` § 1) — and rejects one that doesn't, rather than silently coercing it.
6. A prediction response returns from the inference service to the backend.
7. Each of the three application services exposes a basic health check.

**Explicit exclusions from this milestone:** the full risk list/detail dashboard UI, the batch
scheduler, any production cadence, and any invented API field. **If the model/encoder artifacts
referenced by `ML-PIPELINE-001` § 5 are not present on disk**, the milestone's definition of done
is adjusted to: the inference service starts, reports the missing artifacts clearly, and returns
an explicit "model unavailable" response rather than a fabricated score — the communication path
(steps 1–3, 6, 7) must still be demonstrated with that honest failure mode in step 4/5.

## 2. Ordered implementation phases

| Phase | Scope | Deliverables | Depends on |
|---|---|---|---|
| **0 — Workspace** | Already done by `IMPL-001` | `src/frontend/`, `src/backend/`, `src/ml-service/`, `infra/docker/`, `scripts/`, `tests/` directories with ownership `README.md`s; `.env.example` | All seven ADRs `Accepted`; `DB-ARCH-REVISION-001` `Approved` |
| **1 — Communication proof** | The milestone in § 1 above | Minimal Angular shell calling one backend endpoint; minimal Spring Boot app with one PostgreSQL-backed endpoint and one ML-service-calling endpoint; minimal Python service implementing the nine-feature contract; `infra/docker/docker-compose.yml` wiring all four; health checks on all three application services | Phase 0 |
| **2 — Database schema implementation** | Apply `DB-ARCH-001` + `DB-ARCH-REVISION-001` as an actual PostgreSQL schema via a `scripts/` migration | **Done (2026-11-03)** — [`scripts/db/001_init_schema.sql`](../../scripts/db/001_init_schema.sql); the `order` table includes `payment_type` | Phase 1 (needs a running PostgreSQL container to validate against) |
| **3 — Non-ML MVP flows** | Implement FR-032/FR-033's list/detail views and FR-034's auth flow against real (not stubbed) backend endpoints, with a stubbed risk score | **Done (2026-11-03)** — real session auth, risk queue, and order detail, verified end to end in a real browser against a real migrated+seeded database; then redesigned per UI-001-REVISION's enterprise dashboard direction (see `src/frontend/README.md`) | Phase 2; satisfies `IMPLEMENTATION_ROADMAP.md`'s Stage 5→6 gate |
| **4 — ML integration** | Replace the stubbed risk score with the real inference call; implement `ML-001`'s leakage-free training pipeline if not already done | **Done (2026-11-03)** — [`scripts/ml/train_model.py`](../../scripts/ml/train_model.py) produced real `artifacts/model.joblib`/`encoders.json`; `ml-service` loads them for real; `BatchScoringService`/`POST /system/batch-scoring` call it and persist real `risk_assessment` rows; verified end to end in a real browser (real scores, real `modelVersion`, the "Run Batch Scoring" button itself). See [`ML-PIPELINE-001-REVISION-001`](../generated/ml/ML-PIPELINE-001-REVISION-001-real-training-run.md) | Phase 3; `IMPLEMENTATION_ROADMAP.md` Stage 6 |
| **5 — Validation and release** | `QA-001`'s full test suite, `SEC-001`'s requirements, `DEV-001`'s deployment runbook | **Done (2026-11-03)** — real security controls (input validation, audit logging, login/general rate limiting, least-privilege DB role) with passing tests; backend (20), ml-service (5), and new ml-pipeline (2) test suites all passing for real in Docker; frontend unit-test infrastructure built from scratch (10 passing specs); `DEV-STRATEGY-001` S5.3's health-check signals wired in (authenticated DB-readiness detail, batch `lastScoredAt`). See [`QA-STRATEGY-001-REVISION-001`](../generated/testing/QA-STRATEGY-001-REVISION-001-phase5-execution.md) for the full record, including what's honestly still open (E2E scenarios, coverage gate, migration-version health check) | Phase 4 |

**This plan defines Phase 0 (done) and Phase 1 (next) in detail. Phases 2–5 are sequenced but not
elaborated — elaborating them now would be planning past the single milestone `IMPL-001` scoped,
and each should be re-scoped against whatever Phase 1 actually reveals.**

## 3. Definition of Done — Phase 1 (the only phase authorized to start now)

- All 7 target-flow steps in § 1 are demonstrated, including the "model unavailable" honest
  failure mode if artifacts are absent.
- `infra/docker/docker-compose.yml` brings up all four containers with one command.
- A `tests/` integration test exercises steps 1–3 and 6 automatically (not just manually
  verified).
- No new API field, cloud provider, or production cadence was introduced beyond what
  `IMPLEMENTATION-READINESS-001.md` already inventories.
- `BATCH_SCORING_CADENCE_CRON` remains `TBD` — Phase 1 does not implement the batch scheduler.

## 4. Exact first coding task

**Done:** [`infra/docker/docker-compose.yml`](../../infra/docker/docker-compose.yml) now defines
the four services (frontend, backend, ml-service, postgres) with the ports and environment
variables `.env.example` already inventories. `postgres` can be brought up today; `backend`,
`ml-service`, and `frontend` reference their `src/` directories as build contexts, which have no
Dockerfile or application code yet — `docker compose build` will fail on those three until the
next task gives each one.

**Done, and actually verified (2026-11-03):** the minimal Spring Boot skeleton in
[`src/backend/`](../../src/backend/) (Spring Boot 3.3.4, Java 21) — a `POST`/`GET /api/ping`
endpoint and the `Dockerfile` the compose file's `backend.build.context` expects. Once Docker
Desktop's engine was reachable, `docker compose up --build postgres backend` was run for real:
`POST /api/ping` wrote a row to actual PostgreSQL, `GET /api/ping` read it back, and `GET
/actuator/health` returned `{"status":"UP"}`. Target-flow steps 2 and 7 are genuinely proven,
not just compiled. (One local wrinkle, not a code defect: port `5432` was already in use by
another PostgreSQL instance on the machine the verification ran on, so that run used
`POSTGRES_PORT=5433` in a local-only `.env` — see `infra/docker/README.md`'s setup note.)

**Done, and actually verified (2026-11-03):** the minimal Python ML inference service skeleton
in [`src/ml-service/`](../../src/ml-service/) (FastAPI, Python 3.12). `POST /score` implements
`ML-INFERENCE-001`'s exact nine-feature request/response contract, rejecting extra or missing
fields with `422` (step 5). `docker compose up --build postgres backend ml-service` was run for
real: `GET /health` returned `{"status":"UP","modelLoaded":false}` and `POST /score` returned
`503 {"error":"model_unavailable", ...}` — step 4's honest-failure path, genuinely exercised,
since no `ML-001` training run has produced real model/encoder artifacts in this repository yet.
The artifact-present path (steps 4–6) was proven separately with a synthetic test fixture, not
a real trained model — see `src/ml-service/README.md`.

**Done, and actually verified (2026-11-03):** `src/backend` now has `GET /api/ml-check`
(`com.supplychain.backend.mlcheck`), a diagnostic endpoint that calls `ml-service`'s `POST
/score` with one hardcoded sample order and passes through whatever comes back — success, a
non-2xx from `ml-service`, or an explicit "unreachable" if the network call itself fails. All
three containers (`postgres`, `backend`, `ml-service`) were brought up together via
`docker compose up --build`, and `GET http://localhost:8080/api/ml-check` genuinely reached the
real `ml-service` container and returned `{"backendReachedMlService":true,"mlServiceStatus":
503,"mlServiceBody":"...model_unavailable..."}` — step 3 proven for real, and step 6 is
demonstrated through this same path once a real model is loaded (not yet the case, since no
`ML-001` artifacts exist). `/api/ping` and `/actuator/health` were re-checked at the same time
with no regression.

**Done, and actually verified in a real browser (2026-11-03):** `src/frontend` now has a
minimal Angular 18 skeleton (`AppComponent`) with a "Check backend connectivity" button calling
`POST /api/ping`. Verified against the live `frontend` container at `http://localhost:4200` with
a real browser click (not curl) — the page displayed `"Backend reachable. Wrote PingRecord
id=4 at ..."`, a genuinely new PostgreSQL row.

Two real bugs were found and fixed in the process, not glossed over:
1. The initial build threw Angular's `NG0908` at runtime (missing `zone.js` polyfill) —
   `angular.json` was missing `polyfills: ["zone.js"]`. Fixed, rebuilt, confirmed clean.
2. The browser's first real click was blocked by **CORS** — the backend had no CORS policy for
   `http://localhost:4200`. Fixed by adding `WebConfig.java` to the backend (Phase 1 dev-only
   policy, explicitly flagged for revisiting once ADR-0005's real auth is implemented). Rebuilt
   and re-verified; the browser's own network log shows the earlier blocked attempts followed by
   clean `200`s after the fix.

### All seven target-flow steps — status

| Step | Description | Status |
|---|---|---|
| 1 | Frontend reaches backend | **Done** — real browser click, verified |
| 2 | Backend connects to PostgreSQL | **Done** — real read/write round-trip, verified |
| 3 | Backend calls the ML service | **Done** — real network call, verified |
| 4 | ML service loads model/encoders | **Done (honest-failure path)** — no real artifacts exist yet; verified the service reports this explicitly rather than fabricating |
| 5 | ML service accepts the exact nine-feature request | **Done** — verified by test (422 on extra/missing fields) |
| 6 | A prediction returns to the backend | **Demonstrated via the honest-failure path** — the backend correctly receives and passes through whatever the ML service returns (today, `model_unavailable`); a real prediction will flow through this same path once `ML-001` produces real artifacts |
| 7 | Health checks on each service | **Done** — `/actuator/health` and `/health` both verified |

**The Phase 1 communication-proof milestone (§ 1 of this document) is complete.**

## 5. Conditions for moving to the next phase

Phase 1 → Phase 2 only once every item in § 3's Definition of Done is met **and** a human has
reviewed the Phase 1 result — this plan does not authorize an automatic phase advance. Per
`IMPL-001`'s instruction to stop after its deliverables: **this plan's own execution ends here.**
Starting Phase 1's actual coding task is a separate, explicitly requested next step, not an
automatic continuation of this document.

**Phase 2 — done and verified (2026-11-03).** On explicit request, `scripts/db/001_init_schema.sql`
was written and run against a real `postgres` container via `scripts/run_migration.sh`. All eight
`DB-ARCH-001` § 2 entities were created; `\d "order"` confirmed `payment_type character varying
NOT NULL`, matching `DB-ARCH-REVISION-001` § 4.1 exactly; both `risk_assessment` indexes from
`DB-ARCH-001` § 4 are present. The backend's Phase 1 `ping_record` table and `/api/ping`/
`/actuator/health` endpoints were re-checked afterward with no regression. See
[`scripts/README.md`](../../scripts/README.md) for the full verification record. No application
code reads or writes these tables yet — that is Phase 3, not started.
