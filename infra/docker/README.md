# `infra/docker` — local container orchestration

**Status:** [`docker-compose.yml`](docker-compose.yml) wires all four services together (the
Phase 1 "exact first coding task" from `IMPLEMENTATION-PLAN-001.md` § 4). **`postgres` and
`backend` were actually brought up together and verified on 2026-11-03** — `docker compose up
--build postgres backend` succeeded, `POST /api/ping` wrote a row to real PostgreSQL, `GET
/api/ping` read it back, and `GET /actuator/health` returned `{"status":"UP"}`. `ml-service` and
`frontend` still reference `../../src/ml-service` and `../../src/frontend` as build contexts,
which have no Dockerfile or application code yet — `docker compose build` will fail on those
two until each gets one.

**Setup:** copy the repository root's `.env.example` to a file named `.env` **in this
directory** (`infra/docker/.env`), not the repository root — Compose reads `.env` relative to
the compose file's own directory. If port `5432` is already used locally, change
`POSTGRES_PORT` in your own `infra/docker/.env` (e.g. to `5433`); nothing else needs to change,
since `backend` reaches `postgres` by its Docker service name on the container-internal port.

**Owns:** local development orchestration for the four always-on components (frontend, backend,
PostgreSQL, ML inference service), per
[ADR-0006](../../docs/decisions/ADR-0006-deployment-architecture.md) (containerized deployment
for app components, Accepted).

**Does not decide:** a production cloud provider or orchestrator — `ADR-0006` explicitly leaves
that open, and this directory's local-development compose setup must not be read as a
production deployment recommendation.

See [docs/implementation/IMPLEMENTATION-READINESS-001.md](../../docs/implementation/IMPLEMENTATION-READINESS-001.md)
§ "Container communication plan" for the planned service topology, and
[docs/implementation/IMPLEMENTATION-PLAN-001.md](../../docs/implementation/IMPLEMENTATION-PLAN-001.md)
for when this directory's first files are created.
