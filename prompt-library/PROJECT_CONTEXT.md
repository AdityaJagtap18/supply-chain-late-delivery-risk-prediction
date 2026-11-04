---
artifact_id: CTX-001
title: Project Context (Required Reading Before Any Prompt Execution)
status: Draft
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: []
---

# Project Context — SupplyChainOptimization

**Read this file in full before executing any prompt in this library.** Every prompt in
`prompt-library/` assumes the executor (human or AI agent) has this context loaded. This file
is itself a controlled artifact: update it whenever a fact below changes, and log the change in
[PROMPT_CHANGELOG.md](PROMPT_CHANGELOG.md).

## 1. What this project actually is today (verified facts)

- **Project:** Supply Chain Late Delivery Risk Prediction (repo name: `SupplyChainOptimization`).
- **Current implementation:** a single Jupyter notebook
  ([`supply_chain_late_delivery.ipynb`](../supply_chain_late_delivery.ipynb)) that ingests a
  supply-chain order dataset, cleans it, performs EDA and statistical feature selection, encodes
  features, trains/compares 9 classifiers across 3 feature-encoding strategies, and tunes an
  XGBoost model. **There is no web application, API, database, or UI yet.**
- **The notebook now runs end-to-end without errors** (verified by direct execution in this
  session). It was patched to: guard the PySpark/full-raw-dataset ingestion section behind a
  `HAS_RAW_DATA` check (the raw dataset is not in this repo — only the pre-sampled
  `final_sample.csv` is), fix library-version-breaking calls (`DataFrame.append`,
  `BaggingClassifier(base_estimator=...)`, an invalid XGBoost hyperparameter grid, a bool/float
  dtype interaction bug in `pd.get_dummies()` under pandas ≥ 2.0), and fix one pre-existing
  indentation typo. See [requirements.txt](../requirements.txt) for the exact dependency
  versions this was verified against.
- **Target state:** a full web application with an integrated ML-based late-delivery-risk
  prediction capability — frontend, backend API, persistent database, and a production ML
  inference service.
- **Preferred technology direction to evaluate (NOT yet approved):** Angular frontend, Java
  Spring Boot backend with Spring Security, a Python ML inference service, and PostgreSQL or
  MySQL for the database. These are stated preferences to evaluate against alternatives in
  [ARCH-002](../prompt-library/03-system-architecture/ARCH-002-architecture-tradeoff-evaluation.md),
  not decisions. No ADR has approved any of them yet — see
  [docs/decisions/README.md](../docs/decisions/README.md).

## 2. Existing documentation — do not duplicate, read first

| Document | What it covers | Produced by |
|---|---|---|
| [docs/PRD.md](../docs/PRD.md) | Full reverse-engineered PRD of the notebook-as-it-exists: features, data model, gaps, roadmap | Pre-dates this prompt library (manual analysis) |
| [docs/PRD_VALIDATION.md](../docs/PRD_VALIDATION.md) | Coverage/validation report for the PRD above | Pre-dates this prompt library |
| [docs/architecture/pipeline-architecture.md](../docs/architecture/pipeline-architecture.md) | Mermaid diagram of the current notebook data/ML pipeline | Pre-dates this prompt library |
| [docs/architecture/user-journeys.md](../docs/architecture/user-journeys.md) | Current + proposed user journeys | Pre-dates this prompt library |
| [README.md](../README.md) | Project summary + how to run the notebook | Pre-dates this prompt library |
| [requirements.txt](../requirements.txt) | Pinned Python dependencies verified to run the notebook | Pre-dates this prompt library |

**Any new prompt execution must read the PRD and gap analysis before producing new artifacts in
the same domain**, to avoid re-deriving or contradicting what's already documented. Where a new
artifact supersedes part of an existing document, it must say so explicitly (see
[PROMPT_STANDARDS.md § Traceability rules](PROMPT_STANDARDS.md)) rather than silently diverge.

## 3. Known ML correctness concerns — carry forward, do not claim fixed

