import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  OrderDetail,
  OrdersResponse,
  RiskAssessmentHistoryResponse,
} from '../models/order.model';

/**
 * BE-ARCH-001 S2.3/2.4/2.5 -- FR-032 (risk queue) and FR-033 (order detail + history).
 *
 * UI-003 Phase 7's Angular-layer cache: every module (dashboard, Orders, Reports, ML Monitoring)
 * fetches the same `GET /orders` data, often within moments of each other while navigating
 * between pages, so a short-lived cache here avoids redundant round trips to a backend that is
 * itself now caching this same read (see the backend's `OrderService#listOrders`). The one
 * invalidation rule: a successful `triggerBatchScoring()` clears it immediately, since that's the
 * only action in this app that changes what `GET /orders` returns.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  private static readonly CACHE_TTL_MS = 10_000;
  private readonly listingCache = new Map<string, { response: OrdersResponse; cachedAt: number }>();

  listOrders(riskBand?: string, status?: string, forceRefresh = false): Observable<OrdersResponse> {
    const cacheKey = `${riskBand ?? ''}|${status ?? ''}`;
    const cached = this.listingCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.cachedAt < OrderService.CACHE_TTL_MS) {
      return of(cached.response);
    }

    let params = new HttpParams();
    if (riskBand) {
      params = params.set('riskBand', riskBand);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http
      .get<OrdersResponse>(`${environment.apiBaseUrl}/orders`, { params, withCredentials: true })
      .pipe(
        tap((response) => this.listingCache.set(cacheKey, { response, cachedAt: Date.now() })),
      );
  }

  getOrderDetail(orderId: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${environment.apiBaseUrl}/orders/${orderId}`, {
      withCredentials: true,
    });
  }

  getRiskHistory(orderId: number): Observable<RiskAssessmentHistoryResponse> {
    return this.http.get<RiskAssessmentHistoryResponse>(
      `${environment.apiBaseUrl}/orders/${orderId}/risk-assessments`,
      { withCredentials: true },
    );
  }

  /** Phase 4's real FR-031 batch-scoring trigger (POST /system/batch-scoring). */
  triggerBatchScoring(): Observable<BatchScoringResult> {
    return this.http
      .post<BatchScoringResult>(`${environment.apiBaseUrl}/system/batch-scoring`, {}, { withCredentials: true })
      .pipe(
        tap((result) => {
          if (result.succeeded) {
            this.listingCache.clear();
          }
        }),
      );
  }
}

export interface BatchScoringResult {
  succeeded: boolean;
  scoredAt?: string;
  totalOrders?: number;
  scoredCount?: number;
  skippedUnseenCategory?: number;
  skippedIncompleteData?: number;
  /** UI-003 Phase 7: orders whose feature fingerprint hadn't changed since their last score. */
  skippedUnchanged?: number;
  reason?: string;
}
