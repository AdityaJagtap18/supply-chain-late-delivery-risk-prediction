---
artifact_id: UI-DESIGN-001-REVISION-001
title: UI Design Revision — Enterprise Dashboard Shell and KPI Summary
source_prompt: UI-001-REVISION
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

> **Approval record.** The project owner requested this revision directly, in detail (component
> list, palette, a reference screenshot, explicit prohibitions on fabricated data), on
> 2026-11-03. Treated as this revision's approval, consistent with how every other `Approved`
> artifact in this repository was approved in this session.

# UI Design Revision — Enterprise Dashboard Shell and KPI Summary

`UI-DESIGN-001` § 3.3 explicitly scoped out "a business-stakeholder aggregate dashboard" for
MVP. `UI-001-REVISION` asks for KPI cards, a risk-distribution chart, and an application shell
(sidebar/top nav) around the existing Screen 1 (Risk Queue). **This supersedes that one line of
§ 3.3 only** — Screen 1 is still FR-032's risk queue (same data, same default sort, same
riskBand filter), Screen 2 is unchanged in scope (FR-033, read-only), and every other § 3.3
exclusion (live/real-time scoring, multi-role admin, in-app intervention) still stands.

**What is added, and what backs it:**
- KPI cards (High/Medium/Low/Total counts) -- computed client-side from the same `GET /orders`
  response Screen 1 already fetches (no new endpoint, no new request).
- A risk-distribution donut -- same data, re-visualized.
- An application shell (sidebar nav, top bar with search/user menu) -- navigation chrome only;
  `Orders`/`Batch Scoring`/`Reports`/`Settings` nav items beyond `Late Delivery Risk` are
  deliberately non-functional placeholders (no screen exists for them) and are marked visually
  disabled, not wired to fake routes.

**What is explicitly NOT added, per `UI-001-REVISION`'s own "do not fabricate" instructions:**
- A risk-trend-over-time chart -- no endpoint returns historical batch-run data
  (`BE-ARCH-001` has no such endpoint; `ARCH-CONSISTENCY-001` CONS-005 already flags that the
  batch cadence/history story is unresolved). Shown as an explicit "not available" state instead
  of an invented line chart.
- "vs. previous batch" percentage deltas on the KPI cards -- same reason; no prior-batch data
  exists to compare against.
- A working "Run Batch Scoring" trigger -- `BE-ARCH-001` § 2.7/§ 5 explicitly leaves
  `POST /risk-assessments/batch-runs` as an undecided scope question, not a committed endpoint.
  Shown disabled with an explanatory tooltip, per `UI-001-REVISION` § 5's own instruction to do
  exactly that rather than invent the endpoint.
- A `Market` column/filter on the order table -- `BE-ARCH-001` § 2.3's `GET /orders` response
  does not include `market`. Omitted rather than invented.

**Contract extension, flagged (not silently added):** `GET /orders`'s response gains two fields
`BE-ARCH-001` § 2.3's original response did not include: `orderStatus` and `paymentType`.
Both already exist on the `order` entity (`DB-ARCH-001` § 2.3, `DB-ARCH-REVISION-001` § 4.1) and
are already exposed elsewhere (`orderStatus` in the § 2.4 detail response; `paymentType` only
internally, per that revision's § 6 — "no endpoint... is required to expose `payment_type`...
no screen needs payment type displayed"). `UI-001-REVISION` § 5 explicitly asks for both columns
in the Order Risk List table, which is a new display requirement that revision itself
introduces; this note records that `GET /orders`'s shape changed to satisfy it, so the gap is
traceable rather than silent.

## Addendum (2026-11-03, Phase 4): "Run Batch Scoring" is now wired

[`ML-PIPELINE-001-REVISION-001`](../ml/ML-PIPELINE-001-REVISION-001-real-training-run.md) § 5
adds the real `POST /system/batch-scoring` endpoint this document's original text said did not
exist. The button above is no longer a disabled placeholder: it calls that endpoint, shows a
real summary line (`"Scored N of M orders (... skipped: unseen category; ... skipped:
incomplete data)"` or the real failure reason on abort — never a fabricated success message),
and reloads the order list/KPIs/distribution chart from the real post-batch data on success. The
risk-trend-over-time chart and "vs. previous batch" deltas remain NOT added, for the same reason
stated above (no endpoint returns historical batch-run data) -- this addendum only concerns the
trigger button.
