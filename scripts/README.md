# `scripts` — database initialization and development utilities

**Status:** Phase 2 migration built and verified against a real PostgreSQL container
(2026-11-03).

**Owns:** one-off and repeatable developer-convenience scripts — database schema
initialization/migration (applying `DB-ARCH-001` plus the `Approved`
[`DB-ARCH-REVISION-001`](../docs/generated/database/DB-ARCH-REVISION-001-type-feature.md)
`payment_type` addition), seed-data loading, and local environment setup helpers.

**Does not own:** application runtime logic — anything here is a development/operations aid,
never imported by `src/frontend`, `src/backend`, or `src/ml-service` at runtime.

**Contents:**
- [`db/000_ping_table.sql`](db/000_ping_table.sql) — the Phase 1 `ping_record` connectivity-proof
  table (not part of `DB-ARCH-001`), moved here once `src/backend`'s `hibernate.ddl-auto` was
  tightened from `update` to `validate` in Phase 3.
- [`db/001_init_schema.sql`](db/001_init_schema.sql) — creates all eight `DB-ARCH-001` § 2
  entities (`customer`, `customer_location`, `order`, `product`, `order_item`, `shipment`,
  `risk_assessment`, `app_user`) in one migration, with `order.payment_type` included directly
  per `DB-ARCH-REVISION-001`. Written in PostgreSQL syntax per ADR-0003. Column names, types,
  nullability, and the two `risk_assessment` indexes from `DB-ARCH-001` § 4's migration-readiness
  notes are copied verbatim from the source documents.
- [`db/002_seed_phase3.sql`](db/002_seed_phase3.sql) — Phase 3 seed data: one `app_user` row
  (dev-only test login `analyst`/`analyst123`), a handful of `customer`/`order`/`shipment` rows,
  and seeded `risk_assessment` rows (`model_version: "stub-seed-data-phase3"`, never a real
  `ML-001` output) so `GET /orders`/`GET /orders/{orderId}` have real data to serve.
- [`db/003_seed_phase4_real_categories.sql`](db/003_seed_phase4_real_categories.sql) — Phase 4:
  adds `customer_location` rows for the three Phase 3 seed customers (never populated before,
  needed internally by `BatchScoringService` to build ML feature vectors) and corrects the five
  seeded orders' illustrative location fields to real category values from `final_sample.csv`,
  so they are scorable by the real trained model rather than always "unseen category". See
  [`ML-PIPELINE-001-REVISION-001`](../docs/generated/ml/ML-PIPELINE-001-REVISION-001-real-training-run.md)
  § 6.
- [`run_migration.sh`](run_migration.sh) — applies every `db/*.sql` file, in order, to the
  running `postgres` compose service via `docker compose exec ... psql`.
- [`db/generate_bulk_seed.py`](db/generate_bulk_seed.py) /
  [`db/005_seed_bulk_real_orders.sql`](db/005_seed_bulk_real_orders.sql) — a larger, more
  realistic demo dataset (300 additional orders, seed 42) sampled directly from real
  `final_sample.csv` rows — the same file `ML-001`'s training pipeline reads — so the live
  dashboard shows a real-looking queue instead of the 5 hand-written Phase 3/4 seed orders.
  Inserts no `risk_assessment` row itself; a real `POST /system/batch-scoring` run afterward is
  what produces every score shown (verified: 305/305 orders scored, 0 skipped). Usage: `pip
  install pandas && python db/generate_bulk_seed.py > db/005_seed_bulk_real_orders.sql`, then
  apply it like any other `db/*.sql` file.
- [`db/004_least_privilege_app_role.sql`](db/004_least_privilege_app_role.sql) — Phase 5:
  `SEC-THREATMODEL-001` REQ-AUTHZ-002's least-privilege DB role (`supplychain_app`, CRUD-only, no
  DDL). Deployment-time artifact for staging/production — not switched into local dev's
  `infra/docker/.env` (see the file's own header for why).
- [`ml/train_model.py`](ml/train_model.py) — Phase 4's real `ML-001` training pipeline, extended
  in Phase 5 with a `train_and_evaluate()` function separated from artifact-writing (so the new
  regression test below can re-run training without clobbering the committed artifacts) and a
  `categoryFrequencies` field in `encoders.json` (the training-distribution baseline
  `data_drift_check.py` compares live data against). A developer-run utility, same role as
  `db/*.sql`: produces `artifacts/model.joblib` + `artifacts/encoders.json` from
  `final_sample.csv`, never imported at runtime by any `src/*` service. See
  [`ML-PIPELINE-001-REVISION-001`](../docs/generated/ml/ML-PIPELINE-001-REVISION-001-real-training-run.md)
  for what it reproduces, the model-selection/risk-band-threshold decisions it makes, and a real
  encoding bug it was fixed to avoid. Usage: `pip install -r ml/requirements.txt && python
  ml/train_model.py`.
- [`ml/tests/test_training_regression.py`](ml/tests/test_training_regression.py) — Phase 5:
  `QA-STRATEGY-001` S4.1's training-pipeline regression test (±2pp recall/accuracy tolerance
  against the baseline already persisted in `artifacts/encoders.json`, in either direction — an
  unexplained upward jump fails too). Usage: `pip install -r ml/requirements-dev.txt && pytest
  ml/tests`.
- [`ml/data_drift_check.py`](ml/data_drift_check.py) — Phase 5: `QA-STRATEGY-001` S4.3's
  data-drift smoke test, now runnable since `BatchScoringService` (Phase 4) gives it real
  batch-scoring input data to compare against the training distribution. Not a CI gate with an
  approved tolerance — the module's own docstring flags its drift threshold as an illustrative
  placeholder. Usage: `pip install -r ml/requirements-drift.txt && python
  ml/data_drift_check.py [--threshold 0.15] [--fail-on-drift]`.

**Verified (2026-11-03):** `docker compose up -d postgres` (real container) → `run_migration.sh`
applied `001_init_schema.sql` with no errors. `\d "order"` on the live database confirmed
`payment_type` is `character varying NOT NULL`; `\d risk_assessment` confirmed both documented
indexes exist. The `src/backend` skeleton's Phase 1 `ping_record` table (created separately by
Hibernate's `ddl-auto: update`) coexists in the same database with no conflict, and
`/api/ping`/`/actuator/health` were re-checked afterward with no regression — this migration
does not touch the backend's own tables.

**Not yet done (out of this migration's scope, per `IMPLEMENTATION-PLAN-001.md` Phase 3):** no
application code reads from or writes to these eight tables yet. `src/backend`'s only persistence
today is the Phase 1 `ping_record` proof table; wiring real repositories against this schema is
Phase 3 (non-ML MVP flows), not this migration.

See [docs/implementation/IMPLEMENTATION-READINESS-001.md](../docs/implementation/IMPLEMENTATION-READINESS-001.md)
§ "Database migration strategy" for what this script was expected to do.
