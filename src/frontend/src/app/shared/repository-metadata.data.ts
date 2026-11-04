import {
  ArchitectureEdge,
  ArchitectureNode,
  RepositoryDirectoryEntry,
  TechStackEntry,
} from './repository-metadata.model';

/**
 * Every entry here was verified against the actual repository (package.json, pom.xml,
 * Dockerfiles, docker-compose.yml, and the real directory tree) rather than assumed. This is a
 * curated, hand-written list -- the app never scans the server filesystem at runtime, so there is
 * no way for it to expose paths or files beyond what is listed here.
 */
export const TECH_STACK: TechStackEntry[] = [
  { layer: 'Frontend', technology: 'Angular 18 (standalone components) / TypeScript', details: 'Signal-based state, Angular Router, RxJS; served by Nginx in production.' },
  { layer: 'Backend', technology: 'Spring Boot 3.3.4 / Java 21', details: 'Session-based auth (Spring Security), Spring Data JPA, Spring Cache.' },
  { layer: 'ML Service', technology: 'Python 3.12 / FastAPI / scikit-learn', details: 'Serves a trained AdaBoost classifier via strict Pydantic request/response schemas.' },
  { layer: 'Database', technology: 'PostgreSQL 16', details: 'Normalized schema with a JSONB feature-snapshot column on risk assessments.' },
  { layer: 'Infrastructure', technology: 'Docker / Docker Compose', details: 'Multi-stage Dockerfiles for frontend, backend, and ML service; one compose stack wires all four services together.' },
];

export const REPOSITORY_STRUCTURE: RepositoryDirectoryEntry[] = [
  {
    path: 'src/frontend',
    description: 'Angular 18 single-page application (the UI shown in this app right now).',
    children: [
      { path: 'src/frontend/src/app/shell', description: 'App chrome: sidebar navigation, top bar, and the authenticated-route layout.' },
      { path: 'src/frontend/src/app/risk-dashboard', description: 'Late Delivery Risk dashboard page.' },
      { path: 'src/frontend/src/app/orders', description: 'Orders list and order risk-detail pages.' },
      { path: 'src/frontend/src/app/batch-scoring', description: 'Batch scoring trigger and status page.' },
      { path: 'src/frontend/src/app/reports', description: 'Reporting page.' },
      { path: 'src/frontend/src/app/ml-monitoring', description: 'ML model info and monitoring page.' },
      { path: 'src/frontend/src/app/settings', description: 'Account and system-status settings page.' },
      { path: 'src/frontend/src/app/services', description: 'Shared Angular services (e.g. authentication).' },
      { path: 'src/frontend/src/app/shared', description: 'Reusable UI building blocks (page header, badges, empty-state notices) and app-wide metadata/constants.' },
    ],
  },
  {
    path: 'src/backend',
    description: 'Spring Boot 3.3.4 REST API (Java 21).',
    children: [
      { path: 'src/backend/src/main/java/.../auth', description: 'Login/session authentication controller and config.' },
      { path: 'src/backend/src/main/java/.../orders', description: 'Order and system-info endpoints (includes model-version and model-info relays).' },
      { path: 'src/backend/src/main/java/.../domain', description: 'JPA entities and repositories (orders, risk assessments, etc.).' },
      { path: 'src/backend/src/main/java/.../mlcheck', description: 'Client and health-check endpoint for reaching the ML service.' },
      { path: 'src/backend/src/main/java/.../scoring', description: 'Batch-scoring endpoint that fans out to the ML service.' },
      { path: 'src/backend/src/main/java/.../ping', description: 'Lightweight liveness endpoint.' },
      { path: 'src/backend/src/main/resources/application.yml', description: 'Spring configuration (datasource, server, logging).' },
    ],
  },
  {
    path: 'src/ml-service',
    description: 'FastAPI inference service (Python 3.12) that serves the trained model.',
    files: [
      { path: 'src/ml-service/app/main.py', description: 'FastAPI app and routes (score, health, model-info).' },
      { path: 'src/ml-service/app/schemas.py', description: 'Pydantic request/response schemas (strict, extra="forbid").' },
      { path: 'src/ml-service/app/model_loader.py', description: 'Loads the trained model and encoders from artifacts/.' },
      { path: 'src/ml-service/app/scoring.py', description: 'Feature construction and scoring logic.' },
    ],
  },
  {
    path: 'scripts/ml',
    description: 'Offline model-training pipeline (not part of the running application).',
    files: [
      { path: 'scripts/ml/train_model.py', description: 'Trains the AdaBoost model from the source CSV and writes artifacts/model.joblib + encoders.json.' },
      { path: 'scripts/ml/data_drift_check.py', description: 'Standalone data-drift analysis script.' },
    ],
  },
  { path: 'artifacts', description: 'Trained model artifact (model.joblib) and its metadata/metrics (encoders.json), loaded by the ML service at startup.' },
  { path: 'scripts/db', description: 'SQL migration scripts applied to the PostgreSQL schema, in numbered order.' },
  {
    path: 'infra/docker',
    description: 'Deployment configuration.',
    files: [{ path: 'infra/docker/docker-compose.yml', description: 'Orchestrates the postgres, ml-service, backend, and frontend containers together.' }],
  },
  { path: 'docs', description: 'Product requirements, technical design, architecture decision records, and generated reference documentation.' },
  { path: 'tests', description: 'Top-level test documentation; component-level automated tests live alongside each service (src/ml-service/tests, scripts/ml/tests, Angular spec files).' },
];

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  { id: 'frontend', label: 'Angular Frontend', kind: 'frontend', description: 'Angular 18 single-page app. Calls the Spring Boot backend over HTTP with a session cookie for auth.' },
  { id: 'backend', label: 'Spring Boot Backend', kind: 'backend', description: 'Java 21 / Spring Boot 3.3.4 REST API. Owns authentication, order data, and relays scoring requests to the ML service.' },
  { id: 'database', label: 'PostgreSQL Database', kind: 'database', description: 'PostgreSQL 16. Stores orders, customers, shipments, and risk-assessment history via Spring Data JPA.' },
  { id: 'ml-service', label: 'FastAPI ML Service', kind: 'ml-service', description: 'Python 3.12 / FastAPI. Serves late-delivery-risk predictions from the trained model over its own HTTP API.' },
  { id: 'artifacts', label: 'Model Artifacts', kind: 'artifacts', description: 'artifacts/model.joblib and encoders.json -- the trained AdaBoost model and its encoders/metrics, loaded by the ML service at startup.' },
  { id: 'training', label: 'Training Pipeline', kind: 'scripts', description: 'scripts/ml/train_model.py -- the offline script that produces the model artifacts. Not part of the running application.' },
  { id: 'infra', label: 'Docker Compose', kind: 'infra', description: 'infra/docker/docker-compose.yml -- builds and orchestrates the frontend, backend, ML service, and database containers together.' },
  { id: 'docs', label: 'Documentation', kind: 'docs', description: 'PRD, technical design, and architecture decision records that describe and justify this architecture.' },
  { id: 'tests', label: 'Automated Tests', kind: 'tests', description: 'Backend (JUnit), ML service (pytest), and frontend (Karma/Jasmine) test suites that verify the backend and ML service.' },
];

