# `src/frontend` — Angular client

**Status:** Phase 3 complete, then redesigned per `UI-001-REVISION`'s enterprise dashboard
direction (both verified in a real browser, 2026-11-03). Real login (FR-034), risk queue
(FR-032) with an enterprise dashboard shell/KPIs/distribution chart added on top of it, and
order detail (FR-033) — all against the real backend endpoints. See
[`UI-DESIGN-001-REVISION-001`](../../docs/generated/ui-ux/UI-DESIGN-001-REVISION-001-dashboard.md)
for exactly what that redesign added, omitted (no fabricated trend chart or batch-comparison
deltas), and flagged as a contract extension (`orderStatus`/`paymentType` on `GET /orders`).

**Dashboard structure (`app/shell/`, `app/risk-dashboard/`):** `AppShellComponent` (dark navy
sidebar + top bar, wraps every authenticated route) → `RiskDashboardPageComponent` (KPI cards,
risk-distribution donut, an honest "not available" card in place of a trend chart, and
`OrderRiskTableComponent` with client-side search/sort/pagination plus server-side `riskBand`
re-fetch, per `FE-ARCH-001` § 2.2's explicit decision that the risk-band filter re-issues
`GET /orders` rather than filtering a client-held list). `Orders`/`Batch Scoring`/`Reports`/
`Settings` nav items are visibly disabled placeholders — no screen exists for them. "Run Batch
Scoring" is disabled with a tooltip explaining why (no committed trigger endpoint).

**Owns:** the risk list view (FR-032), risk detail view (FR-033), and the client-side half of
authentication (FR-034), per [ADR-0001](../../docs/decisions/ADR-0001-frontend-framework.md)
(Angular, Accepted) and
[ARCH-DESIGN-002](../../docs/generated/architecture/ARCH-DESIGN-002-finalized-architecture.md) § 1.1.

**Must not own:** risk-score computation, encoding/business logic, or persisting order data
beyond what it needs to render the current view. Never requests `customer_location`'s fields
(zipcode/lat/long) — the backend's own contract doesn't expose them (CONS-004).

**Talks to:** the backend API (`src/backend`) only, over `BE-ARCH-001`'s contract exactly —
never the database or the ML inference service directly.

**Structure:**
- `app/login/` — FR-034's sign-in form, calling the real `POST /auth/sessions`.
- `app/risk-queue/` — FR-032's risk queue (`GET /orders`), risk-descending, unscored orders
  shown as "Unscored" rather than hidden. No manual-refresh control (CONS-006's gap, not closed
  by this phase either — navigating away and back is the only way to see fresher data).
- `app/risk-detail/` — FR-033's order detail (`GET /orders/{orderId}`), showing only
  `customer.segment` for customer context (CONS-007 — the contract has nothing richer).
- `app/auth.guard.ts` / `app/services/auth.service.ts` — client-side route gate backed by an
  in-memory signal. **Known limitation, not fixed here:** a page reload loses that signal even
  though the session cookie is still valid server-side, so a reload bounces an actually-logged-in
  user back to `/login`. `BE-ARCH-001` has no "who am I" endpoint to reconcile this against;
  inventing one is out of this phase's scope.
- `app/services/order.service.ts` — `GET /orders`, `GET /orders/{orderId}`,
  `GET /orders/{orderId}/risk-assessments`, all with `withCredentials: true` for the session
  cookie.

**Build/run:** `npm install && npm run build`, or `docker build .` / `docker compose up
--build frontend` from `infra/docker/`. The dev-mode `.env.example`'s `API_BASE_URL` is
hardcoded into `src/environments/environment.ts` (a real build-time/runtime config mechanism is
a later task).

**Verified (2026-11-03), real bugs found and fixed along the way:**
1. (Phase 1, historical) Angular `NG0908` — missing `polyfills: ["zone.js"]` in `angular.json`.
2. (Phase 1, historical) CORS failure — fixed then by a backend `WebConfig.java`, since
   **superseded** by Phase 3's `SecurityConfig`'s own CORS bean (Spring Security owns CORS now
   that it owns the whole filter chain; the separate `WebMvcConfigurer` was removed).
3. **(Phase 3) nginx 404 on direct navigation to a client-side route.** Visiting
   `http://localhost:4200/orders` directly (not via an in-app link) returned nginx's default
   404 — the Dockerfile only renamed nginx's listen port, with no SPA fallback for Angular's
   client-side routes. Fixed by adding `nginx.conf` (`try_files $uri $uri/ /index.html;`),
   copied into the image in place of the old `sed`-patched default config. Re-verified: the same
   URL now serves `index.html` and the Angular router correctly takes over (redirecting to
   `/login` per the reload limitation noted above, or to the queue if already authenticated in
   that tab).

