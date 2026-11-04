import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

/**
 * FR-034's client-side gate. The real enforcement is server-side (every /orders* endpoint
 * returns 401 without a valid session, per BE-ARCH-001); this guard only avoids flashing the
 * queue/detail screens before that 401 comes back, using AuthService's in-memory `authenticated`
 * signal (see its own class comment for the page-reload limitation this implies).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.authenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
