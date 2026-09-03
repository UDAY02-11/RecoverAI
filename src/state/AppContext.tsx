// ============================================================
// Central Application State
// Context + useReducer + localStorage persistence.
// All pages consume this shared state.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type {
  AppState,
  AgentEvent,
  RecoveryCase,
  CounterfactualResult,
  PolicyCheck,
  RecoveryOutcomeRecord,
  DashboardMetrics,
  Customer,
  Payment,
  CheckoutSession,
  Subscription,
  Invoice,
  Communication,
  PromiseToPay,
  ActionType,
  RecoveryAction,
} from '@/types';
import {
  generateCustomers,
  generatePayments,
  generateCheckouts,
  generateSubscriptions,
  generateInvoices,
  generateCommunications,
  generateRecoveryCases,
  generatePromises,
  generateHistoricalActions,
} from '@/lib/data';
import { analyticsRepo } from '@/lib/repositories';
import { agentService } from '@/lib/engines/agentService';
import { loadState, saveState, clearAllState } from '@/lib/storage';
import { uid } from '@/lib/format';

// ---------------------------------------------------------------
// Actions
// ---------------------------------------------------------------
export type Action =
  | { type: 'LOAD_DEMO_CASE'; caseId: string }
  | { type: 'SELECT_CASE'; caseId: string | null }
  | { type: 'RUN_AGENT'; simulate: 'SUCCESS' | 'FAILURE' | 'AUTO' }
  | { type: 'SIMULATE_SUCCESS' }
  | { type: 'SIMULATE_FAILURE' }
  | { type: 'ESCALATE_CASE' }
  | { type: 'CLOSE_CASE' }
  | { type: 'RESET_DEMO' }
  | { type: 'ADD_AGENT_EVENT'; event: AgentEvent }
  | { type: 'UPDATE_CASE'; caseId: string; patch: Partial<RecoveryCase> }
  | { type: 'RECORD_OUTCOME'; outcome: RecoveryOutcomeRecord }
  | { type: 'SET_COUNTERFACTUAL'; caseId: string; result: CounterfactualResult }
  | { type: 'SET_POLICY_CHECKS'; caseId: string; checks: PolicyCheck[] }
  | { type: 'HYDRATE'; state: AppState };

