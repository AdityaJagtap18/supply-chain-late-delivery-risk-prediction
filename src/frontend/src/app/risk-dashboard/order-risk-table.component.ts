import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderQueueItem } from '../models/order.model';
import { RiskLevelBadgeComponent } from '../shared/risk-level-badge.component';
import { EmptyStateComponent } from '../shared/state-views.component';

type SortKey = 'orderId' | 'riskScore';

/**
 * UI-001-REVISION S5's Order Risk List. `Market` is omitted -- `GET /orders` does not return it
 * (see UI-DESIGN-001-REVISION-001). Server-side `riskBand` filtering (already supported by
 * BE-ARCH-001 S2.3) is handled by the parent page re-fetching; search/sort/pagination here are
 * client-side over the already-fetched page, consistent with FE-ARCH-001 S2.2's "purely a
 * display filter" pattern for anything the backend contract doesn't support as a query param.
 */
@Component({
  selector: 'app-order-risk-table',
  standalone: true,
  imports: [RouterLink, FormsModule, RiskLevelBadgeComponent, EmptyStateComponent],
  template: `
    <div class="toolbar">
      <input
        type="search"
        placeholder="Search by Order ID"
        [(ngModel)]="searchTerm"
        aria-label="Search within this page by Order ID"
      />
      <select [ngModel]="riskBand" (ngModelChange)="riskBandChange.emit($event)" aria-label="Risk level">
        <option [ngValue]="undefined">Risk Level: All</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
        <option value="stale">Unscored</option>
      </select>
      <button type="button" (click)="refresh.emit()">&#8635; Refresh</button>
    </div>

    @if (orders.length === 0) {
      <app-empty-state message="No open orders currently in the queue." />
    } @else if (visibleRows().length === 0) {
      <app-empty-state message="No orders match this search." />
    } @else {
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <button class="sort" (click)="toggleSort('orderId')">Order ID</button>
              </th>
              <th>
                <button class="sort" (click)="toggleSort('riskScore')">Risk Score</button>
              </th>
              <th>Risk Level</th>
              <th>Order Status</th>
              <th>Order City</th>
              <th>Order Region</th>
              <th>Shipping Mode</th>
              <th>Payment Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (order of pagedRows(); track order.orderId) {
              <tr>
                <td>ORD-{{ order.orderId }}</td>
                <td>{{ order.riskScore ?? '--' }}</td>
                <td><app-risk-level-badge [riskBand]="order.riskBand" /></td>
                <td>{{ order.orderStatus }}</td>
                <td>{{ order.destination.city }}</td>
                <td>{{ order.destination.region }}</td>
                <td>{{ order.shippingMode }}</td>
                <td>{{ order.paymentType }}</td>
                <td><a [routerLink]="['/orders', order.orderId]">View</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <span>
          Showing {{ pageStart() + 1 }}&ndash;{{ pageEnd() }} of {{ visibleRows().length }} orders
        </span>
        <div class="controls">
          <button type="button" [disabled]="page() === 0" (click)="page.set(page() - 1)">&lsaquo;</button>
          <span>{{ page() + 1 }} / {{ pageCount() }}</span>
          <button type="button" [disabled]="page() >= pageCount() - 1" (click)="page.set(page() + 1)">
            &rsaquo;
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .toolbar {
        display: flex;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
        flex-wrap: wrap;
      }
      .toolbar input,
      .toolbar select {
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 13px;
      }
      .toolbar button {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 13px;
        margin-left: auto;
      }
      .table-scroll {
        overflow-x: auto;
      }
      table {
        font-size: 13px;
      }
      th {
        text-align: left;
        color: var(--text-secondary);
        font-weight: 600;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }
      td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--border);
        white-space: nowrap;
      }
      .sort {
        border: none;
        background: transparent;
        color: inherit;
        font: inherit;
        padding: 0;
      }
      a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 500;
      }
      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--space-3);
        color: var(--text-secondary);
        font-size: 13px;
      }
      .controls {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .controls button {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        padding: 4px 10px;
      }
      .controls button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class OrderRiskTableComponent {
  @Input() orders: OrderQueueItem[] = [];
  @Input() riskBand: string | undefined;
  @Output() riskBandChange = new EventEmitter<string | undefined>();
  @Output() refresh = new EventEmitter<void>();

  readonly pageSize = 10;
  searchTerm = '';
  sortKey = signal<SortKey>('riskScore');
  sortDescending = signal(true);
  page = signal(0);

  visibleRows = computed(() => {
    const term = this.searchTerm.trim();
    let rows = this.orders;
    if (term) {
      rows = rows.filter((order) => String(order.orderId).includes(term));
    }
    const key = this.sortKey();
    const descending = this.sortDescending();
    return [...rows].sort((a, b) => {
      const left = a[key] ?? -1;
      const right = b[key] ?? -1;
      return descending ? right - left : left - right;
    });
  });

  pageCount = computed(() => Math.max(1, Math.ceil(this.visibleRows().length / this.pageSize)));

  pageStart = computed(() => this.page() * this.pageSize);

  pageEnd = computed(() => Math.min(this.pageStart() + this.pageSize, this.visibleRows().length));

  pagedRows = computed(() => this.visibleRows().slice(this.pageStart(), this.pageEnd()));

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDescending.update((value) => !value);
    } else {
      this.sortKey.set(key);
      this.sortDescending.set(true);
    }
    this.page.set(0);
  }
}
