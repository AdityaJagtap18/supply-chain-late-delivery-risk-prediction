# Generated Artifacts — Architecture

Artifacts produced by the `03-system-architecture` prompt category. See
[prompt-library/03-system-architecture/](../../../prompt-library/03-system-architecture/) for
the prompts, and [prompt-library/README.md § Artifact metadata](../../../prompt-library/README.md#artifact-metadata)
for the required front-matter.

**Note:** this is for the **proposed** web-application architecture. The **existing** notebook
pipeline's architecture is already documented and is *not* duplicated here — see
[docs/architecture/pipeline-architecture.md](../../architecture/pipeline-architecture.md) and
[docs/PRD.md § 15](../../PRD.md#15-system-architecture).

**Naming convention:** `ARCH-DESIGN-NNN-*.md` (from `ARCH-001`), `ARCH-TRADEOFF-NNN-*.md` (from
`ARCH-002`), `ARCH-CONSISTENCY-NNN-*.md`/`ARCH-BLOCKERS-NNN-*.md` (from `ARCH-003`),
`ARCH-FINALIZATION-NNN-*.md` (from `ARCH-005`).

## Current artifacts

| Artifact ID | Title | Source prompt | Status | File |
|---|---|---|---|---|
| ARCH-DESIGN-001 | High-Level Architecture | ARCH-001 | Approved | [ARCH-DESIGN-001-high-level-architecture.md](ARCH-DESIGN-001-high-level-architecture.md) |
| ARCH-DESIGN-002 | Finalized Architecture — Component Design with Accepted Technology Choices | ad-hoc (chat request) | Draft | [ARCH-DESIGN-002-finalized-architecture.md](ARCH-DESIGN-002-finalized-architecture.md) |
| ARCH-TRADEOFF-001 | Stack Evaluation | ARCH-002 | Draft | [ARCH-TRADEOFF-001-stack-evaluation.md](ARCH-TRADEOFF-001-stack-evaluation.md) |
| ARCH-CONSISTENCY-001 | Cross-Artifact Architecture Consistency Review | ARCH-003 | Draft | [ARCH-CONSISTENCY-001.md](ARCH-CONSISTENCY-001.md) |
| ARCH-BLOCKERS-001 | Critical Implementation Blockers | ARCH-003 | Draft | [ARCH-BLOCKERS-001.md](ARCH-BLOCKERS-001.md) |
| ARCH-DECISIONS-001 | Architecture Decision Summary & Implementation Gate | ARCH-004 | Draft | [ARCH-DECISIONS-001-summary.md](ARCH-DECISIONS-001-summary.md) |
| ARCH-FINALIZATION-001 | Final ADR Acceptance & Schema Revision — Finalization Register | ARCH-005 | Draft | [ARCH-FINALIZATION-001.md](ARCH-FINALIZATION-001.md) |

`ARCH-DESIGN-001` is mirrored into [docs/TECHNICAL_DESIGN.md](../../TECHNICAL_DESIGN.md), per
that file's own instructions. `ARCH-TRADEOFF-001` fed the seven ADR drafts — see
[docs/decisions/](../../decisions/README.md); all seven are now `status: Accepted` (`ARCH-005`,
2026-11-03), recorded in the dependency order the project owner specified.
`ARCH-CONSISTENCY-001`/`ARCH-BLOCKERS-001` (from `ARCH-003`) found one Critical governance
blocker (zero ADRs existed) and one Critical data-model blocker (a feature required by the ML
pipeline that was dropped from the database schema); **both are now closed (2026-11-03)** —
the governance blocker by `ARCH-005`'s ADR acceptance, the data-model blocker by `IMPL-001`
recording the project owner's approval of
[DB-ARCH-REVISION-001-type-feature.md](../database/DB-ARCH-REVISION-001-type-feature.md), now
`Approved`. Both closures are noted directly in `ARCH-BLOCKERS-001.md`. See
[ARCH-FINALIZATION-001.md](ARCH-FINALIZATION-001.md) for the ADR acceptance register and
[IMPLEMENTATION-READINESS-001.md](../../implementation/IMPLEMENTATION-READINESS-001.md) for the
Stage 5 entry-gate verification. See
[ARCH-DESIGN-002-finalized-architecture.md](ARCH-DESIGN-002-finalized-architecture.md) for
`ARCH-DESIGN-001`'s component design re-expressed with the now-`Accepted` technology choices
filled in — a derived convenience document, not a new review; `ARCH-DESIGN-001` remains the
`Approved` source of truth for the component boundaries themselves.
