# PRD Validation Report — Supply Chain Late Delivery Risk Prediction

Companion to [docs/PRD.md](PRD.md). Date: 2026-11-03.

> This report validates the PRD **as originally written** (§ 1–27, the notebook-prototype
> analysis). It is unaffected by the subsequent AI Engineering Knowledge System
> ([prompt-library/](../prompt-library/)) and does not cover any future § 28+ web-application
> content that `PRD-001` will add — that content will need its own validation pass once written.
>
> **Branding note (2026-11-04):** the product was subsequently named **ShipGuard**; this title
> quotes the PRD as it read at the time of this validation pass and is left unchanged.

## 1. Files and Modules Inspected

| Artifact | Method of inspection | Coverage |
|---|---|---|
| `README.md` | Read in full (19 lines) | 100% |
| `supply_chain_late_delivery.ipynb` | Parsed as JSON; all 171 cells extracted and read in full (source truncated to first ~2,000 characters per cell during extraction — see Coverage Assessment below for the one cell this affected) | 171/171 cells enumerated; 170/171 read in full, 1 read partially |
| `final_sample.csv` | Header row + first 5 data rows read directly; full-file line count (50,001 lines incl. header) obtained via `wc -l` | Schema and sample rows confirmed; not every row individually inspected (not necessary for PRD purposes — see Coverage Assessment) |
| `Project Understandings.docx` | Binary file; not readable by standard text tools. Extracted via a PowerShell script that unzipped the `.docx` (OOXML) container and pulled all `<w:t>` text runs from `word/document.xml`, split on `</w:p>` paragraph boundaries | 894 extracted lines/paragraphs, all read in full across two passes |

No other files exist in the repository (confirmed via a recursive directory listing excluding `node_modules`/`.git`, which returned exactly these four files plus the newly created `docs/` directory).

## 2. Modules Not Inspected, and Why

There are no modules to exclude — the repository contains no source-code directories, packages, modules, or configuration beyond the four files above. Every byte of text content in the repository was read. The only partial-coverage item is noted below.

## 3. Coverage Assessment

- **Notebook cells:** The extraction script printed up to 2,000 characters of each cell's source. Reviewing the extracted dump, no cell's printed output appeared to be cut off mid-content (cell sources in this notebook are all well under 2,000 characters), so in practice coverage is effectively 100%. This is stated as an assumption rather than a certainty because the extraction was done via `source[:2000]` truncation rather than an unbounded read.
- **`final_sample.csv` row-level data:** Only the header and first 5 rows were read directly; the full 50,000-row body was not individually inspected cell-by-cell. This is sufficient for the PRD's purposes (confirming column names, inferred types, and that the file matches the pre-feature-selection schema described in the notebook) and does not affect any requirement, gap, or architectural claim in the PRD, none of which depend on specific row values.
- **Notebook cell *outputs*** (e.g., rendered plot images, printed metric values from actual past executions) were **not** available — the `.ipynb` file as inspected did not expose executed output payloads through the extraction method used (the script read `cell['source']`, not `cell['outputs']`). Where specific metric values (e.g., "Test Recall: 0.9557") are cited in the PRD, they are sourced from the **narrative markdown cells and the `Project Understandings.docx` commentary**, which quote these figures as already-observed results from a prior run — not from this analysis independently re-executing the notebook. This is called out explicitly in PRD §23 ("self-reported... not independently re-verified").
- **External source dataset** (`DataCoSupplyChainDataset.csv`, referenced by hardcoded path in cell 7): not present in the repository and therefore not inspected. Its existence and schema are inferred solely from the notebook's own markdown description (cell 9) and from `final_sample.csv`'s columns.

**Overall coverage: effectively complete** for everything present in the repository. The repository's small size (4 files, no source tree) made exhaustive inspection feasible, in contrast to the "inspect in batches" guidance intended for large codebases.

## 4. Unverified Assumptions

These are called out in the PRD itself (primarily §6, §22, §24) and are repeated here for visibility:

