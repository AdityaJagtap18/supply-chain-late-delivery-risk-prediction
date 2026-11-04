import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Phase 3: the Phase 1 connectivity-proof page (POST /api/ping) is superseded by the real
 * FR-032/FR-033/FR-034 screens below -- see src/frontend/README.md for that proof's history.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
