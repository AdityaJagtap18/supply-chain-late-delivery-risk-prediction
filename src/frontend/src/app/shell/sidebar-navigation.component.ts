import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * UI-003 Phase 1: all six modules are now real, routed screens (no disabled placeholders).
 * Orders/Batch Scoring/Reports/ML Monitoring/Settings show an honest "scheduled for Phase N"
 * empty state until their own phase builds out the real screen -- see each page component.
 */
@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <span class="mark" aria-hidden="true">&#9635;</span>
        <span>Supply Chain<br />Optimization</span>
      </div>
      <nav>
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          Late Delivery Risk
        </a>
        <a routerLink="/orders" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          Orders
        </a>
        <a routerLink="/batch-scoring" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          Batch Scoring
        </a>
        <a routerLink="/reports" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          Reports
        </a>
        <a routerLink="/ml-monitoring" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          ML Monitoring
        </a>
        <a routerLink="/settings" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
          Settings
        </a>
      </nav>
      <div class="version">v1.0.0</div>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 240px;
        flex: 0 0 240px;
        background: var(--sidebar-bg);
        color: #cbd5e1;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: var(--space-3) 0;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: 0 var(--space-3) var(--space-4);
        color: #fff;
        font-weight: 700;
        font-size: 14px;
      }
      .mark {
        color: var(--primary);
        font-size: 20px;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      nav a {
        display: block;
        padding: 10px var(--space-3);
        border-radius: 6px;
        margin: 0 var(--space-2);
        color: #cbd5e1;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }
      nav a.active {
        background: var(--sidebar-active);
        color: #fff;
      }
      .version {
        margin-top: auto;
        padding: var(--space-3);
        color: #566178;
        font-size: 12px;
      }
    `,
  ],
})
export class SidebarNavigationComponent {}
