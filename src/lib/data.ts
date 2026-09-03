// ============================================================
// Deterministic synthetic data generator
// Produces realistic, related entities for RecoverAI demo.
// ============================================================

import type {
  Customer,
  CustomerSegment,
  Payment,
  PaymentStatus,
  CheckoutSession,
  CheckoutStatus,
  Subscription,
  SubscriptionStatus,
  Invoice,
  InvoiceStatus,
  Communication,
  RecoveryCase,
  RecoveryType,
  RiskLevel,
  CaseStatus,
  PaymentFailureReason as FR,
  PromiseToPay,
  PromiseStatus,
  PreferredChannel,
  RecoveryAction,
} from '@/types';

// Deterministic PRNG (mulberry32) so data is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260902);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function range(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function rangeFloat(min: number, max: number): number {
  return rng() * (max - min) + min;
}
function chance(p: number): boolean {
  return rng() < p;
}

const FIRST = [
  'Acme', 'Zenith', 'Nimbus', 'Vertex', 'Quantum', 'Stellar', 'Apex',
  'Orbit', 'Pinnacle', 'Catalyst', 'Momentum', 'Horizon', 'Vanguard',
  'Summit', 'Pulse', 'Atlas', 'Cobalt', 'Ironclad', 'Beacon', 'Cascade',
  'Delta', 'Echo', 'Flux', 'Galaxy', 'Helix', 'Ion', 'Junction', 'Kinetix',
  'Lumen', 'Meridian', 'Nexus', 'Onyx', 'Prism', 'Quasar', 'Radiant',
  'Solstice', 'Titan', 'Unity', 'Velocity', 'Whisper', 'Xenon', 'Yield',
  'Zephyr', 'Bright', 'Clear', 'Deep', 'Ever', 'Fair', 'Grand', 'High',
];
const SECOND = [
  'Technologies', 'Systems', 'Solutions', 'Labs', 'Dynamics', 'Group',
  'Industries', 'Software', 'Digital', 'Analytics', 'Cloud', 'AI',
  'Capital', 'Ventures', 'Enterprises', 'Networks', 'Platforms',
  'Services', 'Corp', 'Partners', 'Holdings', 'Logix', 'Stack', 'Works',
  'Media', 'Commerce', 'Payments', 'Finance', 'Health', 'Retail',
];

const DOMAINS = ['com', 'in', 'io', 'co', 'tech'];

function companyName(i: number): string {
  return `${FIRST[i % FIRST.length]} ${SECOND[(i * 7) % SECOND.length]}`;
}

function isoDaysAgo(days: number, hourOffset = 0): string {
  const d = new Date('2026-09-02T09:00:00');
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString();
}

const SEGMENTS: CustomerSegment[] = ['Enterprise', 'SMB', 'Startup', 'Individual'];
const CHANNELS: PreferredChannel[] = ['Email', 'SMS', 'WhatsApp', 'Phone', 'In-App'];

// ---------------------------------------------------------------
// Customers (500)
// ---------------------------------------------------------------
export function generateCustomers(): Customer[] {
  const customers: Customer[] = [];
  for (let i = 0; i < 500; i++) {
    const name = companyName(i);
    const segment = SEGMENTS[i % SEGMENTS.length];
    const successCount = range(2, 40);
    const failCount = range(0, 6);
    const avg =
      segment === 'Enterprise' ? range(80000, 500000) :
      segment === 'SMB' ? range(15000, 80000) :
      segment === 'Startup' ? range(5000, 40000) :
      range(1000, 15000);
    const ltv = (successCount + failCount) * avg * rangeFloat(0.8, 1.4);
    customers.push({
      id: `CUS-${String(i + 1).padStart(4, '0')}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@example.${DOMAINS[i % DOMAINS.length]}`,
      phone: `+91${range(70000, 99999)}${range(10000, 99999)}`,
      segment,
      lifetimeValue: Math.round(ltv),
      successfulPayments: successCount,
      previousFailures: failCount,
      averagePayment: avg,
      previousRecoveryAttempts: range(0, 4),
      preferredChannel: CHANNELS[i % CHANNELS.length],
      optedOut: chance(0.04),
      flaggedSuspicious: chance(0.02),
      createdAt: isoDaysAgo(range(30, 400)),
    });
  }
  return customers;
}

// ---------------------------------------------------------------
// Payments (2000) — related to customers
// ---------------------------------------------------------------
const FAIL_REASONS: FR[] = [
  'INSUFFICIENT_FUNDS', 'EXPIRED_CARD', 'BANK_FAILURE',
  'NETWORK_ERROR', 'TEMPORARY_FAILURE', 'DECLINED',
];

