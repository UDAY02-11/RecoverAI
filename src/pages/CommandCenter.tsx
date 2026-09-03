// Command Center — main revenue recovery dashboard.
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { RecoveryFunnel } from '@/components/RecoveryFunnel';
import { RecoveryQueueTable } from '@/components/RecoveryQueueTable';
import { AgentTimeline } from '@/components/AgentTimeline';
import { EmptyState } from '@/components/ui/States';
import { analyticsRepo, recoveryCaseRepo } from '@/lib/repositories';
import { formatINR, formatINRShort, formatPercent } from '@/lib/format';
import type { PageKey } from '@/App';
import {
  TrendingDown, TrendingUp, Target, Activity, AlertCircle,
  BarChart3, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, Legend,
} from 'recharts';

interface Props {
  onNavigate: (key: PageKey) => void;
  onSelectCase: (caseId: string) => void;
}

export function CommandCenter({ onNavigate, onSelectCase }: Props) {
  const { state, dispatch } = useApp();
  const m = state.dashboardMetrics;
  const highPriority = recoveryCaseRepo.highPriority(state.recoveryCases, 8);
  const funnel = analyticsRepo.recoveryFunnel(state.recoveryCases);
  const recentEvents = state.agentEvents.slice(0, 8);
  const timeSeries = analyticsRepo.recoveryOverTime(state.recoveryOutcomes).slice(-14);
  const interventionPerf = analyticsRepo.interventionPerformance(state.recoveryOutcomes);

  const interventionData = interventionPerf.map((s) => ({
    name: s.action.replace(/_/g, ' '),
    successRate: Math.round(s.successRate * 100),
    recovered: s.recovered,
  }));

  const impactData = [
    { name: 'At Risk', value: m.revenueAtRisk, fill: '#f87171' },
    { name: 'Expected', value: m.expectedRecoverable, fill: '#819af8' },
    { name: 'Recovered', value: m.recoveredRevenue, fill: '#10b981' },
    { name: 'Remaining', value: Math.max(0, m.revenueAtRisk - m.recoveredRevenue), fill: '#d1d5db' },
  ];

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Real-time revenue recovery overview"
        actions={
          <button onClick={() => dispatch({ type: 'RESET_DEMO' })} className="btn-secondary text-xs">
            Reset Demo
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard label="Revenue At Risk" value={formatINRShort(m.revenueAtRisk)} icon={<TrendingDown className="w-5 h-5" />} tone="error" sublabel={`${m.activeCases} active cases`} />
        <MetricCard label="Recovered Revenue" value={formatINRShort(m.recoveredRevenue)} icon={<TrendingUp className="w-5 h-5" />} tone="success" sublabel="Total recovered to date" />
        <MetricCard label="Recovery Rate" value={formatPercent(m.recoveryRate, 1)} icon={<Target className="w-5 h-5" />} tone="primary" sublabel={`${m.totalCases} total cases`} />
        <MetricCard label="Expected Recoverable" value={formatINRShort(m.expectedRecoverable)} icon={<Activity className="w-5 h-5" />} tone="warning" sublabel="AI-projected" />
        <MetricCard label="Active Cases" value={String(m.activeCases)} icon={<AlertCircle className="w-5 h-5" />} tone="default" sublabel={`${m.escalationRate > 0 ? formatPercent(m.escalationRate, 1) + ' escalation' : 'No escalations'}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recovery Over Time */}
        <ChartCard title="Revenue Recovery Over Time" description="Daily recovered vs expected" className="lg:col-span-2" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6173f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6173f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatINRShort(v)} />
              <Tooltip
                formatter={(v: number) => formatINR(v)}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="expected" name="Expected" stroke="#6173f1" strokeWidth={2} fill="url(#colorExpected)" />
              <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" strokeWidth={2} fill="url(#colorRecovered)" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recovery Impact */}
        <ChartCard title="Recovery Impact" description="Revenue breakdown" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={impactData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatINRShort(v)} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={70} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {impactData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Funnel + Intervention Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Revenue Recovery Funnel" description="Detection → Intervention → Execution → Recovery">
          <RecoveryFunnel stages={funnel} />
        </SectionCard>

        <ChartCard title="Intervention Performance" description="Success rate by action type" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interventionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="successRate" name="Success Rate" radius={[4, 4, 0, 0]}>
                {interventionData.map((_, idx) => (
                  <Cell key={idx} fill={['#6173f1', '#14b886', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'][idx % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* High Priority Cases + Live Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard
            title="High Priority Recovery Cases"
            description="Sorted by expected recoverable revenue"
            actions={
              <button onClick={() => onNavigate('queue')} className="btn-ghost text-xs">
                <Layers className="w-3.5 h-3.5" /> View All
              </button>
            }
            noPadding
          >
            <RecoveryQueueTable
              cases={highPriority}
              customers={state.customers}
              onRowClick={(c) => onSelectCase(c.id)}
            />
          </SectionCard>
        </div>

        <SectionCard title="Live Agent Activity" description="Recent recovery agent events" actions={<BarChart3 className="w-4 h-4 text-gray-400" />}>
          {recentEvents.length === 0 ? (
            <EmptyState title="No agent activity yet" description="Run a recovery agent to see the live timeline." icon={<Activity className="w-6 h-6" />} />
          ) : (
            <AgentTimeline events={recentEvents} />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