**End-to-end verification (2026-11-03):** against the real four-container stack with a freshly
migrated+seeded database — signed in as the seeded `analyst` test user, saw the real risk queue
(5 seeded orders, correctly risk-sorted, order 5 shown "Unscored"), opened order 4's detail page
(real `customer.segment`, `shippingMode`, and current risk fields), signed out
(`DELETE /auth/sessions` → `204`), and confirmed the browser's network log shows no CORS or
auth errors on any of these real requests.

**Dashboard redesign verification (2026-11-03), real bug found and fixed:**
4. The `riskBand` dropdown filter correctly re-issues `GET /orders` and both the table and the
   KPI/distribution cards update to the filtered subset's real counts (e.g. filtering to "High"
   showed exactly the 2 real high-risk seeded orders, KPI cards recomputing to 2/0/0/2) — this
   matches `FE-ARCH-001` § 2.2's explicit server-side-refetch decision, not a bug.
5. At desktop width (1440×900) the layout matches the reference screenshot's structure,
   proportions, and palette closely: dark navy sidebar, KPI cards, donut chart, and table with
   real data in place of the screenshot's illustrative numbers. At mobile width (375×812) the
   sidebar collapses behind a hamburger/scrim drawer and KPI cards stack to one column, verified
   by toggling the drawer open/closed in a real (emulated) mobile viewport.
6. Console was checked at every step above — no errors.

**Not implemented, consistent with `UI-001-REVISION`'s own "do not fabricate" instructions and
`UI-DESIGN-001-REVISION-001`'s notes:** the risk-trend-over-time chart (no historical endpoint
exists) and "vs. previous batch" deltas on the KPI cards (same reason).

**Phase 4 addition: "Run Batch Scoring" is now real.** `OrderService.triggerBatchScoring()`
calls the real `POST /system/batch-scoring` added in Phase 4
(`risk-dashboard-page.component.ts`). On success it shows the real summary line returned by the
backend (scored/skipped counts) and reloads the order list/KPIs/chart; on failure (ML service
unreachable, etc.) it shows the real abort reason, never a fabricated success. See
[`UI-DESIGN-001-REVISION-001`](../../docs/generated/ui-ux/UI-DESIGN-001-REVISION-001-dashboard.md)'s
addendum.

**Phase 5 addition: unit tests now exist.** `QA-STRATEGY-001` S1's frontend scope (RiskLevelBadge
rendering, staleness display logic) is covered by `app/shared/risk-level-badge.component.spec.ts`
(the High/Medium/Low/stale-"Unscored" states, including the null/undefined/unrecognized-band
cases that must never silently render as "Low") and
`app/risk-dashboard/risk-dashboard-page.component.spec.ts` (the "Last Scored: ..." vs. "No scores
available" distinction driven by `scoresAsOf`). No frontend test infrastructure existed before
this phase — `angular.json`'s `test` architect target, `tsconfig.spec.json`, and the
Karma/Jasmine devDependencies were all added here. **Run:** `npm test` (uses the default
`ChromeHeadless` launcher — a normal, non-root developer machine). **In a container/CI with no
usable Chrome sandbox** (verified here under plain `node:20-bookworm` as root), use Angular's
own built-in `ChromeHeadlessNoSandbox` launcher instead: `npx ng test --watch=false
--browsers=ChromeHeadlessNoSandbox` (no extra `karma.conf.js` needed — it already ships in
`@angular-devkit/build-angular`'s default config). Verified (2026-11-03): 10 specs, all passing.

**Real bug found and fixed during Phase 4 browser verification:** direct two-segment navigation
(e.g. `http://localhost:4200/orders/3` typed directly, or a hard reload on that route) failed
with `Failed to load module script: ... MIME type of "text/html"` — `index.html` had no
`<base href="/">`, so Angular's bundled script tags resolved relative to the *current path*
(`/orders/main.js`, a 404 that nginx's SPA-fallback `try_files` then serves as `index.html`,
tripping the browser's strict module MIME check). The earlier-verified "nginx 404" fix
(`nginx.conf`'s `try_files`) only ever got exercised at a *one-segment* path (`/orders`), where
relative resolution happens to still land correctly — masking this. Fixed by adding
`<base href="/">` to `src/index.html`; re-verified: direct navigation to `/orders/3` now loads
the bundle correctly with no console errors (the subsequent redirect to `/login` on a hard
reload is the already-documented in-memory-auth-signal limitation above, not this bug).
