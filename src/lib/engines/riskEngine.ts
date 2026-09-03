// ============================================================
// Risk Engine — scores revenue-at-risk cases.
// Backend-ready interface; deterministic local implementation.
// ============================================================

import type { Customer, RiskLevel } from '@/types';
import { computeRiskScore, riskScoreToLevel } from '@/lib/data';

export interface RiskEngine {
  score(customer: Customer, amountAtRisk: number): number;
  level(score: number): RiskLevel;
}

export const riskEngine: RiskEngine = {
  score: (customer, amountAtRisk) => computeRiskScore(customer, amountAtRisk),
  level: (score) => riskScoreToLevel(score),
};
