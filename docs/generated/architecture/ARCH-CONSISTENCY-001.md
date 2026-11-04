---
artifact_id: ARCH-CONSISTENCY-001
title: Cross-Artifact Architecture Consistency Review — 2026-11-03
source_prompt: ARCH-003
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Cross-Artifact Architecture Consistency Review

Produced by inspecting, in full, the actual text of: `docs/PRD.md`, `docs/TECHNICAL_DESIGN.md`,
`docs/IMPLEMENTATION_ROADMAP.md`, every file under `docs/generated/*/` (excluding each domain's
own `README.md` tracker), `docs/decisions/README.md`, `docs/decisions/ADR-001-template.md`,
`prompt-library/PROJECT_CONTEXT.md`, and `prompt-library/PROMPT_INDEX.md` — not their filenames
or prior summaries. This review does not design anything new; it evaluates what the existing
Approved/Draft artifact set actually says, against itself. Per the reviewing prompt's
constraints: no existing document is modified, no ADR is created or accepted, no technology
decision is made here, and no evidence is invented. Every finding below distinguishes a
**confirmed inconsistency** (directly evidenced by quoted/cited text in two or more documents)
from an **assumption or interpretive gap** (a plausible reading difference, not a hard
contradiction).

Companion deliverables: [ARCH-BLOCKERS-001.md](ARCH-BLOCKERS-001.md) (the subset of findings
below that block implementation) and
[REQUIREMENTS-TRACEABILITY-001.md](../product/REQUIREMENTS-TRACEABILITY-001.md) (every FR/NFR
traced to its implementing artifacts).

## Finding register

