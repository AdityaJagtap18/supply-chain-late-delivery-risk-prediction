---
artifact_id: FE-ARCH-001
title: Frontend Architecture — MVP
source_prompt: FE-001
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0001]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the no-polling/no-cross-navigation-caching staleness rules (§ 2.3) and the gap flagged back to
> `UI-DESIGN-001` about a missing manual-refresh affordance (§ 6). Approved as-is, with no
> requested changes.

# Frontend Architecture — MVP

Produced by executing [FE-001](../../../prompt-library/07-frontend-development/FE-001-frontend-architecture.md)
against [UI-DESIGN-001](../ui-ux/UI-DESIGN-001-design-system-and-screens.md) and
[BE-ARCH-001](../backend/BE-ARCH-001-api-and-layering.md) (both Approved), and
[ARCH-DESIGN-001](../architecture/ARCH-DESIGN-001-high-level-architecture.md). This design
consumes `BE-ARCH-001`'s contract **exactly as specified** — no field is invented; where a need
was found that the contract doesn't cover, it is flagged in § 6, not silently added.

**Document History / framework-idiom note (per FE-001 instruction 5):** `ADR-0001` (frontend
framework) is not yet `Accepted` — `ARCH-TRADEOFF-001` only *recommends* Angular, pending human
approval via that ADR. Illustrative code references below use Angular-flavored idioms (services,
RxJS observables) because that is both the stakeholder's stated preference and `ARCH-002`'s
current recommendation, purely for concreteness. The module boundaries, state ownership, and
routing structure themselves do not depend on Angular being chosen — a React/Vue equivalent would
use the same boundaries with different idioms (e.g., a custom hook + a data-fetching library
instead of a service + RxJS). This will be confirmed, not re-derived, once `ADR-0001` is accepted.

## 1. Route map

Every `UI-DESIGN-001` screen maps to exactly one route; no route exists without a corresponding
screen, and no screen is left unrouted.

