# Architecture Decision Records (ADRs)

This directory holds Architecture Decision Records for the ShipGuard (repository:
`SupplyChainOptimization`) web application effort. An ADR captures a technical or product decision that would be **costly to
reverse** — not every design choice needs one; see
[prompt-library/PROMPT_STANDARDS.md § 7](../../prompt-library/PROMPT_STANDARDS.md#7-traceability-rules--when-an-adr-is-required-vs-not)
for the exact rule.

## Status as of 2026-11-03 (updated by `ARCH-005`)

**All seven anticipated ADRs are now `status: Accepted`.** `ARCH-002` (Architecture Trade-off
Evaluation) and the domain-specific architecture prompts (`DB-001`, `BE-001`, `FE-001`, `ML-002`,
`SEC-001`, `DEV-001`) were executed first, producing the trade-off analysis these ADRs formalize.
`ARCH-003` (a cross-artifact consistency review) then found that despite all of the above being
executed, zero ADRs had actually been drafted — a governance gap, not a technical one, since no
`src/` implementation had begun either. `ARCH-004` drafted the seven ADRs below from `ARCH-002`'s
trade-off analysis, each `status: Proposed`. **On 2026-11-03, the project owner explicitly
accepted all seven ADRs exactly as drafted; `ARCH-005` recorded that acceptance** in the
dependency order the project owner specified — ADR-0004 first (so its outcome was settled before
ADR-0002, which is contingent on it), then ADR-0002 (so its outcome was settled before ADR-0005,
which is contingent on it), then ADR-0005, ADR-0001, ADR-0003, ADR-0006, and ADR-0007 last. Each
ADR's own "Status" section records this with a dated human-approval note; ADR-0003 additionally
records the project owner's explicit confirmation that no existing MySQL/Oracle agreement
overrides PostgreSQL, and ADR-0005 records the explicit confirmation that no existing SSO/
identity-provider requirement overrides session-based Spring Security.

**Every ADR below now authorizes implementation work in its area**, per
`prompt-library/PROJECT_CONTEXT.md § 4` rule 9 — the human acceptance that rule requires has
occurred. `ARCH-005` did not evaluate, re-evaluate, or generate any new alternative; it recorded
decisions the project owner made outside this repository's AI-execution loop.

**Do not create an `Accepted` ADR for a decision that has not actually been made by a human
reviewer.** This rule remains in force for any *future* ADR — it describes how ADR-0001–0007
reached `Accepted` (a human decision, recorded by `ARCH-005` on explicit instruction, not
inferred or assumed by an AI agent), not an exception to it.

## Anticipated decisions backlog

These are the decision points named in the current project context (see
[prompt-library/PROJECT_CONTEXT.md § 1](../../prompt-library/PROJECT_CONTEXT.md#1-what-this-project-actually-is-today-verified-facts)).
**Every ADR is now `Accepted`, in the dependency order recorded below** (acceptance order left
to right, 1st through 7th) — each records the project owner's explicit decision on 2026-11-03.

| Order | ADR | Decision point | Accepted decision | Fed by |
|---|---|---|---|---|
| 1st | [ADR-0004](ADR-0004-ml-inference-architecture.md) | ML inference architecture | Separate Python inference service | `ARCH-002`, `ML-002` |
| 2nd | [ADR-0002](ADR-0002-backend-framework.md) | Backend framework | Java Spring Boot (ADR-0004 dependency verified satisfied) | `ARCH-002`, `BE-001` |
| 3rd | [ADR-0005](ADR-0005-authentication-strategy.md) | Authentication strategy | Session-based via Spring Security (ADR-0002 dependency verified satisfied; no SSO/IdP override confirmed) | `SEC-001`, `BE-001` |
| 4th | [ADR-0001](ADR-0001-frontend-framework.md) | Frontend framework | Angular | `ARCH-002`, `FE-001` |
| 5th | [ADR-0003](ADR-0003-database-selection.md) | Database | PostgreSQL (no MySQL/Oracle override confirmed) | `ARCH-002`, `DB-001` |
| 6th | [ADR-0006](ADR-0006-deployment-architecture.md) | Deployment architecture | Containerized app components; serverless evaluated for the batch job | `ARCH-002`, `DEV-001` |
| 7th | [ADR-0007](ADR-0007-model-storage-and-versioning.md) | Model storage and versioning | File-based for MVP (reconsideration trigger preserved) | `ML-001` |

This table links to real, accepted ADR files; the authoritative acceptance record is each ADR
file's own `status` field and "Status" section, not this table.

## How to create an ADR

1. Copy [ADR-001-template.md](ADR-001-template.md) to `ADR-NNNN-<kebab-case-title>.md`, using
   the next free number from the backlog table above (or a new number if it's not one of the
   anticipated ones).
2. Fill in every section. Do not leave "Options considered" with only one option — if there was
   truly only one option worth evaluating, say why alternatives were not seriously considered.
3. Set `status: Proposed`.
4. Link the ADR from the artifact(s) that fed it (`related_decisions:` in that artifact's
   metadata) and from this README's backlog table (update the "not yet created" note to a real
   link).
5. A human reviewer changes `status` to `Accepted` or `Rejected`. Only an `Accepted` ADR
   authorizes implementation work in that area (see
   [prompt-library/PROJECT_CONTEXT.md § 4, rule 9](../../prompt-library/PROJECT_CONTEXT.md#4-ai-agent-execution-rules)).
6. If a later decision replaces an earlier one, create a new ADR, set the old one's status to
   `Superseded`, and cross-link both (`superseded_by:` / `supersedes:`).

## Traceability

```text
Prompt → AI Execution → Generated Artifact → Human Review → Approved Artifact → ADR → Implementation
```

- A **prompt** (in `prompt-library/`) is executed and produces a **Generated Artifact** (in
  `docs/generated/<domain>/`), initially `status: Draft`.
- A human reviews it against that prompt's "Validation requirements" / "Definition of Done" and
  may set it to `Approved`.
- If the artifact's conclusion commits to something costly to reverse, its `related_decisions`
  field names the ADR drafted from it (or to be drafted); that ADR cites the artifact under
  "Related generated artifacts".
- Implementation work in `src/` may begin in a given area only once the relevant ADR (if one
  was required) is `Accepted`.

Not every artifact needs an ADR, and not every ADR needs exactly one feeding artifact — see
[prompt-library/PROMPT_STANDARDS.md § 7](../../prompt-library/PROMPT_STANDARDS.md#7-traceability-rules--when-an-adr-is-required-vs-not)
for the exact boundary.
