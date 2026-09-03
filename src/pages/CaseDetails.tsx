// Case Details — detailed view with the Counterfactual Recovery Planner.
import { useEffect, useState } from 'react';
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { CaseStatusBadge, RiskBadge } from '@/components/ui/StatusBadge';
import { CounterfactualActionCard } from '@/components/counterfactual/CounterfactualActionCard';
import { CounterfactualComparison } from '@/components/counterfactual/CounterfactualComparison';
import { RecommendationPanel } from '@/components/counterfactual/RecommendationPanel';
import { DiagnosisPanel } from '@/components/counterfactual/DiagnosisPanel';
import { CustomerContextPanel } from '@/components/counterfactual/CustomerContextPanel';
import { PolicyCheckPanel } from '@/components/counterfactual/PolicyCheckPanel';
import { AgentTimeline } from '@/components/AgentTimeline';
import { DemoControls } from '@/components/DemoControls';
import { counterfactualEngine } from '@/lib/engines/counterfactualEngine';
import { formatINR, formatPercent } from '@/lib/format';
import { ArrowLeft, Brain, Activity, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function CaseDetails({ onBack }: Props) {
  const { state, activeCase, activeCustomer, dispatch } = useApp();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Generate counterfactual evaluation if not yet present.
  useEffect(() => {
    if (activeCase && activeCustomer && !activeCase.counterfactual) {
      const result = counterfactualEngine.evaluate(
        activeCustomer,
        activeCase,
        activeCase.retryCount,
        activeCase.communicationCount,
        activeCase.amountAtRisk,
      );
      dispatch({ type: 'SET_COUNTERFACTUAL', caseId: activeCase.id, result });
    }
  }, [activeCase, activeCustomer, dispatch]);

  if (!activeCase || !activeCustomer) {
    return (
      <div>
        <PageHeader title="Case Details" />
        <SectionCard>
          <div className="py-16 text-center text-gray-500">
            <p className="text-sm">No case selected. Go back to the Recovery Queue to select one.</p>
            <button onClick={onBack} className="btn-secondary mt-4">
              <ArrowLeft className="w-4 h-4" /> Back to Queue
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const counterfactual = activeCase.counterfactual;
  const caseEvents = state.agentEvents.filter((e) => e.caseId === activeCase.id);
  const policyChecks = activeCase.policyChecks ?? [];
  const recommendedAction = counterfactual?.recommendedAction ?? activeCase.recommendedAction;
  const selected = counterfactual?.actions.find((a) => a.type === (selectedAction ?? recommendedAction));
  const isClosed = ['RECOVERED', 'FAILED', 'ESCALATED', 'STOPPED'].includes(activeCase.status);

  return (
    <div>
      <PageHeader
        title={`Case ${activeCase.id}`}
        description={`${activeCustomer.name} · ${activeCase.type.replace(/_/g, ' ')}`}
        actions={
          <button onClick={onBack} className="btn-secondary text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </button>
        }
      />

      {/* Case header KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Revenue At Risk" value={formatINR(activeCase.amountAtRisk)} tone="error" />
        <MetricCard label="Risk Score" value={`${activeCase.riskScore}/100`} tone="warning" icon={<RiskBadge level={activeCase.riskLevel} />} />
        <MetricCard label="Recovery Prob." value={formatPercent(activeCase.recoveryProbability, 0)} tone="primary" />
        <MetricCard label="Expected Recovery" value={formatINR(activeCase.expectedRecovery)} tone="success" />
        <MetricCard label="Recovery Type" value={activeCase.type.replace(/_/g, ' ')} />
        <div className="card p-5 flex flex-col justify-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Status</p>
          <CaseStatusBadge status={activeCase.status} />
          {activeCase.actualRecovery !== undefined && (
            <p className="mt-2 text-xs text-gray-500">
              Actual: <span className="font-semibold text-gray-700">{formatINR(activeCase.actualRecovery)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main grid: Planner + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Counterfactual Planner (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Hero: What Should The Agent Do? */}
          <SectionCard
            title="What Should The Agent Do?"
            description="Counterfactual Recovery Engine — evaluating every recovery path"
            actions={<Brain className="w-5 h-5 text-primary-500" />}
          >
            {counterfactual ? (
              <>
                {/* Action cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                  {counterfactual.actions.map((action) => (
                    <CounterfactualActionCard
                      key={action.type}
                      action={action}
                      recommended={action.type === counterfactual.recommendedAction}
                      selected={action.type === selectedAction}
                      onSelect={() => setSelectedAction(action.type)}
                      compact
                    />
                  ))}
                </div>

                {/* Comparison bar chart */}
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-3">Expected Net Recovery Comparison</p>
                  <CounterfactualComparison actions={counterfactual.actions} recommendedAction={counterfactual.recommendedAction} />
                </div>

                {/* Recommendation panel */}
                {selected && (
                  <RecommendationPanel
                    action={selected}
                    reason={counterfactual.recommendationReason}
                    amountAtRisk={activeCase.amountAtRisk}
                    customerName={activeCustomer.name}
                  />
                )}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <Activity className="w-6 h-6 mx-auto mb-2 animate-pulse-soft" />
                Evaluating counterfactual scenarios...
              </div>
            )}
          </SectionCard>

          {/* Diagnosis */}
          <DiagnosisPanel caseData={activeCase} customer={activeCustomer} />

          {/* Policy checks */}
          {policyChecks.length > 0 && (
            <PolicyCheckPanel checks={policyChecks} />
          )}

          {/* Agent timeline for this case */}
          {caseEvents.length > 0 && (
            <SectionCard title="Agent Timeline" description="Recovery agent workflow for this case" actions={<Activity className="w-4 h-4 text-gray-400" />}>
              <AgentTimeline events={caseEvents} />
            </SectionCard>
          )}
        </div>

        {/* Right: Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Demo controls */}
          <DemoControls caseData={activeCase} />

          {/* Customer context */}
          <CustomerContextPanel customer={activeCustomer} />

          {/* Quick stats */}
          <SectionCard title="Case Metadata">
            <div className="space-y-2 text-xs">
              <Row label="Case ID" value={activeCase.id} />
              <Row label="Customer ID" value={activeCase.customerId} />
              <Row label="Created" value={new Date(activeCase.createdAt).toLocaleString('en-IN')} />
              <Row label="Updated" value={new Date(activeCase.updatedAt).toLocaleString('en-IN')} />
              <Row label="Retry Count" value={String(activeCase.retryCount)} />
              <Row label="Communication Count" value={String(activeCase.communicationCount)} />
              {activeCase.paymentId && <Row label="Payment ID" value={activeCase.paymentId} />}
              {activeCase.checkoutId && <Row label="Checkout ID" value={activeCase.checkoutId} />}
              {activeCase.invoiceId && <Row label="Invoice ID" value={activeCase.invoiceId} />}
              {activeCase.subscriptionId && <Row label="Subscription ID" value={activeCase.subscriptionId} />}
            </div>
          </SectionCard>

          {/* Outcome */}
          {isClosed && (
            <SectionCard title="Recovery Outcome">
              <div className="text-center py-4">
                {activeCase.status === 'RECOVERED' ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-success-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-success-700">{formatINR(activeCase.actualRecovery ?? 0)} Recovered</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expected: {formatINR(activeCase.expectedRecovery)} · Variance: {formatINR((activeCase.actualRecovery ?? 0) - activeCase.expectedRecovery)}
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-error-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-error-700">{activeCase.status}</p>
                    <p className="text-xs text-gray-500 mt-1">No revenue recovered</p>
                  </>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono font-medium text-gray-700 truncate">{value}</span>
    </div>
  );
}
