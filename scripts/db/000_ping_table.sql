-- 000_ping_table.sql
--
-- The Phase 1 connectivity-proof table backing src/backend's `PingRecord` entity
-- (IMPLEMENTATION-PLAN-001.md target-flow steps 2/7). Previously auto-created by Hibernate's
-- `ddl-auto: update`; moved here now that scripts/ owns schema creation and application.yml's
-- ddl-auto has been tightened to `validate` (the reconsideration that file's own comment flagged
-- as overdue "before Phase 2"). Not part of DB-ARCH-001 -- this table is Phase 1 scaffolding,
-- kept only because src/backend/.../ping still uses it; it is not a Phase 3 entity.

CREATE TABLE ping_record (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP
);
