---
artifact_id: QA-STRATEGY-001
title: Testing Strategy — MVP
source_prompt: QA-001
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Testing Strategy — MVP

Produced by executing [QA-001](../../../prompt-library/09-testing-and-qa/QA-001-testing-strategy.md)
against [BE-ARCH-001](../backend/BE-ARCH-001-api-and-layering.md),
[FE-ARCH-001](../frontend/FE-ARCH-001-frontend-architecture.md),
[ML-INFERENCE-001](../ml/ML-INFERENCE-001-service-contract.md) (all Approved), and `docs/PRD.md
§ 18` (the notebook's current zero-exception-handling state, which this strategy must not let the
web app inherit). Framework names below are illustrative only, pending the relevant ADRs.

## 1. Unit-test scope

| Layer | Scope | Illustrative tooling | Coverage bar (placeholder, see § 6) | Exempt |
|---|---|---|---|---|
| Backend — service layer | Risk-band thresholding logic (`BE-ARCH-001` § 3.2's decision), request validation, orchestration logic | JUnit/Mockito if Spring Boot wins ADR-0002, or that framework's equivalent | 80% line coverage | — |
| Backend — repository layer | Query-construction logic only (not the database itself — see § 2) | Same as above | 60% — thinner, since most of this layer is thin pass-through to `DB-ARCH-001`'s schema | Trivial pass-through methods with no branching logic |
| Frontend — components/state | `RiskBadge` renders the correct icon+color+text per band (`UI-DESIGN-001` § 3.1 — asserting color is never the only signal, directly testable); `FE-ARCH-001` § 2.3's no-cross-navigation-caching/no-polling rules; status-code-to-state mapping (`FE-ARCH-001` § 4) | Illustrative: a component-testing library paired with whichever framework ADR-0001 selects | 70% for components with logic; staleness/state-mapping logic specifically targeted at ~90% given § 2.3's explicit correctness framing ("not just a UX nicety") | Purely presentational templates with no conditional logic |
| ML — feature-transformation functions | The leakage-safe encoding functions `ML-PIPELINE-001` § 2 defines (smoothed-mean computation, out-of-fold encoding, cold-start fallback substitution) | Illustrative: pytest with small, hand-constructed fixtures (not the full 50,000-row dataset) | 90% — this is exactly the logic whose subtle breakage *is* the leakage risk `ML-001` fixed; "generated code is exempt" does not apply here, there is none | — |

**Exempt generally:** DTOs/data classes with no logic, framework-generated boilerplate, and
illustrative code samples inside other generated artifacts (none of which are executable
project code).

## 2. Integration-test scope

- **Backend ↔ database:** exercise the repository layer against a real (or containerized) test
  database instance using `DB-ARCH-001`'s actual schema — not an in-memory substitute that could
  silently tolerate a constraint `DB-ARCH-001` requires (e.g., `risk_assessment.model_version
  NOT NULL`, per `DB-ARCH-001` § 2.7). At minimum: verify every foreign key relationship in
  `DB-ARCH-001` § 3's ER diagram is enforced, and that `customer_location`'s access restriction
  (§ 2.2 there) actually blocks an unauthorized query path, not just that it's documented.
- **Backend ↔ ML inference boundary:** exercise `BE-ARCH-001` § 3's contract against
  `ML-INFERENCE-001`'s finalized schema (§ 1–2 there) using a **test double that can simulate
  failure**, not only a happy-path mock — this is the one explicit instruction in QA-001 worth
  restating: `ML-INFERENCE-001` § 5's error/fallback behavior (whole-batch-run failure leaves
  previous scores untouched; per-order failure skips only that order) **must be
  integration-tested**, because it is exactly the kind of behavior a pure unit-test mock would
  never actually exercise (a mock that always "succeeds" can't catch a fallback path regression).
- **Backend auth-enforcement (functional correctness, not adversarial — see § 5):** every
  endpoint in `BE-ARCH-001` § 2 that is marked "authenticated session required" returns the
  documented `401` when called without one. This is a contract-correctness check against
  `BE-001`'s own specification, not a security-bypass attempt.

## 3. End-to-end test scope (MVP primary journey)

Per `UI-DESIGN-001`/`FE-ARCH-001`, at minimum:

1. **Happy path:** an order exists in the database with a current `risk_assessment` row →
   `/orders` renders it in the queue with the correct `RiskBadge` → selecting it navigates to
   `/orders/:orderId` and renders the same score consistently.
2. **Loading state:** the fetch is in flight → `LoadingSkeleton` renders (`UI-DESIGN-001` § 3.1/
   3.2, `FE-ARCH-001` § 4).
3. **Empty state:** zero open orders → `EmptyState`, distinguishable from loading and error.
4. **Error state:** the backend is unreachable/returns 5xx → `ErrorBanner`, distinguishable from
   empty.
5. **Not-found state:** a detail-view request for a nonexistent/closed order → the dedicated
   not-found state (`BE-ARCH-001` § 2.4's `404`), distinguishable from loading/error/empty — this
   is its own named state precisely because `UI-DESIGN-001` § 3.2 required it to be.
6. **Auth redirect:** an unauthenticated session attempting `/orders` or `/orders/:orderId` is
   redirected to `/login` (`FE-ARCH-001` § 1), not shown `ErrorBanner`.
7. **Staleness display:** the queue view always shows `scoresAsOf` (`BE-ARCH-001` § 2.3,
   `FE-ARCH-001` § 2.3 item 3) — assert it is present and reflects the actual last successful
   batch run, not silently omitted when the run was long ago.

## 4. ML-specific validation (mandatory — all three present, per QA-001's own constraint)

### 4.1 Training-pipeline regression test

Given a **fixed input snapshot** (a frozen copy of `final_sample.csv` at a recorded content
hash — reusing `ML-PIPELINE-001` § 5's training-data-snapshot-identifier concept), re-running
`ML-001`'s training pipeline must produce metrics within an agreed tolerance (placeholder:
**±2 percentage points on recall and accuracy**, explicitly marked as a placeholder per QA-001's
failure-handling clause — no team CI budget/history exists yet to set this more precisely) of the
recorded baseline in `ML-PIPELINE-001` § 4.1 (e.g., AdaBoost recall ≈ 0.733). **This test exists
specifically to catch a silent leakage regression** — per `PROJECT_CONTEXT.md § 3` concerns #1/#2
and `ML-PIPELINE-001` § 4.2's own isolated measurement, reintroducing pre-split
encoding/selection would push recall back up *toward* the leaky baseline's ≈0.85. **An unexplained
upward jump in this metric must fail the test, not be celebrated as an improvement** — this is the
literal mechanism `ML-001`'s own before/after evidence exists to make checkable, not just
narratively true.

### 4.2 Feature-availability contract test

An automatable schema diff: every key in `ML-INFERENCE-001` § 1's request schema must appear in
`ML-PIPELINE-001` § 1's final retained feature set. This directly operationalizes
`PROJECT_CONTEXT.md § 3` concern #4 as a CI-enforceable check — e.g., it would have caught
`Order Status` being reintroduced into the request schema after `ML-001` specifically excluded it
for being entangled with the outcome (§ 3 there).

### 4.3 Data-drift smoke test

Compare summary statistics (category frequencies for the target-encoded/dummy columns; basic
distributional stats for any retained numeric columns) of **live production batch-scoring
inputs** against the training-fold distribution recorded by `ML-001`, flagging large deviations.
**Explicitly tied to `PROJECT_CONTEXT.md § 3` concern #8** (dataset provenance): because the
training data's own provenance/representativeness was never confirmed, this drift check is this
system's only operational safety net for noticing if production order data diverges materially
from whatever was actually used to train — it cannot compensate for the provenance question
itself, only detect symptoms of it. **Status: design only, not yet executable** — there is no
live production data yet (MVP has not launched); this test activates once `BE-ARCH-001` § 2.7's
batch job is actually running against real orders, not the current committed CSVs.

## 5. Explicitly out of scope — belongs to `SEC-001`

Per QA-001 instruction 5, cross-referenced against `SEC-001`'s own stated scope
(`prompt-library/10-security-and-performance/SEC-001-security-threat-modeling.md`, not yet
executed) to avoid duplicate/overlapping test plans:

- **Adversarial authentication-bypass testing** (attempting to defeat the session mechanism
  itself) — distinct from § 2's functional 401-on-missing-session check, which only verifies the
  *documented* behavior, not resistance to attack.
- **Injection-attack testing** (SQL injection, XSS payload fuzzing against any `BE-ARCH-001`
  input field) — `SEC-001` instruction 4 owns defining the input-validation/injection-prevention
  *requirements*; this strategy does not design the adversarial test suite that would verify
  them, to avoid the two artifacts independently inventing two different test plans for the same
  concern.
- **Rate-limiting/abuse-prevention testing** — `SEC-001` instruction 6 owns sizing this
  requirement; once `SEC-001` sets concrete numbers, a basic smoke test verifying the configured
  limit is enforced would be a QA-001-style test, but the limit's *value* is not this artifact's
  decision.
- **PII/quasi-identifier exposure testing** (verifying `customer_location`'s access restriction
  resists an unauthorized role, not just that it blocks the one role already modeled in § 2) —
  `SEC-001` instruction 2 owns the policy question of who should be able to see what; this
  strategy's § 2 integration test only checks the restriction exists and works for the single
  MVP role, not that it is adversarially robust.

## 6. Coverage/acceptance bar — stated as a placeholder recommendation

No team CI budget or tooling history exists yet to set these precisely (per QA-001's
failure-handling clause, stated explicitly rather than left blank): **80% line coverage for
backend service logic and ML feature-transformation code** (the highest-correctness-risk layers),
**60–70% for frontend components** (90% specifically for staleness/state-mapping logic, § 1), and
**100% of the three ML-specific validation items in § 4 present and passing** before any deploy —
this last bar is not a percentage, it is a presence/absence gate, since a single missing
leakage-regression check is a correctness risk no coverage percentage captures. These numbers are
a reasonable starting default, not a benchmarked target — revisit once real CI history exists.