export const ARCHITECTURE_EDGES: ArchitectureEdge[] = [
  { source: 'frontend', target: 'backend', label: 'HTTPS / REST', description: 'The Angular app calls the Spring Boot API with a session cookie for authenticated requests.' },
  { source: 'backend', target: 'database', label: 'JDBC / JPA', description: 'The backend reads and writes orders, customers, and risk-assessment rows through Spring Data JPA.' },
  { source: 'backend', target: 'ml-service', label: 'HTTP (internal)', description: 'The backend forwards scoring requests to the FastAPI ML service and relays its responses (e.g. model-info, batch scoring).' },
  { source: 'ml-service', target: 'artifacts', label: 'loads at startup', description: 'The ML service loads the trained model and its encoders/metrics from the artifacts directory when it starts.' },
  { source: 'training', target: 'artifacts', label: 'produces', description: 'Running the training script regenerates the model artifact and its metadata; this is a manual, offline step.' },
  { source: 'infra', target: 'frontend', label: 'builds & runs', description: 'Docker Compose builds the frontend image and runs it as a container.' },
  { source: 'infra', target: 'backend', label: 'builds & runs', description: 'Docker Compose builds the backend image and runs it as a container.' },
  { source: 'infra', target: 'ml-service', label: 'builds & runs', description: 'Docker Compose builds the ML service image and runs it as a container.' },
  { source: 'infra', target: 'database', label: 'runs', description: 'Docker Compose runs the official postgres:16 image as the database container.' },
  { source: 'tests', target: 'backend', label: 'verifies', description: 'JUnit tests exercise backend controllers and services.' },
  { source: 'tests', target: 'ml-service', label: 'verifies', description: 'pytest tests exercise the ML service\'s scoring and schema logic.' },
  { source: 'docs', target: 'backend', label: 'documents', description: 'Architecture decision records and technical design docs describe the backend\'s design and rationale.' },
  { source: 'docs', target: 'ml-service', label: 'documents', description: 'ADR-0004 and ADR-0007 describe the ML inference architecture and model-versioning approach.' },
];
