import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  userId: number;
  username: string;
  sessionToken: string;
}

/**
 * FR-034 -- POST/DELETE /auth/sessions (BE-ARCH-001 S2.1/2.2). ADR-0005's session cookie is the
 * actual auth mechanism; `authenticated`/`username` here are an in-memory UI convenience only --
 * a page reload loses them even though the session cookie itself is still valid server-side.
 * Reconciling that (e.g. a "who am I" check on startup) is not in BE-ARCH-001's contract and is
 * left as a known Phase 3 limitation, not invented here.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly authenticated = signal(false);
  readonly username = signal<string | null>(null);

  login(username: string, credential: string): Observable<LoginResponse> {
    const url = `${environment.apiBaseUrl}/auth/sessions`;
    return this.http
      .post<LoginResponse>(url, { username, credential }, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.authenticated.set(true);
          this.username.set(response.username);
        }),
      );
  }

  logout(): Observable<void> {
    const url = `${environment.apiBaseUrl}/auth/sessions`;
    return this.http.delete<void>(url, { withCredentials: true }).pipe(
      tap(() => {
        this.authenticated.set(false);
        this.username.set(null);
      }),
    );
  }
}
