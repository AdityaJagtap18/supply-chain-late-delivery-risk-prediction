import { Injectable, signal } from '@angular/core';

/** Mobile sidebar open/closed state, shared between the hamburger toggle and the shell. */
@Injectable({ providedIn: 'root' })
export class ShellStateService {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
