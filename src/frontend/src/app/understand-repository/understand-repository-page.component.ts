import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../shared/page-header.component';
import { APP_VERSION, REPOSITORY_URL } from '../shared/app-version';
import { REPOSITORY_STRUCTURE, TECH_STACK } from '../shared/repository-metadata.data';
import { ArchitectureGraphComponent } from './architecture-graph.component';
import { RepositoryExplorerComponent } from './repository-explorer.component';

@Component({
  selector: 'app-understand-repository-page',
  standalone: true,
  imports: [PageHeaderComponent, ArchitectureGraphComponent, RepositoryExplorerComponent, RouterLink],
  template: `
    <app-page-header
      title="Understand Repository"
      subtitle="What this application is, how it is built, and how its pieces fit together."
    />

    <section class="card">
      <h2>Repository Overview</h2>
      <dl>
        <dt>Name</dt>
        <dd>Supply Chain Late Delivery Risk Prediction</dd>
        <dt>Purpose</dt>
        <dd>
          Predicts which orders are at risk of a late delivery so operations teams can intervene
          before a shipment is late, rather than finding out after the fact.
        </dd>
        <dt>What it does</dt>
        <dd>
          Scores individual orders and batches of orders for late-delivery risk, shows that risk
          on a dashboard and per-order detail view, and surfaces the ML model's own offline
          evaluation metrics so the model's reliability is visible, not just its predictions.
        </dd>
        <dt>Core technologies</dt>
        <dd>Angular, Spring Boot, FastAPI, PostgreSQL, Docker</dd>
        <dt>Architecture</dt>
        <dd>
          A single-page Angular frontend talks to a Spring Boot REST API, which is the system of
          record (PostgreSQL) and relays scoring requests to a separate Python/FastAPI ML
          inference service. All four pieces run as Docker containers orchestrated by one Compose
          file.
        </dd>
        <dt>Current version</dt>
        <dd>v{{ appVersion }} &mdash; see <a routerLink="/patch-notes">Patch Notes</a> for release history.</dd>
        <dt>Source</dt>
        <dd><a [href]="repositoryUrl" target="_blank" rel="noopener">{{ repositoryUrl }}</a></dd>
      </dl>
    </section>

    <section class="card">
      <h2>Technology Stack</h2>
      <div class="stack-grid">
        @for (entry of techStack; track entry.layer) {
          <div class="stack-card">
            <div class="layer">{{ entry.layer }}</div>
            <div class="tech">{{ entry.technology }}</div>
            <div class="details">{{ entry.details }}</div>
          </div>
        }
      </div>
    </section>

    <section class="card">
      <h2>Repository Architecture Graph</h2>
      <p class="lead">
        A live map of how the real components in this repository depend on each other. Click any
        component or connection for an explanation; drag, zoom, and pan to explore.
      </p>
      <app-architecture-graph />
    </section>

    <section class="card">
      <h2>Repository Structure &amp; Explorer</h2>
      <p class="lead">
        Expand a directory to see what it contains. This is a curated, hand-verified list of the
        repository's real structure &mdash; not a live scan of the server filesystem &mdash; so it
        only ever shows paths and descriptions that have been explicitly reviewed as safe to
        display. No configuration values, credentials, or file contents are shown.
      </p>
      <app-repository-explorer [entries]="repositoryStructure" />
    </section>
  `,
  styles: [
    `
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .card h2 {
        font-size: 15px;
        margin-bottom: var(--space-3);
      }
      .lead {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0 0 var(--space-3);
      }
      dl {
        display: grid;
        grid-template-columns: 160px 1fr;
        row-gap: var(--space-2);
        margin: 0;
        font-size: 13px;
      }
      dt {
        color: var(--text-secondary);
      }
      dd {
        margin: 0;
      }
      dd a {
        color: var(--primary);
      }
      .stack-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-3);
      }
      .stack-card {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        background: var(--page-bg);
      }
      .stack-card .layer {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--primary);
        margin-bottom: 4px;
      }
      .stack-card .tech {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .stack-card .details {
        font-size: 12px;
        color: var(--text-secondary);
      }
      @media (max-width: 560px) {
        dl {
          grid-template-columns: 1fr;
        }
        dt {
          margin-top: var(--space-2);
        }
      }
    `,
  ],
})
export class UnderstandRepositoryPageComponent {
  readonly appVersion = APP_VERSION;
  readonly repositoryUrl = REPOSITORY_URL;
  readonly techStack = TECH_STACK;
  readonly repositoryStructure = REPOSITORY_STRUCTURE;
}
