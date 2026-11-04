/**
 * UI-003 Phase 6's Data Drift section: Population Stability Index (PSI) between the training
 * category-frequency baseline (`ModelInfo.categoryFrequencies`, written once by `train_model.py`)
 * and the live category distribution computed from the same `GET /orders` response the Orders
 * module already fetches. A small epsilon replaces a zero share on either side so a category
 * present in only one distribution doesn't divide by zero or take `ln(0)` -- a standard PSI
 * implementation detail, not an invented statistic.
 *
 * The <0.1 / 0.1-0.25 / >=0.25 "no significant / moderate / significant" bands are the commonly
 * published PSI interpretation guideline (not a project-specific SLA or alerting threshold --
 * none exists here).
 */
const EPSILON = 0.0001;

export type DriftSeverity = 'none' | 'moderate' | 'significant';

export interface DataDriftRow {
  feature: string;
  psi: number;
  severity: DriftSeverity;
  liveCategoryCount: number;
  baselineCategoryCount: number;
}

export function liveFrequencies(counts: Record<string, number>): Record<string, number> {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [category, count] of Object.entries(counts)) {
    result[category] = count / total;
  }
  return result;
}

export function computePsi(
  baseline: Record<string, number>,
  live: Record<string, number>,
): number {
  const categories = new Set([...Object.keys(baseline), ...Object.keys(live)]);
  let psi = 0;
  for (const category of categories) {
    const basePct = baseline[category] ?? EPSILON;
    const livePct = live[category] ?? EPSILON;
    psi += (livePct - basePct) * Math.log(livePct / basePct);
  }
  return psi;
}

export function severityOf(psi: number): DriftSeverity {
  if (psi >= 0.25) {
    return 'significant';
  }
  if (psi >= 0.1) {
    return 'moderate';
  }
  return 'none';
}
