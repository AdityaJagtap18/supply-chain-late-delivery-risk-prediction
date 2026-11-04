// Shapes copied verbatim from BE-ARCH-001 S2.3/2.4/2.5 (FR-032/FR-033) -- see
// docs/generated/backend/BE-ARCH-001-api-and-layering.md. Nothing here is invented beyond that
// contract; fields that contract excludes (customer_id, zipcode, lat/long) are not modeled here
// either, per CONS-004's note that the real contract is more conservative than NFR-WEB-003.

export interface Destination {
  city: string | null;
  region: string | null;
}

export interface OrderQueueItem {
  orderId: number;
  riskBand: string | null;
  riskScore: number | null;
  shippingMode: string | null;
  destination: Destination;
  scoredAt: string | null;
  // UI-DESIGN-001-REVISION-001 contract extension -- not in BE-ARCH-001's original S2.3 response.
  orderStatus: string | null;
  paymentType: string | null;
}

export interface OrdersResponse {
  scoresAsOf: string | null;
  orders: OrderQueueItem[];
}

export interface CurrentRisk {
  riskScore: number;
  riskBand: string;
  modelVersion: string;
  scoredAt: string;
}

export interface CustomerSummary {
  segment: string | null;
}

export interface OrderDetail {
  orderId: number;
  placedAt: string | null;
  orderStatus: string | null;
  shippingMode: string | null;
  destination: Destination;
  customer: CustomerSummary;
  currentRisk: CurrentRisk | null;
}

export interface RiskAssessmentHistoryItem {
  riskAssessmentId: number;
  riskScore: number;
  riskBand: string;
  modelVersion: string;
  scoredAt: string;
}

export interface RiskAssessmentHistoryResponse {
  assessments: RiskAssessmentHistoryItem[];
}
