-- 001_init_schema.sql
--
-- Applies docs/generated/database/DB-ARCH-001-schema-design.md (Approved) combined with
-- docs/generated/database/DB-ARCH-REVISION-001-type-feature.md (Approved) as one migration,
-- per IMPLEMENTATION-READINESS-001.md's "Database migration strategy" (there being no live
-- production data to migrate around yet -- DB-ARCH-REVISION-001 S5). This creates the eight
-- entities from DB-ARCH-001 S2 for a fresh database; `order.payment_type` is included directly
-- (not added in a second migration) because no `order` rows exist to backfill.
--
-- Written in PostgreSQL syntax per ADR-0003 (Accepted). Column names, types, nullability and
-- PK/FK relationships below are copied verbatim from the two source documents; nothing here
-- invents a column, constraint, or default beyond what those documents already specify.

BEGIN;

-- S2.1 customer -- core, non-sensitive attributes only.
-- customer_id is NOT a surrogate key: it is the source `Customer Id`, per DB-ARCH-001 S5 item 1
-- (an unconfirmed-but-accepted assumption that it is unique across the full population).
CREATE TABLE customer (
    customer_id     INTEGER PRIMARY KEY,
    customer_segment VARCHAR
);

-- S2.2 customer_location -- isolated for the quasi-identifier concern (DB-ARCH-001 S2.2).
-- latitude/longitude are documented as access-restricted; the row-level grant/policy enforcing
-- that is noted there as illustrative/pending ADR-0003 detail and is intentionally not invented
-- here -- out of this migration's scope.
CREATE TABLE customer_location (
    customer_id      INTEGER PRIMARY KEY REFERENCES customer (customer_id),
    customer_city    VARCHAR,
    customer_state   VARCHAR,
    customer_zipcode VARCHAR,
    customer_country VARCHAR,
    latitude         DECIMAL,
    longitude        DECIMAL
);

-- S2.4 product.
CREATE TABLE product (
    product_id          INTEGER PRIMARY KEY,
    product_category_id INTEGER,
    product_name        VARCHAR,
    product_price        DECIMAL
);

-- S2.3 order -- order_id/placed_at are new surrogate columns (DB-ARCH-001 S2.3); payment_type is
-- the DB-ARCH-REVISION-001 addition (S4.1 there), included here directly per this file's header
-- note.
CREATE TABLE "order" (
    order_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id   INTEGER REFERENCES customer (customer_id),
    order_city    VARCHAR,
    order_country VARCHAR,
    order_region  VARCHAR,
    order_state   VARCHAR,
    market        VARCHAR,
    order_status  VARCHAR,
    placed_at     TIMESTAMP,
    payment_type  VARCHAR NOT NULL
);

-- S2.5 order_item -- order_item_id is a new surrogate column.
CREATE TABLE order_item (
    order_item_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id          BIGINT REFERENCES "order" (order_id),
    product_id        INTEGER REFERENCES product (product_id),
    discount          DECIMAL,
    discount_rate     DECIMAL,
    item_product_price DECIMAL,
    profit_ratio      DECIMAL,
    quantity          INTEGER,
    sales             DECIMAL,
    item_total        DECIMAL,
    profit_per_order  DECIMAL
);

-- S2.6 shipment -- modeled 1:1 with order for MVP (DB-ARCH-001 S5 item 3, unconfirmed assumption,
-- accepted as-is). actual_days/delivery_status/actual_late_delivery are nullable and populated
-- only post-hoc; this migration does not populate them.
CREATE TABLE shipment (
    order_id             BIGINT PRIMARY KEY REFERENCES "order" (order_id),
    shipping_mode        VARCHAR,
    scheduled_days       INTEGER,
    actual_days          INTEGER,
    delivery_status      VARCHAR,
    actual_late_delivery BOOLEAN
);

-- S2.7 risk_assessment -- the new auditability entity; order_id is not unique (one row per
-- scoring cycle, FR-031). model_version and scored_at are NOT NULL per DB-ARCH-001 S2.7.
CREATE TABLE risk_assessment (
    risk_assessment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id           BIGINT REFERENCES "order" (order_id),
    model_version       VARCHAR NOT NULL,
    risk_score          DECIMAL,
    risk_band            VARCHAR,
    scored_at            TIMESTAMP NOT NULL,
    feature_snapshot     JSONB
);

-- DB-ARCH-001 S4 "Migration-readiness notes" -- the two stated query patterns.
CREATE INDEX idx_risk_assessment_order_scored ON risk_assessment (order_id, scored_at DESC);
CREATE INDEX idx_risk_assessment_score_scored ON risk_assessment (risk_score DESC, scored_at DESC);

-- S2.8 app_user -- supports FR-034's minimal single-role authentication only; no roles table,
-- per NFR-WEB-004. Deliberately has no FK to any other entity (DB-ARCH-001 S3 note).
CREATE TABLE app_user (
    user_id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username             VARCHAR UNIQUE,
    credential_reference VARCHAR,
    created_at           TIMESTAMP,
    last_login_at        TIMESTAMP
);

COMMIT;
