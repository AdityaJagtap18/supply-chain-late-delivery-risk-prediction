---
artifact_id: PD-REVIEW-001
title: Existing Project & PRD Review — Digest
source_prompt: PD-001
source_prompt_version: "1.0"
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Existing Project & PRD Review — Digest

Produced by executing [PD-001](../../../prompt-library/01-product-discovery/PD-001-existing-project-review.md)
against [docs/PRD.md](../../PRD.md) and [docs/PRD_VALIDATION.md](../../PRD_VALIDATION.md). Per
PD-001's scope, this is **read-and-digest only** — no product vision, MVP scope, or technology
recommendation appears below; that is PD-002's job.

## Coverage note

- `docs/PRD.md` — read end to end, all 27 sections.
- `docs/PRD_VALIDATION.md` — read in full.
- `docs/architecture/pipeline-architecture.md`, `docs/architecture/user-journeys.md` — read in
  full (both are short, explicitly-stated duplicates of PRD §15/§14).
- `README.md`, `requirements.txt` — read in full.
- `supply_chain_late_delivery.ipynb` — not re-read cell-by-cell narratively (PRD.md already did
  that); instead parsed programmatically to spot-check specific claims: total cell count,
  presence of the `HAS_RAW_DATA` guard, and whether the GAP-003/GAP-004 fixes described in
  `PROJECT_CONTEXT.md` are actually present in the current cell source.
