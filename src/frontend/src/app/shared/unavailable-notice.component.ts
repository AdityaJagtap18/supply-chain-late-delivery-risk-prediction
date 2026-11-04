import { Component, Input } from '@angular/core';

/**
 * Generic honest "not available" notice -- same visual pattern as the dashboard's
 * `RiskTrendUnavailableComponent` and the batch-scoring module's
 * `BatchRunHistoryUnavailableComponent`, generalized here since UI-003 Phase 6's ML Monitoring
 * module needs the same pattern three times (Prediction Drift, Production Performance, MLOps
 * Alerts) for three different real reasons.
 */
@Component({
  selector: 'app-unavailable-notice',
  standalone: true,
  template: `
    <div class="unavailable">
      <p><strong>{{ title }}</strong></p>
      <p>{{ message }}</p>
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
    `,
  ],
})
export class UnavailableNoticeComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
}
