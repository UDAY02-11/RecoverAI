// ============================================================
// Agent Service
// Orchestrates the full recovery agent workflow as a sequence of
// deterministic steps. Each step emits an AgentEvent.
//
// Steps:
//  1. Revenue Risk Detected
//  2. Customer Context Retrieved
//  3. Failure Reason Analyzed
//  4. Recovery Probability Calculated
//  5. Candidate Interventions Generated
//  6. Counterfactual Evaluation Completed
//  7. Optimal Action Selected
//  8. Policy Validation
//  9. Recovery Action Executed
// 10. Outcome Recorded
// 11. Case Closed
// ============================================================

import type {
  Customer,
  RecoveryCase,
  AgentEvent,
  CounterfactualResult,
  PolicyCheck,
  RecoveryAction,
  RecoveryOutcome,
  ActionType,
} from '@/types';
import { counterfactualEngine } from '@/lib/engines/counterfactualEngine';
import { policyEngine } from '@/lib/engines/policyEngine';
import { recoveryToolExecutor } from '@/lib/engines/recoveryToolExecutor';
import { riskEngine } from '@/lib/engines/riskEngine';
import { uid } from '@/lib/format';

export interface AgentStepResult {
  events: AgentEvent[];
  counterfactual?: CounterfactualResult;
  policyChecks?: PolicyCheck[];
  recommendedAction?: ActionType;
  selectedAction?: RecoveryAction;
  outcome?: RecoveryOutcome;
  actualRecovery?: number;
  finalStatus: RecoveryCase['status'];
}

export interface AgentService {
  run(
    customer: Customer,
    caseData: RecoveryCase,
    simulateOutcome: 'SUCCESS' | 'FAILURE' | 'AUTO',
  ): AgentStepResult;
}

export const agentService: AgentService = {
  run: (customer, caseData, simulateOutcome) => {
    const events: AgentEvent[] = [];
    let ts = Date.now();
    const mkEvent = (
      step: number,
      title: string,
      description: string,
      status: AgentEvent['status'],
      offsetMs = 0,
    ): AgentEvent => ({
      id: uid('evt'),
      caseId: caseData.id,
      customerId: customer.id,
      step,
      title,
      description,
      status,
      timestamp: new Date(ts + offsetMs).toISOString(),
    });

    // 1. Revenue Risk Detected
    events.push(mkEvent(1, 'Revenue Risk Detected', `Case ${caseData.id} flagged. ₹${caseData.amountAtRisk.toLocaleString('en-IN')} at risk.`, 'COMPLETED', 0));
    ts += 2000;

    // 2. Customer Context Retrieved
    events.push(mkEvent(2, 'Customer Context Retrieved', `${customer.name} — ${customer.segment}, LTV ₹${customer.lifetimeValue.toLocaleString('en-IN')}, ${customer.successfulPayments} successful payments.`, 'COMPLETED', 2000));
    ts += 2000;

    // 3. Failure Reason Analyzed
    events.push(mkEvent(3, 'Failure Reason Analyzed', caseData.failureDescription, 'COMPLETED', 4000));
    ts += 2000;

    // 4. Recovery Probability Calculated
    const score = riskEngine.score(customer, caseData.amountAtRisk);
    events.push(mkEvent(4, 'Recovery Probability Calculated', `Risk score ${score}/100. Base recovery probability ${Math.round(caseData.recoveryProbability * 100)}%.`, 'COMPLETED', 6000));
    ts += 2000;

    // 5. Candidate Interventions Generated
    events.push(mkEvent(5, 'Candidate Interventions Generated', 'Generated 6 candidate recovery actions for counterfactual evaluation.', 'COMPLETED', 8000));
    ts += 2000;

    // 6. Counterfactual Evaluation Completed
    const counterfactual = counterfactualEngine.evaluate(
      customer,
      caseData,
      caseData.retryCount,
      caseData.communicationCount,
      caseData.amountAtRisk,
    );
    events.push(mkEvent(6, 'Counterfactual Evaluation Completed', `Evaluated ${counterfactual.actions.length} actions. Recommended: ${counterfactual.actions.find((a) => a.type === counterfactual.recommendedAction)?.label}.`, 'COMPLETED', 10000));
    ts += 2000;

    // 7. Optimal Action Selected
    const recommendedAction = counterfactual.recommendedAction;
    const selectedAction = counterfactual.actions.find((a) => a.type === recommendedAction)!;
    events.push(mkEvent(7, 'Optimal Action Selected', `Selected ${selectedAction.label} — highest safe expected net recovery (₹${selectedAction.expectedNetRecovery.toLocaleString('en-IN')}).`, 'COMPLETED', 12000));
    ts += 2000;

    // 8. Policy Validation
    const policyResult = policyEngine.check({
      action: recommendedAction,
      retryCount: caseData.retryCount,
      communicationCount: caseData.communicationCount,
      amount: caseData.amountAtRisk,
      customer,
      caseData,
      lastRetryAt: caseData.lastRetryAt,
    });
    const policyStatus = policyResult.status === 'PASS' ? 'COMPLETED' : 'STOPPED';
    events.push(mkEvent(8, 'Policy Validation', policyResult.reason, policyStatus as AgentEvent['status'], 14000));
    ts += 2000;

    if (policyResult.status === 'REJECT') {
      return {
        events,
        counterfactual,
        policyChecks: policyResult.checks,
        recommendedAction,
        selectedAction,
        finalStatus: 'STOPPED',
      };
    }

    // 9. Recovery Action Executed
    const exec = recoveryToolExecutor.execute(caseData, selectedAction, simulateOutcome);
    events.push(mkEvent(9, 'Recovery Action Executed', `Executing ${selectedAction.label}...`, 'COMPLETED', 16000));
    ts += 2000;

    // 10. Outcome Recorded
    events.push(mkEvent(10, 'Outcome Recorded', exec.message, exec.outcome === 'SUCCESS' ? 'COMPLETED' : 'FAILED', 18000));
    ts += 2000;

    // 11. Case Closed
    const finalStatus: RecoveryCase['status'] =
      exec.outcome === 'SUCCESS' ? 'RECOVERED' : 'FAILED';
    events.push(mkEvent(11, 'Case Closed', `Case ${caseData.id} closed as ${finalStatus}.`, 'COMPLETED', 20000));

    return {
      events,
      counterfactual,
      policyChecks: policyResult.checks,
      recommendedAction,
      selectedAction,
      outcome: exec.outcome,
      actualRecovery: exec.actualRecovery,
      finalStatus,
    };
  },
};
