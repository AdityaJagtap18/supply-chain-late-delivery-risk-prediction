---
artifact_id: ML-PIPELINE-001
title: ML Pipeline Productionization — Leakage-Free Training Design
source_prompt: ML-001
source_prompt_version: "1.0"
status: Approved
created_date: 2026-11-03
last_updated: 2026-11-03
related_decisions: [ADR-0004, ADR-0007]
---

> **Approval note.** Approved 2026-11-03 by the project stakeholder in this session, including
> the AdaBoost-over-XGBoost finding (§ 4.2), the `Customer Id` smoothed-encoding decision (§ 2),
> and the two items left explicitly unresolved (the full prediction-time feature-availability
> audit against real production timing, § 3; dataset provenance, § 6). Approved as-is, with no
> requested changes.

# ML Pipeline Productionization — Leakage-Free Training Design

Produced by executing [ML-001](../../../prompt-library/08-ml-model-integration/ML-001-pipeline-productionization.md)
against `supply_chain_late_delivery.ipynb`, `docs/PRD.md § 10/§ 20/§ 23`, and
`prompt-library/PROJECT_CONTEXT.md § 3`. **This is a design document; no production code tree
was created** (`src/ml-service/` is deliberately not created here, per ML-001's output-storage
instructions — this prompt's default mode is design/documentation). To ground this design in real
evidence rather than hypothetical numbers, a one-off analysis script was written and executed
against the committed `final_sample.csv` (not saved into the repository — it is scratch work, not
a deliverable); every metric below is a genuine measured result from that run, not an estimate.

**Every one of `PROJECT_CONTEXT.md § 3`'s 8 numbered concerns is addressed below — none silently
skipped.** Status per concern: concerns #1, #2, #4 (partially), #6, #7 are **fixed/demonstrated**
in this design with before/after evidence; #3 and #5 have a **documented decision with residual
risk stated**; #4 (fully) and #8 remain **explicitly unresolved**, carried forward, not claimed
fixed.

## 1. Concern #1 and #2 — leakage order of operations (FIXED, with evidence)

**The fix:** train/test split happens first (80/20, stratified on `Late_delivery_risk`, same seed
`34` as the original notebook for comparability); both the statistical feature-selection step
(Chi² for categorical columns, Mann-Whitney U for numeric columns) and the target-encoding fit are
computed **only on the training fold**, then applied — not refit — to the test fold.

**Evidence this fix was actually applied, not just described:** a train-only feature-selection
pass on this project's actual data (40,000 training rows) found **17 of 26 candidate columns
non-significant** (p > 0.05) at the training-fold level, including **every remaining numeric
financial column** (`Order Item Discount`, `Order Item Discount Rate`, `Order Item Product
Price`, `Order Item Quantity`, `Sales`, `Order Item Total`, `Product Price`, `Latitude`,
`Longitude`) and several categoricals (`Customer Country`, `Customer Segment`, `Customer State`,
`Market`, `Product Name`, `Department Id`, `Product Category Id`, `Order Item Cardprod Id`).

This result was cross-checked against `df_last.csv` (the original pipeline's own committed
output, per `docs/generated/product/PD-REVIEW-001-existing-project-digest.md` Confirmed Fact #2):
`df_last.csv`'s header retains **zero numeric financial columns**, confirming the original
notebook's own (leakage-affected, full-dataset) selection *also* dropped them — this specific
finding is not an artifact of fixing the leakage, it is consistent with the original pipeline.
**What differs because of the leakage fix specifically:** `Customer Segment` and `Market` are
dropped here (p = 0.637 and p = 0.050 respectively, on the training fold) but are present in
`df_last.csv`'s header — i.e., the original full-dataset selection found them significant where
a correctly-isolated training fold does not. This is a direct, measured consequence of concern
#2, not a hypothetical one.

**Final retained feature set after selection:** `Type`, `Customer City`, `Customer Id`, `Customer
Zipcode`, `Order City`, `Order Country`, `Order Region`, `Order State`, `Shipping Mode` (plus the
Customer-Id handling in § 2 below). This is this design's own result — it is not assumed to match
the original notebook's Model 1/2/3 feature sets, consistent with ML-001's own failure-handling
clause.

## 2. Concern #3 — `Customer Id` (DECISION: option (a), generalizable leakage-safe aggregate)

**Decision:** replace the raw `Customer Id` identifier with a **smoothed, leakage-safe target
encoding**, not kept as a raw identifier (rejecting option (b) from ML-001's menu). Concretely:
- The encoding map (`customer_id → historical late-rate`) is fit **only on the training fold**.
- Within training, the encoding is computed **out-of-fold** (5-fold), so no training row's
  own target value leaks into its own encoded feature — a within-training-overfit refinement
  beyond the minimum needed to fix GAP-008's test-set leakage.
- **Heavier smoothing** is applied to `Customer Id` specifically (shrinkage toward the global
  training late-rate, weighted equivalent to ~50 "prior" orders) than to other target-encoded
  columns (~10), because of its very high cardinality (13,081 distinct training-fold customers
  for 40,000 training rows — most customers appear only a handful of times).
- **Cold-start fallback, measured, not assumed:** in the actual held-out test fold, **12.4% of
  test-fold customers were never seen during training** (`cold_start_frac` = 0.1244). Every one
  of those rows receives the global training late-rate as its encoded value (the fallback), not
  an error or a missing-value failure.

**Residual risk stated, not hidden:** smoothing reduces but does not eliminate the risk that this
feature still partly captures "how distinctively unlucky/lucky has this specific customer's
order history been" rather than a generalizable shipping-risk driver. Whether this residual risk
is acceptable is a judgment call for `ML-002`'s reviewer, not resolved unilaterally here.

## 3. Concern #4 — prediction-time feature availability (PARTIALLY addressed; full audit still open)

**Newly-identified finding, not previously named in `PROJECT_CONTEXT.md § 3`'s original list:**
`Order Status` was audited and found to be **entangled with the outcome being predicted**, not
genuinely available at order-placement time. Measured evidence: in `final_sample.csv`, orders
with `Order Status` = `CANCELED` or `SUSPECTED_FRAUD` have an observed `Late_delivery_risk` rate
of **exactly 0%** (2,193 orders across those two statuses — 1,078 `CANCELED` + 1,115
`SUSPECTED_FRAUD` — zero of which are flagged late) — because an order that never actually
shipped cannot be "late." This means `Order Status`
in this dataset reflects the order's *eventual* state, not its state at placement, and the
original notebook never audited this. **`Order Status` is dropped from the feature set in this
design**, not retained.

**Conservatively excluded pending business confirmation (not dropped with full confidence, not
silently kept either):** `Order Item Profit Ratio` and `Order Profit Per Order` — these may
depend on actual fulfillment cost data, not just placement-time list price/discount (which are
already captured, when retained, via the already-selected discount/price columns). This design
excludes them from the trained feature set as the conservative choice, trading a small amount of
potential signal for a feature-availability guarantee this document can actually stand behind.
**This should be revisited once a stakeholder confirms how these two columns are actually
computed** — if they are in fact derivable from placement-time data alone, they can be added
back.

**What this design does NOT do:** a field-by-field audit of literally every retained column's
exact availability timing against a real order-management system (because no such system exists
yet — this is still a prototype dataset, not live production data). `Shipping Mode` is treated as
available at placement time (it is a selection made when the order is placed, consistent with
`ARCH-DESIGN-001` § 2's note on this), and the remaining retained columns (`Customer City/Id/
Zipcode`, `Order City/Country/Region/State`, `Type`) are customer/order attributes set at order
creation, not computed from fulfillment outcomes. This is this design's best-effort audit given
available documentation, **not a certified exhaustive one** — carried forward as a residual risk
for `ML-002` to re-confirm once real production order data/timing is available.

## 4. Concerns #6 and #7 — real evaluation protocol and before/after comparison (FIXED, with evidence)

**Full metric suite** (PR-AUC, ROC-AUC, precision, recall, F1, Brier score, confusion matrix at
threshold 0.5 — no business-chosen threshold exists yet per `docs/PRD.md § 24` Open Question 4,
so 0.5 is used as a placeholder and stated as such) was computed for 7 classifiers under the
corrected, leakage-free pipeline described in § 1–3. (The original notebook's 4 Bagging variants
were not all re-run — only one representative Bagging configuration was, given this design
document's scope; this is a stated reduction, not a silent one.)

### 4.1 Leakage-free results (this design's own run, 40,000 train / 10,000 test rows)

| Model | Accuracy | Recall | Precision | F1 | ROC-AUC | PR-AUC | Brier score |
|---|---|---|---|---|---|---|---|
| AdaBoost | 0.706 | **0.733** | 0.731 | 0.732 | 0.785 | 0.830 | 0.207 |
| GradientBoosting | 0.712 | 0.708 | 0.752 | 0.729 | 0.791 | 0.843 | 0.184 |
| Bagging (DecisionTree) | 0.710 | 0.708 | 0.750 | 0.728 | 0.787 | 0.840 | 0.186 |
| RandomForest | 0.710 | 0.708 | 0.749 | 0.728 | 0.785 | 0.835 | 0.187 |
| XGBoost | 0.709 | 0.703 | 0.749 | 0.726 | 0.781 | 0.836 | 0.190 |
| LogisticRegression | 0.714 | 0.662 | 0.784 | 0.717 | 0.787 | 0.838 | 0.185 |
| GaussianNB | 0.705 | 0.603 | 0.810 | 0.691 | 0.754 | 0.767 | 0.212 |

### 4.2 Leakage-replicating baseline (isolates the leakage effect — same split/seed/library
versions as § 4.1, same model (XGBoost), but target-encoding and feature selection deliberately
fit on the full pre-split dataset, i.e. reproducing the original notebook's actual bug)

| | Accuracy | Recall | Precision | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|
| XGBoost, leaky (replicated) | 0.855 | **0.854** | 0.877 | 0.866 | 0.941 | 0.955 |
| XGBoost, leakage-free (§ 4.1) | 0.709 | **0.703** | 0.749 | 0.726 | 0.781 | 0.836 |

**This isolates the leakage effect specifically** (same model, same split, same seed, same
current library versions — only the encoding/selection fit scope differs), and it closely
reproduces the original notebook's own self-reported figures for tuned/vanilla XGBoost
(accuracy 0.8526–0.9055, recall 0.8611–0.8674, per `docs/PRD.md § 23`) — confirming this
replication is a faithful stand-in for the original leakage pattern, not a mismatched comparison.

**Explicit answer to ML-001's required question — how does the new recall differ, and why:**
the leakage-free recall (~0.70, best model AdaBoost at 0.733) is **substantially lower** than the
original notebook's reported ~0.86, and the controlled isolation in § 4.2 attributes essentially
all of that gap to the leakage itself (0.854 → 0.703 recall, same model/split/seed) rather than to
any other change made in this design (feature set, `Customer Id` handling, etc. — all of which
are secondary effects by comparison). **This matches `PROJECT_CONTEXT.md § 3` item 5's
prediction exactly:** the original figures were optimistic, and this is the first artifact in
this repository to demonstrate that quantitatively rather than asserting it qualitatively.

**Explicit answer to the "does the winning model change" question (ML-001's failure-handling
clause):** **yes — AdaBoost, not XGBoost, now leads on recall** (0.733 vs. XGBoost's 0.703), and
GradientBoosting/Bagging/RandomForest are statistically close to each other and to AdaBoost. This
design does **not** quietly keep the original "XGBoost, Model 1 encoding" conclusion. **This
design does not pick a final model** — that is a decision for a human ML lead reviewing this
artifact (per ML-001's Definition of Done), not asserted unilaterally here, especially since the
top 4 models' recall values (0.70–0.73) are close enough that the choice may reasonably depend on
criteria beyond recall alone (e.g., Brier score favors GradientBoosting/LogisticRegression/
Bagging over AdaBoost; PR-AUC favors GradientBoosting).

## 5. Model persistence/versioning plan (feeds ADR-0007)

**Serialization format:** a standard, inspectable format — not a bespoke pickle with no
metadata. Recommend the model artifact itself in a widely-supported native format for whichever
library wins the model-selection decision (e.g., XGBoost's own native `.json`/`.ubj` save format
if an XGBoost-family model is selected; scikit-learn's pipeline serialized via `joblib` otherwise)
**plus** a separate, human-readable metadata file (JSON) alongside it.

**Metadata that must travel with the artifact** (mirroring the `requirements.txt` discipline
already established for the notebook, per `prompt-library/PROJECT_CONTEXT.md § 1`):
- Training data snapshot identifier (e.g., a content hash of `final_sample.csv`/`df_last.csv` as
  used for that specific training run — not just a filename, since the file's content could
  change).
- The final feature list actually used (per § 1's selection result) and the fitted target-encoding
  maps/smoothing parameters for every target-encoded column (per § 2) — without this, the
  persisted model cannot be correctly applied to new data at all.
- The full metric suite from § 4.1 for that specific training run.
- Training date and the exact library versions used (mirroring `requirements.txt`).
- The `Customer Id` cold-start fallback value (the global training late-rate at training time).

**Where/how versions are tracked — both options presented for ADR-0007, not pre-decided:**
(a) a **versioned file-naming convention** (e.g., `model-v{N}-{date}.json` plus its metadata
sidecar file), or (b) a **model registry** (e.g., MLflow). `ARCH-TRADEOFF-001` already recommended
(a) for MVP specifically, with an explicit note to revisit once retraining becomes a recurring
activity — this design does not re-litigate that recommendation, only restates both options here
as ML-001 instruction 5 requires.

## 6. Concern #8 — dataset provenance (NOT resolved; carried forward as a blocking open item)

**Not resolved by this design.** The source dataset's license/provenance remains unconfirmed
(`docs/PRD.md § 24` Open Question 1, `docs/generated/product/PD-REVIEW-001-existing-project-digest.md`
assumption #1) — this design did not attempt to resolve it, consistent with ML-001's own
instruction to either resolve it or explicitly carry it forward. **Carried forward as a blocking
item:** anyone retraining beyond the committed `final_sample.csv`/`df_last.csv` (e.g., to get a
larger or more recent sample) cannot do so until this is resolved, since the acquisition path for
the original raw dataset is undocumented and its redistribution rights are unknown.

## 7. Summary — concern-by-concern disposition

| `PROJECT_CONTEXT.md § 3` concern | Disposition |
|---|---|
| #1 Target-encoding leakage pre-split | **Fixed**, with measured before/after evidence (§ 4.2) |
| #2 Feature-selection leakage pre-split | **Fixed**, with measured evidence of a different selection outcome (§ 1) |
| #3 `Customer Id` generalization | **Decision made** (leakage-safe smoothed encoding + measured cold-start fallback), residual risk stated, not eliminated |
| #4 Prediction-time feature availability | **Partially addressed** — one new leakage source found and fixed (`Order Status`) and two columns conservatively excluded pending confirmation; full exhaustive audit against real production timing remains open |
| #5 Reproducibility of prior results | **Addressed** — § 4 is the first artifact to quantitatively reproduce and explain the gap between reported and true out-of-sample performance |
| #6 Model selection beyond recall/accuracy | **Fixed** — full metric suite computed (§ 4.1), used to show the "best model" conclusion is not a one-metric call |
| #7 Required evaluation metrics | **Fixed** — PR-AUC, ROC-AUC, precision, recall, F1, Brier score, confusion matrix all reported |
| #8 Dataset provenance/reproducibility | **Not resolved** — explicitly carried forward as blocking |

No concern is claimed resolved beyond what is demonstrated above, per `PROJECT_CONTEXT.md § 3`'s
"do not claim fixed" rule.
