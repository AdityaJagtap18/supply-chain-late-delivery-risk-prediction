# Architecture Diagram — Notebook Data/ML Pipeline

Source of truth: [docs/PRD.md §15](../PRD.md#15-system-architecture). Duplicated here as a standalone reference per the requested `docs/architecture/` deliverable.

```mermaid
flowchart LR
    subgraph Source
        CSV[("DataCoSupplyChainDataset.csv\n(NOT in repo)")]
    end
    subgraph "Notebook execution (Google Colab)"
        direction TB
        Spark["PySpark\n(ingest, clean, EDA on full population)"]
        Sampling["Statistical sampling validation\n(pandas + scipy)"]
        Pandas["pandas / seaborn / matplotlib\n(EDA on sample)"]
        FeatSel["Feature selection\n(Chi2 / Mann-Whitney vs target)"]
        Encode["Encoding\n(target encoding + dummies + KMeans cluster)"]
        Train["scikit-learn / xgboost\n(train, compare, tune)"]
    end
    subgraph Artifacts
        FinalSample[("final_sample.csv\n(committed to repo)")]
        DfLast[("df_last.csv\n(produced, NOT committed)")]
        Plots["In-notebook plots\n(not persisted as files)"]
        ModelArtifact["Trained model\n(in-memory only — NOT persisted)"]
    end

    CSV --> Spark --> Sampling --> FinalSample
    FinalSample --> Pandas --> FeatSel --> DfLast --> Encode --> Train --> ModelArtifact
    Pandas --> Plots
    FeatSel --> Plots
    Train --> Plots
```

All elements above are **implemented**, except the two artifacts explicitly marked "NOT committed" / "NOT persisted," which the notebook produces transiently in-session but does not save to the repository.
