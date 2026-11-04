---
artifact_id: UI-DESIGN-001
title: UI/UX Design System & Key Screens — MVP
source_prompt: UI-001
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the read-only MVP scope for both screens and the still-open items (batch-cadence staleness
> display, NFR-WEB-003's pending lat/long decision). Approved as-is, with no requested changes.

# UI/UX Design System & Key Screens — MVP

Produced by executing [UI-001](../../../prompt-library/04-ui-ux-design/UI-001-design-system.md)
against [PD-VISION-001](../product/PD-VISION-001-mvp-scope.md), `docs/PRD.md § 28`/`§ 14`, and
[ARCH-DESIGN-001](../architecture/ARCH-DESIGN-001-high-level-architecture.md) (both Approved). No
frontend-framework or component-library name appears anywhere below, per UI-001's constraint.

## 1. Persona and working context (carried over, not invented)

**Primary persona:** operations analyst (per `PD-VISION-001`'s Persona decision — carried over
verbatim, not re-decided here).

**Working context, derived from `PD-VISION-001`'s MVP scope, not invented:** a **queue-based**
workflow, not an alert-driven or passive-dashboard one. Evidence: `PD-VISION-001` scoped MVP to a
**batch/offline risk report** (not live alerts) feeding a **risk list + risk detail view** (FR-032/
FR-033), and its success criterion #3 is framed as "retrieve the top N highest-risk open orders" —
a pull/review action, not a push notification. This satisfies UI-001's failure-handling clause:
the scope is not ambiguous here (list-based review is explicit in `PD-VISION-001`), so this is not
flagged back as a scope gap.

One related ambiguity **is** flagged, not resolved: `docs/PRD.md § 24` Open Question 7 (batch-
scoring cadence) is still open, which means this spec cannot state *how fresh* the queue is at any
given moment. Screen 1 below therefore requires a "scores last updated at [timestamp]" element so
the analyst is never shown a stale score without knowing it's stale — this is a UI requirement
this artifact adds in response to that still-open question, not a resolution of it.

## 2. Information hierarchy — single order's risk view

1. **Most important signal:** the risk band (High / Medium / Low — see § 3.1) plus its underlying
   numeric score. This is the one thing the screen exists to communicate.
2. **Supporting context the analyst needs to act:** Shipping Mode and customer-identity/history
   context — per `docs/PRD.md § 1`/§ 19's own finding that shipping mode and customer identity are
   the strongest predictors, these are shown immediately below the risk band, not buried. Order
   destination (city/region) is shown for operational relevance (per the vision statement's
   "re-route or escalate" framing); raw `Latitude`/`Longitude` is **not** shown pending NFR-WEB-003
   (`docs/PRD.md § 28`), which this spec does not resolve.
3. **Action available from this screen: none, by design.** `PD-VISION-001`'s MVP scope does not
   include executing an intervention inside the application (re-routing, notifying the customer)
   — those happen outside this system today. **This screen is read-only for MVP.** This is stated
   explicitly, per UI-001's instruction 2, rather than silently implying actionability the MVP
   does not have.

## 3. Screens (structural spec, not visual mockups)

Both screens below map directly to an in-scope MVP FR; no out-of-scope screen is included.

### 3.1 Screen 1 — Risk Queue (maps to FR-032)

**Layout regions:**
- Header: page title, "scores last updated at [timestamp]" (see § 1), sign-out control (FR-034).
- Primary region: a table/list of currently open orders, one row per order, columns:
  - Order identifier (display only — not a raw internal key)
  - Risk band (icon + color + text label — see below; never color alone)
  - Shipping Mode
  - Order destination (city/region — not raw coordinates)
  - A row-level control to open Screen 2 for that order
- Default sort: highest risk first (per `PD-VISION-001` success criterion #3).
- Filter control: by risk band, at minimum.

**Risk-band visual treatment and states:**
- Three bands — **High / Medium / Low** — until `ML-001`/`ML-002` define the actual score
  thresholds (not this artifact's job; thresholds are placeholders here, marked `TBD`).
- A fourth, non-risk state — **Stale/Unscored** — for an order with no current-cycle score yet
  (new order placed since the last batch run, or the order predates the online-inference rollout).
  This state must not be visually confused with "Low risk."
- **Every band is encoded as icon + color + text label together — never color alone**, per
  UI-001's accessibility requirement and WCAG non-text-contrast guidance (color-only encoding of
  risk would fail colorblind users, which is a correctness failure for a system whose entire
  purpose is communicating risk).

**Empty state:** "No open orders currently in the queue" (distinct from a loading or error state).
**Loading state:** a skeleton/placeholder for the table while scores are fetched.
**Error state:** an explicit error banner distinguishing "scores failed to load" from "zero open
orders" — these must never look the same to the analyst.

### 3.2 Screen 2 — Order Risk Detail (maps to FR-033)

**Layout regions:**
- Header: order identifier, risk band (same visual treatment as Screen 1, large/prominent),
  "scored at [timestamp]" for this specific order's most recent assessment.
- Primary region, in priority order per § 2: Shipping Mode; customer-identity/history context
  (subject to NFR-WEB-003 — exact fields TBD, not raw lat/long); order destination (city/region);
  other order attributes approved for display once NFR-WEB-003/Open Question 8 is resolved.
- No action controls (read-only, per § 2 item 3).
- A visible link/control back to Screen 1.

**Empty/loading/error states:** same pattern as Screen 1 — a not-found state (order no longer in
the open queue, or an invalid identifier) is distinct from a loading state and from a transient
fetch error.

### 3.3 Out of scope for this spec (explicitly, per PD-VISION-001)

No screen is specified for: a business-stakeholder aggregate dashboard, a live/real-time scoring
view, multi-user/role administration, or an in-app intervention workflow (re-routing, notifying a
customer) — all deferred per `PD-VISION-001`'s Out-of-scope table.

## 4. Design tokens

Color roles (not literal hex values, and not tied to any specific brand — none exists for this
project):
- `risk-high`, `risk-medium`, `risk-low`, `risk-stale` — each must pair with a non-color signal
  (icon + text label, § 3.1); each must meet at least a 3:1 contrast ratio against its background
  for the icon/graphical element and 4.5:1 for any text rendered in that color, per WCAG 2.1 AA.
- `surface`, `surface-alt` — background regions (e.g., table rows vs. page background).
- `text-primary`, `text-secondary` — body text contrast roles.
- `border` — dividers/table borders.
- `status-error` — for the error state only, distinct from any `risk-*` token so an error is never
  visually confusable with a risk level.

Spacing scale (implementation-neutral, e.g., a 4/8/16/24/32(px-equivalent) scale) and a type scale
(e.g., small/base/large/heading) are both required but intentionally left at the token-*name*
level here — `FE-001` assigns concrete values once a frontend framework is selected (ARCH-002/
ADR-0001), per UI-001's technical constraint not to assume a specific component library.

## 5. Component inventory (behavior/appearance, not a library mapping)

- **RiskBadge** — renders a risk band as icon + color + text label (never color alone); has a
  distinct rendering for the `stale`/`unscored` state.
- **OrderQueueTable** — the Screen 1 primary region; supports default sort-by-risk-descending and
  at-minimum a risk-band filter.
- **OrderDetailPanel** — the Screen 2 primary region; read-only.
- **EmptyState**, **LoadingSkeleton**, **ErrorBanner** — shared across both screens, each visually
  distinct from the others (see § 3.1/§ 3.2).
- **SessionGate** — the client-side half of FR-034's authentication requirement; blocks rendering
  of OrderQueueTable/OrderDetailPanel for an unauthenticated session.

## 6. Accessibility requirements (explicit, per UI-001 instruction 5)

- Risk level is never encoded by color alone anywhere in this spec (verified: § 3.1, § 3.2, § 4,
  § 5 all pair color with icon + text).
- Minimum contrast: 4.5:1 for body text, 3:1 for large text and graphical/icon elements (WCAG 2.1
  AA), applying to every `risk-*`/`status-error` token's actual implemented value — a requirement
  on `FE-001`'s token values, not verifiable from names alone.
- Table/list content (Screen 1) must be navigable and readable by assistive technology — row
  semantics, not purely visual grouping.
- Loading and error states must be announced to assistive technology (e.g., via a live region),
  not purely visual — called out here since both are novel screens with no existing accessible
  implementation to inherit from.
