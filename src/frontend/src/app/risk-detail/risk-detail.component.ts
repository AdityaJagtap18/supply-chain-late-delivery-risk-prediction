import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../services/order.service';
import { OrderDetail } from '../models/order.model';
import { RiskLevelBadgeComponent } from '../shared/risk-level-badge.component';
import { LoadingStateComponent, ErrorStateComponent } from '../shared/state-views.component';

/**
 * FR-033 -- order risk detail view (UI-DESIGN-001 Screen 2). Shows only `customer.segment` for
 * "customer context" (CONS-007: BE-ARCH-001's contract does not expose any customer-identity/
 * history field beyond segment -- not invented here). Never requests
 * `customer_location`/lat/long -- BE-ARCH-001's contract does not expose them (CONS-004).
 */
@Component({
  selector: 'app-risk-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, RiskLevelBadgeComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <p><a routerLink="/orders" class="back">&larr; Back to risk queue</a></p>
    @if (loading()) {
      <app-loading-state />
    } @else if (error()) {
      <app-error-state message="Could not load this order." />
    } @else if (detail()) {
      <div class="header">
        <h1>Order ORD-{{ detail()!.orderId }}</h1>
        <app-risk-level-badge [riskBand]="detail()!.currentRisk?.riskBand" />
      </div>

      <div class="grid">
        <section class="card">
          <h2>Order information</h2>
          <dl>
            <dt>Status</dt>
            <dd>{{ detail()!.orderStatus }}</dd>
            <dt>Placed at</dt>
            <dd>{{ detail()!.placedAt | date: 'medium' }}</dd>
            <dt>Destination</dt>
            <dd>{{ detail()!.destination.city }}, {{ detail()!.destination.region }}</dd>
          </dl>
        </section>

        <section class="card">
          <h2>Shipping information</h2>
          <dl>
            <dt>Shipping mode</dt>
            <dd>{{ detail()!.shippingMode }}</dd>
          </dl>
        </section>

        <section class="card">
          <h2>Customer context</h2>
          <dl>
            <dt>Segment</dt>
            <dd>{{ detail()!.customer.segment }}</dd>
          </dl>
        </section>

        <section class="card">
          <h2>Current risk assessment</h2>
          @if (detail()!.currentRisk) {
            <dl>
              <dt>Risk score</dt>
              <dd>{{ detail()!.currentRisk!.riskScore }}</dd>
              <dt>Model version</dt>
              <dd>{{ detail()!.currentRisk!.modelVersion }}</dd>
              <dt>Scored at</dt>
              <dd>{{ detail()!.currentRisk!.scoredAt | date: 'medium' }}</dd>
            </dl>
          } @else {
            <p class="muted">No risk assessment yet for this order.</p>
          }
        </section>
      </div>
    }
  `,
  styles: [
    `
      .back {
        color: var(--primary);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
      }
      .header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: var(--space-2) 0 var(--space-4);
      }
      .header h1 {
        font-size: 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
      }
      .card h2 {
        font-size: 14px;
        margin-bottom: var(--space-2);
        color: var(--text-secondary);
      }
      dl {
        margin: 0;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--space-2) var(--space-3);
      }
      dt {
        color: var(--text-secondary);
        font-size: 13px;
      }
      dd {
        margin: 0;
        font-weight: 500;
      }
      .muted {
        color: var(--text-secondary);
        font-size: 13px;
      }
      @media (max-width: 700px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RiskDetailComponent {
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  detail = signal<OrderDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    const orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    this.orderService.getOrderDetail(orderId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('failed');
        this.loading.set(false);
      },
    });
  }
}
