---
artifact_id: REQUIREMENTS-TRACEABILITY-001
title: Requirements Traceability Matrix — 2026-11-03
source_prompt: ARCH-003
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Requirements Traceability Matrix

Traces every functional and non-functional requirement in `docs/PRD.md` to the architecture/
design artifact(s) that implement it, and (where applicable) to the specific screen, API
endpoint, database entity, or ML contract field that satisfies it. Companion to
[ARCH-CONSISTENCY-001.md](../architecture/ARCH-CONSISTENCY-001.md) and
[ARCH-BLOCKERS-001.md](../architecture/ARCH-BLOCKERS-001.md). Produced by direct inspection of
every cited document's actual text, not by re-deriving requirements from memory.

## 1. Notebook-era functional requirements (FR-001 – FR-025)

These describe the existing notebook prototype as implemented (`docs/PRD.md § 10`), not the web
application. `docs/PRD.md § 25` already provides a complete cell-level traceability matrix for
these; this document does not duplicate it. **Status: Implemented** (in the notebook only — see
`docs/PRD.md § 8`/§ 20 for what is explicitly *not* carried over, e.g. EDA/plotting code, which
`ARCH-DESIGN-001` § 2 formally retires from the production pipeline).

## 2. Planned requirements superseded by the web-application scope

| FR | Description | Original status | Web-app disposition |
|---|---|---|---|
| FR-026 | Persist the trained model | Planned (§ 10) | **Superseded by FR-029** below — same requirement, restated for the web-app context per `docs/PRD.md § 28`'s own note |
| FR-027 | Score new orders | Planned (§ 10) | **Superseded by FR-031** below — scoped specifically to batch, not a general API, per `PD-VISION-001`'s MVP decision |
| FR-028 | Encoding pipeline persistence | Planned (§ 10) | **Superseded by FR-030** below |

## 3. Web-application MVP requirements (FR-029 – FR-034, `docs/PRD.md § 28`)

### FR-029 — Persist trained model artifact

| Implementing artifact | What it provides |
|---|---|
| `ML-PIPELINE-001` § 5 | Serialization format (native model format + JSON metadata sidecar), what metadata must travel with the artifact |
| `ARCH-TRADEOFF-001` § 7 | Recommends file-based storage for MVP (feeds ADR-0007) |
| `DEV-STRATEGY-001` § 3 | Deployment/versioning procedure: independent, hot-swappable publication of the model artifact, with a "current production model version" pointer |
| `DB-ARCH-001` § 2.7 | `risk_assessment.model_version` — the column that records which persisted model produced a given score |

**Gap check:** none found. Every layer (training → storage → deployment → the column that
records the result) is traced and consistent.

### FR-030 — Persist fitted encoding pipeline

| Implementing artifact | What it provides |
|---|---|
| `ML-PIPELINE-001` § 2, § 5 | The leakage-safe target-encoding maps, smoothing parameters, dummy-encoding schema, and cold-start fallback value — all listed as required metadata traveling with the model artifact |
| `ML-INFERENCE-001` § 3 | States explicitly: this fitted state is loaded, never refit, at inference time |

**Gap check:** none found.

### FR-031 — Batch risk-scoring job

| Implementing artifact | What it provides |
|---|---|
| `BE-ARCH-001` § 3 | The ML inference boundary contract (request/response shape) the batch job uses |
| `ML-INFERENCE-001` § 1–2, § 4 | Finalizes the exact feature-key list and response schema; confirms batch (not sync) as the integration pattern |
| `DEV-STRATEGY-001` § 4 | Scheduling/orchestration (cadence left as an explicit placeholder) and failure handling |
| `DB-ARCH-001` § 2.7 | `risk_assessment` — where each scoring cycle's results are written |

