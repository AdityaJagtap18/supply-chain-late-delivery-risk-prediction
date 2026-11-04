import { Component, Input } from '@angular/core';

/**
 * UI-003 S5's reusable "Page header" component -- title + subtitle on the left, an actions slot
 * (buttons, timestamps) on the right via content projection. Used by every top-level module page
 * so they all read as the same application, not five differently-built screens.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="header">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-3);
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }
      h1 {
        font-size: 22px;
      }
      .subtitle {
        margin: 4px 0 0;
        color: var(--text-secondary);
        font-size: 13px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      @media (max-width: 560px) {
        .actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
