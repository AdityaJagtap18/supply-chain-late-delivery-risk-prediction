---
decision_id: ADR-0003
title: Database Selection
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/database/DB-ARCH-001-schema-design.md]
supersedes: null
superseded_by: null
---

# ADR-0003: Database Selection

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (PostgreSQL) on
> 2026-11-03, fifth in the dependency order `ARCH-005` specified. The project owner also
> explicitly confirmed: **no existing MySQL or Oracle hosting/licensing agreement overrides
> PostgreSQL** — the "blocking input gap" noted below is therefore resolved in favor of
> PostgreSQL, not left open. This ADR has no dependency on any other ADR, per
> `ARCH-TRADEOFF-001` § 3.

## Context and problem

`DB-ARCH-001` defines the persistent data store's schema (`customer`, `customer_location`,
`order`, `order_item`, `product`, `shipment`, `risk_assessment`, `app_user`) in product-neutral
standard-SQL types, deliberately naming no RDBMS product as a requirement. A concrete database
product must be chosen. The question: PostgreSQL or MySQL?

## Options considered

### Option 1: PostgreSQL
- Description: both stakeholder-stated candidates were evaluated; PostgreSQL offers native
  row-level security as a first-class feature.
- Pros: row-level security is a direct, concrete fit for enforcing `DB-ARCH-001` § 2.2's
  `customer_location` access restriction (the quasi-identifier isolation NFR-WEB-003 depends on)
  at the data layer, not only in application code; PostgreSQL License is permissive and free.
- Cons: none identified as a differentiator at this project's scale (tens of thousands of rows).
- Cost/effort to reverse later: high — a database migration between RDBMS products after data
  exists is a non-trivial operational undertaking; this is exactly the kind of decision an ADR
  exists to gate before implementation.

### Option 2: MySQL
- Description: the other stakeholder-stated candidate.
- Pros: very widely deployed, large hiring pool; GPL v2 community edition is free and sufficient
  for this project's scope.
- Cons: row-level security is less of a first-class, native feature than PostgreSQL's — a real
  but narrow disadvantage specific to this project's quasi-identifier isolation need.
- Cost/effort to reverse later: same as Option 1.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 3: team/ecosystem fit, operational complexity, licensing/cost,
performance at this project's scale, security posture (specifically, fit with
`DB-ARCH-001` § 2.2's access-restriction requirement), and ML-correctness-requirement fit
(`PROJECT_CONTEXT.md § 3` — not applicable; the database does not perform encoding or training).

## Selected decision

**Accepted: PostgreSQL.**

## Rationale

The two options are operationally comparable at this project's scale. PostgreSQL's native
row-level security is a real, criteria-based edge for enforcing the `customer_location` access
restriction `DB-ARCH-001` § 2.2 already designed around — not a restatement of either stated
preference, since both PostgreSQL and MySQL were stated preferences; this is what breaks the tie
between them, per `ARCH-TRADEOFF-001` § 3's stated reasoning.

## Consequences and trade-offs

- Enables implementing `DB-ARCH-001` § 2.2/§ 4's access-restriction recommendation as a
  database-level row-level-security policy rather than purely application-code enforcement.
- **Blocking input gap, carried forward from `ARCH-TRADEOFF-001` § 3, not resolved by this ADR:**
  if the business already has an existing enterprise licensing or managed-hosting agreement
  specific to MySQL/Oracle, that fact — known only to the business stakeholder — could override
  this recommendation. The human reviewer accepting or rejecting this ADR should confirm no such
  agreement exists before accepting PostgreSQL.
- Forecloses MySQL's larger raw hiring-pool advantage, judged not decisive at this project's
  scale.

## Related prompts

ARCH-002, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 3;
`docs/generated/database/DB-ARCH-001-schema-design.md` § 2.2, § 4.

## Superseded or related ADRs

None.
