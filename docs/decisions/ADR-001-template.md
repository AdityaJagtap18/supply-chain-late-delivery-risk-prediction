<!--
TEMPLATE — copy this file to ADR-NNNN-<kebab-case-title>.md and fill in every section.
Do not fill this template file itself in; it stays blank as the reusable starting point.
See docs/decisions/README.md for the full process.
-->

---
decision_id: ADR-NNNN
title: <Short decision title>
date: YYYY-MM-DD
status: Proposed <!-- Proposed | Accepted | Rejected | Superseded -->
related_prompts: []        <!-- e.g. [ARCH-002, BE-001] -->
related_artifacts: []      <!-- e.g. [docs/generated/architecture/ARCH-TRADEOFF-001-....md] -->
supersedes: null           <!-- ADR-NNNN this one replaces, if any -->
superseded_by: null        <!-- ADR-NNNN that replaced this one, if any -->
---

# ADR-NNNN: <Short decision title>

## Status

`Proposed` — set by an AI agent or a human author. Only a human reviewer may change this to
`Accepted` or `Rejected`. See
[prompt-library/PROMPT_STANDARDS.md § 5](../../prompt-library/PROMPT_STANDARDS.md#5-prompt-review-and-approval-workflow).

## Context and problem

<What forces/requirements/constraints make a decision necessary here? What is the actual
question being decided — stated precisely enough that "Option A" and "Option B" below are
genuinely mutually exclusive answers to it?>

## Options considered

List at least two genuinely considered options, even if one is clearly favored going in. For
each:

### Option 1: <name>
- Description:
- Pros:
- Cons:
- Cost/effort to reverse later:

### Option 2: <name>
- Description:
- Pros:
- Cons:
- Cost/effort to reverse later:

<add more options as needed>

## Evaluation criteria

<The criteria actually used to compare options — e.g., team familiarity, licensing, operational
burden, fit with existing ML correctness requirements (see PROJECT_CONTEXT.md § 3), cost, time
to implement. State weights/priority if criteria conflict.>

## Selected decision

<Which option was selected. If this ADR is still `Proposed`, say "Recommended: Option N,
pending human approval" rather than asserting it as final.>

## Rationale

<Why this option best satisfies the evaluation criteria, referencing the actual trade-off
analysis — do not restate "Pros" from above without synthesis.>

## Consequences and trade-offs

<What this decision makes easier, what it makes harder, what it forecloses, and what follow-up
work or new constraints it creates for other in-flight prompts/artifacts.>

## Related prompts

<List prompt IDs whose execution fed this decision, e.g. ARCH-002.>

## Related generated artifacts

<List artifact IDs/paths this decision is based on.>

## Superseded or related ADRs

<List any ADRs this one supersedes, is superseded by, or is closely related to (e.g., a
backend-framework ADR relating to an auth-strategy ADR).>
