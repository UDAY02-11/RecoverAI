// ============================================================
// Counterfactual Recovery Engine
// The hero innovation: evaluates multiple candidate recovery
// actions and recommends the one with the highest SAFE expected
// net recovery.
//
// Expected Gross Recovery = Recovery Probability × Recoverable Amount
// Expected Net Recovery  = Expected Gross Recovery
//                        − Intervention Cost
//                        − Incentive Cost
//                        − Friction/Risk Penalty
// ============================================================

import type {
  Customer,
  RecoveryCase,
  RecoveryAction,
  ActionType,
  CounterfactualResult,
  PolicyStatus,
} from '@/types';
import { recoveryProbabilityModel } from '@/lib/engines/recoveryProbabilityModel';
import { policyEngine } from '@/lib/engines/policyEngine';

const ACTION_LABELS: Record<ActionType, string> = {
  IMMEDIATE_RETRY: 'Immediate Retry',
  DELAYED_RETRY: 'Delayed Retry',
  PAYMENT_LINK: 'Payment Link',
  REMINDER: 'Reminder',
  SMALL_INCENTIVE: 'Small Incentive',
  HUMAN_ESCALATION: 'Human Escalation',
  NO_ACTION: 'No Action',
};

const INTERVENTION_COSTS: Record<ActionType, number> = {
  IMMEDIATE_RETRY: 5,
  DELAYED_RETRY: 5,
  PAYMENT_LINK: 15,
  REMINDER: 8,
  SMALL_INCENTIVE: 25,
  HUMAN_ESCALATION: 500,
  NO_ACTION: 0,
};

const FRICTION_SCORES: Record<ActionType, number> = {
  IMMEDIATE_RETRY: 0.6,
  DELAYED_RETRY: 0.3,
  PAYMENT_LINK: 0.35,
  REMINDER: 0.2,
  SMALL_INCENTIVE: 0.15,
  HUMAN_ESCALATION: 0.7,
  NO_ACTION: 0.0,
};

const RISK_LEVELS: Record<ActionType, RecoveryAction['riskLevel']> = {
  IMMEDIATE_RETRY: 'MEDIUM',
  DELAYED_RETRY: 'LOW',
  PAYMENT_LINK: 'LOW',
  REMINDER: 'LOW',
  SMALL_INCENTIVE: 'MEDIUM',
  HUMAN_ESCALATION: 'LOW',
  NO_ACTION: 'LOW',
};

function incentiveCost(action: ActionType, amount: number): number {
  if (action === 'SMALL_INCENTIVE') return Math.round(amount * 0.05);
  return 0;
}

function frictionPenalty(action: ActionType, amount: number): number {
  const friction = FRICTION_SCORES[action];
  // Penalty scales with amount — friction on a large transaction is costlier.
  return Math.round(amount * friction * 0.02);
}

const CANDIDATES: ActionType[] = [
  'IMMEDIATE_RETRY',
  'DELAYED_RETRY',
  'PAYMENT_LINK',
  'REMINDER',
  'SMALL_INCENTIVE',
  'HUMAN_ESCALATION',
];

export interface CounterfactualEngine {
  evaluate(
    customer: Customer,
    caseData: RecoveryCase,
    retryCount: number,
    communicationCount: number,
  amountAtRisk: number,
  opts?: { includeNoAction?: boolean },
  ): CounterfactualResult;
}

export const counterfactualEngine: CounterfactualEngine = {
  evaluate: (customer, caseData, retryCount, communicationCount, amountAtRisk, opts) => {
    const candidates = opts?.includeNoAction
      ? [...CANDIDATES, 'NO_ACTION' as ActionType]
      : CANDIDATES;

    const actions: RecoveryAction[] = candidates.map((action) => {
      const probability = recoveryProbabilityModel.estimate(
        customer,
        caseData.type,
        caseData.failureReason,
        action,
        retryCount,
      );
      const expectedGross = Math.round(amountAtRisk * probability);
      const interventionCost = INTERVENTION_COSTS[action];
      const incentive = incentiveCost(action, amountAtRisk);
      const friction = frictionPenalty(action, amountAtRisk);
      const expectedNet = Math.max(
        0,
        expectedGross - interventionCost - incentive - friction,
      );

      const policy = policyEngine.check({
        action,
        retryCount,
        communicationCount,
        amount: amountAtRisk,
        customer,
        caseData,
      });

      const rationale = buildRationale(action, caseData, customer, probability);

      return {
        type: action,
        label: ACTION_LABELS[action],
        recoveryProbability: probability,
        expectedGrossRecovery: expectedGross,
        interventionCost,
        incentiveCost: incentive,
        customerFriction: FRICTION_SCORES[action],
        riskLevel: RISK_LEVELS[action],
        policyStatus: policy.status,
        policyReason: policy.reason,
        expectedNetRecovery: expectedNet,
        rationale,
      };
    });

    // Recommend the action with the highest SAFE expected net recovery.
    // "Safe" = policy PASS and risk not CRITICAL.
    const safe = actions.filter(
      (a) => a.policyStatus === 'PASS' && a.riskLevel !== 'CRITICAL',
    );
    const pool = safe.length > 0 ? safe : actions;
    const recommended = pool.reduce((best, a) =>
      a.expectedNetRecovery > best.expectedNetRecovery ? a : best,
    );

    return {
      caseId: caseData.id,
      actions,
      recommendedAction: recommended.type,
      recommendationReason: buildRecommendationReason(recommended, caseData, customer),
      evaluatedAt: new Date().toISOString(),
    };
  },
};

function buildRationale(
  action: ActionType,
  caseData: RecoveryCase,
  customer: Customer,
  probability: number,
): string {
  const pct = `${Math.round(probability * 100)}%`;
  switch (action) {
    case 'IMMEDIATE_RETRY':
      return `Retrying immediately has ${pct} recovery odds. Risk of repeated failure if the cause is transient.`;
    case 'DELAYED_RETRY':
      return `Waiting for a short window lifts recovery odds to ${pct}. ${customer.name} has ${customer.successfulPayments} successful payments, suggesting transient failures self-resolve.`;
    case 'PAYMENT_LINK':
      return `Sending a fresh payment link converts at ${pct}. Useful when the original checkout had friction or an expired instrument.`;
    case 'REMINDER':
      return `A gentle reminder via ${customer.preferredChannel} recovers ${pct}. Low friction, low cost — ideal for abandonment and overdue invoices.`;
    case 'SMALL_INCENTIVE':
      return `A small incentive (5% credit) nudges recovery to ${pct}. Best for price-sensitive abandonment.`;
    case 'HUMAN_ESCALATION':
      return `Human escalation recovers ${pct} but costs operational overhead. Reserved for high-value or complex cases.`;
    case 'NO_ACTION':
      return `No intervention. Expected recovery is zero. Used when the case is not worth pursuing or the customer opted out.`;
    default:
      return '';
  }
}

function buildRecommendationReason(
  recommended: RecoveryAction,
  caseData: RecoveryCase,
  customer: Customer,
): string {
  const pct = `${Math.round(recommended.recoveryProbability * 100)}%`;
  const net = recommended.expectedNetRecovery;
  return `${recommended.label} maximizes expected net recovery (₹${net.toLocaleString('en-IN')}) at ${pct} probability while keeping customer friction low and passing policy. ${customer.name}'s history supports this path.`;
}

export { ACTION_LABELS, INTERVENTION_COSTS, FRICTION_SCORES, RISK_LEVELS };
export type { PolicyStatus };
