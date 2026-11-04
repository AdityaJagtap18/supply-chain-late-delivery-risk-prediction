import { ReleaseNote } from './release-notes.model';

/**
 * Built strictly from this repository's real Git history (`git log`), which at the time this was
 * written contains exactly two commits and zero tags:
 *   87e6fd6  2026-11-04  Initial commit: Supply Chain Late Delivery Risk Prediction platform
 *   729e27c  2026-11-04  Fix invalid Mermaid erDiagram key syntax (PK_FK -> PK,FK)
 *
 * No prior Semantic Versioning tags or changelog exist, so v1.0.0 is established here as the
 * documented baseline release for the application as it exists in the initial commit plus the
 * follow-up documentation fix, per this feature's own instruction: "If there are no existing
 * semantic versions or Git tags, establish an initial version baseline based on the current state
 * of the application." Nothing below is invented -- every bullet traces to a real, inspected
 * feature of the committed code. Future releases should be appended here (newest first) as new
 * version tags are cut.
 */
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: '2026-11-04',
    title: 'Initial release: Supply Chain Late Delivery Risk Prediction platform',
    summary:
      'First documented baseline of the application: an Angular + Spring Boot + FastAPI platform that scores orders for late-delivery risk, plus a follow-up fix to the README\'s database diagram. This repository has no prior Git tags, so this release covers everything present in the two commits that exist in version control to date.',
    changes: [
      {
        category: 'Added',
        description:
          'Angular 18 frontend: Late Delivery Risk dashboard, Orders list and detail views, Batch Scoring, Reports, ML Monitoring, and Settings pages behind a session-based login.',
      },
      {
        category: 'Added',
        description:
          'Spring Boot 3.3.4 (Java 21) backend exposing order, risk-assessment, batch-scoring, auth, and system-info REST endpoints backed by PostgreSQL 16 via Spring Data JPA.',
      },
      {
        category: 'Added',
        description:
          'FastAPI (Python 3.12) ML inference service serving a trained AdaBoost late-delivery-risk model, with request/response contracts validated by strict Pydantic schemas.',
      },
      {
        category: 'Added',
        description:
          'Docker Compose orchestration for the Postgres, ML service, backend, and frontend containers, each with its own Dockerfile.',
      },
      {
        category: 'Added',
        description:
          'Project documentation set: PRD, technical design, architecture decision records (ADR-0001 through ADR-0007), implementation plan, and a full prompt-engineering library documenting how the system was designed.',
      },
      {
        category: 'Added',
        description: 'Comprehensive repository README with setup instructions, architecture overview, and real ML evaluation graphs and screenshots.',
      },
      {
        category: 'Fixed',
        description:
          "Corrected an invalid Mermaid erDiagram key annotation (PK_FK, which is not valid Mermaid syntax) to the correct comma-separated form (PK,FK) in the README's database entity-relationship diagram, which had been failing to render on GitHub.",
      },
    ],
  },
];
