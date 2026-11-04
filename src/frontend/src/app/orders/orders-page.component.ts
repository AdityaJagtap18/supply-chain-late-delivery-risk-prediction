import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrderService } from '../services/order.service';
import { OrderQueueItem } from '../models/order.model';
import { PageHeaderComponent } from '../shared/page-header.component';
import { LoadingStateComponent, ErrorStateComponent } from '../shared/state-views.component';
import { OrdersTableComponent } from './orders-table.component';

/**
 * UI-003 Phase 2: the Orders module. Fetches the same real `GET /orders` endpoint the Late
 * Delivery Risk dashboard uses (BE-ARCH-001 S2.3) -- there is no separate "orders list" backend
 * endpoint, and none is invented here -- but filters by `orderStatus` rather than `riskBand`,
 * since this module is for browsing all orders by their own attributes, not triaging risk.
 */
@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [DatePipe, PageHeaderComponent, LoadingStateComponent, ErrorStateComponent, OrdersTableComponent],
  template: `
    <app-page-header title="Orders" subtitle="Browse, search, and filter all orders.">
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
      <section class="card">
        <app-orders-table
          [orders]="orders()"
          [orderStatus]="orderStatusFilter()"
          (orderStatusChange)="onOrderStatusChange($event)"
          (refresh)="load(true)"
        />
      </section>
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
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
      }
    `,
  ],
})
export class OrdersPageComponent {
  private readonly orderService = inject(OrderService);

  orders = signal<OrderQueueItem[]>([]);
  asOf = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  orderStatusFilter = signal<string | undefined>(undefined);

  constructor() {
    this.load();
  }

  load(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.listOrders(undefined, this.orderStatusFilter(), forceRefresh).subscribe({
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

  onOrderStatusChange(status: string | undefined): void {
    this.orderStatusFilter.set(status);
    this.load();
  }
}
