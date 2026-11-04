import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_VERSION, AUTHOR_NAME, AUTHOR_URL } from '../shared/app-version';

/**
 * FR-034's login screen -- calls the real POST /auth/sessions, no stubbed auth. Visual design
 * follows the same split-panel pattern as the reference provided for this screen: a dark navy
 * branding panel on the left, a light sign-in card on the right. The left panel's background is
 * a CSS gradient + inline decorative shapes, not a stock photo -- this repository has no image
 * assets, consistent with every other screen's icon-only (no external images) visual language.
 * The feature list below the headline names only real, shipped capabilities (risk queue, batch
 * scoring, risk distribution chart, order detail) -- nothing invented for the sake of the design.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <section class="hero" aria-hidden="false">
        <svg class="hero-bg" viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0b1930" />
              <stop offset="100%" stop-color="#132c54" />
            </linearGradient>
          </defs>
          <rect width="600" height="900" fill="url(#heroGradient)" />
          <path
            d="M600 0 C 420 220, 420 680, 600 900 L600 0 Z"
            fill="rgba(255,255,255,0.03)"
          />
          <circle cx="520" cy="160" r="220" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1.5" />
          <circle cx="60" cy="780" r="160" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
        </svg>

        <div class="hero-content">
          <div class="brand">
            <span class="mark" aria-hidden="true">&#9635;</span>
            <span>ShipGuard</span>
          </div>

          <h1>Late Delivery<br />Risk Prediction</h1>
          <p class="tagline">
            Identify and manage potential late deliveries across your supply chain.
          </p>

          <ul class="features">
            <li>
              <span class="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M7 15l4-4 3 3 5-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              Order-level risk assessment
            </li>
            <li>
              <span class="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3l9 5-9 5-9-5 9-5z" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M3 13l9 5 9-5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              Batch scoring and result management
            </li>
            <li>
              <span class="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 17l5-5 4 4 7-8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              Risk trends and distribution
            </li>
            <li>
              <span class="icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              Order tracking and details
            </li>
          </ul>
        </div>
      </section>

      <section class="panel">
        <div class="card">
          <h2>Sign In</h2>
          <p class="subtitle">Access the ShipGuard application</p>

          <form (ngSubmit)="submit()">
            <label class="field">
              <span class="field-label">Username</span>
              <span class="input-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke-linecap="round" />
                </svg>
                <input
                  name="username"
                  [(ngModel)]="username"
                  autocomplete="username"
                  placeholder="Enter your username"
                  [disabled]="submitting()"
                />
              </span>
            </label>

            <label class="field">
              <span class="field-label">Password</span>
              <span class="input-wrap">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  name="credential"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="credential"
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  [disabled]="submitting()"
                />
                <button
                  type="button"
                  class="toggle-visibility"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.4 10.4 0 0112 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.6-2.8 3.8M6.1 6.1C3.9 7.6 2.4 9.6 1.5 11c1 1.9 2.6 3.6 4.5 4.8 1.4.9 3.1 1.5 5 1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path
                        d="M1.5 11C3 8 7 5 12 5s9 3 10.5 6c-1.5 3-5.5 6-10.5 6S3 14 1.5 11z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                  }
                </button>
              </span>
            </label>

            <p class="session-note">Your session stays active for 30 minutes of inactivity.</p>

            <button type="submit" class="submit" [disabled]="submitting() || !username || !credential">
              {{ submitting() ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <div class="notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" stroke-linejoin="round" />
              <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Authorized use only. Your session is secured and monitored.
          </div>

          <div class="footer">
            Powered by <a [href]="authorUrl" target="_blank" rel="noopener">{{ authorName }}</a>
            &middot; v{{ appVersion }}
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        min-height: 100vh;
      }

      /* --- Left branding panel --- */
      .hero {
        position: relative;
        flex: 1 1 50%;
        min-width: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: var(--space-5);
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .hero-content {
        position: relative;
        z-index: 1;
        color: #fff;
        max-width: 480px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: 700;
        font-size: 16px;
        line-height: 1.2;
        margin-bottom: var(--space-5);
      }
      .brand .mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--primary);
        font-size: 18px;
      }
      .hero-content h1 {
        font-size: 40px;
        line-height: 1.15;
        font-weight: 700;
        margin: 0 0 var(--space-3);
      }
      .tagline {
        color: #c3cedf;
        font-size: 15px;
        margin: 0 0 var(--space-5);
        max-width: 400px;
      }
      .features {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }
      .features li {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 14px;
        color: #e4e9f2;
      }
      .features .icon {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
      }
      .features .icon svg {
        width: 18px;
        height: 18px;
      }

      /* --- Right sign-in panel --- */
      .panel {
        flex: 1 1 50%;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-5);
        background: linear-gradient(160deg, #eef2fb 0%, #e3e9f7 100%);
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: var(--surface);
        border-radius: 12px;
        padding: var(--space-5);
        box-shadow: 0 20px 50px -20px rgba(15, 32, 66, 0.25);
      }
      .card h2 {
        font-size: 24px;
        margin: 0 0 var(--space-1);
      }
      .subtitle {
        color: var(--text-secondary);
        font-size: 13px;
        margin: 0 0 var(--space-4);
      }
      .field {
        display: block;
        margin-bottom: var(--space-3);
      }
      .field-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: var(--space-1);
      }
      .input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      .input-icon {
        position: absolute;
        left: 12px;
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
        pointer-events: none;
      }
      .input-wrap input {
        width: 100%;
        padding: 10px 12px 10px 38px;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        background: var(--surface);
        color: var(--text-primary);
      }
      .input-wrap input:disabled {
        background: var(--page-bg);
      }
      .toggle-visibility {
        position: absolute;
        right: 8px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        padding: 4px;
        display: inline-flex;
      }
      .toggle-visibility svg {
        width: 18px;
        height: 18px;
      }
      .session-note {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0 0 var(--space-3);
      }
      .submit {
        width: 100%;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 12px;
        font-size: 15px;
        font-weight: 600;
      }
      .submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .error {
        margin: var(--space-3) 0 0;
        padding: 10px 12px;
        border-radius: 8px;
        background: color-mix(in srgb, var(--risk-high) 10%, white);
        color: var(--risk-high);
        border: 1px solid color-mix(in srgb, var(--risk-high) 30%, white);
        font-size: 13px;
      }
      .notice {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-top: var(--space-4);
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--page-bg);
        color: var(--text-secondary);
        font-size: 12px;
      }
      .notice svg {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        color: var(--primary);
      }
      .footer {
        margin-top: var(--space-4);
        text-align: center;
        font-size: 12px;
        color: var(--text-secondary);
      }
      .footer a {
        color: var(--primary);
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 900px) {
        .page {
          flex-direction: column;
        }
        .hero {
          flex: 0 0 auto;
          padding: var(--space-4);
        }
        .hero-content h1 {
          font-size: 28px;
        }
        .features {
          display: none;
        }
        .panel {
          flex: 1 1 auto;
          padding: var(--space-4);
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly appVersion = APP_VERSION;
  readonly authorName = AUTHOR_NAME;
  readonly authorUrl = AUTHOR_URL;

  username = '';
  credential = '';
  error = signal<string | null>(null);
  showPassword = signal(false);
  submitting = signal(false);

  submit(): void {
    this.error.set(null);
    this.submitting.set(true);
    this.authService.login(this.username, this.credential).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Invalid username or password.');
        this.submitting.set(false);
      },
    });
  }
}