These were identified during the PRD/gap analysis of the existing notebook
([docs/PRD.md §20](../docs/PRD.md#20-gap-analysis), GAP-007/GAP-008 in particular) and **must be
explicitly addressed by name** in any prompt or artifact that touches the ML pipeline (ML-001,
ML-002, and any architecture/PRD work that assumes a given model performance). No prompt output
may claim these are already resolved unless a specific, reviewed artifact demonstrates the fix
with before/after evidence.

1. **Target leakage from target encoding performed before the train/test split.** The existing
   notebook fits target-encoding probability maps on the full dataset, including rows later
   placed in the test set.
2. **Leakage from statistical feature selection (Chi²/Mann-Whitney U) performed before the
   split**, for the same reason.
3. **`Customer Id` target-encoding and generalization.** Using a raw per-customer identifier's
   historical late-delivery rate as a feature risks memorization rather than generalizable
   signal, and is undefined for a customer never seen in training (cold start).
4. **Prediction-time feature availability.** Several features used in training (e.g., values
   derived from the full order record) may not be known or may differ at the moment a
   production system would need to produce a risk score (e.g., at order placement vs. at
   fulfillment). Any productionization prompt must explicitly enumerate which features are
   genuinely available at the intended prediction time.
5. **Reproducibility of existing model results.** The notebook's reported recall/accuracy
   figures were produced before the leakage issues above were corrected; they should be treated
   as directional, not as a validated baseline, until a leakage-free re-run is done.
6. **Model selection based on more than accuracy and recall.** The existing comparison sorts
   models by test recall alone. A production model-selection prompt must also consider PR-AUC,
   ROC-AUC, precision, F1, calibration, and confusion-matrix analysis (see item 7).
7. **Required evaluation metrics going forward:** PR-AUC, ROC-AUC, precision, recall, F1,
   calibration curves, and confusion-matrix analysis — not recall/accuracy alone.
8. **Dataset provenance and reproducible preprocessing.** The full raw dataset
   (`DataCoSupplyChainDataset.csv`) is not in this repository, its license/provenance is
   unconfirmed (see [docs/PRD.md §22](../docs/PRD.md#22-risks-and-assumptions)), and the
   preprocessing that produced `final_sample.csv` cannot currently be re-run by anyone without
   that file.

## 4. AI Agent Execution Rules

These rules apply to **any** AI agent (or human) executing a prompt from this library. They are
restated in [PROMPT_STANDARDS.md](PROMPT_STANDARDS.md); this is the authoritative copy.

1. Read this file (`PROJECT_CONTEXT.md`) before executing any project prompt.
2. Read the referenced prompt completely before acting on it.
3. Inspect all referenced repository files before making recommendations — do not answer from
   assumption or memory of a "typical" project of this kind.
4. Read relevant approved artifacts and ADRs before producing a new artifact in the same domain.
5. Never invent existing functionality or project decisions. If something is unknown, say so.
6. Clearly separate **verified facts** (something observed in the repo), **assumptions**
   (something inferred but unconfirmed), and **recommendations** (a proposal requiring human
   approval) in every generated artifact.
7. Do not modify an artifact with status `Approved` without explicitly documenting the proposed
   change, its rationale, and creating a new version (see artifact versioning rules in
   [PROMPT_STANDARDS.md](PROMPT_STANDARDS.md)) — never a silent in-place edit.
8. Never silently overwrite existing source files or documents. Diff-aware edits only; if a
   rewrite is genuinely required, say so and justify it before doing it.
9. Do not implement a technology choice that has not been approved via an Accepted ADR. Treat
   "preferred direction to evaluate" (§1 above) as exactly that — a candidate, not a decision.
10. Generate outputs only in their designated location (see each prompt's "Output storage
    location" field, and the mapping convention in
    [prompt-library/README.md](README.md)).
11. Include the source prompt ID and version in every generated artifact's metadata block.
12. At the end of any prompt execution, report: files created/modified, unresolved issues or
    open questions, and validation results — do not report silent success if something could
    not be verified.

## 5. Context-loading checklist for a new prompt execution

Before running any prompt `X`:

- [ ] Re-read this `PROJECT_CONTEXT.md` (facts may have changed since last execution).
- [ ] Read prompt `X`'s full definition, including its "Dependencies on other prompts" field.
- [ ] Confirm every prompt it depends on has `Status: Approved` or `Reviewed` (per that prompt's
      own gating — see [PROMPT_STANDARDS.md](PROMPT_STANDARDS.md)).
- [ ] Read every artifact listed in prompt `X`'s "Input files and repository paths to inspect".
- [ ] Check [docs/decisions/README.md](../docs/decisions/README.md) for any ADR relevant to
      prompt `X`'s domain.
- [ ] Confirm the target output location (per prompt `X`'s "Output storage location") does not
      already contain an `Approved` artifact that this execution would overwrite.