| ID | Severity | Dimension(s) | One-line summary |
|---|---|---|---|
| [CONS-001](#cons-001-critical--type-feature-required-by-ml-but-dropped-from-the-database-schema) | **Critical** | 6, 7, 4 | `Type` is a required ML inference feature but was dropped entirely from the database schema |
| [CONS-002](#cons-002-high--zero-adrs-exist-despite-stage-gates-requiring-at-least-drafted-ones) | **High** | 11, 12 | Zero ADRs exist; the roadmap's own Stage 3→4 and Stage 5 gates were not honored as process |
| [CONS-003](#cons-003-medium--docsdecisionsreadmemd-narrative-is-stale) | Medium | 11 | `docs/decisions/README.md`'s "Status as of" narrative is now factually wrong |
| [CONS-004](#cons-004-medium-already-self-flagged--nfr-web-003-vs-be-arch-001s-actual-contract) | Medium (pre-existing, consolidated here) | 1, 8 | `NFR-WEB-003` anticipated fields that `BE-ARCH-001`'s contract never exposes — already self-flagged in `SEC-THREATMODEL-001` |
| [CONS-005](#cons-005-medium--batch-trigger-endpoint-and-batch-cadence-both-reach-dev-001-unresolved) | Medium | 3, 9, 12 | The batch-trigger endpoint's existence and the batch-scoring cadence both remain undecided all the way through `DEV-STRATEGY-001` |
| [CONS-006](#cons-006-low–medium--manual-refresh-gap-never-closed) | Low–Medium | 2 | `FE-ARCH-001`'s flagged manual-refresh gap was never closed by any later artifact |
| [CONS-007](#cons-007-low-assumption-not-a-confirmed-inconsistency--customer-identityhistory-context) | Low (assumption) | 1, 3 | `UI-DESIGN-001`'s "customer-identity/history context" may be only partially satisfied by `BE-ARCH-001`'s `customer.segment`-only field |

---

## CONS-001 (Critical) — `Type` feature required by ML but dropped from the database schema — **CLOSED 2026-11-03**

> **Closure note (`IMPL-001`):** resolved via `DB-ARCH-REVISION-001-type-feature.md`, now
> `Approved` — see [ARCH-BLOCKERS-001.md § BLOCK-002](ARCH-BLOCKERS-001.md#block-002-critical--type-feature-required-by-the-ml-pipeline-is-unavailable-in-the-database-schema--closed-2026-11-03).
> The analysis below is preserved as the historical finding, not re-litigated.

**Affected documents:** `docs/generated/database/DB-ARCH-001-schema-design.md` § 6;
`docs/generated/ml/ML-PIPELINE-001-leakage-free-training.md` § 1;
`docs/generated/ml/ML-INFERENCE-001-service-contract.md` § 1;
`docs/generated/backend/BE-ARCH-001-api-and-layering.md` § 3.1.

**Description:** `ML-PIPELINE-001` § 1 states its leakage-free feature-selection result as:
"Final retained feature set after selection: `Type`, `Customer City`, `Customer Id`, `Customer
Zipcode`, `Order City`, `Order Country`, `Order Region`, `Order State`, `Shipping Mode`."
`ML-INFERENCE-001` § 1 finalizes the inference request schema with exactly these nine keys,
literally including `"type": "string"`. But `DB-ARCH-001` § 6's traceability table — produced
*before* `ML-001`/`ML-002` ran, by the chain's own dependency order — maps the source `Type`
column to **`*Dropped*`**, with the stated reason: *"Payment type — no FR in `docs/PRD.md § 28`
or screen in `UI-DESIGN-001` needs it; not an ML feature of interest for the web app's MVP scope
either."* That last clause is the part later proven wrong by `ML-001`'s own measured result:
`Type` *is* one of only nine features the leakage-free pipeline actually retained. No entity in
`DB-ARCH-001`'s schema (`customer`, `customer_location`, `order`, `order_item`, `product`,
`shipment`, `risk_assessment`, `app_user`) stores a payment-type column anywhere.

`BE-ARCH-001` § 3.1 (approved before `ML-002` ran) deliberately left the inference request's
`features` map unenumerated, committing only to "whatever feature set `ML-001`/`ML-002` confirm
is valid" — so `BE-ARCH-001` itself does not contradict `ML-INFERENCE-001`. The contradiction is
specifically between `DB-ARCH-001` (approved, dropped `Type`) and `ML-PIPELINE-001`/
`ML-INFERENCE-001` (approved later, require `type`). As currently designed, there is no column
anywhere the backend's repository layer could read to populate `features.type` for a given order
when assembling a batch-scoring request.

**Severity: Critical.** This is not a cosmetic mismatch — it means `FR-031` (the batch
risk-scoring job) cannot be implemented as specified by the current, fully-approved artifact set
without a revision to at least one of the conflicting documents.

**Evidence:**
- `DB-ARCH-001` § 6: `| \`Type\` | *Dropped* | Payment type — no FR in \`docs/PRD.md § 28\` or
  screen in \`UI-DESIGN-001\` needs it; not an ML feature of interest for the web app's MVP scope
  either. Can be re-added if a future requirement needs it. |`
- `ML-PIPELINE-001` § 1: `**Final retained feature set after selection:** \`Type\`, \`Customer
  City\`, \`Customer Id\`, \`Customer Zipcode\`, \`Order City\`, \`Order Country\`, \`Order
  Region\`, \`Order State\`, \`Shipping Mode\``
- `ML-INFERENCE-001` § 1 request schema: `"type": "string"`, with the surrounding text stating
  "Every key above is one of `ML-PIPELINE-001` § 1's final retained feature set... nothing else."

**Recommended resolution (not decided here, per this review's constraints):** either (a) revise
`DB-ARCH-001` to add a column preserving payment type (e.g., on `order` or `order_item`) and
re-approve it, or (b) revise `ML-001`'s pipeline to exclude `Type`, re-measure the § 4 metrics
without it, and re-approve `ML-PIPELINE-001`/`ML-INFERENCE-001` accordingly. Either path requires
re-opening at least one already-Approved artifact under the project's own versioning rules
(`PROJECT_CONTEXT.md § 4` rule 7).

**Human approval required:** Yes — this changes an Approved artifact's content either way.

---

## CONS-002 (High) — Zero ADRs exist despite stage gates requiring at least drafted ones

**Affected documents:** `docs/IMPLEMENTATION_ROADMAP.md` (Stage 3 and Stage 5 gates);
`prompt-library/PROJECT_CONTEXT.md § 4` rule 9; `docs/decisions/README.md`.

**Description:** `docs/IMPLEMENTATION_ROADMAP.md`'s own "Gate to Stage 4" states: *"`ARCH-001`,
`DB-001`, `BE-001` artifacts `Approved`; ADR-0001–0003 and ADR-0005 **at least drafted** (not
necessarily all `Accepted` yet, but no longer just backlog placeholders)."* Its Stage 5 text adds:
*"only once the relevant ADRs (frontend framework, backend framework, database, auth strategy)
are `Accepted`... `src/frontend/`, `src/backend/`, `src/ml-service/` deliberately do not exist in
this repository"* until then. Directly confirmed by repository listing: `docs/decisions/`
contains only `README.md` and `ADR-001-template.md` — **no ADR file of any kind has been
created**, drafted or otherwise, for any of the seven backlog items (ADR-0001 through ADR-0007).
Despite this, every downstream prompt through `UI-001`, `DB-001`, `BE-001`, `FE-001`, `ML-001`,
`ML-002`, `QA-001`, `SEC-001`, and `DEV-001` has been executed and its artifact Approved —
bypassing the Stage 3→4 gate's explicit "at least drafted" requirement wholesale, every single
time it applied.

**What this is not:** this is **not** a violation of `PROJECT_CONTEXT.md § 4` rule 9's bright
line ("do not implement a technology choice that has not been approved via an Accepted ADR") —
confirmed by repository listing, no `src/` directory exists anywhere in this repository, so no
actual implementation has occurred. The violation is of the roadmap's own staged-review
*process* discipline, not of the no-premature-code rule itself.

**Severity: High.** No technical artifact is incorrect because of this, but it means the
project's own documented governance gate was never actually enforced across six consecutive
stage transitions, and if that pattern continues unnoticed into Stage 5 (actual code), rule 9
would be the only remaining backstop.

**Evidence:** `docs/IMPLEMENTATION_ROADMAP.md`, Stage 3 ("Gate to Stage 4") and Stage 5 sections,
quoted above; `docs/decisions/README.md` § "Status as of 2026-11-03" ("No ADR has been created
yet"); repository listing of `docs/decisions/` (two files only: `README.md`,
`ADR-001-template.md`).

**Recommended resolution:** before any `src/` work begins, draft ADR-0001 through ADR-0007 from
`ARCH-TRADEOFF-001`'s recommendations (`status: Proposed`) and have a human reviewer accept,
reject, or amend each one, per `docs/decisions/README.md`'s own "How to create an ADR" procedure.

**Human approval required:** Yes — accepting an ADR is by definition a human-only action per
`docs/decisions/README.md` § "How to create an ADR" step 5.

---

## CONS-003 (Medium) — `docs/decisions/README.md`'s narrative is stale

**Affected documents:** `docs/decisions/README.md` § "Status as of 2026-11-03";
`prompt-library/PROMPT_INDEX.md`.

**Description:** `docs/decisions/README.md` states: *"ADRs should be written from the output of
`ARCH-002`... and the domain-specific architecture prompts (`DB-001`, `BE-001`, `FE-001`,
`ML-002`, `SEC-001`, `DEV-001`), **none of which have been executed yet either**."* This is now
false — `PROMPT_INDEX.md` confirms all six of those prompts are `Executed`, most with their
artifact `Approved`. The anticipated-decisions **backlog table** itself remains accurate (no
candidate is marked approved, correctly), so this is a narrative-staleness finding, not a
backlog-accuracy one. This is distinct from, and not caught by, `DOC-001`'s most recent audit
(`docs/generated/product/DOC-AUDIT-001-2026-11-03.md`), whose six categories check metadata, ID
uniqueness, link resolution, status consistency, orphans, and unfilled placeholders — none of
which covers prose claims going stale as later prompts execute.

**Severity: Medium.** Misleads a reader of the ADR system's own front-door document about current
project state; does not itself block anything, since the backlog table (the operative part) is
still correct.

**Evidence:** `docs/decisions/README.md` § "Status as of 2026-11-03", quoted above, versus
`prompt-library/PROMPT_INDEX.md`'s `Status` column for `DB-001`/`BE-001`/`FE-001`/`ML-002`/
`SEC-001`/`DEV-001` (all `Executed`).

**Recommended resolution:** update the "Status as of" prose to reflect current execution state
(while leaving the backlog table's "none approved" claim as-is, since that part is still true).
Consider adding a narrative-staleness check to `DOC-001`'s own audit checklist for future runs, so
this class of drift is caught periodically going forward.

**Human approval required:** No — this is a factual correction to a status statement, not a
decision; but per `PROJECT_CONTEXT.md § 4` rule 7/8, it should be done as a visible edit with
rationale, not silently.

---

## CONS-004 (Medium, already self-flagged) — `NFR-WEB-003` vs. `BE-ARCH-001`'s actual contract

**Affected documents:** `docs/PRD.md § 28` (`NFR-WEB-003`); `docs/generated/backend/BE-ARCH-001-api-and-layering.md`
§ 2.3/2.4; `docs/generated/security/SEC-THREATMODEL-001-threat-model.md` § 2, § 7 item 1.

**Description:** This review re-confirms, rather than newly discovers, a cross-artifact gap
`SEC-THREATMODEL-001` § 2 already identified: `NFR-WEB-003` (Approved, in `docs/PRD.md § 28`)
anticipated that `Customer Id`/`Customer Zipcode` *might* be shown to the ops-analyst role
("may be shown to the authenticated operations-analyst role... consistent with that role's
legitimate business need"), while `BE-ARCH-001`'s Approved response schemas (`GET /orders`,
`GET /orders/{orderId}`) never include `Customer Id`, `Customer Zipcode`, or `Latitude`/
`Longitude` in any form. Both artifacts are individually self-consistent; the gap is between
them, and `SEC-THREATMODEL-001` already recorded it as Open Item 1 for the product owner, not
resolved it. This review includes it here for completeness of the full-system picture, not as a
new finding, and defers to `SEC-THREATMODEL-001` § 7 item 1's framing.

**Severity: Medium** (unchanged from its original flagging) — the current contract is *more*
conservative than the NFR required, which is a safe default, not an active exposure risk; the
inconsistency is between the documents' stated expectations, not an operational problem today.

**Evidence:** quoted in `SEC-THREATMODEL-001` § 2 (reproduced above) and `docs/PRD.md § 28`'s
`NFR-WEB-003` text.

**Recommended resolution:** unchanged from `SEC-THREATMODEL-001` § 7 item 1 — the product owner
ratifies either (a) updating `NFR-WEB-003` to match the current, more conservative contract, or
(b) adding `Customer Id`/zip back to `BE-ARCH-001`'s contract under an explicit access
justification.

**Human approval required:** Yes (product-owner decision, as already stated in `SEC-THREATMODEL-001`).

---

## CONS-005 (Medium) — Batch-trigger endpoint and batch cadence both reach `DEV-001` unresolved

**Affected documents:** `docs/PRD.md § 24` Open Question 7; `docs/generated/backend/BE-ARCH-001-api-and-layering.md`
§ 2.7, § 5; `docs/generated/security/SEC-THREATMODEL-001-threat-model.md` § 1 (boundary ②), § 7
item 2; `docs/generated/deployment/DEV-STRATEGY-001-deployment-strategy.md` § 4.

**Description:** Two related open questions were correctly flagged at `BE-001` (whether
`POST /risk-assessments/batch-runs` belongs in the public API at all, and if so with what
authorization) and have been consistently re-flagged, not silently resolved, by every subsequent
artifact that touches them (`SEC-THREATMODEL-001` § 1/§ 7, and implicitly `DEV-STRATEGY-001` § 4,
which describes only a scheduler-triggered batch job with no mention of a user-facing trigger
endpoint at all — consistent with treating the endpoint as not yet decided, but also not
explicitly reconciling the two designs). Separately, `docs/PRD.md § 24` Open Question 7 (the
actual batch-scoring cadence) is still open at `DEV-STRATEGY-001` § 4, which uses "nightly"
purely as an illustrative placeholder. Neither gap is a contradiction — every artifact that
touches them is internally consistent and correctly labels them open — but by `DEV-001` (the
final stage before implementation), the project has reached its deployment/runbook design with
two FR-031-critical decisions (how scoring is triggered, and how often) still undecided.

**Severity: Medium.** Not a defect in any single artifact; a consolidated flag that these two
specific open items are no longer "early design ambiguity" — they are now blocking a concrete
runbook (`DEV-STRATEGY-001` § 4's scheduling section) from being anything more than a placeholder.

**Evidence:** `BE-ARCH-001` § 2.7/§ 5; `SEC-THREATMODEL-001` § 1 row ②, § 7 item 2;
`DEV-STRATEGY-001` § 4 ("Scheduling cadence: explicitly a placeholder, not decided here");
`docs/PRD.md § 24` item 7.

**Recommended resolution:** the product owner/ops lead resolves `docs/PRD.md § 24` Open Question
7 (cadence) and the batch-trigger endpoint's existence/authorization together, since the
scheduling decision determines whether a manual-trigger endpoint is even needed as a fallback.

**Human approval required:** Yes (product/business decision, not an architectural one).

---

## CONS-006 (Low–Medium) — Manual-refresh gap never closed

**Affected documents:** `docs/generated/ui-ux/UI-DESIGN-001-design-system-and-screens.md` § 5;
`docs/generated/frontend/FE-ARCH-001-frontend-architecture.md` § 6.

**Description:** `FE-ARCH-001` § 6 explicitly flags that `UI-DESIGN-001`'s component inventory has
no "manual refresh" affordance, which matters because `FE-ARCH-001` § 2.3 deliberately avoids
auto-polling (the batch cadence being unresolved — see CONS-005). No later artifact
(`QA-STRATEGY-001`, `SEC-THREATMODEL-001`, `DEV-STRATEGY-001`) revisits or closes this gap; it
remains an acknowledged but unaddressed UX completeness item in the Approved `UI-DESIGN-001`.

**Severity: Low–Medium.** Does not block FR-032's core function (the queue still renders
correctly on navigation), but means a long-lived analyst session has no way to request fresher
data without navigating away and back — a real, if minor, usability gap in an Approved artifact.

**Evidence:** `FE-ARCH-001` § 6, quoted in full in that artifact.

**Recommended resolution:** add a manual "Refresh" control to `UI-DESIGN-001`'s component
inventory (e.g., on `OrderQueueTable`) in a future revision of that artifact.

**Human approval required:** No for drafting the addition; yes for re-approving the revised
`UI-DESIGN-001`.

---

## CONS-007 (Low, assumption) — "Customer-identity/history context"

**Affected documents:** `docs/generated/ui-ux/UI-DESIGN-001-design-system-and-screens.md` § 2;
`docs/generated/backend/BE-ARCH-001-api-and-layering.md` § 2.4.

**Description:** `UI-DESIGN-001` § 2 lists "customer-identity/history context" as supporting
information the Order Risk Detail screen should surface, citing shipping mode and customer
identity as the strongest predictors per `docs/PRD.md`. `BE-ARCH-001` § 2.4's detail-view response
provides only `customer: { segment: string }` — a single categorical attribute, not any
identity or historical-behavior field. **This is flagged as an interpretive gap, not a confirmed
inconsistency:** it is plausible that "customer segment" was intended to satisfy this requirement
at MVP fidelity, and no artifact states otherwise; but it is equally plausible that "history
context" meant something more (e.g., a customer-level late-delivery-rate indicator, which is
exactly the kind of signal `ML-PIPELINE-001` § 2's `Customer Id` encoding captures internally but
never surfaces to the UI). Neither reading is confirmed by direct evidence in either document.

**Severity: Low** (interpretive, not evidenced as wrong).

**Evidence:** `UI-DESIGN-001` § 2 item 2; `BE-ARCH-001` § 2.4's response shape.

**Recommended resolution:** the product owner/UI-DESIGN-001 owner confirms whether `customer.segment`
alone satisfies the "identity/history context" requirement, or whether an additional field is
needed.

**Human approval required:** Yes, if the gap is confirmed as real.

---

## Review by the 12 required dimensions

| # | Dimension | Result |
|---|---|---|
| 1 | Product requirements vs. UI functionality | Consistent, with CONS-004 (pre-existing) and CONS-007 (interpretive) as the only gaps. FR-032/FR-033 map cleanly to `UI-DESIGN-001` Screens 1/2. |
| 2 | User journeys vs. frontend modules | Consistent, with CONS-006 (manual-refresh gap) as the only open item. |
| 3 | Frontend architecture vs. backend API contracts | Consistent — `FE-ARCH-001` consumes `BE-ARCH-001`'s contract exactly as specified, with no invented field (verified directly: § 2–4 of `FE-ARCH-001` cite `BE-ARCH-001` sections for every field used). CONS-005's batch-trigger ambiguity is the one unresolved cross-cutting item. |
| 4 | Backend services vs. database schema | Consistent except CONS-001 (the `Type` column gap, which is really a database-vs-ML issue surfacing at the backend layer). Every other `BE-ARCH-001` field traces to a named `DB-ARCH-001` column. |
| 5 | Database design vs. PRD requirements | Consistent — `DB-ARCH-001` § 6 maps every PRD § 12.1 column to a destination or an explicit, justified drop; the one drop that turned out to be wrong in hindsight is CONS-001. |
| 6 | ML training pipeline vs. inference service | Consistent at the ML-to-ML level (`ML-INFERENCE-001` § 1–3 are a direct, verified restatement of `ML-PIPELINE-001` § 1–2/§ 5, with an explicit "no conflict found" check against `BE-001`'s sketch in § 0) — the only break is CONS-001, one layer down at the database. |
| 7 | Prediction inputs vs. features available at prediction time | Consistent and well-evidenced — `ML-PIPELINE-001` § 3 performed a genuine, measured audit (finding and excluding `Order Status`), and `ML-INFERENCE-001` § 1 correctly excludes exactly what § 3 excluded. The audit is explicitly stated as not-yet-exhaustive against real production timing, which is an honestly-flagged limitation, not an inconsistency. |
| 8 | Security architecture vs. authentication/authorization requirements | Consistent — every `SEC-THREATMODEL-001` §3 requirement maps to a `TBD pending ADR-0005` marker already present in `BE-ARCH-001`, with no contradiction. |
| 9 | Testing strategy vs. functional/non-functional requirements | Mostly consistent; CONS-005 notes that one NFR (`NFR-WEB-002`, batch latency) has no concrete value for `QA-STRATEGY-001` to test against, which that artifact itself does not claim to resolve. |
| 10 | Deployment architecture vs. selected technology stack | Consistent — `DEV-STRATEGY-001` deliberately names no technology, matching `ARCH-TRADEOFF-001`'s still-pending-ADR status throughout; no premature commitment found. |
| 11 | Architecture decisions vs. approved technical documents | **CONS-002 and CONS-003** — no ADR exists at all, and the ADR system's own front-door document has a stale status narrative. |
| 12 | Implementation roadmap vs. actual dependencies | **CONS-002** (stage gates not honored as process) and **CONS-005** (two FR-031-critical decisions still open at the final design stage). |

## Important checks (per the reviewing prompt's instructions)

- **Contradictory technologies, APIs, data models, terminology:** none found beyond CONS-001
  (a data-model/feature-list contradiction, not a technology one). No artifact names a concrete
  technology as a requirement outside an explicitly labeled, ADR-pending candidate — verified by
  direct reading, not by trusting prior artifacts' own self-certifications.
- **Missing API endpoints/data contracts:** none found beyond the already-flagged, already-open
  batch-trigger endpoint (CONS-005). Every MVP FR traces to at least one endpoint or screen — see
  [REQUIREMENTS-TRACEABILITY-001.md](../product/REQUIREMENTS-TRACEABILITY-001.md).
- **Undocumented assumptions:** the three `DB-ARCH-001` § 5 assumptions (`Customer Id`
  uniqueness, order grain, shipment cardinality) remain exactly as documented there — still
  open, still correctly labeled as assumptions, not newly discovered here.
- **Decisions marked Approved without a supporting ADR where one is required:** none found. Every
  Approved artifact that touches an ADR backlog item correctly labels the relevant technology as
  an unapproved candidate, not a decision — the gap is the inverse one (CONS-002: no ADR exists at
  all, approved or not), not artifacts falsely claiming ADR backing.
- **Whether any document depends on an unapproved technology decision:** no — every artifact that
  touches an ADR-backlog item (frontend/backend framework, database, ML-inference architecture,
  auth strategy, deployment, model storage) explicitly marks its technology references as
  unapproved candidates pending the relevant ADR, including the illustrative Angular-flavored code
  notes in `FE-ARCH-001` § 5, which are explicitly labeled non-binding.
- **Whether the ML prediction pipeline can actually be integrated into the application:** **not
  as currently specified** — see CONS-001. This is the one concrete integration blocker found.
- **Remaining ML data leakage or model-validation concerns:** `ML-PIPELINE-001` § 7's own
  disposition table already states, accurately and without overclaiming, that concern #4 is only
  partially addressed and concern #8 (dataset provenance) is fully unresolved. This review found
  no additional leakage concern beyond what `ML-001` already self-identified.
- **MVP scope consistency throughout all artifacts:** confirmed consistent. Every artifact from
  `PD-VISION-001` through `DEV-STRATEGY-001` correctly carries forward: single ops-analyst
  persona, batch (not live) scoring, read-only screens, single-role authentication, and
  file-based (not registry) model storage for MVP. No artifact was found to silently expand or
  contract this scope.
