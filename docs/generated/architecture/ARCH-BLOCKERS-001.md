---
artifact_id: ARCH-BLOCKERS-001
title: Critical Implementation Blockers — 2026-11-03
source_prompt: ARCH-003
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Critical Implementation Blockers

Derived from [ARCH-CONSISTENCY-001.md](ARCH-CONSISTENCY-001.md)'s full finding register. This
document isolates the subset of findings that **block entry into implementation** (i.e., writing
code under `src/`) if left unresolved — as distinct from open items that are inconvenient but do
not themselves prevent a correct implementation. Ordered by blocking priority (what must be
resolved first).

## BLOCK-001 (Critical) — Zero ADRs exist; implementation may not begin in any area — **CLOSED 2026-11-03**

> **Closure note (`IMPL-001`, verified against current files, not re-asserted from memory):** all
> seven ADRs (`ADR-0001`–`ADR-0007`) are now `status: Accepted`, recorded by `ARCH-005` on
> 2026-11-03 in the dependency order the project owner specified. This blocker no longer applies;
> the description below is preserved as the historical record of why it existed.

**Blocks:** all implementation work, in every domain, by the project's own rule.

**Description:** `prompt-library/PROJECT_CONTEXT.md § 4` rule 9 states: *"Do not implement a
technology choice that has not been approved via an Accepted ADR."* `docs/decisions/README.md`
confirms, directly: *"No ADR has been created yet."* Repository listing confirms `docs/decisions/`
contains only `README.md` and `ADR-001-template.md` — zero of the seven backlog items
(ADR-0001–0007) have even been drafted, let alone accepted. `docs/IMPLEMENTATION_ROADMAP.md`'s
Stage 5 gate is explicit: `src/frontend/`, `src/backend/`, `src/ml-service/` "deliberately do not
exist in this repository" until the relevant ADRs are `Accepted` — confirmed true by repository
listing (no `src/` directory exists anywhere).

This is procedurally sound *today* (no premature implementation has occurred), but it is the
single blocking precondition for every other piece of design work in this repository converting
into actual code. `ARCH-TRADEOFF-001` already produced the trade-off analysis each ADR needs; the
remaining step is purely human: draft and accept.

**Why this blocks implementation specifically:** rule 9 is a bright line, not a guideline — any
agent or human picking up this project to start coding is required by the project's own stated
rules to stop here first.

**Affected documents:** `docs/decisions/README.md`; `docs/IMPLEMENTATION_ROADMAP.md` (Stage 3,
Stage 5); `prompt-library/PROJECT_CONTEXT.md § 4` rule 9; `docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md`
(the input every ADR would be drafted from).

**Recommended resolution:** a human reviewer drafts ADR-0001 through ADR-0007 (status:
`Proposed`) from `ARCH-TRADEOFF-001`'s seven recommendations, then explicitly accepts, rejects, or
amends each one, per `docs/decisions/README.md`'s own "How to create an ADR" procedure. At
minimum, ADR-0001 (frontend), ADR-0002 (backend), ADR-0003 (database), ADR-0004 (ML inference
architecture), and ADR-0005 (auth strategy) must be `Accepted` before Stage 5 (application
implementation) begins, per the roadmap's own gate; ADR-0006 (deployment) and ADR-0007 (model
storage) can follow slightly later but should not be left open indefinitely either.

**Human approval required:** Yes — by definition; an AI agent must never set an ADR's status to
`Accepted` itself (`docs/decisions/README.md` § "Status as of 2026-11-03").

---

## BLOCK-002 (Critical) — `Type` feature required by the ML pipeline is unavailable in the database schema — **CLOSED 2026-11-03**

> **Closure note (`IMPL-001`, verified against current files, not re-asserted from memory):**
> resolved via path (a) — `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md` now
> adds an `Approved`, `order`-level `payment_type` column. `DB-ARCH-001` itself remains
> `Approved` and unmodified; the revision artifact is the authoritative superseding change. This
> blocker no longer applies; the description below is preserved as the historical record of why
> it existed.

