import { Component } from '@angular/core';

/**
 * UI-003 Phase 3: batch-scoring run history across sessions is not available -- there is no
 * `batch_run` persistence anywhere in BE-ARCH-001; `BatchScoringController`/`BatchScoringService`
 * run synchronously and return a result object that is never written to a table. Persisted run
 * history is the kind of storage UI-003's own Phase 7 (persistence/caching) is scoped to add --
 * this is an honest unavailable state now, same pattern as the dashboard's
 * `RiskTrendUnavailableComponent`, rather than an invented history table.
 */
@Component({
  selector: 'app-batch-run-history-unavailable',
  standalone: true,
  template: `
    <div class="unavailable">
      <p><strong>Run history is not available yet.</strong></p>
      <p>
        No backend endpoint persists past batch-scoring runs -- each run's result is only known
        for the duration it's shown below. Persisted run history is planned as part of this
        build's persistence work, not invented here.
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
    `,
  ],
})
export class BatchRunHistoryUnavailableComponent {}
