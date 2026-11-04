---
artifact_id: ML-INFERENCE-001
title: ML Inference Service Integration — Contract & Pattern
source_prompt: ML-002
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0004]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the finalized request/response schemas (§ 1–2), the batch-over-sync integration recommendation
> (§ 4), and the still-open items in § 6. Approved as-is, with no requested changes.

# ML Inference Service Integration — Contract & Pattern

Produced by executing [ML-002](../../../prompt-library/08-ml-model-integration/ML-002-inference-integration.md)
against [ML-PIPELINE-001](ML-PIPELINE-001-leakage-free-training.md) and
[BE-ARCH-001](../backend/BE-ARCH-001-api-and-layering.md) (both Approved). This finalizes, not
reinvents, the ML-inference-boundary contract `BE-001` already sketched.

## 0. Conflict check against `BE-001`'s sketch (per ML-002's failure-handling clause)

**No conflict found.** `BE-ARCH-001` § 3 sketched the request as `{ orders: [{ orderId,
features: {...opaque map...} }] }` and the response as `{ results: [{ orderId, riskScore,
modelVersion (required), confidence (optional) }] }`, with `riskBand` deliberately **excluded**
from the response (a decision `BE-001` already made: band thresholding happens in the backend's
service layer, not the ML boundary). The finalized contract below (§ 2–3) matches this shape
exactly — the only thing this artifact adds is the concrete feature-key list and the concrete
rationale for the integration pattern, neither of which contradicts `BE-001`'s sketch. No
amendment to `BE-ARCH-001` is required.

## 1. Request schema — finalized feature list (per ML-001's cleared-for-inference set only)

Cross-checked field-by-field against `ML-PIPELINE-001` § 1/§ 3 (not against the original
notebook's full feature set, per ML-002 instruction 1):

```json
{
  "orders": [
    {
      "orderId": 12345,
      "features": {
        "type": "string",
        "customerCity": "string",
        "customerId": "integer",
        "customerZipcode": "string",
        "orderCity": "string",
        "orderCountry": "string",
        "orderRegion": "string",
        "orderState": "string",
        "shippingMode": "string"
      }
    }
  ]
}
```

**Every key above is one of `ML-PIPELINE-001` § 1's final retained feature set** (`Type`,
`Customer City`, `Customer Id`, `Customer Zipcode`, `Order City`, `Order Country`, `Order
Region`, `Order State`, `Shipping Mode`) — nothing else. In particular:
- `Order Status` is **not** a request field — `ML-PIPELINE-001` § 3 found it entangled with the
  outcome (0% late-rate for `CANCELED`/`SUSPECTED_FRAUD` orders) and dropped it; including it
  here would silently reopen a leakage source `ML-001` just closed.
- `Order Item Profit Ratio`/`Order Profit Per Order` are **not** request fields — conservatively
  excluded pending business confirmation per `ML-PIPELINE-001` § 3; they cannot be added to this
  contract until that confirmation happens and `ML-001`'s artifact is revised accordingly.
- No numeric financial column (`Sales`, `Order Item Discount`, `Product Price`, etc.) appears —
  `ML-PIPELINE-001` § 1 found all of them statistically non-significant on the training fold.

## 2. Response schema — finalized

```json
{
  "results": [
    {
      "orderId": 12345,
      "riskScore": 0.73,
      "modelVersion": "string, required",
      "confidence": null
    }
  ]
}
```

