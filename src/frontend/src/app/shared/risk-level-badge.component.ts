import { Component, Input } from '@angular/core';

/**
 * UI-DESIGN-001 S3.1: risk is always icon + color + text together, never color alone (WCAG
 * non-text-contrast). `riskBand` null/undefined renders the fourth "Stale/Unscored" state,
 * visually distinct from "Low".
 */
@Component({
  selector: 'app-risk-level-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="cssClass()">
      <span aria-hidden="true">{{ icon() }}</span>
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 10px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 12px;
        white-space: nowrap;
      }
      .high {
        background: color-mix(in srgb, var(--risk-high) 14%, white);
        color: var(--risk-high);
      }
      .medium {
        background: color-mix(in srgb, var(--risk-medium) 16%, white);
        color: #8a5a00;
      }
      .low {
        background: color-mix(in srgb, var(--risk-low) 14%, white);
        color: var(--risk-low);
      }
      .stale {
        background: var(--page-bg);
        color: var(--text-secondary);
      }
    `,
  ],
})
export class RiskLevelBadgeComponent {
  @Input() riskBand: string | null | undefined;

  cssClass(): string {
    const band = (this.riskBand ?? '').toLowerCase();
    return band === 'high' || band === 'medium' || band === 'low' ? band : 'stale';
  }

  label(): string {
    return this.riskBand ?? 'Unscored';
  }

  icon(): string {
    switch (this.cssClass()) {
      case 'high':
        return '▲';
      case 'medium':
        return '●';
      case 'low':
        return '✓';
      default:
        return '–';
    }
  }
}
