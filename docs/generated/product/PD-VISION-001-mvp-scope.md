---
artifact_id: PD-VISION-001
title: Product Vision & MVP Scope
source_prompt: PD-002
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the ops-analyst primary-persona call flagged below as a judgment call. Approved as-is, with no
> requested scope changes.

# Product Vision & MVP Scope

Produced by executing [PD-002](../../../prompt-library/01-product-discovery/PD-002-product-vision-mvp.md),
building on [PD-REVIEW-001](PD-REVIEW-001-existing-project-digest.md) (PD-001's digest) and
`docs/PRD.md` §4, §5, §23. Per PD-002's technical constraints, no frontend/backend/database
technology is named below, and the existing model is not claimed to be production-ready.

## Product vision statement

When a new order is placed, the system flags it as at-risk of late delivery *before* it ships —
not after the fact — so a supply-chain operations analyst can decide, for that specific order,
whether to switch its shipping mode, escalate it to the carrier, or proactively notify the
customer, instead of discovering the lateness only once `Delivery Status` already shows it.

This is deliberately narrower than the README's framing ("optimize supply chain operations" /
"enhance the efficiency of their supply chain operations" — generic language this vision
statement intentionally does not reuse): the product's value is a single, concrete decision —
*does this order need an intervention right now* — not supply-chain optimization in the abstract.

## Persona decision

**Primary MVP user: the supply-chain / operations analyst persona** (`docs/PRD.md` §5, row 1),
not the business/product stakeholder or data-scientist personas. Carried over from existing docs,
not invented here.

**Rationale:** The vision statement above is an operational, per-order action. Of the three
personas PRD §5 lists, only the ops analyst takes an action on an individual order; the business
stakeholder persona (PRD §5, row 3) wants an aggregate, plain-language interpretation of *what
drives* late delivery across orders, which is a reporting need, not the MVP's core loop. The
data-scientist persona (PRD §5, row 2) is already served today, by the notebook itself.

This is a judgment call, not a fact pulled from stakeholder documentation — PD-001's open
question #2 explicitly left "who is the intended consumer" unresolved, and no interview or
requirements document confirms this choice. Per PD-002's failure-handling clause, this is
recorded here as a **decision requiring product-owner confirmation**, not a blocking open
question: evidence in the existing docs favors the ops-analyst reading strongly enough that this
artifact proceeds on that basis rather than halting, but it should be the first thing a product
owner either confirms or overturns before `PRD-001` finalizes MVP requirements language.

The business-stakeholder and data-scientist personas are not dropped — they are explicitly
**deferred**, in the Out-of-scope list below, not ignored.

## MVP scope

### In scope

| Item | Decision | Justification |
|---|---|---|
| Primary persona | Supply-chain / operations analyst (single role) | See Persona decision above |
| Prediction timing | Order-placement time | Matches the real-world predictive problem already framed in `docs/PRD.md` §3 (estimate risk using only information available at/before order placement, not post-hoc shipping-duration fields) |
| Feature-availability audit | **Required before launch, not assumed.** MVP may only use features confirmed genuinely available at order-placement time | Directly ties to `PROJECT_CONTEXT.md` §3 item 4 (prediction-time feature availability) — this is flagged there as unresolved, and this vision does not resolve it; it makes resolving it a launch blocker owned by `ML-001`/`ML-002`, not something the MVP can skip |
| Interface | Batch/offline risk report over currently-open orders | Lower-risk starting point than a live-scoring API; defers a real-time-latency commitment until the batch report's value is validated with the ops-analyst persona |
| Authentication | Minimal, single-role authentication (prevents public/anonymous access to order and location data) | The retained quasi-identifiers (`Customer Id`, `Customer Zipcode`, lat/long — PRD §17) mean this cannot ship with zero access control, but role-based permissioning is not needed for a single-persona MVP |
| Persisted model + fitted encoders | In scope, baseline version only (covers FR-026, FR-028 at minimum fidelity — no versioning/registry required yet) | Nothing in this product can function without this; it is the floor, not an enhancement |
| Batch scoring job | In scope, baseline version only (covers FR-027 as a scheduled/manually-triggered batch job, not a request/response API) | Required to produce the risk report; "batch" framing keeps it consistent with the Interface decision above |
| Risk list/detail view | In scope — a list of open orders with a risk indicator, and a detail view per order | Minimum surface for the ops analyst to act on a specific order, per the vision statement |

