# Prompt Index

Single source of truth for every prompt ID in this library — check here before assigning a new
ID (see [PROMPT_STANDARDS.md § 2](PROMPT_STANDARDS.md#2-prompt-id-conventions)). All prompts
below were authored in this initial setup pass and carry `status: Draft` — **none has been
human-reviewed yet**; see [PROMPT_STANDARDS.md § 5](PROMPT_STANDARDS.md#5-prompt-review-and-approval-workflow)
for what `Draft → Reviewed → Approved` requires.

| Prompt ID | Prompt name | Category | Version | Status | Dependencies | Expected artifact | Artifact location | Related ADRs |
|---|---|---|---|---|---|---|---|---|
| [PD-001](01-product-discovery/PD-001-existing-project-review.md) | Existing Project & PRD Review | 01-product-discovery | 1.0 | Executed (artifact Draft) | None (entry point) | Gap/assumption/open-question digest for product discovery | [docs/generated/product/PD-REVIEW-001-existing-project-digest.md](../docs/generated/product/PD-REVIEW-001-existing-project-digest.md) | — |
| [PD-002](01-product-discovery/PD-002-product-vision-mvp.md) | Product Vision & MVP Definition | 01-product-discovery | 1.0 | Executed (artifact Approved) | PD-001 | Product vision statement + MVP scope boundary | [docs/generated/product/PD-VISION-001-mvp-scope.md](../docs/generated/product/PD-VISION-001-mvp-scope.md) | — |
| [PRD-001](02-prd-and-requirements/PRD-001-prd-refinement.md) | PRD Refinement for Web Application | 02-prd-and-requirements | 1.0 | Executed (§28 Approved) | PD-002 | Revision proposal for `docs/PRD.md` (web-app scope, new FRs/NFRs) | `docs/PRD.md` (in place, versioned per PROMPT_STANDARDS §3) | — |
| [ARCH-001](03-system-architecture/ARCH-001-technical-architecture-design.md) | Technical Architecture Design | 03-system-architecture | 1.0 | Executed (artifact Approved) | PRD-001 | Technology-agnostic high-level architecture (layers, components, boundaries) | `docs/generated/architecture/ARCH-DESIGN-001-*.md`; authorized version mirrored into `docs/TECHNICAL_DESIGN.md` | Candidate for multiple ADRs (see docs/decisions/README.md) |
| [ARCH-002](03-system-architecture/ARCH-002-architecture-tradeoff-evaluation.md) | Architecture Trade-off Evaluation | 03-system-architecture | 1.0 | Executed (artifact Draft) | ARCH-001 | Scored comparison of candidate stacks (incl. the Angular/Spring Boot/Python-ML/Postgres-or-MySQL direction) against alternatives | `docs/generated/architecture/ARCH-TRADEOFF-001-*.md` | Feeds ADR-0001..0007 (none created yet) |
| [ARCH-003](03-system-architecture/ARCH-003-cross-artifact-consistency-review.md) | Cross-Artifact Architecture Consistency Review | 03-system-architecture | 1.0 | Executed (artifact Draft) | None (runs once a meaningful artifact batch exists) | Consistency/blocker/traceability review across all domains | `docs/generated/architecture/ARCH-CONSISTENCY-001.md`, `docs/generated/architecture/ARCH-BLOCKERS-001.md`, `docs/generated/product/REQUIREMENTS-TRACEABILITY-001.md` | Surfaced the gap behind ADR-0001..0007, resolved by `ARCH-004` |
| [ARCH-004](03-system-architecture/ARCH-004-architecture-decision-finalization.md) | Architecture Decision Finalization & Implementation Gate | 03-system-architecture | 1.0 | Executed (artifact Draft) | ARCH-003 | 7 ADR drafts (Proposed), `Type`-feature resolution proposal, decision summary | `docs/decisions/ADR-0001..0007-*.md`, `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md`, `docs/generated/architecture/ARCH-DECISIONS-001-summary.md` | ADR-0001..0007 drafted (all `Proposed`) |
| [ARCH-005](03-system-architecture/ARCH-005-final-adr-acceptance-and-schema-revision.md) | Final ADR Acceptance & Database Schema Revision | 03-system-architecture | 1.0 | Executed (artifact In Review) | ARCH-004 | All 7 ADRs recorded `Accepted`; revised `type`-feature schema artifact; finalization register | `docs/decisions/ADR-0001..0007-*.md` (now `Accepted`), `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md` (now `In Review`), `docs/generated/architecture/ARCH-FINALIZATION-001.md` | ADR-0001..0007 now `Accepted` |
| [UI-001](04-ui-ux-design/UI-001-design-system.md) | UI/UX Design System | 04-ui-ux-design | 1.0 | Executed (artifact Approved) | PRD-001, ARCH-001 | Design system spec + key screen wireframe set for the risk-prediction web app | `docs/generated/ui-ux/UI-DESIGN-001-*.md` | — |
| [DB-001](05-database-design/DB-001-database-architecture.md) | Database Architecture & Schema Design | 05-database-design | 1.0 | Executed (artifact Approved) | ARCH-001, PRD-001 | Logical + physical schema, ER diagram, migration-readiness notes | `docs/generated/database/DB-ARCH-001-*.md` | Candidate for an ADR (RDBMS choice) |
| [BE-001](06-backend-development/BE-001-backend-architecture.md) | Backend Architecture & API Design | 06-backend-development | 1.0 | Executed (artifact Approved) | ARCH-001, DB-001 | Backend layering, API contract (OpenAPI-style), auth integration points | `docs/generated/backend/BE-ARCH-001-*.md` | Candidate for an ADR (backend framework, auth strategy) |
| [FE-001](07-frontend-development/FE-001-frontend-architecture.md) | Frontend Architecture | 07-frontend-development | 1.0 | Executed (artifact Approved) | ARCH-001, UI-001, BE-001 | Frontend module/state/routing architecture consuming BE-001's API contract | `docs/generated/frontend/FE-ARCH-001-*.md` | Candidate for an ADR (frontend framework) |
| [ML-001](08-ml-model-integration/ML-001-pipeline-productionization.md) | ML Pipeline Productionization | 08-ml-model-integration | 1.0 | Executed (artifact Approved) | PRD-001, ARCH-001 | Leakage-free training pipeline design, evaluation protocol, model persistence plan | `docs/generated/ml/ML-PIPELINE-001-*.md` | Candidate for an ADR (model storage/versioning) |
| [ML-002](08-ml-model-integration/ML-002-inference-integration.md) | ML Inference Service Integration | 08-ml-model-integration | 1.0 | Executed (artifact Approved) | ML-001, BE-001 | Inference-service contract + integration design with the backend | `docs/generated/ml/ML-INFERENCE-001-*.md` | Candidate for an ADR (ML inference architecture) |
| [QA-001](09-testing-and-qa/QA-001-testing-strategy.md) | Testing Strategy | 09-testing-and-qa | 1.0 | Executed (artifact Draft) | ARCH-001, BE-001, FE-001, ML-002 | Test strategy across unit/integration/e2e/ML-specific validation | `docs/generated/testing/QA-STRATEGY-001-*.md` | — |
| [SEC-001](10-security-and-performance/SEC-001-security-threat-modeling.md) | Security & Threat Modeling | 10-security-and-performance | 1.0 | Executed (artifact Approved) | ARCH-001, BE-001, DB-001 | STRIDE-style threat model + security requirements | `docs/generated/security/SEC-THREATMODEL-001-*.md` | Candidate for an ADR (authentication strategy) |
| [DEV-001](11-deployment-and-devops/DEV-001-deployment-devops-strategy.md) | Deployment & DevOps Strategy | 11-deployment-and-devops | 1.0 | Executed (artifact Approved) | ARCH-001, BE-001, FE-001, ML-002, SEC-001 | Environment topology, CI/CD pipeline design, deployment runbook | `docs/generated/deployment/DEV-STRATEGY-001-*.md` | Candidate for an ADR (deployment architecture) |
| [DOC-001](12-documentation-and-maintenance/DOC-001-documentation-maintenance.md) | Documentation & Artifact Lifecycle Maintenance | 12-documentation-and-maintenance | 1.0 | Executed (artifact Draft; runs periodically — latest: 2026-11-03) | None (runs periodically) | Audit report: stale/orphaned/missing-metadata artifacts, broken links | `docs/generated/product/DOC-AUDIT-001-2026-11-03.md` (an audit note, domain determined by findings) | — |
| [IMPL-001](13-implementation/IMPL-001-stage-5-implementation-preparation.md) | Stage 5 Implementation Preparation | 13-implementation | 1.0 | Executed (artifacts Draft) | ARCH-005 | `DB-ARCH-REVISION-001` recorded Approved; prepared `src/`/`infra/`/`scripts/`/`tests/` workspace (no app code); implementation readiness report and plan | `docs/generated/database/DB-ARCH-REVISION-001-type-feature.md` (now Approved); `docs/implementation/IMPLEMENTATION-READINESS-001.md`; `docs/implementation/IMPLEMENTATION-PLAN-001.md` | Closed BLOCK-001/BLOCK-002 (already closed by ARCH-005/this prompt) |

## Reading order

The dependency chain above is also the recommended execution order:
`PD-001 → PD-002 → PRD-001 → ARCH-001 → ARCH-002 → {UI-001, DB-001} → BE-001 → FE-001 → ML-001 → ML-002 → QA-001 → SEC-001 → DEV-001`,
with `DOC-001` run periodically throughout rather than once in sequence.

## Category → folder map

| # | Category | Folder |
|---|---|---|
| 01 | Product Discovery | `01-product-discovery/` |
| 02 | PRD & Requirements | `02-prd-and-requirements/` |
| 03 | System Architecture | `03-system-architecture/` |
| 04 | UI/UX Design | `04-ui-ux-design/` |
| 05 | Database Design | `05-database-design/` |
| 06 | Backend Development | `06-backend-development/` |
| 07 | Frontend Development | `07-frontend-development/` |
| 08 | ML Model Integration | `08-ml-model-integration/` |
| 09 | Testing & QA | `09-testing-and-qa/` |
| 10 | Security & Performance | `10-security-and-performance/` |
| 11 | Deployment & DevOps | `11-deployment-and-devops/` |
| 12 | Documentation & Maintenance | `12-documentation-and-maintenance/` |
| 13 | Implementation Transition (cross-cutting; added by `IMPL-001`, see that prompt's own note on this category extension) | `13-implementation/` |
