// ============================================================
// Recovery Tool Executor
// Simulates executing a recovery action and producing an outcome.
// Backend-ready interface; deterministic local implementation.
// ============================================================

import type {
  RecoveryCase,
  RecoveryAction,
  RecoveryOutcome,
} from '@/types';
import { uid } from '@/lib/format';

export interface ExecutionResult {
  outcome: RecoveryOutcome;
  actualRecovery: number;
  message: string;
}

export interface RecoveryToolExecutor {
  execute(
    caseData: RecoveryCase,
    action: RecoveryAction,
    simulate: 'SUCCESS' | 'FAILURE' | 'AUTO',
  ): ExecutionResult;
}

export const recoveryToolExecutor: RecoveryToolExecutor = {
  execute: (caseData, action, simulate) => {
    // Deterministic outcome when AUTO: use the action's probability.
    let success: boolean;
    if (simulate === 'SUCCESS') success = true;
    else if (simulate === 'FAILURE') success = false;
    else {
      // Deterministic pseudo-outcome based on case id + action type hash.
      const seed = hashStr(caseData.id + action.type);
      success = (seed % 100) / 100 < action.recoveryProbability;
    }

    if (success) {
      return {
        outcome: 'SUCCESS',
        actualRecovery: caseData.amountAtRisk,
        message: `Recovery successful. ₹${caseData.amountAtRisk.toLocaleString('en-IN')} recovered via ${action.label}.`,
      };
    }
    return {
      outcome: 'FAILURE',
      actualRecovery: 0,
      message: `Recovery failed via ${action.label}. Escalation may be required.`,
    };
  },
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export { uid };
