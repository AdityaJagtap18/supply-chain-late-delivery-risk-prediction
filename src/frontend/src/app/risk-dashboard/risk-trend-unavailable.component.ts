import { Component } from '@angular/core';

/**
 * UI-001-REVISION S5 asks for a risk-trend-over-time chart "only if supported by the API" --
 * it isn't: no endpoint returns historical batch-run data (BE-ARCH-001 has none;
 * ARCH-CONSISTENCY-001 CONS-005 already flags the batch-history story as unresolved). This is
 * an honest unavailable state instead of an invented line chart.
 */
@Component({
  selector: 'app-risk-trend-unavailable',
  standalone: true,
  template: `
    <div class="unavailable">
      <p><strong>Risk trend over time is not available yet.</strong></p>
      <p>
        No backend endpoint returns historical batch-scoring data (see
        <code>BE-ARCH-001</code> and <code>ARCH-CONSISTENCY-001</code> CONS-005). This chart will
        appear once that data exists, rather than show invented values now.
      </p>
    </div>
  `,
  styles: [
    `
      .unavailable {
        padding: var(--space-4);
        color: var(--text-secondary);
        font-size: 13px;
      }
      .unavailable p {
        margin: 0 0 var(--space-2);
      }
      code {
        background: var(--page-bg);
        padding: 1px 4px;
        border-radius: 3px;
      }
    `,
  ],
})
export class RiskTrendUnavailableComponent {}
