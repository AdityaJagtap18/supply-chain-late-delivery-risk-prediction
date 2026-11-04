import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
import { PageHeaderComponent } from '../shared/page-header.component';

type CheckState = 'checking' | 'up' | 'down';

/**
 * UI-003 Phase 5: the Settings module. Only two sections show real data: Account (the signed-in
 * username this session's auth cookie already proved, plus the real sign-out action) and System
 * Information (two live checks -- `GET /actuator/health` for the backend, and the existing
 * diagnostic `GET /api/ml-check` for ML service reachability, which its own class comment says
 * is a diagnostic-only endpoint -- a legitimate use for that purpose here).
 *
 * Preferences, Risk Configuration, and Scoring Configuration have no backing endpoint anywhere
 * in BE-ARCH-001 -- risk-band thresholds are hardcoded Java constants
 * (`RiskBandThresholds.HIGH_THRESHOLD`/`MEDIUM_THRESHOLD`) never exposed via an API, and there is
 * no preferences table at all. Rather than hardcode those backend constants here (a second,
 * driftable source of truth) or invent a preferences store, each section honestly says so.
 */
@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Settings" subtitle="Account, preferences, and system configuration." />

    <section class="card">
      <h2>Account</h2>
      <dl>
        <dt>Username</dt>
        <dd>{{ authService.username() ?? 'Unknown' }}</dd>
      </dl>
      <button type="button" class="secondary" (click)="signOut()">Sign Out</button>
    </section>

    <section class="card">
      <h2>Preferences</h2>
      <p class="empty">No user preferences exist yet -- there is no preferences endpoint in the backend.</p>
    </section>

    <section class="card">
      <h2>Risk Configuration</h2>
      <p class="empty">
        Risk-band thresholds are configured in the backend's service layer and are not yet exposed
        through an API. Showing them here would mean duplicating a backend constant that could
        silently drift out of sync, so this section is intentionally empty for now.
      </p>
    </section>

    <section class="card">
      <h2>Scoring Configuration</h2>
      <p class="empty">
        No endpoint exposes global scoring configuration (model name, version, feature mapping) as
        a settings resource. The model version used for a given score is visible on that order's
        detail page instead.
      </p>
    </section>

    <section class="card">
      <h2>System Information</h2>
      <dl>
        <dt>Backend</dt>
        <dd><span class="status" [class]="backendStatus()">{{ statusLabel(backendStatus()) }}</span></dd>
        <dt>ML Service</dt>
        <dd><span class="status" [class]="mlServiceStatus()">{{ statusLabel(mlServiceStatus()) }}</span></dd>
      </dl>
    </section>
  `,
  styles: [
    `
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .card h2 {
        font-size: 15px;
        margin-bottom: var(--space-3);
      }
      .empty {
        color: var(--text-secondary);
        font-size: 13px;
        margin: 0;
      }
      dl {
        display: grid;
        grid-template-columns: 160px 1fr;
        row-gap: var(--space-2);
        margin: 0 0 var(--space-3);
        font-size: 13px;
      }
      dt {
        color: var(--text-secondary);
      }
      dd {
        margin: 0;
      }
      .secondary {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 600;
      }
      .status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
      }
      .status.up {
        background: color-mix(in srgb, var(--risk-low) 14%, white);
        color: var(--risk-low);
      }
      .status.down {
        background: color-mix(in srgb, var(--risk-high) 14%, white);
        color: var(--risk-high);
      }
      .status.checking {
        background: var(--page-bg);
        color: var(--text-secondary);
      }
    `,
  ],
})
export class SettingsPageComponent {
  readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  backendStatus = signal<CheckState>('checking');
  mlServiceStatus = signal<CheckState>('checking');

  constructor() {
    this.http.get<{ status: string }>(`${environment.apiBaseUrl}/actuator/health`).subscribe({
      next: (response) => this.backendStatus.set(response.status === 'UP' ? 'up' : 'down'),
      error: () => this.backendStatus.set('down'),
    });
    this.http
      .get<{ backendReachedMlService: boolean }>(`${environment.apiBaseUrl}/api/ml-check`)
      .subscribe({
        next: (response) => this.mlServiceStatus.set(response.backendReachedMlService ? 'up' : 'down'),
        error: () => this.mlServiceStatus.set('down'),
      });
  }

  statusLabel(state: CheckState): string {
    return state === 'checking' ? 'Checking…' : state === 'up' ? 'Reachable' : 'Unreachable';
  }

  signOut(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
