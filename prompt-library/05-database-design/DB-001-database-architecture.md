---
Prompt ID: DB-001
Prompt title: Database Architecture & Schema Design
Version: "1.0"
Category: 05-database-design
Status: Draft
---

## Objective

Produce a logical and physical database schema (with ER diagram) for the web application —
covering order/customer/shipment entities, stored risk-score history, and whatever
operational data the backend needs (users, if auth is in MVP scope) — grounded in the actual
flat-file schema already documented in `docs/PRD.md § 12.1`, properly normalized rather than
carried over as one denormalized table.

## Required role/persona

Database Architect.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), especially § 3 item 8 (dataset
provenance) — the schema design must not assume the full raw dataset's exact row-level content
is known, since it isn't in this repo.

## Prerequisites

`ARCH-001` and `PRD-001` approved.

## Input files and repository paths to inspect

- `docs/PRD.md § 12.1` (the existing flat-schema documentation — 32-column `final_sample.csv`
  schema, and the ER diagram already drawn there as a single denormalized entity)
- `df_last.csv` header (the actual leakage-cleaned, feature-selected modeling schema, if present
  in the repo after the notebook fix)
- `docs/generated/architecture/ARCH-DESIGN-001-high-level-architecture.md`

## Detailed execution instructions

1. Start from `docs/PRD.md § 12.1`'s single-entity flat schema and **normalize** it: identify
   genuine entities (Customer, Order, Order Line/Item, Product, Shipment, and — new for the web
   app — Risk Assessment/Prediction, and User/Account if auth is in MVP scope per `PRD-001`).
   Do not just re-draw the flat schema as "the database schema" — that would just be the CSV
   with extra steps, and the PRD's own GAP-002 already flagged the input data as a messy
   intermediate artifact, not a clean source schema.
2. Design a `risk_assessment` (or equivalent) table that records: which order it's for, the
   model's output (score and/or class), **which model version produced it** (this directly
   supports the model-storage/versioning decision backlogged in
   `docs/decisions/README.md` as ADR-0007 — don't silently omit a model-version foreign key),
   and a timestamp. This is what makes risk scores auditable rather than ephemeral.
2a. Decide and document whether raw feature values used for a given prediction are also stored
    (needed for later model-debugging/drift analysis) or deliberately not stored (e.g., for data
    minimization) — state the trade-off, don't silently pick one.
3. Produce a Mermaid ER diagram, in the same `erDiagram` style as `docs/PRD.md § 12.1`'s existing
   one, showing the normalized entities and their relationships (1:N, N:N as applicable), plus a
   short note under each entity on which fields carry the privacy/quasi-identifier concern
   flagged in `docs/PRD.md § 17` (`Customer Id`, zip code, lat/long) and how this schema handles
   it (e.g., a separate `customer_pii` table with restricted access, vs. a flag field).
4. Add migration-readiness notes: what indices are needed for the MVP's primary query pattern
   (likely "fetch risk assessment(s) for order X" and/or "list high-risk orders"), and whether
   any field needs a uniqueness/foreign-key constraint not implied by the flat CSV (e.g., is
   `Customer Id` actually unique per customer in the source data, or could it collide across
   markets — flag as unconfirmed if the CSV alone can't prove it).

## Technical constraints

- Must not name a specific RDBMS product as a requirement (PostgreSQL vs. MySQL is
  `ARCH-002`/ADR-0003's decision) — write the schema in a product-neutral form (standard SQL
  types/constraints), noting only where behavior would differ between the two candidates if
  relevant (e.g., JSON column support, case-sensitivity defaults).
- Must preserve traceability to the original flat schema — every normalized column must be
  traceable back to a `docs/PRD.md § 12.1` source column or explicitly marked "new, for the web
  application" (e.g., model version, timestamps, user accounts).

## Expected outputs and deliverables

Logical schema (entities + attributes + relationships), ER diagram, migration-readiness notes,
and a traceability table mapping old flat columns → new normalized columns/tables.

## Output storage location

`docs/generated/database/DB-ARCH-001-schema-design.md`

## Validation requirements

- Every column in the existing `docs/PRD.md § 12.1` schema is accounted for in the traceability
  table (either mapped or explicitly dropped with a stated reason).
- The risk-assessment entity includes a model-version reference.
- No RDBMS-specific syntax/feature is required by the design (or, where used for illustration,
  it's marked as illustrative, not required).

## Definition of Done

Artifact `status: Draft`; reviewed by a human data architect; `Approved` status unlocks
`BE-001`. This artifact is also the primary input to ADR-0003 (database product choice) once
combined with `ARCH-002`'s comparison.

## Failure handling and clarification requirements

If it's unclear from the available CSVs whether a field is truly a candidate key (e.g.,
`Customer Id` uniqueness across the full population, not just the 50k-row sample), state this as
an unconfirmed assumption rather than asserting a constraint that might not hold on the full
dataset.

## Dependencies on other prompts

`ARCH-001`, `PRD-001`.
