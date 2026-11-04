---
Prompt ID: SEC-001
Prompt title: Security & Threat Modeling
Version: "1.0"
Category: 10-security-and-performance
Status: Draft
---

## Objective

Produce a threat model (STRIDE-style or equivalent) and a concrete set of security requirements
for the web application, with explicit attention to the PII/quasi-identifier retention already
flagged in `docs/PRD.md § 17`, since this system handles real customer location/identity data
even after the original notebook's PII-stripping.

## Required role/persona

Security Architect / AppSec Engineer.

## Required project context

[prompt-library/PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md).

## Prerequisites

`ARCH-001`, `BE-001`, and `DB-001` approved.

## Input files and repository paths to inspect

- `docs/PRD.md § 17` (Security and Privacy Considerations — the existing PII/quasi-identifier
  findings: `Customer Id`, zip code, lat/long retained through modeling)
- `docs/generated/backend/BE-ARCH-001-api-and-layering.md` (attack surface: every endpoint)
- `docs/generated/database/DB-ARCH-001-schema-design.md` (what's stored, where PII lives)

## Detailed execution instructions

1. Enumerate the system's trust boundaries and assets using `ARCH-001`'s component diagram as
   the base (frontend ↔ backend ↔ ML inference ↔ database), and apply STRIDE (or an equivalent
   explicit threat-category framework) to each boundary crossing.
2. Give the PII/quasi-identifier concern from `docs/PRD.md § 17` its own dedicated section:
   who can see `Customer Id`/zip/lat-long-derived data through the UI, whether role-based access
   control is needed to gate that (tie this to the auth-strategy decision, ADR-0005), and
   whether any aggregated/masked view is sufficient for the MVP's actual use case (per `PD-002`)
   instead of exposing raw identifiers.
3. Define authentication and authorization requirements at the requirement level (not
   implementation) — e.g., "every risk-assessment-read endpoint requires an authenticated
   session with role X" — to feed ADR-0005, evaluated independently of whether Spring Security
   (the stated preference) or an alternative implements it.
4. Define input-validation and injection-prevention requirements for every `BE-001` endpoint,
   and transport security requirements (TLS) for both frontend↔backend and backend↔ML-inference
   traffic.
5. Define logging/audit requirements specifically for risk-assessment access (who looked up
   which order's risk data, when) — this is a reasonable data-governance control given the PII
   sensitivity already identified, and should be stated as a requirement here even though its
   implementation belongs to `BE-001`/`DEV-001`.
6. Include a brief performance-and-security intersection note: rate limiting / abuse prevention
   for the public-facing endpoints, sized appropriately for this project's actual expected load
   (do not invent enterprise-scale numbers without basis — state the assumption explicitly).

## Technical constraints

- Must not assume Spring Security (or any specific framework) implements these controls — state
  requirements abstractly; note where the stated-preference stack would satisfy a requirement
  natively vs. require custom work, as input to ADR-0005, without treating that as a foregone
  conclusion.
- Must directly reference, not re-derive from scratch, the existing `docs/PRD.md § 17` findings.

## Expected outputs and deliverables

A threat model (diagram + table of threats per boundary) and a security-requirements list
covering PII handling, authn/authz, input validation, transport security, audit logging, and
basic rate limiting.

## Output storage location

`docs/generated/security/SEC-THREATMODEL-001-threat-model.md`

## Validation requirements

- The PII/quasi-identifier section explicitly references `docs/PRD.md § 17` and does not
  contradict or silently narrow its findings.
- Every `BE-001` endpoint has at least one associated authn/authz requirement (even if "TBD
  pending ADR-0005" for the specific mechanism).

## Definition of Done

Artifact `status: Draft`; reviewed by a human security reviewer; `Approved` status feeds
ADR-0005 (authentication strategy) and `DEV-001`'s deployment hardening section.

## Failure handling and clarification requirements

If the acceptable risk tolerance for exposing quasi-identifiers to the MVP's primary persona
can't be determined from existing documents (a genuine policy/business call, not a technical
one), record it as an open question for the product owner rather than making the privacy
trade-off unilaterally.

## Dependencies on other prompts

`ARCH-001`, `BE-001`, `DB-001`.