export function generatePayments(customers: Customer[]): Payment[] {
  const payments: Payment[] = [];
  for (let i = 0; i < 2000; i++) {
    const c = customers[i % customers.length];
    const failed = chance(0.22);
    const status: PaymentStatus = failed ? 'FAILED' : 'SUCCESS';
    const reason: FR = failed ? pick(FAIL_REASONS) : 'NONE';
    const amount = Math.round(c.averagePayment * rangeFloat(0.5, 1.8));
    payments.push({
      id: `PAY-${String(i + 1).padStart(5, '0')}`,
      customerId: c.id,
      amount,
      status,
      failureReason: reason,
      method: pick(['UPI', 'Card', 'Netbanking', 'Wallet']),
      createdAt: isoDaysAgo(range(0, 60), range(0, 8)),
    });
  }
  return payments;
}

// ---------------------------------------------------------------
// Checkout Sessions (1000)
// ---------------------------------------------------------------
export function generateCheckouts(customers: Customer[]): CheckoutSession[] {
  const checkouts: CheckoutSession[] = [];
  for (let i = 0; i < 1000; i++) {
    const c = customers[i % customers.length];
    const abandoned = chance(0.28);
    const status: CheckoutStatus = abandoned ? 'ABANDONED' : 'COMPLETED';
    const value = Math.round(c.averagePayment * rangeFloat(0.8, 3));
    checkouts.push({
      id: `CKO-${String(i + 1).padStart(5, '0')}`,
      customerId: c.id,
      cartValue: value,
      status,
      items: range(1, 8),
      createdAt: isoDaysAgo(range(0, 45), range(0, 10)),
    });
  }
  return checkouts;
}

// ---------------------------------------------------------------
// Subscriptions (500)
// ---------------------------------------------------------------
export function generateSubscriptions(customers: Customer[]): Subscription[] {
  const subs: Subscription[] = [];
  for (let i = 0; i < 500; i++) {
    const c = customers[i % customers.length];
    const r = rng();
    const status: SubscriptionStatus =
      r < 0.6 ? 'ACTIVE' : r < 0.75 ? 'PAST_DUE' : r < 0.85 ? 'TRIALING' : r < 0.95 ? 'UNPAID' : 'CANCELLED';
    const amount = Math.round(c.averagePayment * rangeFloat(0.4, 1.2));
    subs.push({
      id: `SUB-${String(i + 1).padStart(4, '0')}`,
      customerId: c.id,
      plan: pick(['Basic', 'Pro', 'Business', 'Enterprise']),
      amount,
      status,
      billingCycle: chance(0.7) ? 'MONTHLY' : 'YEARLY',
      createdAt: isoDaysAgo(range(30, 300)),
    });
  }
  return subs;
}

// ---------------------------------------------------------------
// Invoices (500) — B2B overdue cases
// ---------------------------------------------------------------
export function generateInvoices(customers: Customer[]): Invoice[] {
  const invoices: Invoice[] = [];
  for (let i = 0; i < 500; i++) {
    const c = customers[i % customers.length];
    const r = rng();
    const status: InvoiceStatus =
      r < 0.55 ? 'PAID' : r < 0.85 ? 'OPEN' : 'OVERDUE';
    const amount = Math.round(c.averagePayment * rangeFloat(1.5, 6));
    const daysOverdue = status === 'OVERDUE' ? range(3, 30) : 0;
    invoices.push({
      id: `INV-${String(i + 1).padStart(4, '0')}`,
      customerId: c.id,
      number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
      amount,
      status,
      daysOverdue,
      normalPaymentDays: range(3, 14),
      createdAt: isoDaysAgo(range(10, 90)),
      dueDate: isoDaysAgo(range(0, 40) * -1),
    });
  }
  return invoices;
}

// ---------------------------------------------------------------
// Communications (derived from cases)
// ---------------------------------------------------------------
export function generateCommunications(
  customers: Customer[],
  cases: RecoveryCase[],
): Communication[] {
  const comms: Communication[] = [];
  cases.slice(0, 200).forEach((c, idx) => {
    const customer = customers.find((x) => x.id === c.customerId)!;
    comms.push({
      id: `COM-${String(idx + 1).padStart(5, '0')}`,
      customerId: c.customerId,
      caseId: c.id,
      channel: customer.preferredChannel,
      direction: 'OUTBOUND',
      subject: `Recovery attempt for ${c.id}`,
      body: `Hello ${customer.name}, we noticed an issue with your recent payment of ${c.amountAtRisk}. Please complete your payment.`,
      createdAt: c.createdAt,
    });
  });
  return comms;
}

