import { Component, Input } from '@angular/core';

/** UI-DESIGN-001 S3.1/3.2: loading, empty, and error must never look alike to the analyst. */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `<div class="state loading">Loading...</div>`,
  styles: [
    `
      .state {
        padding: var(--space-4);
        text-align: center;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class LoadingStateComponent {}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<div class="state empty">{{ message }}</div>`,
  styles: [
    `
      .state {
        padding: var(--space-4);
        text-align: center;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() message = 'Nothing to show.';
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `<div class="state error">{{ message }}</div>`,
  styles: [
    `
      .state.error {
        padding: var(--space-3);
        text-align: left;
        background: color-mix(in srgb, var(--risk-high) 10%, white);
        color: var(--risk-high);
        border: 1px solid color-mix(in srgb, var(--risk-high) 30%, white);
        border-radius: 6px;
      }
    `,
  ],
})
export class ErrorStateComponent {
  @Input() message = 'Something went wrong.';
}
