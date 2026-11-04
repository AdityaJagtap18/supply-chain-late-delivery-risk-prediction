# Implementation Documents

Documents produced once the project moved from architecture/design into Stage 5 application
implementation (see [docs/IMPLEMENTATION_ROADMAP.md](../IMPLEMENTATION_ROADMAP.md)). Distinct
from `docs/generated/<domain>/`, which holds design-stage artifacts produced by domain-specific
prompts — these documents are produced by the cross-cutting `13-implementation` prompt category
(currently just `IMPL-001`) and track the implementation workspace itself, not a single domain's
design.

## Current documents

| Document | Title | Source prompt | Status | File |
|---|---|---|---|---|
| IMPLEMENTATION-READINESS-001 | Stage 5 Implementation Readiness Report | IMPL-001 | Draft | [IMPLEMENTATION-READINESS-001.md](IMPLEMENTATION-READINESS-001.md) |
| IMPLEMENTATION-PLAN-001 | Stage 5 Implementation Plan — First Milestone and Phase Sequencing | IMPL-001 | Draft | [IMPLEMENTATION-PLAN-001.md](IMPLEMENTATION-PLAN-001.md) |

Both are `Draft` — a human reviewer has not yet confirmed Stage 5's entry-gate verification or
the first-milestone plan, consistent with every other artifact in this repository's
Draft → In Review → Approved lifecycle (see
[prompt-library/PROMPT_STANDARDS.md § 5](../../prompt-library/PROMPT_STANDARDS.md#5-prompt-review-and-approval-workflow)).

See [src/frontend/README.md](../../src/frontend/README.md), [src/backend/README.md](../../src/backend/README.md),
[src/ml-service/README.md](../../src/ml-service/README.md), [infra/docker/README.md](../../infra/docker/README.md),
[scripts/README.md](../../scripts/README.md), and [tests/README.md](../../tests/README.md) for
each workspace directory's own ownership note, and [.env.example](../../.env.example) at the
repository root for the environment-variable inventory.