// ---------------------------------------------------------------
// Initial deterministic state
// ---------------------------------------------------------------
export function buildInitialState(): AppState {
  const customers = generateCustomers();
  const payments = generatePayments(customers);
  const checkouts = generateCheckouts(customers);
  const subscriptions = generateSubscriptions(customers);
  const invoices = generateInvoices(customers);
  const recoveryCases = generateRecoveryCases(customers, payments, checkouts, invoices, subscriptions);
  const communications = generateCommunications(customers, recoveryCases);
  const promises = generatePromises(customers, recoveryCases);

  // Seed historical recovery outcomes from the synthetic historical actions.
  const historical = generateHistoricalActions(customers);
  const recoveryOutcomes: RecoveryOutcomeRecord[] = historical.map((h, i) => ({
    id: `OUT-${String(i + 1).padStart(5, '0')}`,
    caseId: `HIST-${String(i + 1).padStart(4, '0')}`,
    customerId: customers[i % customers.length].id,
    actionType: h.actionType,
    expectedRecovery: h.expected,
    actualRecovery: h.actual,
    variance: h.actual - h.expected,
    outcome: h.outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
    amountAtRisk: h.amount,
    executedAt: h.createdAt,
  }));

  const metrics = analyticsRepo.dashboardMetrics({
    recoveryCases,
    recoveryOutcomes,
  });

  return {
    customers,
    payments,
    checkoutSessions: checkouts,
    subscriptions,
    invoices,
    communications,
    recoveryCases,
    promises,
    recoveryActions: [],
    counterfactualResults: [],
    policyChecks: [],
    agentEvents: [],
    recoveryOutcomes,
    dashboardMetrics: metrics,
    activeCaseId: null,
    demoMode: true,
    agentExecutionState: 'IDLE',
    lastResetAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------
function recomputeMetrics(state: AppState): DashboardMetrics {
  return analyticsRepo.dashboardMetrics({
    recoveryCases: state.recoveryCases,
    recoveryOutcomes: state.recoveryOutcomes,
  });
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'LOAD_DEMO_CASE': {
      const c = state.recoveryCases.find((x) => x.id === action.caseId);
      if (!c) return state;
      return { ...state, activeCaseId: c.id };
    }

    case 'SELECT_CASE':
      return { ...state, activeCaseId: action.caseId };

    case 'UPDATE_CASE': {
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === action.caseId ? { ...c, ...action.patch, updatedAt: new Date().toISOString() } : c,
      );
      const next = { ...state, recoveryCases };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'ADD_AGENT_EVENT':
      return { ...state, agentEvents: [action.event, ...state.agentEvents] };

    case 'SET_COUNTERFACTUAL': {
      const exists = state.counterfactualResults.find((r) => r.caseId === action.caseId);
      const counterfactualResults = exists
        ? state.counterfactualResults.map((r) => (r.caseId === action.caseId ? action.result : r))
        : [action.result, ...state.counterfactualResults];
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === action.caseId ? { ...c, counterfactual: action.result, recommendedAction: action.result.recommendedAction, expectedRecovery: action.result.actions.find((a) => a.type === action.result.recommendedAction)?.expectedNetRecovery ?? c.expectedRecovery } : c,
      );
      const next = { ...state, counterfactualResults, recoveryCases };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'SET_POLICY_CHECKS': {
      const policyChecks = [...action.checks, ...state.policyChecks.filter((p) => p.caseId !== action.caseId)];
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === action.caseId ? { ...c, policyChecks: action.checks } : c,
      );
      return { ...state, policyChecks, recoveryCases };
    }

    case 'RUN_AGENT': {
      if (!state.activeCaseId) return state;
      const caseData = state.recoveryCases.find((c) => c.id === state.activeCaseId);
      if (!caseData) return state;
      const customer = state.customers.find((x) => x.id === caseData.customerId);
      if (!customer) return state;

      const result = agentService.run(customer, caseData, action.simulate);

      // Update the case with counterfactual, policy checks, and final status.
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === caseData.id
          ? {
              ...c,
              counterfactual: result.counterfactual,
              policyChecks: result.policyChecks,
              recommendedAction: result.recommendedAction ?? c.recommendedAction,
              status: result.finalStatus,
              actualRecovery: result.actualRecovery ?? c.actualRecovery,
              retryCount: result.outcome === 'FAILURE' ? c.retryCount + 1 : c.retryCount,
              communicationCount: c.communicationCount + 1,
              lastRetryAt: new Date().toISOString(),
              closedAt: result.finalStatus === 'RECOVERED' || result.finalStatus === 'FAILED' ? new Date().toISOString() : c.closedAt,
              updatedAt: new Date().toISOString(),
            }
          : c,
      );

      // Record outcome if we got one.
      let recoveryOutcomes = state.recoveryOutcomes;
      if (result.outcome && result.selectedAction) {
        const outcome: RecoveryOutcomeRecord = {
          id: uid('OUT'),
          caseId: caseData.id,
          customerId: customer.id,
          actionType: result.selectedAction.type,
          expectedRecovery: result.selectedAction.expectedNetRecovery,
          actualRecovery: result.actualRecovery ?? 0,
          variance: (result.actualRecovery ?? 0) - result.selectedAction.expectedNetRecovery,
          outcome: result.outcome,
          amountAtRisk: caseData.amountAtRisk,
          executedAt: new Date().toISOString(),
        };
        recoveryOutcomes = [outcome, ...recoveryOutcomes];
      }

      const counterfactualResults = result.counterfactual
        ? [result.counterfactual, ...state.counterfactualResults.filter((r) => r.caseId !== caseData.id)]
        : state.counterfactualResults;

      const policyChecks = result.policyChecks
        ? [...result.policyChecks, ...state.policyChecks.filter((p) => p.caseId !== caseData.id)]
        : state.policyChecks;

      const next: AppState = {
        ...state,
        recoveryCases,
        recoveryOutcomes,
        counterfactualResults,
        policyChecks,
        agentEvents: [...result.events, ...state.agentEvents],
        agentExecutionState: 'COMPLETED',
      };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'SIMULATE_SUCCESS': {
      if (!state.activeCaseId) return state;
      const caseData = state.recoveryCases.find((c) => c.id === state.activeCaseId);
      if (!caseData) return state;
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === caseData.id
          ? { ...c, status: 'RECOVERED' as const, actualRecovery: c.amountAtRisk, closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : c,
      );
      const existing = state.recoveryOutcomes.find((o) => o.caseId === caseData.id && o.outcome === 'SUCCESS');
      let recoveryOutcomes = state.recoveryOutcomes;
      if (!existing) {
        const outcome: RecoveryOutcomeRecord = {
          id: uid('OUT'),
          caseId: caseData.id,
          customerId: caseData.customerId,
          actionType: caseData.recommendedAction,
          expectedRecovery: caseData.expectedRecovery,
          actualRecovery: caseData.amountAtRisk,
          variance: caseData.amountAtRisk - caseData.expectedRecovery,
          outcome: 'SUCCESS',
          amountAtRisk: caseData.amountAtRisk,
          executedAt: new Date().toISOString(),
        };
        recoveryOutcomes = [outcome, ...recoveryOutcomes];
      }
      const next = { ...state, recoveryCases, recoveryOutcomes };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'SIMULATE_FAILURE': {
      if (!state.activeCaseId) return state;
      const caseData = state.recoveryCases.find((c) => c.id === state.activeCaseId);
      if (!caseData) return state;
      const newRetryCount = caseData.retryCount + 1;
      const shouldEscalate = newRetryCount >= 2;
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === caseData.id
          ? {
              ...c,
              status: shouldEscalate ? ('ESCALATED' as const) : ('FAILED' as const),
              retryCount: newRetryCount,
              lastRetryAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : c,
      );
      const outcome: RecoveryOutcomeRecord = {
        id: uid('OUT'),
        caseId: caseData.id,
        customerId: caseData.customerId,
        actionType: caseData.recommendedAction,
        expectedRecovery: caseData.expectedRecovery,
        actualRecovery: 0,
        variance: -caseData.expectedRecovery,
        outcome: 'FAILURE',
        amountAtRisk: caseData.amountAtRisk,
        executedAt: new Date().toISOString(),
      };
      const next = { ...state, recoveryCases, recoveryOutcomes: [outcome, ...state.recoveryOutcomes] };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'ESCALATE_CASE': {
      if (!state.activeCaseId) return state;
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === state.activeCaseId
          ? { ...c, status: 'ESCALATED' as const, updatedAt: new Date().toISOString() }
          : c,
      );
      const next = { ...state, recoveryCases };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'CLOSE_CASE': {
      if (!state.activeCaseId) return state;
      const recoveryCases = state.recoveryCases.map((c) =>
        c.id === state.activeCaseId
          ? { ...c, status: 'FAILED' as const, closedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : c,
      );
      const next = { ...state, recoveryCases };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'RECORD_OUTCOME': {
      const next = { ...state, recoveryOutcomes: [action.outcome, ...state.recoveryOutcomes] };
      next.dashboardMetrics = recomputeMetrics(next);
      return next;
    }

    case 'RESET_DEMO': {
      clearAllState();
      return buildInitialState();
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeCase: RecoveryCase | null;
  activeCustomer: Customer | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'appState';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = loadState<AppState | null>(STORAGE_KEY, null);
    if (saved && saved.recoveryCases?.length > 0) return saved;
    return buildInitialState();
  });

  // Persist to localStorage on every change.
  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const activeCase = useMemo(
    () => state.recoveryCases.find((c) => c.id === state.activeCaseId) ?? null,
    [state.recoveryCases, state.activeCaseId],
  );
  const activeCustomer = useMemo(
    () => (activeCase ? state.customers.find((c) => c.id === activeCase.customerId) ?? null : null),
    [state.customers, activeCase],
  );

  const value = useMemo(
    () => ({ state, dispatch, activeCase, activeCustomer }),
    [state, activeCase, activeCustomer],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export types for convenience.
export type {
  AppState,
  AgentEvent,
  RecoveryCase,
  CounterfactualResult,
  PolicyCheck,
  RecoveryOutcomeRecord,
  DashboardMetrics,
  Customer,
  Payment,
  CheckoutSession,
  Subscription,
  Invoice,
  Communication,
  PromiseToPay,
  ActionType,
  RecoveryAction,
};
