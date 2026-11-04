-- 003_seed_phase4_real_categories.sql
--
-- Phase 4 (IMPLEMENTATION-PLAN-001.md: "replace the stubbed risk score with the real inference
-- call"). The Phase 3 seed data's order_city/order_country/order_region/order_state values
-- (scripts/db/002_seed_phase3.sql) were illustrative placeholders ("Chicago"/"USA"/"Midwest"),
-- never drawn from the dataset ML-001 actually trains on -- fine for Phase 3's stubbed-score
-- purpose, but every one of them is an "unseen category" to the real trained encoder
-- (artifacts/encoders.json), so BatchScoringService would honestly skip every seeded order
-- rather than fabricate a score for it (ML-INFERENCE-001 S3). This migration updates those five
-- orders' location fields to real category values copied verbatim from final_sample.csv rows
-- (ML-PIPELINE-001's own source data), and adds the `customer_location` rows Phase 3 never
-- populated (BatchScoringService needs `customerCity`/`customerZipcode` to build a feature
-- vector; see CustomerLocation.java's class comment on why this doesn't reopen CONS-004 --
-- these fields are still never exposed over any HTTP response).
--
-- This does not change order_status/payment_type/shipping_mode (already real category values —
-- see scripts/ml/train_model.py's DUMMY_FIELDS categories, which these already satisfy) or any
-- customer/order identity. It only corrects which real-world place each seeded order/customer is
-- attributed to, so Phase 4's end-to-end verification can show a genuine (not omitted) score.

BEGIN;

INSERT INTO customer_location (customer_id, customer_city, customer_state, customer_zipcode, customer_country) VALUES
    (1001, 'Taylor', 'MI', '48180.0', 'EE. UU.'),
    (1002, 'Caguas', 'PR', '725.0', 'Puerto Rico'),
    (1003, 'Brooklyn', 'NY', '11203.0', 'EE. UU.');

-- o1 (customer 1001, DEBIT/Standard Class) -- was 'Chicago'/'USA'/'Midwest'/'IL'.
UPDATE "order" SET order_city = 'Sorocaba', order_country = 'Brasil',
                   order_region = 'South America', order_state = 'São Paulo'
WHERE customer_id = 1001 AND order_city = 'Chicago';

-- o2 (customer 1002, TRANSFER/First Class) -- was 'Denver'/'USA'/'West'/'CO'.
UPDATE "order" SET order_city = 'Leicester', order_country = 'Reino Unido',
                   order_region = 'Northern Europe', order_state = 'Inglaterra'
WHERE customer_id = 1002 AND order_city = 'Denver';

-- o3 (customer 1003, PAYMENT/Second Class, deliberately left unscored) -- was 'Miami'/'USA'/'South'/'FL'.
UPDATE "order" SET order_city = 'Managua', order_country = 'Nicaragua',
                   order_region = 'Central America', order_state = 'Managua'
WHERE customer_id = 1003 AND order_city = 'Miami';

-- o4 (customer 1001, CASH/Standard Class) -- was 'Austin'/'USA'/'South'/'TX'.
-- Note the trailing space in 'West of USA ' is the literal category value in the source data
-- (and in the trained encoder's map) -- not a typo introduced here.
UPDATE "order" SET order_city = 'San Luis Obispo', order_country = 'Estados Unidos',
                   order_region = 'West of USA ', order_state = 'California'
WHERE customer_id = 1001 AND order_city = 'Austin';

-- o5 (customer 1002, DEBIT/Same Day) -- was 'Seattle'/'USA'/'West'/'WA'.
UPDATE "order" SET order_city = 'Kabul', order_country = 'Afganistán',
                   order_region = 'South Asia', order_state = 'Kabul'
WHERE customer_id = 1002 AND order_city = 'Seattle';

COMMIT;
