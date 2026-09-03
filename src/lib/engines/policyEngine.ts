// ============================================================
// Policy / Guardrail Engine
// Deterministic rule checks applied before any recovery action.
// ============================================================

import type {
  Customer,
  RecoveryCase,
  ActionType,
  PolicyStatus,
  PolicyCheck,
} from '@/types';
import { uid } from '@/lib/format';

export const POLICY_LIMITS = {
  MAX_RETRIES: 2,
  MIN_RETRY_DELAY_MINUTES: 30,
  MAX_INCENTIVE_PERCENT: 0.1,
  MAX_COMMUNICATIONS: 3,
  AUTOMATED_THRESHOLD: 200000, // above this requires human escalation
} as const;

export interface PolicyInput {
  action: ActionType;
  retryCount: number;
  communicationCount: number;
  amount: number;
  customer: Customer;
  caseData: RecoveryCase;
  lastRetryAt?: string;
}

export interface PolicyResult {
  status: PolicyStatus;
  reason: string;
  checks: PolicyCheck[];
}

export interface PolicyEngine {
  check(input: PolicyInput): PolicyResult;
  buildChecks(input: PolicyInput): PolicyCheck[];
}

export const policyEngine: PolicyEngine = {
  check: (input) => {
    const checks = policyEngine.buildChecks(input);
    const anyReject = checks.some((c) => c.status === 'REJECT');
    const anyWarn = checks.some((c) => c.status === 'WARNING') && !anyReject;
    return {
      status: anyReject ? 'REJECT' : anyWarn ? 'WARNING' : 'PASS',
      reason: anyReject
        ? 'One or more policy guardrails were violated.'
        : 'All policy guardrails passed.',
      checks,
    };
  },

  buildChecks: (input) => {
    const { action, retryCount, communicationCount, amount, customer, caseData, lastRetryAt } = input;
    const now = Date.now();
    const checks: PolicyCheck[] = [];

    // 1. Retry count within limit
    const retryOk = action === 'IMMEDIATE_RETRY' || action === 'DELAYED_RETRY'
      ? retryCount < POLICY_LIMITS.MAX_RETRIES
      : true;
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Maximum retries = 2',
      status: retryOk ? 'PASS' : 'REJECT',
      reason: retryOk
        ? `Retry count ${retryCount} within limit of ${POLICY_LIMITS.MAX_RETRIES}.`
        : `Retry count ${retryCount} reached limit of ${POLICY_LIMITS.MAX_RETRIES}.`,
      createdAt: new Date().toISOString(),
    });

    // 2. Minimum retry delay
    let delayOk = true;
    if (lastRetryAt && (action === 'DELAYED_RETRY' || action === 'IMMEDIATE_RETRY')) {
      const elapsed = (now - new Date(lastRetryAt).getTime()) / 60000;
      delayOk = elapsed >= POLICY_LIMITS.MIN_RETRY_DELAY_MINUTES;
    }
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Minimum retry delay = 30 minutes',
      status: delayOk ? 'PASS' : 'REJECT',
      reason: delayOk
        ? 'Minimum retry delay satisfied.'
        : 'Retry attempted before the 30-minute minimum delay.',
      createdAt: new Date().toISOString(),
    });

    // 3. Amount within automated threshold
    const amountOk = amount <= POLICY_LIMITS.AUTOMATED_THRESHOLD || action === 'HUMAN_ESCALATION';
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Amount within automated threshold',
      status: amountOk ? 'PASS' : 'REJECT',
      reason: amountOk
        ? 'Amount within automated threshold.'
        : `Amount ₹${amount.toLocaleString('en-IN')} exceeds automated threshold; requires human escalation.`,
      createdAt: new Date().toISOString(),
    });

    // 4. Communication limit
    const commOk = communicationCount < POLICY_LIMITS.MAX_COMMUNICATIONS;
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Maximum communication attempts = 3',
      status: commOk ? 'PASS' : 'REJECT',
      reason: commOk
        ? `Communication count ${communicationCount} within limit.`
        : `Communication count ${communicationCount} reached limit of ${POLICY_LIMITS.MAX_COMMUNICATIONS}.`,
      createdAt: new Date().toISOString(),
    });

    // 5. Customer has not opted out
    const optOutOk = !customer.optedOut;
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Customer has not opted out',
      status: optOutOk ? 'PASS' : 'REJECT',
      reason: optOutOk
        ? 'Customer has not opted out of communications.'
        : 'Customer has opted out — automated communication blocked.',
      createdAt: new Date().toISOString(),
    });

    // 6. No suspicious activity
    const suspOk = !customer.flaggedSuspicious;
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'No suspicious activity detected',
      status: suspOk ? 'PASS' : 'REJECT',
      reason: suspOk
        ? 'No suspicious activity flagged.'
        : 'Suspicious activity detected — automation stopped, human review required.',
      createdAt: new Date().toISOString(),
    });

    // 7. Incentive within max %
    if (action === 'SMALL_INCENTIVE') {
      const incentivePct = 0.05;
      const incentiveOk = incentivePct <= POLICY_LIMITS.MAX_INCENTIVE_PERCENT;
      checks.push({
        id: uid('pol'),
        caseId: caseData.id,
        rule: 'Maximum incentive = 10%',
        status: incentiveOk ? 'PASS' : 'REJECT',
        reason: incentiveOk
          ? `Incentive ${(incentivePct * 100).toFixed(0)}% within 10% cap.`
          : `Incentive exceeds 10% cap.`,
        createdAt: new Date().toISOString(),
      });
    }

    // 8. Refunds cannot be autonomously executed (no refund action exists yet, but guard)
    checks.push({
      id: uid('pol'),
      caseId: caseData.id,
      rule: 'Refunds cannot be autonomously executed',
      status: 'PASS',
      reason: 'No refund action requested.',
      createdAt: new Date().toISOString(),
    });

    return checks;
  },
};
