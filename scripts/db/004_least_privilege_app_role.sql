-- 004_least_privilege_app_role.sql
--
-- SEC-THREATMODEL-001 REQ-AUTHZ-002: "the backend's own database credentials/service account
-- must follow least-privilege (no broader access than DB-ARCH-001's schema actually requires)."
--
-- This creates a restricted role with exactly the privileges the backend application needs
-- (CRUD on the eight DB-ARCH-001 tables + the Phase 1 ping_record proof table; no DDL, no
-- superuser, no access to any future table added outside this migration) and documents it --
-- it is NOT switched into `infra/docker/.env`'s local-dev default. Local dev deliberately keeps
-- using the single POSTGRES_USER superuser-equivalent role docker's official postgres image
-- creates, because introducing a second credential set for local iteration would add friction
-- with no corresponding risk reduction at that stage (there is no real data, no other tenant,
-- and the only "attacker" is the developer's own machine). This script is the deployment-time
-- artifact DEV-STRATEGY-001 S5.1 ("Backend... run database migrations") should apply in staging/
-- production, where the risk this control addresses is real.
--
-- Usage (staging/production only): run this once after 001_init_schema.sql, then point the
-- backend's POSTGRES_USER/POSTGRES_PASSWORD at `supplychain_app` instead of the migration-owning
-- role. This migration intentionally does not change the role the backend container uses in
-- infra/docker/.env -- doing so would require a password management decision (ADR-0003 does not
-- specify one) this script is not authorized to make silently.

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supplychain_app') THEN
        CREATE ROLE supplychain_app LOGIN PASSWORD 'changeme_local_only';
    END IF;
END
$$;

-- No DDL privileges at all -- this role only ever reads/writes rows, never alters the schema.
GRANT CONNECT ON DATABASE supplychain_dev TO supplychain_app;
GRANT USAGE ON SCHEMA public TO supplychain_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    customer,
    customer_location,
    product,
    "order",
    order_item,
    shipment,
    risk_assessment,
    app_user,
    ping_record
TO supplychain_app;

-- Sequences backing the GENERATED ALWAYS AS IDENTITY columns need USAGE for INSERT to work.
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO supplychain_app;

-- A future table this role was never granted on should fail loudly, not silently inherit access
-- -- no ALTER DEFAULT PRIVILEGES grant is made here on purpose.

COMMIT;
