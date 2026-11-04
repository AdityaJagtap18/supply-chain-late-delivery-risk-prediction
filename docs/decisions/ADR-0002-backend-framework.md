---
decision_id: ADR-0002
title: Backend Framework Selection
date: 2026-11-03
status: Accepted
related_prompts: [ARCH-002, ARCH-003, ARCH-005]
related_artifacts: [docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md, docs/generated/backend/BE-ARCH-001-api-and-layering.md, docs/decisions/ADR-0004-ml-inference-architecture.md]
supersedes: null
superseded_by: null
---

# ADR-0002: Backend Framework Selection

## Status

**`Accepted`.**

> **Human approval record.** The project owner explicitly accepted this decision (Java Spring
> Boot) on 2026-11-03, second in the dependency order `ARCH-005` specified.

> **Dependency verified before acceptance:** [ADR-0004](ADR-0004-ml-inference-architecture.md)
> (ML Inference Architecture) was accepted first, as **Option (a), a separate Python inference
> service** — the outcome this ADR's rationale depends on. Because ADR-0004 was accepted exactly
> as recommended (not the in-process/embedded alternative), this ADR's rationale holds without
> re-evaluation, and Java Spring Boot is accepted as written below.

## Context and problem

`ARCH-DESIGN-001` § 1.2 defines the backend API/application layer's responsibilities (auth,
orchestration, data access, risk-band thresholding) without naming a technology. The question:
Java Spring Boot, Node.js/NestJS, or Python/FastAPI?

## Options considered

### Option 1: Java Spring Boot
- Description: the stakeholder's stated preference; mature enterprise ecosystem.
- Pros: Spring Security (ADR-0005) is a natural pairing; large enterprise hiring pool; JVM
  throughput is more than sufficient for this MVP's request volume.
- Cons: heavier runtime and more ceremony than the alternatives.
- Cost/effort to reverse later: high — `BE-ARCH-001` § 2/§ 3's API contract is confirmed
  framework-neutral (§ 4 there states explicitly "no Spring-specific behavior is baked into a
  path, payload shape, or status code"), which lowers but does not eliminate this cost; the
  actual service-layer implementation would still need rewriting.

### Option 2: Node.js/NestJS
- Description: TypeScript-first; shares a language with an Angular/React/Vue frontend.
- Pros: can reduce context-switching for a small team if paired with a TypeScript frontend;
  lighter runtime than Spring Boot.
- Cons: less of a single, unified security framework than Spring Security specifically.
- Cost/effort to reverse later: same order of magnitude as Option 1.

### Option 3: Python/FastAPI
- Description: Python-native, the same language as the ML inference boundary regardless of
  ADR-0004's outcome.
- Pros: if the ML inference boundary were embedded in-process (the outcome ADR-0004 did *not*
  recommend), this removes a serialization/schema-drift risk a Java backend calling a Python
  service would otherwise carry.
- Cons: a smaller production-hardening track record for large enterprise deployments than Spring
  Boot specifically; this advantage is moot under ADR-0004's actual recommended outcome (a
  separate Python service — the cross-language boundary exists either way once the ML boundary is
  out-of-process, regardless of which language the backend itself is written in).
- Cost/effort to reverse later: same order of magnitude as Option 1.

## Evaluation criteria

Per `ARCH-TRADEOFF-001` § 2: team/ecosystem fit, operational complexity, licensing/cost,
performance at this project's scale, security posture, and — the criterion that makes this
decision contingent on ADR-0004 — ML-correctness-requirement fit specific to whether the backend
and inference boundary share a language/process.

## Selected decision

**Accepted: Java Spring Boot.** (ADR-0004's contingency is satisfied — see Status above.)

## Rationale

With ADR-0004 recommending a separate Python inference service, the cross-language
backend-to-inference-service boundary exists regardless of whether the backend itself is Java or
Python — so Python/FastAPI's narrow advantage (removing that specific boundary) does not apply.
Spring Boot's enterprise maturity and natural pairing with Spring Security (ADR-0005) then stand
on their own merits with no clear technical disadvantage versus the alternatives at this
project's scale, per `ARCH-TRADEOFF-001` § 2. **If ADR-0004 is instead rejected in favor of an
in-process/embedded ML approach, this rationale no longer holds and this ADR should be
re-evaluated before acceptance**, per `ARCH-TRADEOFF-001` § 2's own explicit caveat.

## Consequences and trade-offs

- Confirms Spring Security as the natural, though not forced, choice for ADR-0005.
- Commits the team to JVM deployment/operational patterns in `DEV-STRATEGY-001`'s environment
  topology for the backend unit specifically.
- `BE-ARCH-001`'s contract (§ 2, § 3) remains implementable without change regardless of this
  decision's outcome, per that artifact's own § 4 — so accepting this ADR does not require
  revising `BE-ARCH-001`.
- Forecloses, for MVP, the language-unification benefit a TypeScript or Python backend would have
  offered with its respective frontend/ML-service pairing.

## Related prompts

ARCH-002, ARCH-003, ARCH-004.

## Related generated artifacts

`docs/generated/architecture/ARCH-TRADEOFF-001-stack-evaluation.md` § 2;
`docs/generated/backend/BE-ARCH-001-api-and-layering.md` § 1, § 4.

## Superseded or related ADRs

Depends on [ADR-0004](ADR-0004-ml-inference-architecture.md) (ML inference architecture) being
accepted as recommended; feeds [ADR-0005](ADR-0005-authentication-strategy.md) (authentication
strategy), which is contingent on this ADR's outcome in turn.
