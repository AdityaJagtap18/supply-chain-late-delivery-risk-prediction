# `src/ml-service` — Python inference service

**Status:** Phase 4 complete (2026-11-03) — loading and scoring with a real, trained model, not
just the Phase 1 skeleton below with no artifacts.

**Owns:** applying the **persisted** fitted encoders (FR-030) and the **persisted** trained
model (FR-029) to a batch of order records, per
[ADR-0004](../../docs/decisions/ADR-0004-ml-inference-architecture.md) (separate Python service,
Accepted) and [ADR-0007](../../docs/decisions/ADR-0007-model-storage-and-versioning.md)
(file-based model storage for MVP, Accepted).

**Must not own:** fitting encoders, training or retraining the model, or deciding which features
are used — all of that belongs to the offline training pipeline, which is a separate concern
from this runtime service.

**Contract:** `POST /score` accepts exactly the nine-feature request
[`ML-INFERENCE-001`](../../docs/generated/ml/ML-INFERENCE-001-service-contract.md) § 1 defines
(`type`, `customerCity`, `customerId`, `customerZipcode`, `orderCity`, `orderCountry`,
`orderRegion`, `orderState`, `shippingMode`) and returns that artifact's § 2 response shape
(`orderId`, `riskScore`, `modelVersion`, `confidence: null`). Extra or missing feature keys are
rejected with `422`, verified by test. `GET /health` reports `{"status": "UP", "modelLoaded":
bool}` — `modelLoaded` is this service's own diagnostic, not part of the `ML-INFERENCE-001`
contract.

**Model/encoder artifacts:** loaded from `MODEL_ARTIFACT_PATH`/`ENCODER_ARTIFACT_PATH`
(`.env.example`), per [`ADR-0007`](../../docs/decisions/ADR-0007-model-storage-and-versioning.md).
**Real artifacts now exist** (`artifacts/model.joblib` + `artifacts/encoders.json`, produced by
[`scripts/ml/train_model.py`](../../scripts/ml/train_model.py) — see
[`ML-PIPELINE-001-REVISION-001`](../../docs/generated/ml/ML-PIPELINE-001-REVISION-001-real-training-run.md)
for the full training-run record). Verified directly (2026-11-03) against the mounted real
artifacts: `/health` reports `modelLoaded: true`, and `POST /score` returns a real prediction for
an order whose feature values are real dataset categories (e.g. `riskScore: 0.5044` for a
genuine São Paulo order) while correctly *omitting* an order with a deliberately bogus category
from its `results` — the honest per-order failure path `ML-INFERENCE-001` § 3/§ 5 specifies,
never a fabricated score. The loading/scoring code's working path had previously only been proven
with a tiny synthetic model+encoder test fixture (`tests/test_service.py`, still passing); this is
now also proven against the real artifact. The feature-vector assembly convention
(`app/scoring.py`'s docstring) was this skeleton's own provisional choice and has now been
matched exactly by `train_model.py`'s real artifact (confirmed: same field order, same
`dummyEncodingColumns` key order, same 4 required `encoders.json` keys).

**Runtime dependency version note:** `requirements.txt`'s `scikit-learn`/`joblib` pins were
bumped (1.5.2→1.9.1, 1.4.2→1.6.0) to match the versions `scripts/ml/train_model.py` actually used
to produce `model.joblib` — loading a newer-version pickle with an older scikit-learn raised a
real `InconsistentVersionWarning` ("might lead to breaking code or invalid results") during this
phase's verification; bumping the runtime pin to match removed it rather than silently
tolerating it.

**Phase 5 addition:** `tests/test_feature_contract.py` — `QA-STRATEGY-001` S4.2's
feature-availability contract test, diffing `app/schemas.py`'s `Features` model against
`scripts/ml/train_model.py`'s `CSV_TO_FEATURE_FIELD` (the two *executable* records of the
`ML-INFERENCE-001`/`ML-PIPELINE-001` feature contract, not the markdown prose describing them).
Importing `train_model.py` needs pandas/numpy, added to `requirements-dev.txt` only — this
service's own runtime `requirements.txt` is unchanged.

**Build/test:** `pip install -r requirements-dev.txt && pytest` (5 tests, all passing) or
`docker build .` / `docker compose up --build ml-service` from `infra/docker/`.

See [docs/implementation/IMPLEMENTATION-PLAN-001.md](../../docs/implementation/IMPLEMENTATION-PLAN-001.md)
for what's next.
