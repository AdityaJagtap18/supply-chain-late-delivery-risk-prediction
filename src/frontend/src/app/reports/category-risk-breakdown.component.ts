import { Component, Input, computed, signal } from '@angular/core';

export interface CategoryRiskRow {
  category: string;
  high: number;
  medium: number;
  low: number;
}

/**
 * UI-003 Phase 4's reusable risk-by-category breakdown -- a horizontal stacked bar per category
 * (order status, shipping mode, region, payment type), sorted by total orders descending. Data
 * is always a client-side aggregation of the one real `GET /orders` response the Reports page
 * fetches; no new backend endpoint exists for this, and none is invented here.
 */
@Component({
  selector: 'app-category-risk-breakdown',
  standalone: true,
  template: `
    <section class="card">
      <h2>{{ title }}</h2>
      @if (sortedRows().length === 0) {
        <p class="empty">No data available.</p>
      } @else {
        <ul class="rows">
          @for (row of sortedRows(); track row.category) {
            <li>
              <div class="row-header">
                <span class="category">{{ row.category }}</span>
                <span class="total">{{ total(row) }} orders</span>
              </div>
              <div class="bar" role="img" [attr.aria-label]="ariaLabel(row)">
                <span class="segment high" [style.width.%]="pct(row.high, row)"></span>
                <span class="segment medium" [style.width.%]="pct(row.medium, row)"></span>
                <span class="segment low" [style.width.%]="pct(row.low, row)"></span>
              </div>
            </li>
          }
        </ul>
        <div class="legend">
          <span><i class="swatch high"></i>High</span>
          <span><i class="swatch medium"></i>Medium</span>
          <span><i class="swatch low"></i>Low</span>
        </div>
      }
    </section>
  `,
  styles: [
    `
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
      .empty {
        color: var(--text-secondary);
        font-size: 13px;
      }
      .rows {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }
      .row-header {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 4px;
      }
      .category {
        font-weight: 600;
      }
      .total {
        color: var(--text-secondary);
      }
      .bar {
        display: flex;
        height: 10px;
        border-radius: 5px;
        overflow: hidden;
        background: var(--page-bg);
      }
      .segment.high {
        background: var(--risk-high);
      }
      .segment.medium {
        background: var(--risk-medium);
      }
      .segment.low {
        background: var(--risk-low);
      }
      .legend {
        display: flex;
        gap: var(--space-3);
        margin-top: var(--space-3);
        font-size: 12px;
        color: var(--text-secondary);
      }
      .legend span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        display: inline-block;
      }
      .swatch.high {
        background: var(--risk-high);
      }
      .swatch.medium {
        background: var(--risk-medium);
      }
      .swatch.low {
        background: var(--risk-low);
      }
    `,
  ],
})
export class CategoryRiskBreakdownComponent {
  @Input({ required: true }) title!: string;

  private rowsSignal = signal<CategoryRiskRow[]>([]);

  @Input() set rows(value: CategoryRiskRow[]) {
    this.rowsSignal.set(value ?? []);
  }

  sortedRows = computed(() =>
    [...this.rowsSignal()].sort((a, b) => this.total(b) - this.total(a)),
  );

  total(row: CategoryRiskRow): number {
    return row.high + row.medium + row.low;
  }

  pct(count: number, row: CategoryRiskRow): number {
    const total = this.total(row);
    return total === 0 ? 0 : (count / total) * 100;
  }

  ariaLabel(row: CategoryRiskRow): string {
    return `${row.category}: ${row.high} high, ${row.medium} medium, ${row.low} low risk orders`;
  }
}
