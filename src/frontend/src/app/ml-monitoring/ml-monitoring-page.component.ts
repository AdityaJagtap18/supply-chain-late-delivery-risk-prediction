import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MlMonitoringService } from '../services/ml-monitoring.service';
import { OrderService } from '../services/order.service';
import { OrderQueueItem } from '../models/order.model';
import { ModelInfo, ModelVersionsResponse } from '../models/ml-monitoring.model';
import { PageHeaderComponent } from '../shared/page-header.component';
import { LoadingStateComponent, ErrorStateComponent } from '../shared/state-views.component';
import { UnavailableNoticeComponent } from '../shared/unavailable-notice.component';
import { DataDriftRow, computePsi, liveFrequencies, severityOf } from './data-drift.util';

/**
 * UI-003 Phase 6: the ML Monitoring module. Reads two real backend endpoints --
 * `GET /system/model-info` (new this phase: a thin relay of the ML service's own read-only
 * training-run metadata) and the pre-existing `GET /system/model-versions` (the live
 * active-model/last-scored-at signal already backing `SystemController`) -- plus the same real
 * `GET /orders` response every other module already fetches, for the Data Drift comparison.
 *
 * Sections with no real backing data (Prediction Drift, Production Performance, MLOps Alerts)
 * show an honest unavailable notice instead of fabricated numbers -- per UI-003's own explicit
 * instruction never to display offline test metrics as production metrics, and never to invent
 * production precision/recall/F1/ROC-AUC or alert records that don't exist.
 */
