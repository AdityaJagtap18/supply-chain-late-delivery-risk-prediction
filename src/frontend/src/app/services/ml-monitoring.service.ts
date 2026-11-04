import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModelInfo, ModelVersionsResponse } from '../models/ml-monitoring.model';

/** UI-003 Phase 6 -- the two real backend endpoints the ML Monitoring module reads from. */
@Injectable({ providedIn: 'root' })
export class MlMonitoringService {
  private readonly http = inject(HttpClient);

  getModelInfo(): Observable<ModelInfo> {
    return this.http.get<ModelInfo>(`${environment.apiBaseUrl}/system/model-info`, {
      withCredentials: true,
    });
  }

  getModelVersions(): Observable<ModelVersionsResponse> {
    return this.http.get<ModelVersionsResponse>(`${environment.apiBaseUrl}/system/model-versions`, {
      withCredentials: true,
    });
  }
}
