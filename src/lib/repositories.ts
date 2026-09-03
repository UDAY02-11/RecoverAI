// ============================================================
// Repository / Service Layer
// Backend-ready abstractions over the in-memory store.
// Each repository exposes the same shape a future API client
// would expose, so the UI never has to change when the backend
// is wired in.
// ============================================================

import type {
  Customer,
  Payment,
  CheckoutSession,
  Subscription,
  Invoice,
  Communication,
  RecoveryCase,
  RecoveryAction,
  CounterfactualResult,
  PolicyCheck,
  AgentEvent,
  RecoveryOutcomeRecord,
  PromiseToPay,
  DashboardMetrics,
} from '@/types';

export interface customerRepository {
  getById(customers: Customer[], id: string): Customer | undefined;
  list(customers: Customer[]): Customer[];
}

export interface recoveryCaseRepository {
  getById(cases: RecoveryCase[], id: string): RecoveryCase | undefined;
  list(cases: RecoveryCase[]): RecoveryCase[];
  byStatus(cases: RecoveryCase[], status: RecoveryCase['status']): RecoveryCase[];
  highPriority(cases: RecoveryCase[], limit: number): RecoveryCase[];
}

export interface recoveryActionRepository {
  forCase(results: CounterfactualResult[], caseId: string): RecoveryAction[] | undefined;
}

export interface analyticsRepository {
  dashboardMetrics(state: {
    recoveryCases: RecoveryCase[];
    recoveryOutcomes: RecoveryOutcomeRecord[];
  }): DashboardMetrics;
  interventionPerformance(outcomes: RecoveryOutcomeRecord[]): InterventionStat[];
  expectedVsActual(outcomes: RecoveryOutcomeRecord[]): ExpectedActualRow[];
  recoveryOverTime(outcomes: RecoveryOutcomeRecord[]): TimeSeriesRow[];
  recoveryBySegment(
    outcomes: RecoveryOutcomeRecord[],
    customers: Customer[],
  ): SegmentRow[];
  recoveryFunnel(cases: RecoveryCase[]): FunnelRow[];
}

export interface InterventionStat {
  action: string;
  total: number;
  successes: number;
  successRate: number;
  recovered: number;
}

export interface ExpectedActualRow {
  caseId: string;
  customer: string;
  expected: number;
  actual: number;
  variance: number;
  outcome: string;
}

export interface TimeSeriesRow {
  date: string;
  recovered: number;
  expected: number;
}

export interface SegmentRow {
  segment: string;
  recovered: number;
  cases: number;
}

export interface FunnelRow {
  stage: string;
  value: number;
}

export const customerRepo: customerRepository = {
  getById: (customers, id) => customers.find((c) => c.id === id),
  list: (customers) => customers,
};

export const recoveryCaseRepo: recoveryCaseRepository = {
  getById: (cases, id) => cases.find((c) => c.id === id),
  list: (cases) => cases,
  byStatus: (cases, status) => cases.filter((c) => c.status === status),
  highPriority: (cases, limit) =>
    [...cases]
      .sort((a, b) => b.expectedRecovery - a.expectedRecovery)
      .slice(0, limit),
};

export const recoveryActionRepo: recoveryActionRepository = {
  forCase: (results, caseId) => results.find((r) => r.caseId === caseId)?.actions,
};

export const analyticsRepo: analyticsRepository = {
  dashboardMetrics: ({ recoveryCases, recoveryOutcomes }) => {
    const active = recoveryCases.filter(
      (c) => c.status === 'READY' || c.status === 'ANALYZING' || c.status === 'RECOVERING',
    );
    const atRisk = recoveryCases.reduce((s, c) => s + c.amountAtRisk, 0);
    const recovered = recoveryOutcomes
      .filter((o) => o.outcome === 'SUCCESS')
      .reduce((s, o) => s + o.actualRecovery, 0);
    const expected = recoveryCases.reduce((s, c) => s + c.expectedRecovery, 0);
    const totalCases = recoveryCases.length;
    const recoveredCases = recoveryCases.filter((c) => c.status === 'RECOVERED').length;
    const escalated = recoveryCases.filter((c) => c.status === 'ESCALATED').length;
    const successOutcomes = recoveryOutcomes.filter((o) => o.outcome === 'SUCCESS').length;
    return {
      revenueAtRisk: atRisk,
      recoveredRevenue: recovered,
      recoveryRate: totalCases > 0 ? recoveredCases / totalCases : 0,
      expectedRecoverable: expected,
      activeCases: active.length,
      totalCases,
      escalationRate: totalCases > 0 ? escalated / totalCases : 0,
      averageTimeToRecovery: 2.4, // hours, deterministic
      interventionSuccessRate:
        recoveryOutcomes.length > 0 ? successOutcomes / recoveryOutcomes.length : 0,
    };
  },

  interventionPerformance: (outcomes) => {
    const map = new Map<string, InterventionStat>();
    for (const o of outcomes) {
      const key = o.actionType;
      const cur = map.get(key) || { action: key, total: 0, successes: 0, successRate: 0, recovered: 0 };
      cur.total += 1;
      if (o.outcome === 'SUCCESS') {
        cur.successes += 1;
        cur.recovered += o.actualRecovery;
      }
      map.set(key, cur);
    }
    return Array.from(map.values()).map((s) => ({
      ...s,
      successRate: s.total > 0 ? s.successes / s.total : 0,
    }));
  },

  expectedVsActual: (outcomes) =>
    outcomes.map((o) => ({
      caseId: o.caseId,
      customer: o.customerId,
      expected: o.expectedRecovery,
      actual: o.actualRecovery,
      variance: o.actualRecovery - o.expectedRecovery,
      outcome: o.outcome,
    })),

  recoveryOverTime: (outcomes) => {
    const map = new Map<string, TimeSeriesRow>();
    for (const o of outcomes) {
      const date = new Date(o.executedAt).toISOString().slice(0, 10);
      const cur = map.get(date) || { date, recovered: 0, expected: 0 };
      cur.recovered += o.actualRecovery;
      cur.expected += o.expectedRecovery;
      map.set(date, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  recoveryBySegment: (outcomes, customers) => {
    const map = new Map<string, SegmentRow>();
    for (const o of outcomes) {
      const c = customers.find((x) => x.id === o.customerId);
      const seg = c?.segment ?? 'Unknown';
      const cur = map.get(seg) || { segment: seg, recovered: 0, cases: 0 };
      cur.cases += 1;
      if (o.outcome === 'SUCCESS') cur.recovered += o.actualRecovery;
      map.set(seg, cur);
    }
    return Array.from(map.values());
  },

  recoveryFunnel: (cases) => {
    const detected = cases.length;
    const interventionSelected = cases.filter(
      (c) => c.status !== 'READY' || c.recommendedAction,
    ).length;
    const executed = cases.filter(
      (c) => ['RECOVERED', 'FAILED', 'ESCALATED', 'STOPPED'].includes(c.status),
    ).length;
    const recovered = cases.filter((c) => c.status === 'RECOVERED').length;
    return [
      { stage: 'Revenue At Risk', value: detected },
      { stage: 'Detected', value: detected },
      { stage: 'Intervention Selected', value: interventionSelected },
      { stage: 'Executed', value: executed },
      { stage: 'Recovered', value: recovered },
    ];
  },
};

export type {
  Customer,
  Payment,
  CheckoutSession,
  Subscription,
  Invoice,
  Communication,
  RecoveryCase,
  RecoveryAction,
  CounterfactualResult,
  PolicyCheck,
  AgentEvent,
  RecoveryOutcomeRecord,
  PromiseToPay,
  DashboardMetrics,
};