// ---------------------------------------------------------------
// Recovery Cases (derived from failed payments, abandoned checkouts,
// overdue invoices, failed subscriptions)
// ---------------------------------------------------------------
export function generateRecoveryCases(
  customers: Customer[],
  payments: Payment[],
  checkouts: CheckoutSession[],
  invoices: Invoice[],
  subscriptions: Subscription[],
): RecoveryCase[] {
  const cases: RecoveryCase[] = [];
  let caseNum = 0;

  const mkCase = (
    c: Customer,
    type: RecoveryType,
    amount: number,
    failureReason: RecoveryCase['failureReason'],
    failureDescription: string,
    diagnosis: string,
    supportingBehavior: string,
    ref: Partial<RecoveryCase> = {},
  ): RecoveryCase => {
    caseNum++;
    const riskScore = computeRiskScore(c, amount);
    const riskLevel = riskScoreToLevel(riskScore);
    const recoveryProbability = computeBaseProbability(c, type, failureReason);
    const recommendedAction = defaultAction(type, failureReason);
    const expectedRecovery = Math.round(amount * recoveryProbability);
    const status: CaseStatus = 'READY';
    const created = isoDaysAgo(range(0, 20), range(0, 8));
    return {
      id: `CASE-${String(caseNum).padStart(4, '0')}`,
      customerId: c.id,
      type,
      amountAtRisk: amount,
      riskScore,
      riskLevel,
      recoveryProbability,
      status,
      failureReason,
      failureDescription,
      diagnosis,
      supportingBehavior,
      recommendedAction,
      expectedRecovery,
      retryCount: 0,
      communicationCount: 0,
      createdAt: created,
      updatedAt: created,
      ...ref,
    };
  };

  // Payment failures
  payments.filter((p) => p.status === 'FAILED').slice(0, 120).forEach((p) => {
    const c = customers.find((x) => x.id === p.customerId)!;
    const reasonText = failReasonText(p.failureReason);
    cases.push(
      mkCase(
        c,
        'PAYMENT_FAILURE',
        p.amount,
        p.failureReason,
        reasonText,
        `Payment failed due to ${reasonText.toLowerCase()}. Customer has ${c.successfulPayments} successful payments and ${c.previousFailures} prior failures.`,
        `${c.name} has a ${c.successfulPayments > c.previousFailures ? 'strong' : 'mixed'} payment history with a ${c.preferredChannel} preference.`,
        { paymentId: p.id },
      ),
    );
  });

  // Checkout abandonment
  checkouts.filter((k) => k.status === 'ABANDONED').slice(0, 80).forEach((k) => {
    const c = customers.find((x) => x.id === k.customerId)!;
    cases.push(
      mkCase(
        c,
        'CHECKOUT_ABANDONMENT',
        k.cartValue,
        'ABANDONMENT',
        'Customer abandoned checkout before completing payment.',
        `Checkout abandoned at cart value ${k.cartValue}. ${k.items} items left in cart. Likely intent to pay but distracted or deterred by friction.`,
        `${c.name} prefers ${c.preferredChannel}. Previous recovery attempts: ${c.previousRecoveryAttempts}.`,
        { checkoutId: k.id },
      ),
    );
  });

  // Overdue invoices (B2B)
  invoices.filter((iv) => iv.status === 'OVERDUE').forEach((iv) => {
    const c = customers.find((x) => x.id === iv.customerId)!;
    cases.push(
      mkCase(
        c,
        'INVOICE_OVERDUE',
        iv.amount,
        'OVERDUE',
        `Invoice ${iv.number} is ${iv.daysOverdue} days overdue. Customer normally pays within ${iv.normalPaymentDays} days.`,
        `B2B invoice overdue by ${iv.daysOverdue} days against a normal cycle of ${iv.normalPaymentDays} days. Suggests process delay or cash-flow issue rather than refusal.`,
        `${c.name} (Enterprise/SMB) has LTV of ${c.lifetimeValue}. Account manager follow-up may unblock.`,
        { invoiceId: iv.id },
      ),
    );
  });

  // Subscription failures
  subscriptions.filter((s) => s.status === 'PAST_DUE' || s.status === 'UNPAID').slice(0, 60).forEach((s) => {
    const c = customers.find((x) => x.id === s.customerId)!;
    cases.push(
      mkCase(
        c,
        'SUBSCRIPTION_FAILURE',
        s.amount,
        'TEMPORARY_FAILURE',
        `Subscription renewal for ${s.plan} plan failed. Status: ${s.status}.`,
        `Recurring charge failed for ${s.plan} subscription. Retrying or sending a payment link typically recovers recurring revenue.`,
        `${c.name} has ${c.successfulPayments} successful payments. Retention value is high.`,
        { subscriptionId: s.id },
      ),
    );
  });

  return cases;
}

