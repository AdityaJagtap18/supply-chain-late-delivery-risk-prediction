# Architecture Diagram — User Journeys

Source of truth: [docs/PRD.md §14](../PRD.md#14-user-journeys). Duplicated here as a standalone reference per the requested `docs/architecture/` deliverable.

## Implemented journey — data scientist runs the end-to-end analysis

```mermaid
flowchart TD
    A[Mount Drive / set file_path] --> B[Spark: read CSV, infer schema]
    B --> C[Cast ID columns to string]
    C --> D[Null audit]
    D --> E[Drop rows missing Customer Zipcode]
    E --> F[Drop fully-null & redundant/PII columns]
    F --> G[Univariate EDA: skew, outliers]
    G --> H[Categorical EDA: class balance, geography, segment, market]
    H --> I[Sampling validation: MWU + Chi2 across sample sizes]
    I --> J[Select 50k-row representative sample via selecting_sample]
    J --> K[Persist final_sample.csv]
    K --> L[Bivariate EDA vs target]
    L --> M[Chi2 contingency: drop target-independent categorical features]
    M --> N[MannWhitney U: drop target-independent numeric features]
    N --> O[Drop leakage columns: shipping durations, Delivery Status]
    O --> P[Persist df_last.csv]
    P --> Q[Model 1: target+dummy encode, no drops]
    P --> R[Model 2: drop Customer Segment/Order Country/State/Market/Region, encode]
    P --> S[Model 3: Model-2 drops + KMeans geo cluster feature, encode]
    Q --> T[Fit & compare 9 classifiers, rank by test recall]
    R --> T
    S --> T
    T --> U[Select XGBoost Model-1 encoding as best]
    U --> V[RandomizedSearchCV hyperparameter tuning]
    V --> W[Refit tuned XGBoost]
    W --> X[Feature importance plot]
    X --> Y[Written business interpretation]
```

## Proposed journey (NOT implemented) — ops analyst acts on a risk score

```mermaid
sequenceDiagram
    participant Order as New Order (source system)
    participant Pipe as Inference pipeline (PROPOSED)
    participant Model as Persisted model (PROPOSED)
    participant Analyst as Ops analyst

    Order->>Pipe: New order attributes
    Pipe->>Pipe: Apply same cleaning/encoding as training (PROPOSED)
    Pipe->>Model: Featurized order
    Model->>Pipe: Late-delivery-risk probability
    Pipe->>Analyst: Risk score / flag surfaced (PROPOSED - no UI exists)
    Analyst->>Order: Intervene (expedite shipping, notify customer) (PROPOSED)
```