### Out of scope (deferred)

| Item | Deferred to | Justification |
|---|---|---|
| Business-stakeholder aggregate dashboard / plain-language reporting | A later phase, not named here (would need its own PD-level prompt if prioritized) | Serves a different persona (PRD §5 row 3) than the MVP's chosen primary user; not required for the ops-analyst intervention loop |
| Data-scientist experimentation tooling / model-comparison UI | Out of scope entirely | Already served by the existing notebook; no product gap to close here |
| Live/real-time scoring API | Future architecture work, after batch report validates the use case | Avoids committing to a latency SLA and request/response architecture before the simpler batch path is validated |
| Multi-user roles / fine-grained authorization | `SEC-001` and later backend work | Single-role MVP is sufficient per the Authentication decision above |
| Automated retraining, drift monitoring, experiment tracking | Roadmap Phase 4 (`docs/PRD.md` §21) | Explicitly out of scope per the existing roadmap's own phasing; MVP does not need a maintained, monitored production capability on day one |
| Using today's leakage-affected model as a trustworthy production baseline | Blocked on `ML-001`'s leakage-free re-run | Per `PROJECT_CONTEXT.md` §3's own rule: no artifact may claim a known correctness concern is resolved without before/after evidence. The MVP's batch report must not launch presenting today's notebook-reported recall figures as validated performance. |
| Full raw-dataset ingestion / Spark pipeline | Out of scope unless PD-001's open question #1 (dataset license) is resolved in favor of expanding beyond `final_sample.csv`/`df_last.csv` | No evidence the MVP needs more than the already-committed sample; revisit only if the license question changes this |

### Planned functional requirements (`docs/PRD.md` §10) — MVP disposition

- **FR-026 (persist the trained model):** Required for MVP, at baseline fidelity only (a saved
  model file is sufficient; a model registry/versioning system is not required for MVP).
- **FR-027 (score new orders):** Required for MVP, but scoped to the **batch** framing above, not
  the general "API or service" language in the original FR — a live scoring API is explicitly
  deferred (see Out-of-scope table).
- **FR-028 (encoding pipeline persistence):** Required for MVP, at baseline fidelity — the fitted
  target-encoding maps and dummy-encoding schema must be persisted and reused at batch-scoring
  time, consistent with `PROJECT_CONTEXT.md` §3's leakage concerns (encoders must be fit once,
  on training data only, and reused — not refit per batch).

## MVP success criteria (product usage, not model metrics)

Deliberately excludes model-internal metrics (recall, PR-AUC, etc. — those belong to
`ML-001`/`ML-002`'s own validation, not here):

1. An ops analyst can view the current risk score for a specific, named order within two
   navigations from the MVP's landing view (e.g., open the risk list, select the order).
2. A newly placed order appears in the risk report within one scheduled batch-scoring run,
   without any manual notebook execution by a data scientist.
3. An ops analyst can retrieve the set of currently open orders ranked by risk (e.g., "show me
   the 20 highest-risk open orders") without manually filtering a raw export.
4. Re-scoring a new batch of orders is a repeatable, triggerable operation (a script or job a
   non-data-scientist can run or that runs on a schedule) — not a manual, cell-by-cell notebook
   re-execution.
5. No direct PII (email, password, full name) is exposed anywhere in the MVP's report or UI,
   preserving the privacy-positive removal already done upstream in the existing pipeline
   (`docs/PRD.md` §17).

## Open items carried forward (not resolved by this artifact)

- **Persona confirmation** (see Persona decision above) — recommend direct stakeholder
  confirmation or `AskUserQuestion` before `PRD-001` treats this as settled.
- All of PD-001's open questions not directly addressed by an MVP in/out decision above remain
  open: dataset license/provenance (open question #1), acceptable recall/precision cost trade-off
  (open question #4), existing intervention process design (open question #5), data-privacy
  policy applicability (open question #6), and whether the preferred Angular/Spring/Python/
  Postgres-or-MySQL stack is truly open to `ARCH-002`'s comparison or effectively fixed (open
  question #9). None of these are product-MVP-scope questions this artifact can resolve.
