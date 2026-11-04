# `tests` — integration and contract tests

**Status:** workspace reserved by `IMPL-001`; no tests exist here yet.

**Owns:** cross-service integration tests (frontend ↔ backend, backend ↔ database, backend ↔ ML
inference service) and contract tests verifying the nine-feature inference request/response
shape — per
[QA-STRATEGY-001](../docs/generated/testing/QA-STRATEGY-001-testing-strategy.md)'s integration
layer. Unit tests for a given component live alongside that component's own code under `src/`,
not here; this directory is specifically for tests that cross a component boundary.

See [docs/implementation/IMPLEMENTATION-READINESS-001.md](../docs/implementation/IMPLEMENTATION-READINESS-001.md)
§ "Test strategy for cross-service integration" and
[docs/implementation/IMPLEMENTATION-PLAN-001.md](../docs/implementation/IMPLEMENTATION-PLAN-001.md)
for the first milestone's acceptance tests.