**Gap check — BLOCKING (see [ARCH-BLOCKERS-001.md § BLOCK-002](../architecture/ARCH-BLOCKERS-001.md#block-002-critical--type-feature-required-by-the-ml-pipeline-is-unavailable-in-the-database-schema)):**
`ML-INFERENCE-001` § 1's request schema requires a `type` feature value per order; `DB-ARCH-001`
has no column anywhere that stores it (explicitly dropped, § 6). **FR-031 cannot be implemented
exactly as currently specified until this is resolved.**

**Also open (non-blocking, tracked in `ARCH-CONSISTENCY-001` CONS-005):** the actual
batch-scoring cadence (`docs/PRD.md § 24` Open Question 7) and whether a manual-trigger endpoint
(`BE-ARCH-001` § 2.7) exists in the public API.

### FR-032 — Risk list view

| Implementing artifact | What it provides |
|---|---|
| `UI-DESIGN-001` § 3.1 | Screen 1 — Risk Queue, full structural spec |
| `FE-ARCH-001` § 1, § 3.1 | `/orders` route, `OrdersQueuePage` container + presentational components |
| `BE-ARCH-001` § 2.3 | `GET /orders` — the backing endpoint, field-for-field matched to the screen's needs |

**Gap check:** none found at this layer (the screen correctly depends on FR-031 succeeding to
have data to show, which is BLOCK-002's concern, not a gap in FR-032 itself).

### FR-033 — Risk detail view

| Implementing artifact | What it provides |
|---|---|
| `UI-DESIGN-001` § 3.2 | Screen 2 — Order Risk Detail, full structural spec |
| `FE-ARCH-001` § 1, § 3.2 | `/orders/:orderId` route, `OrderDetailPage` container + presentational components |
| `BE-ARCH-001` § 2.4 | `GET /orders/{orderId}` — the backing endpoint |

**Gap check (non-blocking, interpretive — `ARCH-CONSISTENCY-001` CONS-007):**
`UI-DESIGN-001` § 2 calls for "customer-identity/history context"; `BE-ARCH-001` § 2.4 provides
only `customer.segment`. Flagged as an assumption, not a confirmed defect.

**NFR-WEB-003 interaction (non-blocking — `ARCH-CONSISTENCY-001` CONS-004):** `BE-ARCH-001` § 2.4
withholds `Customer Id`/zip/lat/long entirely, which is a stricter posture than `NFR-WEB-003`
required — see `SEC-THREATMODEL-001` § 2/§ 7 item 1 for the open reconciliation item.

### FR-034 — Minimal single-role authentication

| Implementing artifact | What it provides |
|---|---|
| `BE-ARCH-001` § 2.1/2.2 | `POST /auth/sessions`, `DELETE /auth/sessions` |
| `FE-ARCH-001` § 1 | `/login` route, `SessionGate` applied at the route level |
| `UI-DESIGN-001` § 5 | `SessionGate` component definition |
| `DB-ARCH-001` § 2.8 | `app_user` entity |
| `SEC-THREATMODEL-001` § 3 | REQ-AUTH-001/002/003 — the authentication requirements themselves |

**Gap check:** none found. Every layer traces cleanly; the *mechanism* (session vs. token vs.
SSO) is consistently and correctly marked `TBD pending ADR-0005` everywhere it appears, which is
an open decision, not a traceability gap.

## 4. Non-functional requirements (`docs/PRD.md § 28.2`)

| NFR | Requirement | Implementing artifact(s) | Status |
|---|---|---|---|
| NFR-WEB-001 | Authenticated session required for all access | `BE-ARCH-001` §2 (every endpoint except §2.1 marked auth-required); `SEC-THREATMODEL-001` §3 REQ-AUTH-001 | Traced; mechanism `TBD pending ADR-0005` as the NFR itself anticipated |
| NFR-WEB-002 | Batch scoring completes within a defined operational window | **Not set by any artifact.** `DEV-STRATEGY-001` §4 explicitly states the cadence is a placeholder pending `docs/PRD.md §24` Open Question 7 | **Open — no artifact has given this NFR a concrete value yet** (consistent with the NFR's own "to be set by ARCH-002/DEV-001" note, but neither has actually set it) |
| NFR-WEB-003 | Quasi-identifier display restriction | `DB-ARCH-001` §2.2 (access-restricted `customer_location`); `BE-ARCH-001` §2.3/2.4 (never serialized) | Traced, but see CONS-004 — the implementation is stricter than the NFR text anticipated, an open reconciliation item, not an unmet requirement |
| NFR-WEB-004 | Multi-role authorization out of scope for MVP | `DB-ARCH-001` §2.8 (no roles/permissions table); `SEC-THREATMODEL-001` §3 REQ-AUTHZ-001 | Traced and consistently honored everywhere it's referenced |

## 5. Summary

| Requirement | Traceability status |
|---|---|
| FR-029, FR-030, FR-032, FR-033, FR-034 | Fully traced, no blocking gap |
| FR-031 | **Blocked** — see `ARCH-BLOCKERS-001` BLOCK-002 |
| NFR-WEB-001, NFR-WEB-004 | Fully traced |
| NFR-WEB-002 | **Unset** — no artifact has given it a concrete value |
| NFR-WEB-003 | Traced, with an open reconciliation item (CONS-004) |

No functional requirement in `docs/PRD.md § 28` was found with **zero** implementing artifact —
every FR traces to at least one design document. The one hard gap (FR-031/BLOCK-002) is a
data-availability break between two already-Approved artifacts, not a missing design.
