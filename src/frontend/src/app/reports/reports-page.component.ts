import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService } from '../services/order.service';
import { OrderQueueItem } from '../models/order.model';
import { PageHeaderComponent } from '../shared/page-header.component';
import { LoadingStateComponent, ErrorStateComponent } from '../shared/state-views.component';
import { CategoryRiskBreakdownComponent, CategoryRiskRow } from './category-risk-breakdown.component';

/**
 * UI-003 Phase 4: the Reports module. There is no dedicated reporting/analytics endpoint in
 * BE-ARCH-001 -- the same real `GET /orders` response the dashboard fetches is the only data
 * this app has, so this page aggregates it client-side into four risk-by-category breakdowns
 * (order status, shipping mode, destination region, payment type). Every number traces back to
 * that one real response; nothing here is invented or estimated.
 */
@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    DatePipe,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    CategoryRiskBreakdownComponent,
  ],
  template: `
    <app-page-header title="Reports" subtitle="Risk and delivery performance reporting.">
      <span class="as-of">
        @if (asOf()) {
          Last Scored: {{ asOf() | date: 'MMM d, y, h:mm a' }}
        } @else {
          No scores available
        }
      </span>
      <button type="button" class="refresh" (click)="load(true)" aria-label="Refresh">&#8635;</button>
    </app-page-header>

    @if (loading()) {
      <app-loading-state />
    } @else if (error()) {
      <app-error-state message="Could not load orders." />
    } @else {
      <div class="grid">
        <app-category-risk-breakdown title="Risk by Order Status" [rows]="byStatus()" />
        <app-category-risk-breakdown title="Risk by Shipping Mode" [rows]="byShippingMode()" />
        <app-category-risk-breakdown title="Risk by Destination Region" [rows]="byRegion()" />
        <app-category-risk-breakdown title="Risk by Payment Type" [rows]="byPaymentType()" />
      </div>
    }
  `,
  styles: [
    `
      .as-of {
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
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsPageComponent {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderQueueItem[]>([]);
  asOf = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  byStatus = computed(() => this.breakdownBy((order) => order.orderStatus));
  byShippingMode = computed(() => this.breakdownBy((order) => order.shippingMode));
  byRegion = computed(() => this.breakdownBy((order) => order.destination.region));
  byPaymentType = computed(() => this.breakdownBy((order) => order.paymentType));

  constructor() {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.listOrders(undefined, undefined, forceRefresh).subscribe({
      next: (response) => {
        this.orders.set(response.orders);
        this.asOf.set(response.scoresAsOf);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }

  private breakdownBy(keyOf: (order: OrderQueueItem) => string | null): CategoryRiskRow[] {
    const byCategory = new Map<string, CategoryRiskRow>();
    for (const order of this.orders()) {
      const category = keyOf(order) ?? 'Unknown';
      const row = byCategory.get(category) ?? { category, high: 0, medium: 0, low: 0 };
      switch (order.riskBand?.toLowerCase()) {
        case 'high':
          row.high += 1;
          break;
        case 'medium':
          row.medium += 1;
          break;
        case 'low':
          row.low += 1;
          break;
      }
      byCategory.set(category, row);
    }
    return [...byCategory.values()];
  }
}
