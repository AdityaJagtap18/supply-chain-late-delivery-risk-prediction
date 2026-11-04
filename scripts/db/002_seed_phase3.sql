-- 002_seed_phase3.sql
--
-- Phase 3 seed data (IMPLEMENTATION-PLAN-001.md Phase 3: FR-032/FR-033 list/detail views and
-- FR-034 auth, "with a stubbed risk score"). Populates enough `customer`/`order`/`shipment`/
-- `risk_assessment` rows to exercise GET /orders, GET /orders/{orderId}, and
-- GET /orders/{orderId}/risk-assessments against real data, plus one `app_user` row so the
-- login flow (POST /auth/sessions) can be exercised end to end.
--
-- Every `risk_assessment.model_version` below is the literal string `stub-seed-data-phase3`,
-- never a real `ML-001` model identifier -- this data was never produced by the ML inference
-- service; Phase 4 is what replaces this with real scores (per
-- IMPLEMENTATION-PLAN-001.md S2's phase table).
--
-- Dev-only test login: username `analyst`, password `analyst123` (BCrypt-hashed below). Not a
-- production credential; this is a local/dev-database fixture only.

BEGIN;

INSERT INTO app_user (username, credential_reference, created_at) VALUES
    ('analyst', '$2b$12$EXOObK65P4KbreiXauwfGuVTFdzgSG9RpdT6NMmr27LclBc9RagT.', now());

INSERT INTO customer (customer_id, customer_segment) VALUES
    (1001, 'Consumer'),
    (1002, 'Corporate'),
    (1003, 'Home Office');

WITH o1 AS (
    INSERT INTO "order" (customer_id, order_city, order_country, order_region, order_state,
                          market, order_status, placed_at, payment_type)
    VALUES (1001, 'Chicago', 'USA', 'Midwest', 'IL', 'LATAM', 'PROCESSING',
            now() - interval '2 days', 'DEBIT')
    RETURNING order_id
),
o2 AS (
    INSERT INTO "order" (customer_id, order_city, order_country, order_region, order_state,
                          market, order_status, placed_at, payment_type)
    VALUES (1002, 'Denver', 'USA', 'West', 'CO', 'LATAM', 'PENDING_PAYMENT',
            now() - interval '1 day', 'TRANSFER')
    RETURNING order_id
),
o3 AS (
    INSERT INTO "order" (customer_id, order_city, order_country, order_region, order_state,
                          market, order_status, placed_at, payment_type)
    VALUES (1003, 'Miami', 'USA', 'South', 'FL', 'LATAM', 'PROCESSING',
            now() - interval '3 hours', 'PAYMENT')
    RETURNING order_id
),
o4 AS (
    INSERT INTO "order" (customer_id, order_city, order_country, order_region, order_state,
                          market, order_status, placed_at, payment_type)
    VALUES (1001, 'Austin', 'USA', 'South', 'TX', 'LATAM', 'PROCESSING',
            now() - interval '5 days', 'CASH')
    RETURNING order_id
),
o5 AS (
    INSERT INTO "order" (customer_id, order_city, order_country, order_region, order_state,
                          market, order_status, placed_at, payment_type)
    VALUES (1002, 'Seattle', 'USA', 'West', 'WA', 'LATAM', 'CLOSED',
            now() - interval '10 days', 'DEBIT')
    RETURNING order_id
),
s1 AS (
    INSERT INTO shipment (order_id, shipping_mode)
    SELECT order_id, 'Standard Class' FROM o1 RETURNING order_id
),
s2 AS (
    INSERT INTO shipment (order_id, shipping_mode)
    SELECT order_id, 'First Class' FROM o2 RETURNING order_id
),
s3 AS (
    INSERT INTO shipment (order_id, shipping_mode)
    SELECT order_id, 'Second Class' FROM o3 RETURNING order_id
),
s4 AS (
    INSERT INTO shipment (order_id, shipping_mode)
    SELECT order_id, 'Standard Class' FROM o4 RETURNING order_id
),
s5 AS (
    INSERT INTO shipment (order_id, shipping_mode)
    SELECT order_id, 'Same Day' FROM o5 RETURNING order_id
),
-- o3 is deliberately left unscored (no risk_assessment row) to exercise the "stale/unscored"
-- state BE-ARCH-001 S2.3 documents (scoredAt: null).
r1_older AS (
    INSERT INTO risk_assessment (order_id, model_version, risk_score, risk_band, scored_at)
    SELECT order_id, 'stub-seed-data-phase3', 0.61, 'Medium', now() - interval '1 day 1 hour'
    FROM o1 RETURNING order_id
),
r1_latest AS (
    INSERT INTO risk_assessment (order_id, model_version, risk_score, risk_band, scored_at)
    SELECT order_id, 'stub-seed-data-phase3', 0.82, 'High', now() - interval '1 hour'
    FROM o1 RETURNING order_id
),
r2 AS (
    INSERT INTO risk_assessment (order_id, model_version, risk_score, risk_band, scored_at)
    SELECT order_id, 'stub-seed-data-phase3', 0.45, 'Medium', now() - interval '2 hours'
    FROM o2 RETURNING order_id
),
r4 AS (
    INSERT INTO risk_assessment (order_id, model_version, risk_score, risk_band, scored_at)
    SELECT order_id, 'stub-seed-data-phase3', 0.12, 'Low', now() - interval '30 minutes'
    FROM o4 RETURNING order_id
),
r5 AS (
    INSERT INTO risk_assessment (order_id, model_version, risk_score, risk_band, scored_at)
    SELECT order_id, 'stub-seed-data-phase3', 0.91, 'High', now() - interval '1 day'
    FROM o5 RETURNING order_id
)
SELECT 1;

COMMIT;
