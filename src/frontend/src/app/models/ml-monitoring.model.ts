// Shapes copied verbatim from the backend's `GET /system/model-info` relay, which itself relays
// the ML service's `GET /model-info` unmodified -- see SystemController.getModelInfo() and
// ml-service/app/schemas.py's ModelInfoResponse. Nothing here is invented beyond that contract.

export interface ConfusionMatrix {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface OfflineMetrics {
  prAuc: number;
  rocAuc: number;
  precision: number;
  recall: number;
  f1: number;
  brierScore: number;
  confusionMatrix: ConfusionMatrix;
  testSetSize: number;
  testSetRowsExcludedUnseenCategory: number;
}

export interface ModelInfo {
  modelVersion: string;
  trainedAt: string | null;
  sourceFile: string | null;
  modelAlgorithm: string | null;
  featureList: string[] | null;
  metrics: OfflineMetrics | null;
  categoryFrequencies: Record<string, Record<string, number>> | null;
  libraryVersions: Record<string, string> | null;
}

export interface ModelVersionsResponse {
  activeModelVersion: string | null;
  lastScoredAt: string | null;
}