**Blocks:** `FR-031` (batch risk-scoring job) specifically; by extension, `FR-032`/`FR-033`
(the risk list/detail views), since neither has any risk score to display without `FR-031`
succeeding.

**Description:** See [ARCH-CONSISTENCY-001.md § CONS-001](ARCH-CONSISTENCY-001.md#cons-001-critical--type-feature-required-by-ml-but-dropped-from-the-database-schema)
for full evidence. In summary: `ML-PIPELINE-001` § 1 and `ML-INFERENCE-001` § 1 (both Approved)
require a `type` (payment-type) value as one of exactly nine input features for every
batch-scoring request. `DB-ARCH-001` § 6 (also Approved, produced earlier in the dependency
chain, before `ML-001`/`ML-002` ran) explicitly drops the source `Type` column from the schema
entirely, reasoning — at the time, before `ML-001` ran — that it was "not an ML feature of
interest." That reasoning is now contradicted by `ML-001`'s own measured result. No entity in the
current schema stores this value, so the backend's repository layer has no column to read it
from when assembling a batch-scoring request.

**Why this blocks implementation specifically:** a backend built exactly to `BE-ARCH-001`'s and
`DB-ARCH-001`'s current specifications would compile/run but could never produce a correct
`features.type` value for any order — there is no source of truth for it anywhere in the
database. This is not a style or completeness gap; it is a hard data-availability break between
two Approved artifacts that must be fixed before `FR-031` can be built correctly, not discovered
during implementation.

**Affected documents:** `docs/generated/database/DB-ARCH-001-schema-design.md` § 2.3/§ 6;
`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md` § 1;
`docs/generated/ml/ML-INFERENCE-001-service-contract.md` § 1.

**Recommended resolution (either path, not decided here):**
- **(a)** Revise `DB-ARCH-001` to add a column preserving payment type (most naturally on
  `order` or `order_item`, mirroring where other order-level attributes already live), and
  re-approve the revised schema; or
- **(b)** Revise `ML-001`'s training design to exclude `Type` from the feature set, re-run the
  § 4 metric comparison without it (since removing a retained, non-trivial feature could change
  which model leads), and re-approve `ML-PIPELINE-001`/`ML-INFERENCE-001` with the corrected
  feature list and metrics.

Path (a) is likely the lower-cost fix (a one-column schema addition, no re-training required),
but that judgment is this review's observation, not a decision — the choice affects an already
-Approved ML artifact's validity either way and must be made by whoever owns that artifact's
review.

**Human approval required:** Yes — either path modifies the content of an already-`Approved`
artifact, which `PROJECT_CONTEXT.md § 4` rule 7 requires be done as an explicit, documented
change with a new version, never a silent edit.

---

## Non-blocking open items (tracked, not blockers)

The following findings from `ARCH-CONSISTENCY-001.md` are real and should be resolved, but do
**not** themselves prevent correct implementation of the MVP's currently-specified scope — they
are either already self-consistently flagged as open everywhere they appear, or affect
completeness/governance rather than functional correctness:

- **CONS-003** — stale narrative in `docs/decisions/README.md` (cosmetic; does not affect any
  decision's validity).
- **CONS-004** — the `NFR-WEB-003`/`BE-ARCH-001` display-scope gap (the current contract is
  already the more conservative, safer option; nothing is broken by implementing it as specified
  today).
- **CONS-005** — the batch-trigger endpoint's existence/authorization and the batch-scoring
  cadence (both can be implemented against *a* reasonable default — e.g., scheduler-only
  triggering, a placeholder cadence — and revised later without a structural rework, provided
  whoever implements `DEV-STRATEGY-001` § 4 does not silently invent a cadence value that gets
  presented as decided).
- **CONS-006** — the missing manual-refresh UI affordance (a usability gap, not a correctness
  one).
- **CONS-007** — the "customer-identity/history context" interpretive gap (does not prevent
  Screen 2 from being built to `BE-ARCH-001`'s actual, specified contract).

These remain tracked in [ARCH-CONSISTENCY-001.md](ARCH-CONSISTENCY-001.md) and should be worked
through the normal artifact-revision process, but they do not need to be resolved before
`BLOCK-001` and `BLOCK-002` above are.