- `final_sample.csv`, `df_last.csv` — header row only, plus line counts via `wc -l`. No row-level
  data inspected (consistent with PRD_VALIDATION §3's own scoping of this as unnecessary).
- `prompt-library/PROJECT_CONTEXT.md` — read in full before starting, per PD-001's requirement.

No PRD.md-vs-PRD_VALIDATION.md mismatch was found in the "Files and Modules Inspected" sense
described in PD-001's failure-handling clause, so no stop/flag was triggered on that specific
check. One related but distinct repo-state change *was* found — see Confirmed Fact #2 below —
which does not contradict either document but updates what they describe as of today.

## 1. Confirmed facts

Directly observable in the repository right now, independent of any PRD interpretation:

1. **The repository has no application code.** Confirmed by directory listing: only
   `supply_chain_late_delivery.ipynb`, `final_sample.csv`, `df_last.csv`, `README.md`,
   `requirements.txt`, `Project Understandings.docx`, and the `docs/` / `prompt-library/`
   directories exist. No backend, frontend, API, database, or deployment configuration.
2. **`df_last.csv` is now committed to the repository root** (50,001 lines incl. header,
   5.93 MB, 13 columns: `Type, Late_delivery_risk, Customer City, Customer Id, Customer Segment,
   Customer Zipcode, Market, Order City, Order Country, Order Region, Order State, Order Status,
   Shipping Mode`). This is a change from what `docs/PRD.md` §12.1/§15 and both
   `docs/architecture/*.md` files currently state ("`df_last.csv` (produced, **NOT committed**)").
   This isn't a contradiction to stop and flag under PD-001's failure-handling clause — PRD.md
   itself wasn't edited out from under PRD_VALIDATION.md's inspected-file list — but it is a
   fact the PRD/architecture docs no longer accurately describe, and it partially narrows
   **GAP-002** (the reproducibility gap from the modeling dataset not being committed). The
   *schema mismatch* half of GAP-002 still stands: `final_sample.csv` has 32 columns,
   `df_last.csv` has 13 — confirming the PRD's description that `df_last.csv` is the
   post-feature-selection, pre-leakage-column-drop... actually post-leakage-drop table (it
   excludes `Days for shipping (real)`, `Days for shipment (scheduled)`, `Delivery Status`), not
   a copy of `final_sample.csv`.
3. **`final_sample.csv` is 50,000 data rows × 32 columns** (50,001 lines incl. header; 15.66 MB).
   Header matches PRD §12.1's documented column list exactly.
4. **The notebook now has 172 cells** (109 code, 63 markdown), not the 171 PRD §"Read this first"
   cites. This is expected, not a contradiction: `PROJECT_CONTEXT.md` §1 already documents that
   the notebook was patched after the PRD was written (an `HAS_RAW_DATA` guard was added, among
   other fixes), and a guard-cell addition is consistent with a +1 cell count. Confirmed by
   direct inspection: `HAS_RAW_DATA` appears in 34 cells (0, 4–78 range), consistent with a
   guard variable referenced throughout the ingestion/EDA section rather than a single isolated
   patch.
5. **GAP-003 and GAP-004's fixes are present in the current notebook.** Confirmed by direct
   source inspection: the three locations that previously called `model_report.append(...)`
   (cells 138/145/161 per the original PRD cell numbering) now use `pd.concat([model_report, ...])`
   (found at cells 139, 146, 162 in the current 172-cell notebook — the one-cell offset is
   consistent with the added guard cell), and all three `BaggingClassifier(...)` calls use
   `estimator=` rather than the removed `base_estimator=` kwarg. This corroborates
   `PROJECT_CONTEXT.md` §1's claim that the notebook "now runs end-to-end without errors."
6. **`requirements.txt` exists and pins 9 packages** (pandas 2.3.0, numpy 2.2.6, matplotlib
   3.11.1, seaborn 0.13.2, scipy 1.17.1, statsmodels 0.15.0, scikit-learn 1.9.0,
   scikit-posthocs 0.17.1, xgboost 3.4.1, jupyter 1.1.1), with `pyspark` left commented out as
   optional. This directly resolves **GAP-005** (no dependency manifest) as stated in the
   original PRD — the manifest now exists; the PRD text itself has not yet been updated to
   reflect this (it still lists GAP-005 as open in §20's table, dated from before this file was
   added).
7. **`README.md` documents a `HAS_RAW_DATA`-gated execution path** matching what's found in the
   notebook: without the raw `DataCoSupplyChainDataset.csv` present, PySpark ingestion and
   full-population steps are skipped and execution continues from the committed
   `final_sample.csv` — no PySpark/Java setup required for that default path. This is consistent
   with `requirements.txt` leaving `pyspark` commented out as optional.
8. **No ADRs exist yet.** `docs/decisions/` contains only `README.md` and
   `ADR-001-template.md` — no technology or product decision has been formally accepted.
9. **The prompt library's own validation pass already ran** ([LIBRARY_VALIDATION.md](../../../prompt-library/LIBRARY_VALIDATION.md))
   and found the infrastructure itself (prompts, IDs, links, metadata) consistent, prior to this
   being the first prompt actually executed against it.

## 2. Carried-forward assumptions

Every assumption flagged in `docs/PRD.md` and `docs/PRD_VALIDATION.md`, restated here with its
source — none dropped, none silently resolved:

1. **Dataset identity/provenance is unconfirmed.** The source CSV is assumed to be the public
   "DataCo Smart Supply Chain for Big Data Analysis" dataset based on column-name similarity in
   notebook cell 9's markdown (PRD §6, §22; PRD_VALIDATION §4.1). The raw file is absent from the
   repo; no license or citation exists anywhere. **Still unresolved** — this review did not (and
   per PD-001's scope, should not) attempt to confirm it.
2. **Personas are inferred, not stakeholder-confirmed.** The "Supply-chain / operations analyst"
   and "Business / product stakeholder" personas (PRD §5) are inferred from the shape of the
   analysis and markdown commentary, not from any interview or requirements document
   (PRD_VALIDATION §4.2). **Still unresolved.**
3. **Reported model metrics are self-reported and pre-date leakage fixes.** The recall/accuracy
   figures in PRD §23 (e.g., tuned XGBoost recall ≈0.861, GaussianNB recall ≈0.956) come from the
   notebook's markdown/docx narration of a prior run, not from an independent re-execution by
   either the original PRD analysis or this review (PRD §23, PRD_VALIDATION §4.3). They are
   explicitly flagged as likely optimistic due to the target-encoding leakage in **GAP-008**
   (encoding fit before train/test split) — see `PROJECT_CONTEXT.md` §3, item 5. **Still
   unresolved**; no leakage-free re-run has been produced by any artifact in this repository as
   of this review.
4. **The GAP-003/GAP-004 compatibility-failure claims in the original PRD were reasoned, not
   directly observed via a failing stack trace** at the time the PRD was written
   (PRD_VALIDATION §4.4 — no Python environment was available in that session to execute the
   code). This review does **not** carry this specific assumption forward unresolved: unlike the
   other items in this section, it has since been independently corroborated by direct
   inspection of the current notebook source (Confirmed Fact #5 above) and by
   `PROJECT_CONTEXT.md`'s claim of a verified end-to-end run. It is listed here only for
   completeness per PD-001's instruction not to silently drop any PRD_VALIDATION item.
5. **`Project Understandings.docx` is editorially judged to be AI-generated explanatory
   commentary, not an independent requirements source** (PRD_VALIDATION §4.5). This is a
   judgment call made by the original PRD analysis, not a directly verifiable fact; carried
   forward unresolved.
6. All eight ML correctness concerns in `PROJECT_CONTEXT.md` §3 (target-encoding leakage,
   feature-selection leakage, `Customer Id` cold-start risk, prediction-time feature
   availability, unreproduced baseline, recall-only model selection, required broader metric
   set, and raw-dataset provenance/reproducibility) remain **unaddressed by any artifact in this
   repository** as of this review — no fix has been demonstrated with before/after evidence, so
   per `PROJECT_CONTEXT.md` §3's own rule, none should be claimed as resolved.

## 3. Open questions for product discovery

De-duplicated and combined from `docs/PRD.md` §24 and this review's own findings, each phrased as
something a named stakeholder role could actually answer. Ordered roughly by what blocks the most
downstream work first.

1. **(Business stakeholder / data owner)** What is the actual license and provenance of the
   source dataset, and are we permitted to commit it — or a larger sample than today's 50,000
   rows — to this repository, or to a build/training environment outside it?
2. **(Business stakeholder / ops lead)** Who is the intended end consumer of a late-delivery risk
   score once this becomes a web application — a human ops analyst viewing a dashboard, an
   automated system that re-routes or re-prioritizes orders, or both? This directly determines
   whether the web app's primary surface is a UI, an API for another system, or both, and should
   be answered before `PD-002` sets MVP scope.
3. **(Data owner / ops lead)** Is `final_sample.csv`'s 50,000-row size sufficient as the
   training/evaluation dataset for an MVP web application, or does the product need access to
   the full raw dataset (or a larger sample) from day one?
4. **(Business stakeholder)** What is the actual acceptable trade-off between catching true
   late-delivery risk (recall) and over-flagging orders that turn out fine (false positives),
   expressed as a real cost comparison — not just "recall matters more" — now that `PROJECT_CONTEXT.md`
   §3 requires evaluating PR-AUC, precision, F1, and calibration alongside recall rather than
   recall alone?
5. **(Ops lead)** Does the business already have a late-delivery intervention process (e.g., who
   gets notified, what action is taken) that a risk score would feed into, or does that process
   need to be designed as part of this project?
6. **(Legal/compliance or data-privacy owner)** Is retaining `Customer Id`, `Customer Zipcode`,
   `Latitude`/`Longitude`, and `Customer City`/`State` as model features acceptable under the
   organization's data-privacy policy, given that in combination they form a quasi-identifier set
   (PRD §17, §22; GAP-013)?
7. **(Product owner)** Now that `df_last.csv` is committed (Confirmed Fact #2) and
   `requirements.txt` exists (Confirmed Fact #6) — both items the original PRD's Gap Analysis
   (GAP-002, GAP-005) and Phase 1 roadmap called out as missing — should `docs/PRD.md` §20's gap
   table and Phase 1 roadmap be updated to reflect partial completion, or is that update deferred
   to a later prompt (e.g., `DOC-001`)? This is a process question, not a product one, but it
   affects whether later prompts should treat Phase 1 as "done."
8. **(Product owner)** Is the web application expected to retrain or re-score using the
   corrected, leakage-free pipeline before launch, or is an initial launch acceptable using the
   existing (leakage-affected) model as a placeholder while `ML-001`/`ML-002` do the correction
   work in parallel?
9. **(Technical stakeholder who stated the preferred stack)** Are Angular / Spring Boot / Spring
   Security / Python ML service / PostgreSQL-or-MySQL truly open to being outscored by an
   alternative in `ARCH-002`'s trade-off evaluation, or is this direction effectively fixed and
   `ARCH-002` should instead focus on validating and sequencing it rather than comparing it
   against alternatives?
