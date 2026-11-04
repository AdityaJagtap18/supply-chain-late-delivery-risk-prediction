---
decision_id: ADR-0005
title: Authentication Strategy
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, SEC-001, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/backend/BE-ARCH-001-api-and-layering.md, docs/generated/security/SEC-THREATMODEL-001-threat-model.md, docs/decisions/ADR-0002-backend-framework.md]
supersedes: null
superseded_by: null
---

# ADR-0005: Authentication Strategy

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (session-based
> authentication via Spring Security) on 2026-11-03, third in the dependency order `ARCH-005`
> specified. The project owner also explicitly confirmed: **no existing SSO or identity-provider
> requirement overrides this recommendation** — the OAuth2/OIDC blocking-input-gap noted below
> is therefore resolved in favor of Option 1, not left open.

> **Dependency verified before acceptance:** [ADR-0002](ADR-0002-backend-framework.md) (Backend
> Framework) was accepted first, as **Java Spring Boot** — the outcome this ADR's rationale
> depends on. Because ADR-0002 was accepted exactly as recommended, this ADR's rationale holds
> without re-evaluation.

## Context and problem

`docs/PRD.md § 28` FR-034/NFR-WEB-001 require an authenticated session for all access to risk
scores or order data, for a single operations-analyst role (NFR-WEB-004 — no multi-role
authorization in MVP). `BE-ARCH-001` § 2.1/2.2 sketches `POST`/`DELETE /auth/sessions` but marks
the auth mechanism `TBD pending ADR-0005` throughout. The question: session-based authentication
via Spring Security, stateless JWT, or OAuth2/OIDC SSO?

## Options considered

### Option 1: Session-based authentication via Spring Security
- Description: the stakeholder's stated direction, tied to ADR-0002's backend-framework
  preference.
- Pros: direct, well-documented fit if ADR-0002 selects Spring Boot; mature, well-audited session
  fixation/CSRF protections built in; simplest to reason about for a single-role MVP.
- Cons: requires server-side session storage, tying into `DB-ARCH-001`'s persistent data store
  (ADR-0003).
- Cost/effort to reverse later: moderate — every `BE-ARCH-001` endpoint's auth requirement is
  already marked `TBD pending ADR-0005` as a placeholder, so the *presence* of the requirement
  does not change if this ADR is later superseded, only its mechanism.

### Option 2: Stateless JWT
- Description: framework-agnostic token-based authentication.
- Pros: no server-side session state to manage; works regardless of ADR-0002's outcome.
- Cons: token revocation/expiry requires careful handling (a stateless token cannot be instantly
  invalidated the way a server-side session can, without extra infrastructure) — a real cost for
  `BE-ARCH-001` § 2.2's `DELETE /auth/sessions` (logout) requirement.
- Cost/effort to reverse later: moderate, same order as Option 1.

### Option 3: OAuth2/OIDC SSO
- Description: integration with an existing or new identity provider.
- Pros: strongest security posture *if* an existing enterprise IdP already enforces the
  organization's password/MFA policy.
- Cons: highest complexity of the three for an MVP — requires integrating with or standing up an
  identity provider, disproportionate to a single-role, single-application MVP; whether the
  business already operates an IdP is unknown to this evaluation (a blocking input gap, not
  guessed).
- Cost/effort to reverse later: high — an IdP integration is harder to unwind than the other two
  options.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 5: team/ecosystem fit (contingent on ADR-0002), operational complexity,
licensing/cost, performance (not a differentiator at this scale), security posture, and
ML-correctness-requirement fit (not applicable — authentication has no bearing on any of
`PROJECT_CONTEXT.md § 3`'s 8 numbered ML concerns).

## Selected decision

**Accepted: session-based authentication via Spring Security.** (ADR-0002's contingency is
satisfied — see Status above.)

## Rationale

`NFR-WEB-004` already scopes MVP to a single role with no multi-user authorization complexity —
the scaling/statelessness benefit of JWT and the centralized-identity benefit of OAuth2/OIDC both
solve problems this MVP does not have yet, per `ARCH-TRADEOFF-001` § 5. Given ADR-0002's
recommended Spring Boot outcome, Spring Security is the direct, well-documented pairing.

## Consequences and trade-offs

- Resolves every `TBD pending ADR-0005` marker in `BE-ARCH-001` § 2 to a concrete mechanism
  (e.g., a `Set-Cookie` session) once accepted.
- Requires server-side session storage, which `DB-ARCH-001`'s `app_user` entity (§ 2.8) already
  anticipates via its deliberately abstract `credential_reference` column.
- **Placeholder requiring separate confirmation, per `SEC-THREATMODEL-001` § 3 REQ-AUTH-002:** a
  30-minute idle-session timeout is recommended there as a placeholder, not a team-confirmed
  policy — this ADR's acceptance does not itself ratify that specific number.
- Forecloses OAuth2/OIDC's centralized-identity benefit for MVP; revisit if the business already
  operates an IdP (unconfirmed, per the blocking input gap above) or if multi-role authorization
  is later added (NFR-WEB-004's current scope).

## Related prompts

ARCH-002, SEC-001, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 5;
`docs/generated/backend/BE-ARCH-001-api-and-layering.md` § 2.1, § 2.2, § 4;
`docs/generated/security/SEC-THREATMODEL-001-threat-model.md` § 3 (REQ-AUTH-001/002/003).

## Superseded or related ADRs

Contingent on [ADR-0002](ADR-0002-backend-framework.md) (backend framework).
