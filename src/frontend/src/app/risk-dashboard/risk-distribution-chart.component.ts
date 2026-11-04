import { Component, Input } from '@angular/core';

/**
 * UI-001-REVISION S5's risk-distribution donut -- hand-rolled inline SVG (no new chart
 * dependency; `src/frontend` has none today). Data is the same `GET /orders` response Screen 1
 * already fetched, re-visualized -- no new request, no fabricated value.
 */
@Component({
  selector: 'app-risk-distribution-chart',
  standalone: true,
  template: `
    <div class="wrapper">
      <svg viewBox="0 0 120 120" class="donut" role="img" [attr.aria-label]="ariaLabel()">
        @for (segment of segments(); track segment.band) {
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            [attr.stroke]="segment.color"
            stroke-width="18"
            [attr.stroke-dasharray]="segment.dashArray"
            [attr.stroke-dashoffset]="segment.dashOffset"
            transform="rotate(-90 60 60)"
          />
        }
      </svg>
      <div class="center">
        <div class="total">{{ total }}</div>
        <div class="total-label">Orders</div>
      </div>
    </div>
    <ul class="legend">
      <li>
        <span class="swatch" style="background: var(--risk-high)"></span>
        High Risk
        <strong>{{ high }} ({{ percent(high) }}%)</strong>
      </li>
      <li>
        <span class="swatch" style="background: var(--risk-medium)"></span>
        Medium Risk
        <strong>{{ medium }} ({{ percent(medium) }}%)</strong>
      </li>
      <li>
        <span class="swatch" style="background: var(--risk-low)"></span>
        Low Risk
        <strong>{{ low }} ({{ percent(low) }}%)</strong>
      </li>
    </ul>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        flex-wrap: wrap;
      }
      .wrapper {
        position: relative;
        width: 140px;
        height: 140px;
        flex-shrink: 0;
      }
      .donut {
        width: 100%;
        height: 100%;
      }
      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .total {
        font-size: 20px;
        font-weight: 700;
      }
      .total-label {
        font-size: 11px;
        color: var(--text-secondary);
      }
      .legend {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        font-size: 13px;
      }
      .legend li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }
      .swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        display: inline-block;
      }
      .legend strong {
        margin-left: auto;
      }
    `,
  ],
})
export class RiskDistributionChartComponent {
  @Input() high = 0;
  @Input() medium = 0;
  @Input() low = 0;

  get total(): number {
    return this.high + this.medium + this.low;
  }

  percent(count: number): string {
    return this.total === 0 ? '0' : ((count / this.total) * 100).toFixed(1);
  }

  ariaLabel(): string {
    return `Risk distribution: ${this.high} high, ${this.medium} medium, ${this.low} low risk orders`;
  }

  segments(): { band: string; color: string; dashArray: string; dashOffset: string }[] {
    const circumference = 2 * Math.PI * 45;
    const total = this.total || 1;
    const parts: [string, number, string][] = [
      ['high', this.high, 'var(--risk-high)'],
      ['medium', this.medium, 'var(--risk-medium)'],
      ['low', this.low, 'var(--risk-low)'],
    ];
    let offsetSoFar = 0;
    return parts.map(([band, count, color]) => {
      const length = (count / total) * circumference;
      const segment = {
        band,
        color,
        dashArray: `${length} ${circumference - length}`,
        dashOffset: `${-offsetSoFar}`,
      };
      offsetSoFar += length;
      return segment;
    });
  }
}
