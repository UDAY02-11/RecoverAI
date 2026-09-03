// ============================================================
// RecoverAI — Centralized Domain Types
// ============================================================

export type CustomerSegment =
  | 'Enterprise'
  | 'SMB'
  | 'Startup'
  | 'Individual';

export type PreferredChannel =
  | 'Email'
  | 'SMS'
  | 'WhatsApp'
  | 'Phone'
  | 'In-App';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: CustomerSegment;
  lifetimeValue: number;
  successfulPayments: number;
  previousFailures: number;
  averagePayment: number;
  previousRecoveryAttempts: number;
  preferredChannel: PreferredChannel;
  optedOut: boolean;
  flaggedSuspicious: boolean;
  createdAt: string;
}

export type PaymentStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING'
  | 'REFUNDED';

export type PaymentFailureReason =
  | 'INSUFFICIENT_FUNDS'
  | 'EXPIRED_CARD'
  | 'BANK_FAILURE'
  | 'NETWORK_ERROR'
  | 'TEMPORARY_FAILURE'
  | 'DECLINED'
  | 'NONE';

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  failureReason: PaymentFailureReason;
  method: string;
  createdAt: string;
}

export type CheckoutStatus =
  | 'COMPLETED'
  | 'ABANDONED'
  | 'EXPIRED'
  | 'PENDING';

export interface CheckoutSession {
  id: string;
  customerId: string;
  cartValue: number;
  status: CheckoutStatus;
  items: number;
  createdAt: string;
}

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'TRIALING'
  | 'UNPAID';

export interface Subscription {
  id: string;
  customerId: string;
  plan: string;
  amount: number;
  status: SubscriptionStatus;
  billingCycle: 'MONTHLY' | 'YEARLY';
  createdAt: string;
}

export type InvoiceStatus =
  | 'PAID'
  | 'OPEN'
  | 'OVERDUE'
  | 'VOID';

export interface Invoice {
  id: string;
  customerId: string;
  number: string;
  amount: number;
  status: InvoiceStatus;
  daysOverdue: number;
  normalPaymentDays: number;
  createdAt: string;
  dueDate: string;
}

export type CommunicationChannel = PreferredChannel;
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';

export interface Communication {
  id: string;
  customerId: string;
  caseId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string;
  body: string;
  createdAt: string;
}

export type RecoveryType =
  | 'PAYMENT_FAILURE'
  | 'CHECKOUT_ABANDONMENT'
  | 'SUBSCRIPTION_FAILURE'
  | 'INVOICE_OVERDUE'
  | 'PROMISE_MISSED';

export type CaseStatus =
  | 'READY'
  | 'ANALYZING'
  | 'RECOVERING'
  | 'RECOVERED'
  | 'ESCALATED'
  | 'STOPPED'
  | 'FAILED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionType =
  | 'IMMEDIATE_RETRY'
  | 'DELAYED_RETRY'
  | 'PAYMENT_LINK'
  | 'REMINDER'
  | 'SMALL_INCENTIVE'
  | 'HUMAN_ESCALATION'
  | 'NO_ACTION';

export type PolicyStatus = 'PASS' | 'REJECT' | 'WARNING';

export interface RecoveryAction {
  type: ActionType;
  label: string;
  recoveryProbability: number;
  expectedGrossRecovery: number;
  interventionCost: number;
  incentiveCost: number;
  customerFriction: number;
  riskLevel: RiskLevel;
  policyStatus: PolicyStatus;
  policyReason?: string;
  expectedNetRecovery: number;
  rationale: string;
}

export interface CounterfactualResult {
  caseId: string;
  actions: RecoveryAction[];
  recommendedAction: ActionType;
  recommendationReason: string;
  evaluatedAt: string;
}

export interface PolicyCheck {
  id: string;
  caseId: string;
  rule: string;
  status: PolicyStatus;
  reason: string;
  createdAt: string;
}

export type AgentEventStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'STOPPED';

export interface AgentEvent {
  id: string;
  caseId: string;
  customerId: string;
  step: number;
  title: string;
  description: string;
  status: AgentEventStatus;
  timestamp: string;
}

export type RecoveryOutcome =
  | 'SUCCESS'
  | 'FAILURE'
  | 'PARTIAL'
  | 'PENDING'
  | 'ESCALATED';

export interface RecoveryOutcomeRecord {
  id: string;
  caseId: string;
  customerId: string;
  actionType: ActionType;
  expectedRecovery: number;
  actualRecovery: number;
  variance: number;
  outcome: RecoveryOutcome;
  amountAtRisk: number;
  executedAt: string;
}

export interface RecoveryCase {
  id: string;
  customerId: string;
  type: RecoveryType;
  amountAtRisk: number;
  riskScore: number;
  riskLevel: RiskLevel;
  recoveryProbability: number;
  status: CaseStatus;
  failureReason: PaymentFailureReason | 'ABANDONMENT' | 'OVERDUE' | 'NONE';
  failureDescription: string;
  diagnosis: string;
  supportingBehavior: string;
  recommendedAction: ActionType;
  expectedRecovery: number;
  actualRecovery?: number;
  retryCount: number;
  lastRetryAt?: string;
  communicationCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  counterfactual?: CounterfactualResult;
  policyChecks?: PolicyCheck[];
  invoiceId?: string;
  paymentId?: string;
  checkoutId?: string;
  subscriptionId?: string;
}

export type PromiseStatus = 'PENDING' | 'FULFILLED' | 'MISSED';

export interface PromiseToPay {
  id: string;
  customerId: string;
  amount: number;
  promiseDate: string;
  status: PromiseStatus;
  caseId?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  revenueAtRisk: number;
  recoveredRevenue: number;
  recoveryRate: number;
  expectedRecoverable: number;
  activeCases: number;
  totalCases: number;
  escalationRate: number;
  averageTimeToRecovery: number;
  interventionSuccessRate: number;
}

export type AgentExecutionState = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'STOPPED';

export interface AppState {
  customers: Customer[];
  payments: Payment[];
  checkoutSessions: CheckoutSession[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  communications: Communication[];
  recoveryCases: RecoveryCase[];
  promises: PromiseToPay[];
  recoveryActions: RecoveryAction[];
  counterfactualResults: CounterfactualResult[];
  policyChecks: PolicyCheck[];
  agentEvents: AgentEvent[];
  recoveryOutcomes: RecoveryOutcomeRecord[];
  dashboardMetrics: DashboardMetrics;
  activeCaseId: string | null;
  demoMode: boolean;
  agentExecutionState: AgentExecutionState;
  lastResetAt: string;
}
