import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ShellStateService } from './shell-state.service';

/**
 * UI-001-REVISION S4: search/notification/user menu chrome. The notification bell has no
 * backing data source (no notification endpoint exists anywhere in BE-ARCH-001) so it never
 * shows a count -- only a static "No notifications" state, to avoid fabricating activity.
 */
@Component({
  selector: 'app-top-navigation',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="topbar">
      <button
        class="icon-button hamburger"
        type="button"
        (click)="shellState.toggleSidebar()"
        aria-label="Toggle navigation"
      >
        &#9776;
      </button>
      <form class="search" (ngSubmit)="searchOrder()">
        <svg class="search-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" stroke-linecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search by Order ID"
          [(ngModel)]="searchTerm"
          name="search"
          aria-label="Search by Order ID"
        />
      </form>
      <div class="spacer"></div>
      <div class="notification-wrapper">
        <button
          class="icon-button"
          type="button"
          (click)="showNotifications.set(!showNotifications())"
          aria-label="Notifications"
        >
          <svg class="bell-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13.7 21a2 2 0 01-3.4 0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        @if (showNotifications()) {
          <div class="dropdown">No notifications.</div>
        }
      </div>
      <div class="user-wrapper">
        <button class="user-button" type="button" (click)="showUserMenu.set(!showUserMenu())">
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <span>{{ authService.username() ?? 'Analyst' }}</span>
          <span aria-hidden="true">&#9662;</span>
        </button>
        @if (showUserMenu()) {
          <div class="dropdown">
            <button type="button" (click)="signOut()">Sign out</button>
          </div>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-4);
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        height: 56px;
      }
      .search {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--page-bg);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 6px 12px;
        width: 280px;
      }
      .search input {
        border: none;
        background: transparent;
        outline: none;
        width: 100%;
        font-size: 14px;
      }
      .search-icon {
        flex: 0 0 auto;
        width: 16px;
        height: 16px;
        color: var(--text-secondary);
      }
      .bell-icon {
        width: 18px;
        height: 18px;
      }
      .spacer {
        flex: 1;
      }
      .icon-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        font-size: 18px;
        padding: 6px;
        border-radius: 6px;
        position: relative;
      }
      .icon-button:hover {
        background: var(--page-bg);
      }
      .notification-wrapper,
      .user-wrapper {
        position: relative;
      }
      .user-button {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        border: none;
        background: transparent;
        font-size: 14px;
        font-weight: 500;
        padding: 6px 8px;
        border-radius: 6px;
      }
      .user-button:hover {
        background: var(--page-bg);
      }
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }
      .dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 4px);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);
        padding: var(--space-2);
        min-width: 160px;
        z-index: 10;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .dropdown button {
        width: 100%;
        text-align: left;
        border: none;
        background: transparent;
        padding: 8px;
        border-radius: 4px;
        color: var(--text-primary);
      }
      .dropdown button:hover {
        background: var(--page-bg);
      }
      .hamburger {
        display: none;
      }
      @media (max-width: 900px) {
        .hamburger {
          display: inline-flex;
        }
        .search {
          width: 160px;
        }
      }
    `,
  ],
})
export class TopNavigationComponent {
  protected readonly authService = inject(AuthService);
  protected readonly shellState = inject(ShellStateService);
  private readonly router = inject(Router);

  searchTerm = '';
  showNotifications = signal(false);
  showUserMenu = signal(false);

  initials(): string {
    const name = this.authService.username() ?? 'A';
    return name.slice(0, 2).toUpperCase();
  }

  searchOrder(): void {
    const id = Number(this.searchTerm.trim());
    if (Number.isFinite(id) && id > 0) {
      this.router.navigate(['/orders', id]);
    }
  }

  signOut(): void {
    this.authService.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
