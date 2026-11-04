import { Component, Input } from '@angular/core';

/**
 * UI-001-REVISION S5's KPI cards. No "vs. previous batch" delta is rendered -- there is no
 * historical batch data to compare against (see UI-DESIGN-001-REVISION-001).
 */
@Component({
  selector: 'app-risk-kpi-card',
  standalone: true,
  template: `
    <div class="card" [class]="tone">
      <div class="icon" aria-hidden="true">{{ icon }}</div>
      <div>
        <div class="label">{{ label }}</div>
        <div class="value">{{ value }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        display: flex;
        align-items: center;
        gap: var(--space-3);
        height: 100%;
      }
      .icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .card.high .icon {
        background: color-mix(in srgb, var(--risk-high) 14%, white);
        color: var(--risk-high);
      }
      .card.medium .icon {
        background: color-mix(in srgb, var(--risk-medium) 16%, white);
        color: #8a5a00;
      }
      .card.low .icon {
        background: color-mix(in srgb, var(--risk-low) 14%, white);
        color: var(--risk-low);
      }
      .card.total .icon {
        background: color-mix(in srgb, var(--primary) 12%, white);
        color: var(--primary);
      }
      .label {
        color: var(--text-secondary);
        font-size: 13px;
      }
      .value {
        font-size: 24px;
        font-weight: 700;
      }
    `,
  ],
})
export class RiskKpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() icon = '';
  @Input() tone: 'high' | 'medium' | 'low' | 'total' = 'total';
}
