---
artifact_id: BE-ARCH-001
title: Backend Architecture & API Design — MVP
source_prompt: BE-001
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0002, ADR-0004, ADR-0005]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the 7-endpoint contract, the ML-inference-boundary contract (§ 3), and the still-open scope
> question on the batch-run trigger endpoint (§ 5). Approved as-is, with no requested changes.

# Backend Architecture & API Design — MVP

Produced by executing [BE-001](../../../prompt-library/06-backend-development/BE-001-backend-architecture.md)
against [ARCH-DESIGN-001](../architecture/ARCH-DESIGN-001-high-level-architecture.md) and
[DB-ARCH-001](../database/DB-ARCH-001-schema-design.md) (both Approved) and `docs/PRD.md § 28`.
The API contract below is framework-neutral and reuses `DB-ARCH-001`'s entity/field names
directly — no new field names are invented casually, per BE-001's technical constraint.

## 1. Backend internal layers

Framework-neutral, consistent with `ARCH-DESIGN-001`'s component boundary for the backend
(§ 1.2 there: "applies a persisted model/encoder pair; it does not derive one"):

| Layer | Responsibility | Must not be responsible for |
|---|---|---|
| **API / controller layer** | HTTP request/response marshaling, input validation, enforcing FR-034's authentication requirement on every request | Business logic, direct data-store access, calling the ML inference boundary directly |
| **Application / service layer** | Orchestrates use cases (list open orders with current risk, get one order's detail, trigger a scoring batch); owns the risk-score→risk-band thresholding decision (see § 3.3) | HTTP concerns (status codes, headers), SQL/query construction, ML model internals |
| **Data-access / repository layer** | CRUD against `DB-ARCH-001`'s entities (`customer`, `order`, `order_item`, `product`, `shipment`, `risk_assessment`, `app_user`); returns domain objects, not raw rows, to the service layer | Any ML computation, any HTTP concern |
| **ML inference client boundary** | A single interface the service layer calls to score a batch of orders; abstracts away *how* scoring happens | Fitting encoders, training, or deciding feature selection — all offline-training-pipeline concerns per `ARCH-DESIGN-001` § 1.3/§ 2. This boundary only ever calls out to whatever `ML-002` defines; it does not embed model logic itself. |

**Why a dedicated ML inference client boundary matters for ADR-0004:** `ARCH-DESIGN-001` § 1.3
leaves "in-process vs. separate service" explicitly undecided. This boundary is the seam where
that decision is absorbed — the service layer calls one interface method (§ 3.4) regardless of
which option ADR-0004 eventually accepts, so the rest of the backend does not need to change if
that decision is revisited later.

## 2. API contract

Every endpoint below traces to a `DB-ARCH-001` entity/field (no invented field names) and to an
MVP FR from `docs/PRD.md § 28`. Auth requirement is marked `TBD pending ADR-0005` wherever the
*mechanism* (session cookie vs. token vs. SSO) is not yet decided — but the *requirement itself*
(authenticated access only) is not in question; it is NFR-WEB-001, already approved.

### 2.1 `POST /auth/sessions` — log in (FR-034)

| | |
|---|---|
| **Auth requirement** | None (this endpoint establishes the session) |
| **Request body** | `{ "username": string, "credential": string }` — `credential`'s exact meaning (password vs. SSO token) is `TBD pending ADR-0005` |
| **Response 200** | `{ "userId": integer, "username": string, "sessionToken": string }` — maps to `app_user.user_id`, `app_user.username` |
| **Response 401** | Invalid credentials |

### 2.2 `DELETE /auth/sessions` — log out (FR-034)

| | |
|---|---|
| **Auth requirement** | Authenticated session, `TBD pending ADR-0005` for exact mechanism |
| **Response 204** | Session invalidated |

### 2.3 `GET /orders` — risk queue (FR-032)

| | |
|---|---|
| **Auth requirement** | Authenticated session, `TBD pending ADR-0005` |
| **Query params** | `riskBand` (optional: `high` \| `medium` \| `low` \| `stale`, per `UI-DESIGN-001` § 3.1); `status` (default `open`, maps to `order.order_status`); default sort is risk-descending, per `PD-VISION-001` success criterion #3 |
| **Response 200** | `{ "scoresAsOf": timestamp, "orders": [ { "orderId": integer, "riskBand": string, "riskScore": number, "shippingMode": string, "destination": { "city": string, "region": string }, "scoredAt": timestamp \| null } ] }` — `orderId` ← `order.order_id`; `riskBand`/`riskScore`/`scoredAt` ← the latest `risk_assessment` row per order (`scoredAt: null` when no assessment exists yet — the `UI-DESIGN-001` "stale/unscored" state); `shippingMode` ← `shipment.shipping_mode`; `destination` ← `order.order_city`/`order.order_region`. `scoresAsOf` surfaces the batch-run timestamp this list reflects, per `UI-DESIGN-001` § 1's requirement that staleness is never hidden. |
| **Response 401** | Unauthenticated |

**Deliberately excluded from this response, per `DB-ARCH-001` § 2.2 and `docs/PRD.md § 28`
NFR-WEB-003:** `customer_location.latitude`/`longitude`. No endpoint in this contract exposes
them; if NFR-WEB-003 is later resolved to permit display, that is a contract change, not an
oversight here.

### 2.4 `GET /orders/{orderId}` — order risk detail (FR-033)

| | |
|---|---|
| **Auth requirement** | Authenticated session, `TBD pending ADR-0005` |
| **Path param** | `orderId` — `order.order_id` |
| **Response 200** | `{ "orderId": integer, "placedAt": timestamp, "orderStatus": string, "shippingMode": string, "destination": { "city": string, "region": string }, "customer": { "segment": string }, "currentRisk": { "riskScore": number, "riskBand": string, "modelVersion": string, "scoredAt": timestamp } | null }` — maps directly to `order.*`, `shipment.shipping_mode`, `customer.customer_segment`, and the latest `risk_assessment` row; `currentRisk: null` if unscored, same staleness handling as § 2.3 |
| **Response 404** | No such order |
| **Response 401** | Unauthenticated |

### 2.5 `GET /orders/{orderId}/risk-assessments` — risk assessment history (supports FR-033's audit value; `DB-ARCH-001` § 2.7 was explicitly designed to preserve history, not just the latest score)

| | |
|---|---|
| **Auth requirement** | Authenticated session, `TBD pending ADR-0005` |
| **Response 200** | `{ "assessments": [ { "riskAssessmentId": integer, "riskScore": number, "riskBand": string, "modelVersion": string, "scoredAt": timestamp } ] }`, newest first — maps directly to `risk_assessment.*` |
| **Response 404** | No such order |

*Not required by any `UI-DESIGN-001` screen for MVP (both screens show only the current score),
but included because `DB-ARCH-001` already stores this history and `docs/PRD.md § 28` does not
forbid exposing it; omitting it would mean the only way to access data the schema already
captures is a direct database query, which this API should not force.*

### 2.6 `GET /system/model-versions` — currently active model version(s) (traces FR-029/FR-030)

| | |
|---|---|
| **Auth requirement** | Authenticated session, `TBD pending ADR-0005` |
| **Response 200** | `{ "activeModelVersion": string }` — surfaces whatever `model_version` string the offline training pipeline most recently published, per `ARCH-TRADEOFF-001`'s file-based-for-MVP recommendation (ADR-0007). |
| **Rationale for including this endpoint:** FR-029 (persist model) and FR-030 (persist encoders) are otherwise satisfied entirely by the ML inference boundary contract (§ 3 below), not by a user-facing endpoint — there is no screen in `UI-DESIGN-001` that needs this. This minimal, read-only endpoint exists so both FRs trace to *at least one* endpoint, per BE-001's validation requirement, without inventing user-facing functionality `PD-002` never scoped. | |

### 2.7 `POST /risk-assessments/batch-runs` — manually trigger a scoring batch (FR-031)

| | |
|---|---|
| **Status** | **Flagged as a scope question, not decided here — per BE-001's failure-handling clause.** `docs/PRD.md § 28` FR-031 says the batch job is "scheduled or manually triggered," but whether a manual trigger is exposed through this public API at all (reachable by the single ops-analyst role under NFR-WEB-004) versus only through an internal/ops-console or cron mechanism outside the user-facing API is not decided by `PD-002`, `ARCH-001`, or any artifact so far. This endpoint is specified below *in case* the scope question is resolved in favor of exposing it, but its existence in the final API is **not committed**. |
| **Auth requirement** | TBD — also contingent on the scope question above, since it's unclear whether the single ops-analyst role should have this capability at all |
| **Request body** | None (triggers the next cycle immediately) |
| **Response 202** | `{ "batchRunId": string, "triggeredAt": timestamp }` — accepted, asynchronous; does not return scores directly (scores land via § 2.3 afterward) |

## 3. ML inference boundary contract (shared with `ML-002`)

This is the one contract both this artifact and `ML-002` must honor identically — per BE-001
instruction 3, it is specified once here, not independently re-invented by `ML-002`.

### 3.1 Request (backend → ML inference boundary)

```json
{
  "orders": [
    {
      "orderId": 12345,
      "features": {
        "...": "opaque key-value map, keys = feature names ML-001 has confirmed are genuinely available at order-placement time, per PROJECT_CONTEXT.md § 3 item 4"
      }
    }
  ]
}
```

**Deliberately not enumerated here:** the exact feature key list. `PROJECT_CONTEXT.md § 3` item
4's prediction-time feature-availability audit has not been performed by any artifact in this
repository yet (confirmed as still open in `ARCH-DESIGN-001` § 5 and `DB-ARCH-001` § 2.6's note on
`shipping_mode`). This backend design commits to **sending whatever feature set `ML-001`/`ML-002`
confirm is valid**, not to a specific list — defining that list here would mean this prompt
silently making an ML-correctness decision it is not authorized to make.

### 3.2 Response (ML inference boundary → backend)

```json
{
  "results": [
    {
      "orderId": 12345,
      "riskScore": 0.73,
      "modelVersion": "string, required — see DB-ARCH-001 § 2.7, must never be omitted",
      "confidence": "optional — populated only once ML-001/ML-002 define a calibration/confidence measure per PROJECT_CONTEXT.md § 3 item 7; absent until then, not defaulted to a fabricated value"
    }
  ]
}
```

**Note:** `riskBand` is deliberately **not** part of this response. **Decision:** risk-band
thresholding (score → High/Medium/Low) is performed by the backend's service layer (§ 1), not
the ML inference boundary — this keeps band-threshold tuning (a product/UX concern, per
`UI-DESIGN-001`) independent of redeploying the inference service itself. This is a design
decision this artifact makes explicitly, not left ambiguous; it can be revisited if `ML-001`/
`ML-002` have a strong reason to own thresholding instead.

### 3.3 Write path (persisting a risk assessment)

After receiving § 3.2's response, the service layer: computes `riskBand` from `riskScore` using
thresholds owned by the service layer (exact threshold values are `ML-001`/`ML-002`'s job per
`UI-DESIGN-001` § 3.1 — "TBD" there, not invented here either); writes one new `risk_assessment`
row per order via the repository layer, populating `order_id`, `model_version` (from § 3.2,
never null — `DB-ARCH-001` § 2.7's `NOT NULL` constraint is enforced at this write path), 
`risk_score`, `risk_band`, `scored_at`, and `feature_snapshot` (the exact `features` map sent in
§ 3.1's request, per `DB-ARCH-001` § 2.7's stated trade-off to support later drift/debugging).

### 3.4 Read path

`GET /orders` (§ 2.3) and `GET /orders/{orderId}` (§ 2.4) both read the **latest** `risk_assessment`
row per order (by `scored_at`); `GET /orders/{orderId}/risk-assessments` (§ 2.5) reads the full
history. No endpoint reads `feature_snapshot` directly — it exists for offline debugging/drift
analysis (`ML-001`'s domain), not for API consumers in MVP scope.

## 4. ADR dependencies and what changes under the alternative

- **ADR-0002 (backend framework):** this contract (§ 2, § 3) is implementable in any mainstream
  backend framework — no Spring-specific behavior is baked into a path, payload shape, or status
  code. If a non-Java backend is chosen instead of the stated Spring Boot preference, nothing in
  this artifact needs to change.
- **ADR-0004 (ML inference architecture):** if a separate Python service is chosen (per
  `ARCH-TRADEOFF-001`'s recommendation), § 3's contract is a network call (e.g., HTTP/gRPC — not
  specified here, `ML-002`'s job); if an embedded/in-process approach is chosen instead, § 3's
  contract becomes an in-process function call with the same request/response shapes. The ML
  inference client boundary (§ 1) is exactly what absorbs this difference.
- **ADR-0005 (auth strategy):** every `TBD pending ADR-0005` marker above resolves to a concrete
  mechanism (e.g., a `Set-Cookie` session vs. a `Bearer` token in `Authorization`) once that ADR
  is accepted; the *presence* of an auth requirement on every endpoint except § 2.1 does not
  change either way.

## 5. Open scope question not resolved here

Whether `POST /risk-assessments/batch-runs` (§ 2.7) belongs in the public API at all, and if so,
which role may call it — flagged back to `PD-002`/`ARCH-001`'s owners per BE-001's own
failure-handling clause, not silently decided.