| Route | Screen (`UI-DESIGN-001`) | Auth-gated? |
|---|---|---|
| `/login` | *(not a `UI-DESIGN-001` screen — the client-side half of `BE-ARCH-001` § 2.1/2.2's session endpoints)* | No — this route exists to *reach* an authenticated state, so it cannot itself require one |
| `/orders` | Screen 1 — Risk Queue (§ 3.1) | Yes — `TBD pending ADR-0005`, per `BE-ARCH-001` § 2.3's own marking |
| `/orders/:orderId` | Screen 2 — Order Risk Detail (§ 3.2) | Yes — `TBD pending ADR-0005`, per `BE-ARCH-001` § 2.4's own marking |

An unauthenticated request to `/orders` or `/orders/:orderId` redirects to `/login` (the
`SessionGate` component from `UI-DESIGN-001` § 5, applied at the route level). The exact
mechanism that detects "unauthenticated" (cookie vs. token presence/validity) is itself
`TBD pending ADR-0005` — this route map does not resolve that, only states where the gate sits.

`BE-ARCH-001` § 2.5 (`GET /orders/{orderId}/risk-assessments`) and § 2.6
(`GET /system/model-versions`) have **no corresponding route** — neither is required by any
`UI-DESIGN-001` screen, and FE-001's validation requirement is "every screen has a route," not
"every endpoint has a route." Not calling these from the frontend in MVP is a deliberate
consequence of that scoping, not an oversight.

## 2. State management

### 2.1 Server-derived state (fetched via `BE-ARCH-001`'s API, never hand-maintained)

| State | Source endpoint | Owner |
|---|---|---|
| Risk queue (list of open orders + current risk) | `GET /orders` (`BE-ARCH-001` § 2.3) | `OrdersQueuePage` container (§ 3.1) |
| `scoresAsOf` timestamp | Same response as above | Same container — rendered alongside the queue, per `UI-DESIGN-001` § 1's staleness requirement |
| Single order's detail + current risk | `GET /orders/{orderId}` (`BE-ARCH-001` § 2.4) | `OrderDetailPage` container (§ 3.2) |
| Authenticated user identity | `POST /auth/sessions` response (`BE-ARCH-001` § 2.1) | A session-scoped store read by `SessionGate` and any component needing the current user |

### 2.2 Client-only state (never sent to or derived from the backend)

- The risk-band filter selection on Screen 1 (`UI-DESIGN-001` § 3.1's filter control) — purely a
  display filter over already-fetched data; it does not trigger a new request unless the backend
  contract is later changed to support server-side filtering (it currently is, via `riskBand` on
  `GET /orders` — see note below).
- **Correction to avoid a self-contradiction:** `BE-ARCH-001` § 2.3 *does* define `riskBand` as a
  server-side query param. This architecture's decision: the filter control re-issues `GET /orders`
  with the `riskBand` query param on change (server-side filtering), rather than filtering a
  client-held full list — this avoids the frontend needing to fetch and hold every risk band's
  data just to filter client-side, and keeps the "default sort is risk-descending" behavior
  (`BE-ARCH-001` § 2.3) authoritative on the server, not re-implemented twice.
- UI-only transient state: which row's detail link has focus, whether a loading skeleton is
  currently shown — these are component-local, not application-wide, state.

### 2.3 Staleness/caching behavior for risk-score data (explicit, per FE-001 instruction 2)

**A stale risk score shown as current is a correctness problem, not a UX nicety — treated as
such here:**

1. **No cross-navigation caching of risk data.** Both `GET /orders` and `GET /orders/{orderId}`
   are re-fetched every time their route is entered (including returning to `/orders` after
   visiting `/orders/:orderId`) — risk scores are not held in a client-side cache that survives
   navigation, to avoid showing a previously-fetched score that may already be superseded by a
   newer batch run (`BE-ARCH-001` § 2.7's batch job, cadence still open per `docs/PRD.md § 24`
   Open Question 7).
2. **No background polling / auto-refresh while a screen is open**, because `docs/PRD.md § 24`
   Open Question 7 (batch-scoring cadence) is unresolved — polling at an interval this artifact
   invented would imply a cadence assumption `PD-002`/`PRD-001` never made. This frontend instead
   relies on the explicit re-fetch-on-navigation behavior above.
3. **`scoresAsOf` (§ 2.1) is always rendered alongside the queue**, per `UI-DESIGN-001` § 1 — the
   frontend never hides which batch run a displayed score comes from.
4. **No optimistic updates.** Risk scores are read-only data from the frontend's perspective (no
   screen writes a risk score — per `UI-DESIGN-001` § 2 item 3, both screens are read-only for
   MVP), so there is no optimistic-update/rollback concern to design for here.

## 3. Component breakdown per screen

Re-uses `UI-DESIGN-001` § 5's component inventory directly — no new component boundary is
introduced that doesn't map back to it, per FE-001's technical constraint.

### 3.1 `/orders` — Risk Queue

- **Container:** `OrdersQueuePage` — calls `GET /orders` (with the current `riskBand` filter
  value, if any) on route entry and on filter change (§ 2.2); owns loading/error/empty state
  derived from that single request; passes fetched data down to presentational children.
- **Presentational (all from `UI-DESIGN-001` § 5, none invented here):**
  - `OrderQueueTable` — renders the fetched order list; receives `riskBand` filter changes and
    reports them up to the container (container re-fetches, per § 2.2).
  - `RiskBadge` — rendered once per row inside `OrderQueueTable`.
  - `EmptyState` — shown when the fetch succeeds with zero orders.
  - `LoadingSkeleton` — shown while the fetch is in flight.
  - `ErrorBanner` — shown on a fetch failure (network error or non-2xx other than 401, which
    instead redirects to `/login` per § 1).
  - `SessionGate` — wraps the whole route.

### 3.2 `/orders/:orderId` — Order Risk Detail

- **Container:** `OrderDetailPage` — calls `GET /orders/{orderId}` on route entry (re-fetched if
  the `orderId` route param changes, per § 2.3 item 1); owns loading/error/not-found state.
- **Presentational (all from `UI-DESIGN-001` § 5):**
  - `OrderDetailPanel` — renders the fetched order detail and current risk, read-only.
  - `RiskBadge` — rendered once, prominently, per `UI-DESIGN-001` § 3.2.
  - `EmptyState`/`LoadingSkeleton`/`ErrorBanner` — same roles as § 3.1, plus a **not-found**
    variant distinct from both (per `UI-DESIGN-001` § 3.2's requirement that "order no longer in
    the queue / invalid identifier" must not look like a loading or transient-error state) —
    triggered by `BE-ARCH-001` § 2.4's `404` response specifically.
  - `SessionGate` — wraps the route.

## 4. Data-fetching error/loading/empty-state handling

Consistent with `UI-DESIGN-001` § 3.1/§ 3.2's visual requirements, mapped to `BE-ARCH-001`'s
actual status codes — no invented status code or behavior:

| Condition | `BE-ARCH-001` response | Frontend behavior |
|---|---|---|
| Fetch in flight | — | `LoadingSkeleton` |
| Success, queue has rows / order found | `200` | Render data via the presentational components in § 3 |
| Success, queue empty | `200`, empty `orders` array | `EmptyState` (distinct from loading, per `UI-DESIGN-001` § 3.1) |
| Order not found | `404` (`BE-ARCH-001` § 2.4) | Not-found state (distinct from `ErrorBanner`, per `UI-DESIGN-001` § 3.2) |
| Unauthenticated | `401` (any endpoint in § 2) | Redirect to `/login`, not `ErrorBanner` — this is a session-state transition, not a data error |
| Network failure / 5xx | — | `ErrorBanner` |

## 5. Illustrative framework note (Angular-flavored, per the Document History note above)

Purely illustrative, not architecturally required: `OrdersQueuePage`/`OrderDetailPage` as Angular
components; the server-derived-state fetches (§ 2.1) as Angular services returning RxJS
`Observable`s, re-subscribed on route activation to satisfy § 2.3 item 1's no-cross-navigation-
caching rule; `SessionGate` as an Angular route guard. A different framework choice under
`ADR-0001` would re-implement the same boundaries (container/presentational split, the
re-fetch-on-navigation rule, the explicit status-code-to-state mapping in § 4) with that
framework's own idioms — none of those boundaries are Angular-specific.

## 6. Gap flagged back (per FE-001's failure-handling clause)

**`UI-DESIGN-001`'s component inventory (§ 5 there) has no "manual refresh" affordance for
Screen 1**, yet § 2.3 above deliberately avoids auto-polling (because the batch cadence is
unresolved) and relies on re-fetch-on-navigation. This means an ops analyst who stays on `/orders`
for an extended period has no way, within the current `UI-DESIGN-001` spec, to pull a newer batch
result without navigating away and back. This is **not resolved by this artifact** — flagged back
to `UI-DESIGN-001`'s owner as a small, specific addition to consider (e.g., a manual "Refresh"
control on `OrderQueueTable`), rather than this frontend-architecture artifact inventing a new UI
treatment `UI-001` never specified, per FE-001's constraint not to add fields/behaviors a
consumed artifact didn't define.
