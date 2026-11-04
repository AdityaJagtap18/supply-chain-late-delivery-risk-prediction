import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService, BatchScoringResult } from '../services/order.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { RiskKpiCardComponent } from '../risk-dashboard/risk-kpi-card.component';
import { BatchRunHistoryUnavailableComponent } from './batch-run-history-unavailable.component';

/**
 * UI-003 Phase 3: the Batch Scoring module. Reuses the real FR-031 trigger
 * (`POST /system/batch-scoring`) the dashboard already calls -- the same endpoint, same
 * side effects (new `risk_assessment` rows via a real inference-service round trip) -- and adds
 * a dedicated page to run it and read its result in detail. No run-history list is shown: see
 * `BatchRunHistoryUnavailableComponent` for why.
 */
@Component({
  selector: 'app-batch-scoring-page',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, RiskKpiCardComponent, BatchRunHistoryUnavailableComponent],
  template: `
    <app-page-header title="Batch Scoring" subtitle="Run and review batch scoring.">
      <button
        type="button"
        class="primary"
        [disabled]="running()"
        (click)="run()"
        title="Calls the real ML inference service and persists new risk_assessment rows (FR-031)."
      >
        &#9654; {{ running() ? 'Running…' : 'Run Batch Scoring' }}
      </button>
    </app-page-header>

    @if (message()) {
      <p class="message" [class.error]="!succeeded()">{{ message() }}</p>
    }

    <section class="card">
      <h2>Latest Run</h2>
      @if (lastResult(); as result) {
        <div class="meta">
          Scored at {{ result.scoredAt | date: 'MMM d, y, h:mm:ss a' }}
        </div>
        <div class="kpi-grid">
          <app-risk-kpi-card label="Total Orders" [value]="result.totalOrders ?? 0" icon="&#9635;" tone="total" />
          <app-risk-kpi-card label="Scored" [value]="result.scoredCount ?? 0" icon="&#10003;" tone="low" />
          <app-risk-kpi-card
            label="Skipped: Unseen Category"
            [value]="result.skippedUnseenCategory ?? 0"
            icon="&#9888;"
            tone="medium"
          />
          <app-risk-kpi-card
            label="Skipped: Incomplete Data"
            [value]="result.skippedIncompleteData ?? 0"
            icon="&#9888;"
            tone="medium"
          />
          <app-risk-kpi-card
            label="Skipped: Unchanged"
            [value]="result.skippedUnchanged ?? 0"
            icon="&#8801;"
            tone="low"
          />
        </div>
      } @else {
        <p class="empty">No batch scoring run yet this session. Run one above to see its result here.</p>
      }
    </section>

    <section class="card">
      <h2>Run History</h2>
      <app-batch-run-history-unavailable />
    </section>
  `,
  styles: [
    `
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
      .message {
        font-size: 13px;
        color: var(--risk-low);
        margin: calc(-1 * var(--space-2)) 0 var(--space-3);
      }
      .message.error {
        color: var(--risk-high);
      }
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-4);
      }
      .card h2 {
        font-size: 15px;
        margin-bottom: var(--space-3);
      }
      .meta {
        color: var(--text-secondary);
        font-size: 13px;
        margin-bottom: var(--space-3);
      }
      .empty {
        color: var(--text-secondary);
        font-size: 13px;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
      }
      @media (max-width: 1100px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 560px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class BatchScoringPageComponent {
  private readonly orderService = inject(OrderService);

  running = signal(false);
  message = signal<string | null>(null);
  succeeded = signal(true);
  lastResult = signal<BatchScoringResult | null>(null);

  run(): void {
    this.running.set(true);
    this.message.set(null);
    this.orderService.triggerBatchScoring().subscribe({
      next: (result) => this.onSettled(result),
      error: (err) => this.onSettled(err.error as BatchScoringResult | undefined),
    });
  }

  private onSettled(result: BatchScoringResult | undefined): void {
    this.running.set(false);
    if (result?.succeeded) {
      this.succeeded.set(true);
      this.lastResult.set(result);
      this.message.set(
        `Scored ${result.scoredCount} of ${result.totalOrders} orders ` +
          `(${result.skippedUnseenCategory} skipped: unseen category; ` +
          `${result.skippedIncompleteData} skipped: incomplete data; ` +
          `${result.skippedUnchanged ?? 0} skipped: unchanged since last score).`,
      );
    } else {
      this.succeeded.set(false);
      this.message.set(
        result?.reason ? `Batch scoring run failed: ${result.reason}` : 'Batch scoring run failed.',
      );
    }
  }
}