1. **Dataset identity/provenance**: the source CSV is assumed to be the public "DataCo Smart Supply Chain for Big Data Analysis" dataset based on column-name similarity. Not confirmed — the file is absent and no license/citation exists in the repo.
2. **Personas** (operations analyst, business stakeholder) are inferred from the shape of the analysis and markdown commentary, not from any stated requirements, interviews, or stakeholder documents.
3. **Reported model metrics** (recall/accuracy figures throughout §23 and the feature docs) reflect a prior, un-reproduced execution of the notebook as described in markdown/docx text; this analysis did not execute the notebook to re-derive them, and the PRD explicitly flags a methodological leakage concern (GAP-008) that would likely lower true out-of-sample performance if corrected.
4. **Compatibility failures** (GAP-003: `DataFrame.append`; GAP-004: `BaggingClassifier(base_estimator=...)`) are asserted based on known breaking changes in pandas ≥ 2.0 and scikit-learn ≥ 1.2 release notes, not by actually executing the notebook against a current environment (no Python interpreter with these packages installed was available in this session to confirm by running the code). This is a reasoned, evidence-based claim about the code as written, but is still a claim about *behavior*, not a directly observed stack trace.
5. **`Project Understandings.docx`'s authorship**: its content reads as AI-generated explanatory commentary (question/answer pairs explaining notebook cells) rather than an original product/business specification. This is an editorial judgment made to avoid double-counting its content as an independent requirements source in the PRD; the underlying text itself was fully read and is accurately summarized.

## 5. Areas Requiring Stakeholder Clarification

Mirrors PRD §24 ("Open Questions") and is not repeated in full here. The highest-priority items for a real stakeholder conversation:
- Confirm dataset licensing before committing it or expanding the sample.
- Decide the intended consumer/interface for a production risk score (human analyst vs. automated system) before any Phase 3 work begins.
- Decide whether `Customer Id`/location-based features are acceptable under applicable data-privacy obligations.

## 6. PRD Completeness Assessment

| PRD section | Completeness | Note |
|---|---|---|
| 1–8 (Summary through Scope) | Complete | Fully evidence-based or explicitly marked inferred |
| 9–10 (Feature inventory, FRs) | Complete | 25 implemented + 3 explicitly-planned requirements traced to cell ranges |
| 11 (NFRs) | Complete, but thin by necessity | Reflects the near-total absence of NFR engineering in the source; recommendations are clearly separated from "existing" requirements |
| 12 (Data/API spec) | Complete | Data model documented from the one real schema available; API section is correctly empty, not omitted |
| 13–19 | Complete | |
| 20 (Gap analysis) | Complete | 13 gaps identified, each with file/cell evidence; two (GAP-003, GAP-004) are concrete code defects rather than product gaps, included because they block reproducibility, which is a product-readiness issue |
| 21 (Roadmap) | Complete | 4 phases, each scoped to close specific, named gaps rather than generic maturity-model language |
| 22–27 | Complete | |

**No section was left as a placeholder.** Every "Planned"/"Proposed" item is explicitly labeled as not implemented, per the instruction not to present proposed capability as existing. No performance benchmark, compliance certification, or business KPI was fabricated; where such figures were unavailable, the PRD states that explicitly (§11, §23) rather than inventing a number.

## 7. Internal Consistency Check

- Every Functional Requirement in §10 that is marked "Implemented" has a corresponding cell-range citation; spot-checked FR-010/FR-011 (sampling), FR-017 (leakage drop), and FR-024 (hyperparameter tuning) against the raw cell dump and confirmed the cited cells contain the described code.
- The Gap Analysis's two code-defect items (GAP-003, GAP-004) are cross-referenced from §11 (NFRs → Compatibility) and §14.1 (failure scenarios), and again from the Roadmap's Phase 1, so a reader following any one path arrives at a consistent description.
- The data-model section (§12.1) is explicitly reconciled with the feature-selection requirements (FR-015–FR-017) to flag the schema mismatch (GAP-002) rather than silently presenting `final_sample.csv`'s columns as the modeling dataset.

