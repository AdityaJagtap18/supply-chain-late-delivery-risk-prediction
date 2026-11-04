# Generated Artifacts — ML

Artifacts produced by the `08-ml-model-integration` prompt category. See
[prompt-library/08-ml-model-integration/](../../../prompt-library/08-ml-model-integration/) and
[prompt-library/README.md § Artifact metadata](../../../prompt-library/README.md#artifact-metadata).

**This is the highest-stakes domain in this whole system** — every artifact here must explicitly
address the numbered ML correctness concerns in
[prompt-library/PROJECT_CONTEXT.md § 3](../../../prompt-library/PROJECT_CONTEXT.md#3-known-ml-correctness-concerns--carry-forward-do-not-claim-fixed)
(target-encoding/feature-selection leakage, `Customer Id` generalization, prediction-time
feature availability, reproducibility, and the required evaluation-metric set). An artifact that
doesn't is not done, regardless of what else it covers.

**Naming convention:** `ML-PIPELINE-NNN-*.md` (from `ML-001`), `ML-INFERENCE-NNN-*.md` (from
`ML-002`).

## Current artifacts

| Artifact ID | Title | Source prompt | Status | File |
|---|---|---|---|---|
| ML-PIPELINE-001 | Leakage-Free Training Pipeline Design | ML-001 | Approved | [ML-PIPELINE-001-leakage-free-training.md](ML-PIPELINE-001-leakage-free-training.md) |
| ML-INFERENCE-001 | Inference Service Integration — Contract & Pattern | ML-002 | Approved | [ML-INFERENCE-001-service-contract.md](ML-INFERENCE-001-service-contract.md) |
