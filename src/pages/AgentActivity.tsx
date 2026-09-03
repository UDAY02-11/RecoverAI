// Agent Activity — shows active agents, running cases, completed recoveries, failed workflows, escalations.
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { AgentTimeline } from '@/components/AgentTimeline';
import { CaseStatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/States';
import { formatINR } from '@/lib/format';
import { Bot, CheckCircle, XCircle, AlertTriangle, Activity, Clock } from 'lucide-react';

export function AgentActivity() {
  const { state } = useApp();

  const runningCases = state.recoveryCases.filter((c) => c.status === 'ANALYZING' || c.status === 'RECOVERING');
  const completedRecoveries = state.recoveryCases.filter((c) => c.status === 'RECOVERED');
  const failedWorkflows = state.recoveryCases.filter((c) => c.status === 'FAILED' || c.status === 'STOPPED');
  const escalations = state.recoveryCases.filter((c) => c.status === 'ESCALATED');

  const recentEvents = state.agentEvents.slice(0, 30);

  return (
    <div>
      <PageHeader title="Agent Activity" description="Live recovery agent workflow timeline" />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard label="Active Agents" value="1" icon={<Bot className="w-5 h-5" />} tone="primary" sublabel="Recovery Agent v1" />
        <MetricCard label="Running Cases" value={String(runningCases.length)} icon={<Activity className="w-5 h-5" />} tone="primary" />
        <MetricCard label="Completed Recoveries" value={String(completedRecoveries.length)} icon={<CheckCircle className="w-5 h-5" />} tone="success" />
        <MetricCard label="Failed Workflows" value={String(failedWorkflows.length)} icon={<XCircle className="w-5 h-5" />} tone="error" />
        <MetricCard label="Escalations" value={String(escalations.length)} icon={<AlertTriangle className="w-5 h-5" />} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <SectionCard title="Agent Timeline" description="Recent recovery agent events across all cases" actions={<Clock className="w-4 h-4 text-gray-400" />}>
            {recentEvents.length === 0 ? (
              <EmptyState
                title="No agent activity yet"
                description="Open a case and run the Recovery Agent to see the operational timeline here."
                icon={<Bot className="w-6 h-6" />}
              />
            ) : (
              <AgentTimeline events={recentEvents} />
            )}
          </SectionCard>
        </div>

        {/* Sidebar: Running / Escalations */}
        <div className="space-y-4">
          <SectionCard title="Running Cases" description="Currently being processed">
            {runningCases.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No cases currently running.</p>
            ) : (
              <div className="space-y-2">
                {runningCases.map((c) => {
                  const cust = state.customers.find((x) => x.id === c.customerId);
                  return (
                    <div key={c.id} className="p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-primary-700">{c.id}</span>
                        <CaseStatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{cust?.name}</p>
                      <p className="text-xs text-gray-500">{formatINR(c.amountAtRisk)} at risk</p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Escalations" description="Cases requiring human intervention">
            {escalations.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No escalations.</p>
            ) : (
              <div className="space-y-2">
                {escalations.slice(0, 6).map((c) => {
                  const cust = state.customers.find((x) => x.id === c.customerId);
                  return (
                    <div key={c.id} className="p-3 rounded-lg bg-warning-50/50 border border-warning-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-warning-700">{c.id}</span>
                        <CaseStatusBadge status={c.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{cust?.name}</p>
                      <p className="text-xs text-gray-500">{formatINR(c.amountAtRisk)} · {c.retryCount} retries</p>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
