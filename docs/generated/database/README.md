# Generated Artifacts — Database

Artifacts produced by the `05-database-design` prompt category. See
[prompt-library/05-database-design/](../../../prompt-library/05-database-design/) and
[prompt-library/README.md § Artifact metadata](../../../prompt-library/README.md#artifact-metadata).

**Naming convention:** `DB-ARCH-NNN-*.md`, `DB-ARCH-REVISION-NNN-*.md` (a proposed revision to an
Approved schema, from a later prompt).

## Current artifacts

| Artifact ID | Title | Source prompt | Status | File |
|---|---|---|---|---|
| DB-ARCH-001 | Schema Design — MVP | DB-001 | Approved | [DB-ARCH-001-schema-design.md](DB-ARCH-001-schema-design.md) |
| DB-ARCH-REVISION-001 | Database Schema Revision — Add `payment_type` (ML `Type` Feature) to the Order Entity | ARCH-004, ARCH-005, IMPL-001 | **Approved** | [DB-ARCH-REVISION-001-type-feature.md](DB-ARCH-REVISION-001-type-feature.md) |

`DB-ARCH-REVISION-001` was first produced by `ARCH-004` as a proposal evaluating Option A vs.
Option B; the project owner selected Option A on 2026-11-03, `ARCH-005` rewrote this artifact
into the actual revised schema (a concrete `payment_type` column on `order`) applying that
choice, and on 2026-11-03 the project owner approved all five items of that schema's § 7 review
checklist — `IMPL-001` recorded that approval, changing this artifact's status to `Approved`.
**`DB-ARCH-001` remains `Approved` and unmodified** — this is a separate, traceable revision
artifact, not an in-place edit; it is now the **authoritative superseding change** for the
`order` entity's `payment_type` attribute, per its own § 4.3 traceability-table update.
Reconciling the two files into one canonical schema document remains a separate, open editorial
decision — see
[IMPLEMENTATION-READINESS-001.md](../../implementation/IMPLEMENTATION-READINESS-001.md). See
[ARCH-BLOCKERS-001.md](../architecture/ARCH-BLOCKERS-001.md) for why this revision exists and
[ARCH-FINALIZATION-001.md](../architecture/ARCH-FINALIZATION-001.md) for its place in the overall
finalization.