@Component({
  selector: 'app-ml-monitoring-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    UnavailableNoticeComponent,
  ],
  template: `
    <app-page-header title="ML Monitoring" subtitle="Model evaluation, drift, and production performance.">
      <button type="button" class="refresh" (click)="load(true)" aria-label="Refresh">&#8635;</button>
    </app-page-header>

    @if (loading()) {
      <app-loading-state />
    } @else if (error()) {
      <app-error-state message="Could not load model monitoring data." />
    } @else {
      <section class="card">
        <h2>Overview</h2>
        <dl>
          <dt>Active Model Version</dt>
          <dd>{{ versions()?.activeModelVersion ?? '--' }}</dd>
          <dt>Algorithm</dt>
          <dd>{{ modelInfo()?.modelAlgorithm ?? '--' }}</dd>
          <dt>Trained At</dt>
          <dd>{{ modelInfo()?.trainedAt ? (modelInfo()!.trainedAt | date: 'MMM d, y, h:mm a') : '--' }}</dd>
          <dt>Last Scored At</dt>
          <dd>{{ versions()?.lastScoredAt ? (versions()!.lastScoredAt | date: 'MMM d, y, h:mm a') : '--' }}</dd>
        </dl>
      </section>

      <section class="card">
        <h2>Model Configuration (Read-Only)</h2>
        <dl>
          <dt>Source Training File</dt>
          <dd>{{ modelInfo()?.sourceFile ?? '--' }}</dd>
          <dt>Feature List</dt>
          <dd>
            <div class="chips">
              @for (feature of modelInfo()?.featureList ?? []; track feature) {
                <span class="chip">{{ feature }}</span>
              }
            </div>
          </dd>
          <dt>Library Versions</dt>
          <dd>
            @for (entry of libraryVersionEntries(); track entry[0]) {
              <div>{{ entry[0] }}: {{ entry[1] }}</div>
            }
          </dd>
        </dl>
      </section>

      <section class="card">
        <h2>Evaluation</h2>
        <p class="note">
          Offline evaluation on the held-out test split from the training run that produced
          {{ modelInfo()?.modelVersion }} -- never the live production population.
        </p>
        @if (modelInfo()?.metrics; as metrics) {
          <div class="metrics-grid">
            <div class="metric"><span class="label">Precision</span><span class="value">{{ metrics.precision | number: '1.3-3' }}</span></div>
            <div class="metric"><span class="label">Recall</span><span class="value">{{ metrics.recall | number: '1.3-3' }}</span></div>
            <div class="metric"><span class="label">F1</span><span class="value">{{ metrics.f1 | number: '1.3-3' }}</span></div>
            <div class="metric"><span class="label">ROC-AUC</span><span class="value">{{ metrics.rocAuc | number: '1.3-3' }}</span></div>
            <div class="metric"><span class="label">PR-AUC</span><span class="value">{{ metrics.prAuc | number: '1.3-3' }}</span></div>
            <div class="metric"><span class="label">Brier Score</span><span class="value">{{ metrics.brierScore | number: '1.3-3' }}</span></div>
          </div>
          <h3>Confusion Matrix</h3>
          <table class="confusion">
            <tbody>
              <tr>
                <td class="corner"></td>
                <td class="header">Predicted Low Risk</td>
                <td class="header">Predicted High Risk</td>
              </tr>
              <tr>
                <td class="header">Actual Low Risk</td>
                <td>{{ metrics.confusionMatrix.tn }}</td>
                <td>{{ metrics.confusionMatrix.fp }}</td>
              </tr>
              <tr>
                <td class="header">Actual High Risk</td>
                <td>{{ metrics.confusionMatrix.fn }}</td>
                <td>{{ metrics.confusionMatrix.tp }}</td>
              </tr>
            </tbody>
          </table>
          <p class="note">
            Test set size: {{ metrics.testSetSize }}
            ({{ metrics.testSetRowsExcludedUnseenCategory }} rows excluded: unseen category).
          </p>
        } @else {
          <app-unavailable-notice
            title="Offline evaluation metrics are not available."
            message="The ML service did not return training metrics with its model-info response."
          />
        }
      </section>

      <section class="card">
        <h2>Data Drift</h2>
        <p class="note">
          Population Stability Index between the training set's category frequencies and the
          current live order population, computed for the features both the training metadata and
          the live {{ totalOrders() }}-order response share.
        </p>
        @if (dataDriftRows().length === 0) {
          <app-unavailable-notice
            title="Data drift could not be computed."
            message="No overlapping categorical features were found between the training baseline and the live order data."
          />
        } @else {
          <table class="drift">
            <thead>
              <tr>
                <th>Feature</th>
                <th>PSI</th>
                <th>Assessment</th>
              </tr>
            </thead>
            <tbody>
              @for (row of dataDriftRows(); track row.feature) {
                <tr>
                  <td>{{ row.feature }}</td>
                  <td>{{ row.psi | number: '1.3-3' }}</td>
                  <td><span class="severity" [class]="row.severity">{{ severityLabel(row.severity) }}</span></td>
                </tr>
              }
            </tbody>
          </table>
          <p class="note">PSI &lt; 0.10 no significant drift &middot; 0.10&ndash;0.25 moderate drift &middot; &ge;0.25 significant drift (standard PSI interpretation guideline).</p>
        }
      </section>

      <section class="card">
        <h2>Prediction Drift</h2>
        <app-unavailable-notice
          title="Prediction drift is not available yet."
          message="Prediction drift compares the model's predicted-risk distribution across past batch-scoring runs. No run history is persisted anywhere in this backend (see the Batch Scoring module), so there is nothing to compare against yet."
        />
      </section>

      <section class="card">
        <h2>Production Performance</h2>
        <app-unavailable-notice
          title="Production performance unavailable — awaiting verified delivery outcome labels."
          message="A prediction alone cannot establish whether an order was actually delivered late. No endpoint records verified delivery outcomes, so production precision, recall, F1, or ROC-AUC are not calculated or displayed here."
        />
      </section>

      <section class="card">
        <h2>Model Health</h2>
        <dl>
          <dt>Model Loaded</dt>
          <dd>{{ modelInfo() ? 'Yes' : 'No' }}</dd>
          <dt>Last Successful Batch Run</dt>
          <dd>{{ versions()?.lastScoredAt ? (versions()!.lastScoredAt | date: 'MMM d, y, h:mm a') : 'Never' }}</dd>
        </dl>
      </section>

      <section class="card">
        <h2>Model Versions</h2>
        <table class="drift">
          <thead>
            <tr>
              <th>Version</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ versions()?.activeModelVersion ?? '--' }}</td>
              <td><span class="severity none">Active</span></td>
            </tr>
          </tbody>
        </table>
        <p class="note">
          No model registry persists more than the currently active version, so version history
          and comparison aren't available yet.
        </p>
      </section>

      <section class="card">
        <h2>MLOps Alerts</h2>
        <app-unavailable-notice
          title="No alerting system exists yet."
          message="There is no persisted alert store in this backend. Alerts shown here would need to be backed by real records before they could be acknowledged or resolved, so none are fabricated."
        />
      </section>
    }
  `,
  styles: [
    `
      .refresh {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        width: 36px;
        height: 36px;
      }
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
      .card h3 {
        font-size: 13px;
        margin: var(--space-3) 0 var(--space-2);
      }
      .note {
        color: var(--text-secondary);
        font-size: 12px;
        margin: var(--space-2) 0 0;
      }
      dl {
        display: grid;
        grid-template-columns: 180px 1fr;
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
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .chip {
        background: var(--page-bg);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-3);
      }
      .metric {
        display: flex;
        flex-direction: column;
        gap: 4px;
        background: var(--page-bg);
        border-radius: 6px;
        padding: var(--space-2) var(--space-3);
      }
      .metric .label {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .metric .value {
        font-size: 18px;
        font-weight: 700;
      }
      table.confusion,
      table.drift {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      table.confusion td,
      table.drift td,
      table.drift th {
        padding: 8px 12px;
        border: 1px solid var(--border);
        text-align: center;
      }
      table.confusion .header,
      table.drift th {
        background: var(--page-bg);
        font-weight: 600;
      }
      table.confusion .corner {
        background: var(--surface);
        border: none;
      }
      .severity {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }
      .severity.none {
        background: color-mix(in srgb, var(--risk-low) 14%, white);
        color: var(--risk-low);
      }
      .severity.moderate {
        background: color-mix(in srgb, var(--risk-medium) 16%, white);
        color: #8a5a00;
      }
      .severity.significant {
        background: color-mix(in srgb, var(--risk-high) 14%, white);
        color: var(--risk-high);
      }
      @media (max-width: 700px) {
        .metrics-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class MlMonitoringPageComponent {
  private readonly mlMonitoringService = inject(MlMonitoringService);
  private readonly orderService = inject(OrderService);

  loading = signal(true);
  error = signal<string | null>(null);
  modelInfo = signal<ModelInfo | null>(null);
  versions = signal<ModelVersionsResponse | null>(null);
  orders = signal<OrderQueueItem[]>([]);

  totalOrders = computed(() => this.orders().length);

  libraryVersionEntries = computed(() =>
    Object.entries(this.modelInfo()?.libraryVersions ?? {}),
  );

  /** The live order fields that overlap the training `categoryFrequencies` keys (CONS-004 -- see
   * the Orders model's own note that `GET /orders` is more conservative than the full ML-001
   * feature set: no customerCity/customerZipcode/orderCountry/orderState is exposed there). */
  dataDriftRows = computed((): DataDriftRow[] => {
    const baseline = this.modelInfo()?.categoryFrequencies;
    if (!baseline) {
      return [];
    }
    const orders = this.orders();
    const sources: Record<string, (order: OrderQueueItem) => string | null> = {
      type: (order) => order.paymentType,
      shippingMode: (order) => order.shippingMode,
      orderRegion: (order) => order.destination.region,
      orderCity: (order) => order.destination.city,
    };

    const rows: DataDriftRow[] = [];
    for (const [feature, keyOf] of Object.entries(sources)) {
      const baselineFreq = baseline[feature];
      if (!baselineFreq) {
        continue;
      }
      const counts: Record<string, number> = {};
      for (const order of orders) {
        const value = keyOf(order);
        if (value) {
          counts[value] = (counts[value] ?? 0) + 1;
        }
      }
      const live = liveFrequencies(counts);
      const psi = computePsi(baselineFreq, live);
      rows.push({
        feature,
        psi,
        severity: severityOf(psi),
        liveCategoryCount: Object.keys(live).length,
        baselineCategoryCount: Object.keys(baselineFreq).length,
      });
    }
    return rows;
  });

  constructor() {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      modelInfo: this.mlMonitoringService.getModelInfo(),
      versions: this.mlMonitoringService.getModelVersions(),
      orders: this.orderService.listOrders(undefined, undefined, forceRefresh),
    }).subscribe({
      next: ({ modelInfo, versions, orders }) => {
        this.modelInfo.set(modelInfo);
        this.versions.set(versions);
        this.orders.set(orders.orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  severityLabel(severity: DataDriftRow['severity']): string {
    switch (severity) {
      case 'significant':
        return 'Significant Drift';
      case 'moderate':
        return 'Moderate Drift';
      default:
        return 'No Significant Drift';
    }
  }
}