- **`modelVersion` matches `DB-ARCH-001`'s `risk_assessment.model_version` field name's
  *meaning* exactly** (per ML-002's validation requirement) — this is the same identifier that
  travels with the persisted model artifact per `ML-PIPELINE-001` § 5's metadata plan, and the
  backend writes it unchanged into `risk_assessment.model_version` on the write path
  `BE-ARCH-001` § 3.3 already defined. Never omitted, never defaulted to a placeholder.
- **`confidence` is `null` in this version of the contract, not fabricated.** `ML-PIPELINE-001`
  § 4 produced an *aggregate* calibration measure (Brier score, per model, on the test set) but
  not a *per-prediction* calibrated confidence value — those are different things, and inventing
  a per-prediction number from an aggregate metric would misrepresent what `ML-001` actually
  demonstrated. This field is reserved in the schema for when/if a per-prediction calibration
  method (e.g., a calibrated classifier wrapper) is added in a future revision of `ML-001`'s
  pipeline; it is not populated now.
- **`riskBand` is absent, per `BE-001`'s decision** (see § 0) — band thresholding happens in the
  backend's service layer from `riskScore`, not here.

## 3. Encoding consistency at inference time (never refit)

Per `ML-PIPELINE-001` § 2/§ 5, the following fitted state travels with the model artifact and is
**loaded, never refit**, by the inference boundary:
- The leakage-safe target-encoding maps (category → smoothed historical late-rate) for
  `Customer City`, `Customer Id`, `Customer Zipcode`, `Order City`, `Order Country`, `Order
  Region`, `Order State` — each fit once, on the training fold only, during the `ML-001` training
  run that produced this `modelVersion`.
- The dummy-encoding column schema for `Type` and `Shipping Mode` (which categories map to which
  one-hot columns, and which is the dropped reference category).
- The `Customer Id` cold-start fallback value (the global training-fold late-rate at training
  time) — applied whenever an incoming `customerId` is not present in the loaded encoding map,
  exactly as `ML-PIPELINE-001` § 2 measured (12.4% of test-fold customers hit this path).

**Why this matters enough to restate explicitly:** refitting any of this at inference time —
even "just updating" the `Customer Id` map with newer data — would silently reintroduce a form of
the exact leakage `ML-001` fixed, by a different path (the model would be scored against encoding
statistics it was never trained against). This inference boundary's contract is: load the
artifact's fitted state as-is; never recompute it.

## 4. Integration pattern — concrete recommendation

**Recommended: (b) batch/offline scoring, writing to `risk_assessment` on a schedule — not (a)
synchronous per-request HTTP calls.**

This is not a new decision — it **confirms and finalizes** what `PD-VISION-001`'s already-approved
MVP scope and `BE-ARCH-001`'s already-approved FR-031 already committed to (batch/offline risk
report, explicitly not a live-scoring API, per `PD-VISION-001`'s Out-of-scope table). Cited
concretely, per ML-002's validation requirement: `PD-VISION-001`'s MVP success criteria (e.g.,
"a newly placed order appears in the risk report within one scheduled batch-scoring run... without
any manual notebook execution") describe a periodic batch workflow, not an instant-on-placement
one — the MVP does not need a score the instant an order is placed.

This also lines up with `ARCH-TRADEOFF-001` § 4's ADR-0004 recommendation (a separate Python
inference service) and § 6's deployment recommendation (serverless specifically considered for
FR-031's batch job) — all four artifacts (`PD-VISION-001`, `BE-ARCH-001`, `ARCH-TRADEOFF-001`,
this one) now agree on batch, not sync, for MVP. If a future phase adds a live-scoring need
(explicitly out of MVP scope today), this pattern — and ADR-0004's answer — would need
re-evaluation; this artifact does not attempt to design for that hypothetical now.

## 5. Error/fallback behavior (batch-specific, per § 4's recommended pattern)

The failure modes ML-002 instruction 5 frames (fail the request vs. serve a stale cached score)
presume a synchronous call; under the recommended batch pattern they translate as follows:

- **Whole-batch-run failure** (inference boundary unreachable/erroring for the entire run): the
  batch job aborts without partial writes to `risk_assessment` for that run; the previous cycle's
  scores remain as the latest ones (each still carrying its own `scored_at`), so `FE-ARCH-001`
  § 2.3's `scoresAsOf`/staleness display surfaces this automatically — the frontend never shows a
  fabricated "current" score, it shows the honestly-last-successful one. The run is logged and
  retried/alerted per whatever `DEV-001`'s operational design specifies (not decided here).
- **Per-order failure within an otherwise-successful batch** (e.g., malformed features for one
  order): that order's `risk_assessment` is simply not updated this cycle — same stale-but-honest
  outcome as above, scoped to one order rather than the whole run, logged for investigation.
- **Low-confidence output:** **not applicable in this contract version**, since § 2 does not yet
  populate a per-prediction `confidence` value to threshold on. Deferred until a future revision
  of `ML-PIPELINE-001` produces one — not designed against a field that doesn't exist yet.

## 6. Summary of what this artifact finalizes vs. leaves open

| Finalized here | Still open (not this artifact's job) |
|---|---|
| Exact request feature-key list (§ 1) | ADR-0004 itself (this artifact feeds it, doesn't accept it) |
| Exact response schema incl. `modelVersion` (§ 2) | Risk-band threshold values (`UI-DESIGN-001`/`DB-ARCH-001` both already marked these `TBD`, owned by a future `ML-001`/`ML-002` revision) |
| Encoding-consistency mechanism (§ 3) | Per-prediction confidence/calibration (deferred, § 2) |
| Integration pattern = batch, with rationale (§ 4) | Batch-scoring cadence (`docs/PRD.md § 24` Open Question 7 — still unresolved) |
| Batch-specific error/fallback behavior (§ 5) | Operational retry/alerting mechanics (`DEV-001`'s job) |
