// ============================================================
// Recovery Probability Model
// Estimates the likelihood that a given action recovers a case.
// Backend-ready interface; deterministic local implementation.
// ============================================================

import type {
  Customer,
  RecoveryType,
  RecoveryCase,
  ActionType,
} from '@/types';
import { computeBaseProbability } from '@/lib/data';

export interface RecoveryProbabilityModel {
  estimate(
    customer: Customer,
    type: RecoveryType,
    reason: RecoveryCase['failureReason'],
    action: ActionType,
    retryCount: number,
  ): number;
}

const ACTION_MULTIPLIERS: Record<ActionType, number> = {
  IMMEDIATE_RETRY: 0.85,
  DELAYED_RETRY: 1.0,
  PAYMENT_LINK: 0.95,
  REMINDER: 0.8,
  SMALL_INCENTIVE: 0.9,
  HUMAN_ESCALATION: 1.05,
  NO_ACTION: 0.0,
};

export const recoveryProbabilityModel: RecoveryProbabilityModel = {
  estimate: (customer, type, reason, action, retryCount) => {
    const base = computeBaseProbability(customer, type, reason);
    let p = base * (ACTION_MULTIPLIERS[action] ?? 1);
    // Each retry has diminishing returns
    if (action === 'IMMEDIATE_RETRY' || action === 'DELAYED_RETRY') {
      p *= Math.pow(0.6, retryCount);
    }
    // Incentive boosts for abandonment
    if (action === 'SMALL_INCENTIVE' && reason === 'ABANDONMENT') {
      p *= 1.15;
    }
    // Human escalation recovers high-value complex cases better
    if (action === 'HUMAN_ESCALATION' && customer.segment === 'Enterprise') {
      p *= 1.1;
    }
    return Math.max(0.02, Math.min(0.97, p));
  },
};
