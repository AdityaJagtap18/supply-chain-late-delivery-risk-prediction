---
Prompt ID: PD-002
Prompt title: Product Vision & MVP Definition
Version: "1.0"
Category: 01-product-discovery
Status: Draft
---

## Objective

Produce a product vision statement and a bounded MVP scope for the web application, answering
specifically: who is the first real user of the web app, what is the smallest version of the
late-delivery-risk capability that is useful to them, and what is explicitly deferred past MVP.

## Required role/persona

Technical Product Manager with product-strategy ownership — this prompt makes judgment calls
about scope, not just documents facts.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), with particular attention to § 1
(current vs. target state) and § 3 (ML correctness concerns — the MVP's claims about the model
must not overstate what's actually validated).

## Prerequisites

`PD-001` executed and its digest available.

## Input files and repository paths to inspect

- `docs/generated/product/PD-REVIEW-001-existing-project-digest.md` (PD-001's output)
- `docs/PRD.md § 4` (Product Vision and Objectives — inferred), `§ 5` (Target Users and
  Personas — inferred), `§ 23` (Success Metrics)

## Detailed execution instructions

1. Start from `docs/PRD.md § 5`'s inferred personas (supply-chain/ops analyst, data scientist,
   business stakeholder) and `PD-001`'s open questions — do not invent new personas without
   flagging them as new (not carried over from existing docs).
2. Write a product vision statement (2–4 sentences) that is specific to *this* dataset/domain —
   not a generic "we help businesses with data" statement. It must name the actual decision a
   user will make differently because of the product (e.g., re-routing a specific at-risk
   order, not "improving supply chain efficiency" in the abstract).
3. Define MVP scope as an explicit **in / out** list, not prose. At minimum decide and justify:
   - Which persona is the MVP's primary user (pick one; defer the others explicitly).
   - Whether the MVP predicts risk at order-placement time or some other point (this interacts
     directly with the "prediction-time feature availability" concern in
     `PROJECT_CONTEXT.md § 3` item 4 — the MVP scope must be consistent with which features are
     genuinely available at that point, or must flag this as unresolved).
   - Whether the MVP needs a live-scoring API or a batch/offline report is acceptable first.
   - Whether authentication/multi-user support is in scope for MVP or deferred.
4. State explicitly which of the PRD's "Planned" functional requirements (`docs/PRD.md § 10`,
   FR-026–FR-028) the MVP requires, and which remain out of scope.
5. List 3–5 MVP success criteria that are **measurable from product usage**, not model metrics
   alone (model metrics belong to `ML-001`/`ML-002`, not here) — e.g., "an ops analyst can view
   a risk score for a specific order within N clicks", not "recall ≥ 0.85".

## Technical constraints

- Must not assume any specific frontend/backend/database technology — that is `ARCH-001`'s and
  later prompts' job. If the vision requires a capability that constrains architecture (e.g.,
  "must support offline batch scoring of 50k orders nightly"), state the capability, not the
  technology.
- Must not claim the existing model is production-ready; defer that judgment to `ML-001`.

## Expected outputs and deliverables

A vision + MVP-scope artifact with an explicit in/out table and the 3–5 measurable MVP success
criteria.

## Output storage location

`docs/generated/product/PD-VISION-001-mvp-scope.md`

## Validation requirements

- The in/out table resolves every ambiguity `PD-001` raised that is within product-scope
  authority (vs. architecture/ML authority) — or explicitly defers it to a named later prompt.
- No frontend/backend/database technology is named as a requirement.
- Every MVP success criterion is observable without needing the final ML model's internals.

## Definition of Done

Artifact created, `status: Draft`; a human product owner reviews and either sets `status:
Approved` or returns it with specific requested scope changes.

## Failure handling and clarification requirements

If the primary persona cannot be decided without stakeholder input (e.g., genuinely no evidence
favors ops-analyst over business-stakeholder as the MVP's primary user), do not guess silently —
record it as a top-level open question in the artifact and recommend it be resolved via
`AskUserQuestion` or direct stakeholder conversation before `PRD-001` proceeds.

## Dependencies on other prompts

`PD-001`.