// ---------------------------------------------------------------
// Promise-to-Pay records
// ---------------------------------------------------------------
export function generatePromises(
  customers: Customer[],
  cases: RecoveryCase[],
): PromiseToPay[] {
  const promises: PromiseToPay[] = [];
  cases.slice(0, 60).forEach((c, i) => {
    const customer = customers.find((x) => x.id === c.customerId)!;
    const r = rng();
    const status: PromiseStatus = r < 0.5 ? 'PENDING' : r < 0.8 ? 'FULFILLED' : 'MISSED';
    promises.push({
      id: `PTP-${String(i + 1).padStart(4, '0')}`,
      customerId: c.customerId,
      amount: c.amountAtRisk,
      promiseDate: isoDaysAgo(range(-10, 5)),
      status,
      caseId: status === 'MISSED' ? c.id : undefined,
      createdAt: customer.createdAt,
    });
  });
  return promises;
}

// ---------------------------------------------------------------
// Helpers shared with engine
// ---------------------------------------------------------------
export function computeRiskScore(c: Customer, amount: number): number {
  const amountFactor = Math.min(amount / 200000, 1);
  const failRatio = c.previousFailures / (c.successfulPayments + c.previousFailures + 1);
  const ltvFactor = Math.min(c.lifetimeValue / 5000000, 1);
  const score = amountFactor * 0.4 + failRatio * 0.35 + (1 - ltvFactor) * 0.25;
  return Math.round(score * 100);
}

export function riskScoreToLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

export function computeBaseProbability(
  c: Customer,
  type: RecoveryType,
  reason: RecoveryCase['failureReason'],
): number {
  const successRatio =
    c.successfulPayments / (c.successfulPayments + c.previousFailures + 1);
  let base = successRatio * 0.5 + 0.3;
  if (reason === 'TEMPORARY_FAILURE' || reason === 'NETWORK_ERROR') base += 0.15;
  if (reason === 'INSUFFICIENT_FUNDS') base -= 0.1;
  if (reason === 'EXPIRED_CARD') base -= 0.05;
  if (reason === 'ABANDONMENT') base = 0.6 + successRatio * 0.2;
  if (reason === 'OVERDUE') base = 0.55 + successRatio * 0.15;
  if (type === 'SUBSCRIPTION_FAILURE') base += 0.05;
  if (c.optedOut) base *= 0.3;
  if (c.flaggedSuspicious) base *= 0.5;
  return Math.max(0.1, Math.min(0.95, base));
}

export function defaultAction(
  type: RecoveryType,
  reason: RecoveryCase['failureReason'],
): RecoveryAction['type'] {
  if (reason === 'TEMPORARY_FAILURE' || reason === 'NETWORK_ERROR') return 'DELAYED_RETRY';
  if (reason === 'ABANDONMENT') return 'PAYMENT_LINK';
  if (reason === 'OVERDUE') return 'REMINDER';
  if (reason === 'INSUFFICIENT_FUNDS') return 'DELAYED_RETRY';
  if (reason === 'EXPIRED_CARD') return 'PAYMENT_LINK';
  if (type === 'SUBSCRIPTION_FAILURE') return 'PAYMENT_LINK';
  return 'DELAYED_RETRY';
}

export function failReasonText(reason: FR): string {
  switch (reason) {
    case 'INSUFFICIENT_FUNDS': return 'Insufficient Funds';
    case 'EXPIRED_CARD': return 'Expired Card';
    case 'BANK_FAILURE': return 'Bank Failure';
    case 'NETWORK_ERROR': return 'Network Error';
    case 'TEMPORARY_FAILURE': return 'Temporary Payment Failure';
    case 'DECLINED': return 'Card Declined';
    default: return 'None';
  }
}

// ---------------------------------------------------------------
// Historical recovery actions (1000) for analytics
// ---------------------------------------------------------------
export function generateHistoricalActions(
  customers: Customer[],
): {
  actionType: RecoveryAction['type'];
  outcome: 'SUCCESS' | 'FAILURE';
  amount: number;
  expected: number;
  actual: number;
  segment: CustomerSegment;
  createdAt: string;
}[] {
  const records: {
    actionType: RecoveryAction['type'];
    outcome: 'SUCCESS' | 'FAILURE';
    amount: number;
    expected: number;
    actual: number;
    segment: CustomerSegment;
    createdAt: string;
  }[] = [];
  for (let i = 0; i < 1000; i++) {
    const c = customers[i % customers.length];
    const actionType = pick([
      'IMMEDIATE_RETRY', 'DELAYED_RETRY', 'PAYMENT_LINK', 'REMINDER',
      'SMALL_INCENTIVE', 'HUMAN_ESCALATION',
    ] as const);
    const success = chance(0.58);
    const amount = Math.round(c.averagePayment * rangeFloat(0.5, 2.5));
    const expected = Math.round(amount * rangeFloat(0.5, 0.85));
    const actual = success ? amount : 0;
    records.push({
      actionType,
      outcome: success ? 'SUCCESS' : 'FAILURE',
      amount,
      expected,
      actual,
      segment: c.segment,
      createdAt: isoDaysAgo(range(1, 90), range(0, 8)),
    });
  }
  return records;
}
