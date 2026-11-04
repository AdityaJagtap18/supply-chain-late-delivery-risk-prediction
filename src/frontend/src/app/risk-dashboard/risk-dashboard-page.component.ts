import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService, BatchScoringResult } from '../services/order.service';
import { OrderQueueItem } from '../models/order.model';
import { RiskKpiCardComponent } from './risk-kpi-card.component';
import { RiskDistributionChartComponent } from './risk-distribution-chart.component';
import { RiskTrendUnavailableComponent } from './risk-trend-unavailable.component';
import { OrderRiskTableComponent } from './order-risk-table.component';
import { LoadingStateComponent, ErrorStateComponent } from '../shared/state-views.component';

/**
 * FR-032's risk queue (UI-DESIGN-001 S3.1), extended per UI-DESIGN-001-REVISION-001 with KPI
 * cards and a distribution chart -- both computed from the one `GET /orders` response this page
 * fetches, never a second request. "Run Batch Scoring" stays disabled: BE-ARCH-001 S2.7/S5
 * leaves that trigger endpoint as an undecided scope question, not committed.
 */
@Component({
  selector: 'app-risk-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    RiskKpiCardComponent,
    RiskDistributionChartComponent,
    RiskTrendUnavailableComponent,
    OrderRiskTableComponent,
    LoadingStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="header">
      <div>
        <h1>Late Delivery Risk</h1>
        <p class="subtitle">Order-level risk assessment for potential late deliveries.</p>
      </div>
      <div class="actions">
        <span class="scored-at">
          @if (scoresAsOf()) {
            Last Scored: {{ scoresAsOf() | date: 'MMM d, y, h:mm a' }}
          } @else {
            No scores available
          }
        </span>
        <button type="button" class="refresh" (click)="load(true)" aria-label="Refresh">&#8635;</button>
        <button
          type="button"
          class="primary"
          [disabled]="batchScoringRunning()"
          (click)="runBatchScoring()"
          title="Calls the real ML inference service and persists new risk_assessment rows (FR-031)."
        >
          &#9654; {{ batchScoringRunning() ? 'Running…' : 'Run Batch Scoring' }}
        </button>
      </div>
    </div>

    @if (batchScoringMessage()) {
      <p class="batch-message" [class.error]="!batchScoringSucceeded()">{{ batchScoringMessage() }}</p>
    }

    @if (loading()) {
      <app-loading-state />
    } @else if (error()) {
      <app-error-state message="Could not load the risk queue." />
    } @else {
      <div class="kpi-grid">
        <app-risk-kpi-card label="High Risk Orders" [value]="counts().high" icon="&#9650;" tone="high" />
        <app-risk-kpi-card
          label="Medium Risk Orders"
          [value]="counts().medium"
          icon="&#9679;"
          tone="medium"
        />
        <app-risk-kpi-card label="Low Risk Orders" [value]="counts().low" icon="&#10003;" tone="low" />
        <app-risk-kpi-card label="Total Orders" [value]="counts().total" icon="&#9635;" tone="total" />
      </div>

      <div class="chart-grid">
        <section class="card">
          <h2>Risk Trend</h2>
          <app-risk-trend-unavailable />
        </section>
        <section class="card">
          <h2>Risk Distribution (Current Batch)</h2>
          <app-risk-distribution-chart
            [high]="counts().high"
            [medium]="counts().medium"
            [low]="counts().low"
          />
        </section>
      </div>

      <section class="card">
        <h2>Order Risk List</h2>
        <app-order-risk-table
          [orders]="orders()"
          [riskBand]="riskBandFilter()"
          (riskBandChange)="onRiskBandChange($event)"
          (refresh)="load(true)"
        />
      </section>
    }
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-3);
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }
      h1 {
        font-size: 22px;
      }
      .subtitle {
        margin: 4px 0 0;
        color: var(--text-secondary);
        font-size: 13px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .scored-at {
        font-size: 13px;
        color: var(--text-secondary);
        white-space: nowrap;
      }
      .refresh {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        width: 36px;
        height: 36px;
      }
      .primary {
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 0 16px;
        height: 36px;
        font-weight: 600;
        white-space: nowrap;
      }
      .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .batch-message {
        font-size: 13px;
        color: var(--risk-low);
        margin: calc(-1 * var(--space-2)) 0 var(--space-3);
      }
      .batch-message.error {
        color: var(--risk-high);
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .chart-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
      }
      .card h2 {
        font-size: 15px;
        margin-bottom: var(--space-3);
      }
      @media (max-width: 1100px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .chart-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 560px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
        .actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class RiskDashboardPageComponent {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderQueueItem[]>([]);
  scoresAsOf = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  riskBandFilter = signal<string | undefined>(undefined);
  batchScoringRunning = signal(false);
  batchScoringMessage = signal<string | null>(null);
  batchScoringSucceeded = signal(true);

  counts = computed(() => {
    const rows = this.orders();
    const high = rows.filter((o) => o.riskBand?.toLowerCase() === 'high').length;
    const medium = rows.filter((o) => o.riskBand?.toLowerCase() === 'medium').length;
    const low = rows.filter((o) => o.riskBand?.toLowerCase() === 'low').length;
    return { high, medium, low, total: rows.length };
  });

  constructor() {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.listOrders(this.riskBandFilter(), undefined, forceRefresh).subscribe({
      next: (response) => {
        this.orders.set(response.orders);
        this.scoresAsOf.set(response.scoresAsOf);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  onRiskBandChange(band: string | undefined): void {
    this.riskBandFilter.set(band);
    this.load();
  }

  runBatchScoring(): void {
    this.batchScoringRunning.set(true);
    this.batchScoringMessage.set(null);
    this.orderService.triggerBatchScoring().subscribe({
      next: (result) => this.onBatchScoringSettled(result),
      error: (err) => this.onBatchScoringSettled(err.error as BatchScoringResult | undefined),
    });
  }

  private onBatchScoringSettled(result: BatchScoringResult | undefined): void {
    this.batchScoringRunning.set(false);
    if (result?.succeeded) {
      this.batchScoringSucceeded.set(true);
      this.batchScoringMessage.set(
        `Scored ${result.scoredCount} of ${result.totalOrders} orders ` +
          `(${result.skippedUnseenCategory} skipped: unseen category; ` +
          `${result.skippedIncompleteData} skipped: incomplete data).`,
      );
      this.load();
    } else {
      this.batchScoringSucceeded.set(false);
      this.batchScoringMessage.set(
        result?.reason ? `Batch scoring run failed: ${result.reason}` : 'Batch scoring run failed.',
      );
    }
  }
}
