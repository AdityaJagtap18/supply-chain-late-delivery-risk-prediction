---
Prompt ID: PD-001
Prompt title: Existing Project & PRD Review
Version: "1.0"
Category: 01-product-discovery
Status: Draft
---

## Objective

Produce a single digest document that (a) confirms what is verifiably true about the current
`SupplyChainOptimization` repository, (b) separates that from assumptions already present in
`docs/PRD.md`, and (c) lists every open question that must be answered before product-vision
work (`PD-002`) can proceed — without re-doing the PRD's own analysis from scratch.

## Required role/persona

Senior Product Analyst / Technical Business Analyst with enough ML literacy to evaluate whether
a claimed model result is trustworthy (not to re-derive it, but to judge whether it's fit to
plan a product around).

## Required project context

Load [prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) in full before starting,
especially § 3 (known ML correctness concerns).

## Prerequisites

None — this is the entry point of the prompt library.

## Input files and repository paths to inspect

- `docs/PRD.md` (full document — all 27 sections)
- `docs/PRD_VALIDATION.md`
- `docs/architecture/pipeline-architecture.md`, `docs/architecture/user-journeys.md`
- `README.md`, `requirements.txt`
- `supply_chain_late_delivery.ipynb` (at least skim cell structure; do not re-derive what the
  PRD already covers)
- `final_sample.csv` header and `df_last.csv` header (schema only — do not need full-row review)

## Detailed execution instructions

1. Read `docs/PRD.md` end to end. For each of its 27 sections, note: (a) what is asserted as
   **verified fact** vs. **inferred/assumed** (the PRD itself usually flags this — confirm it
   did so consistently), and (b) anything stated as a gap or open question in §20/§24.
2. Cross-check `docs/PRD_VALIDATION.md`'s "Unverified Assumptions" and "Areas Requiring
   Stakeholder Clarification" sections against § 1 — do not drop any of them silently.
3. Confirm the notebook's current executable state matches what `README.md` claims (i.e., that
   it runs end-to-end per the "Running this notebook" section) — spot check rather than
   re-execute, unless you have specific reason to doubt it.
4. Produce the digest with exactly three sections:
   - **Confirmed facts** — things directly observable in the repo right now (file existence,
     documented schema, documented metrics, documented library-version fixes).
   - **Carried-forward assumptions** — every assumption flagged in the PRD/validation report,
     restated in your own words with its original source section cited, not silently dropped
     or silently resolved.
   - **Open questions for product discovery** — a de-duplicated, prioritized list combining
     `docs/PRD.md § 24` with anything new you found, each phrased as a question a stakeholder
     could actually answer (not "clarify the data model" but "is `final_sample.csv`'s 50,000-row
     size sufficient for an MVP, or does the web app need the full dataset from day one?").
5. Do **not** propose a product vision, MVP scope, or technology choice here — that is `PD-002`
   and later prompts' job. This prompt is read-and-digest only.

## Technical constraints

- Do not re-run the notebook as part of this prompt (it was already verified to run — see
  `README.md`); if you need to confirm something, read code/outputs, don't re-execute unless a
  specific claim is in doubt.
- Do not modify `docs/PRD.md`, `docs/PRD_VALIDATION.md`, or `docs/architecture/*` — read-only.

## Expected outputs and deliverables

One Markdown artifact with the three-section digest described above, plus a short "Coverage"
note stating which PRD sections were read in full vs. skimmed.

## Output storage location

`docs/generated/product/PD-REVIEW-001-existing-project-digest.md`

## Validation requirements

- Every item in `docs/PRD_VALIDATION.md`'s "Unverified Assumptions" and "Areas Requiring
  Stakeholder Clarification" appears somewhere in the digest (spot-check at least 3).
- No new product vision or technology recommendation appears in this artifact.
- Every open question is phrased as something a named stakeholder role could answer.

## Definition of Done

Digest artifact created with `status: Draft` and correct metadata block; a human has skimmed it
for completeness against the checklist above (does not require `status: Approved` to unblock
`PD-002`, per [PROMPT_STANDARDS.md § 7](../PROMPT_STANDARDS.md#7-traceability-rules--when-an-adr-is-required-vs-not) —
this is a discovery artifact, not a committing decision).

## Failure handling and clarification requirements

If `docs/PRD.md` appears to have been modified since `docs/PRD_VALIDATION.md` was written (i.e.,
the validation report's "Files and Modules Inspected" no longer matches), stop and flag this
explicitly rather than silently reconciling the mismatch yourself.

## Dependencies on other prompts

None.
