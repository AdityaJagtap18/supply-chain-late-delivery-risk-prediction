import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarNavigationComponent } from './sidebar-navigation.component';
import { TopNavigationComponent } from './top-navigation.component';
import { ShellStateService } from './shell-state.service';

/** The application chrome wrapping every authenticated screen (not /login). */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarNavigationComponent, TopNavigationComponent],
  template: `
    <div class="shell">
      <div class="sidebar-slot" [class.open]="shellState.sidebarOpen()">
        <app-sidebar-navigation />
      </div>
      @if (shellState.sidebarOpen()) {
        <div class="scrim" (click)="shellState.closeSidebar()"></div>
      }
      <div class="main">
        <app-top-navigation />
        <div class="content" #content>
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        height: 100vh;
      }
      .sidebar-slot {
        flex: 0 0 240px;
      }
      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .content {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-4);
      }
      .scrim {
        display: none;
      }
      @media (max-width: 900px) {
        .sidebar-slot {
          position: fixed;
          inset: 0 auto 0 0;
          width: 240px;
          transform: translateX(-100%);
          transition: transform 0.15s ease;
          z-index: 20;
        }
        .sidebar-slot.open {
          transform: translateX(0);
        }
        .scrim {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(11, 25, 48, 0.4);
          z-index: 15;
        }
      }
    `,
  ],
})
export class AppShellComponent {
  protected readonly shellState = inject(ShellStateService);
  private readonly content = viewChild<ElementRef<HTMLDivElement>>('content');

  constructor() {
    const router = inject(Router);
    router
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.content()?.nativeElement.scrollTo({ top: 0 }));
  }
}
