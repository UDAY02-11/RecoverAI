// Analytics — recovery performance with expected vs actual as the hero visualization.
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { OutcomeBadge } from '@/components/ui/StatusBadge';
import { analyticsRepo, type ExpectedActualRow } from '@/lib/repositories';
import type { Customer } from '@/types';
import { formatINR, formatINRShort, formatPercent } from '@/lib/format';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { TrendingUp, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function Analytics() {
  const { state } = useApp();
  const m = state.dashboardMetrics;

  const timeSeries = analyticsRepo.recoveryOverTime(state.recoveryOutcomes).slice(-30);
  const interventionPerf = analyticsRepo.interventionPerformance(state.recoveryOutcomes);
  const segmentData = analyticsRepo.recoveryBySegment(state.recoveryOutcomes, state.customers);
  const expectedActual = analyticsRepo.expectedVsActual(state.recoveryOutcomes).slice(0, 50);

  const interventionData = interventionPerf.map((s) => ({
    name: s.action.replace(/_/g, ' '),
    successRate: Math.round(s.successRate * 100),
    total: s.total,
    recovered: s.recovered,
  }));

  return (
    <div>
      <PageHeader title="Analytics" description="Recovery performance and expected vs actual" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Revenue Recovered" value={formatINRShort(m.recoveredRevenue)} icon={<TrendingUp className="w-5 h-5" />} tone="success" />
        <MetricCard label="Recovery Rate" value={formatPercent(m.recoveryRate, 1)} icon={<Target className="w-5 h-5" />} tone="primary" />
        <MetricCard label="Expected Recoverable" value={formatINRShort(m.expectedRecoverable)} icon={<Target className="w-5 h-5" />} tone="warning" />
        <MetricCard label="Avg Time to Recovery" value={`${m.averageTimeToRecovery}h`} icon={<Clock className="w-5 h-5" />} tone="default" />
        <MetricCard label="Intervention Success" value={formatPercent(m.interventionSuccessRate, 1)} icon={<CheckCircle className="w-5 h-5" />} tone="success" />
        <MetricCard label="Escalation Rate" value={formatPercent(m.escalationRate, 1)} icon={<AlertTriangle className="w-5 h-5" />} tone="warning" />
      </div>

      {/* Expected vs Actual — hero chart */}
      <ChartCard
        title="Expected vs Actual Recovery"
        description="The most important analytics — comparing AI predictions to real outcomes"
        className="mb-4"
        height={320}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6173f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6173f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatINRShort(v)} />
            <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="expected" name="Expected" stroke="#6173f1" strokeWidth={2} fill="url(#colorExp)" />
            <Area type="monotone" dataKey="recovered" name="Actual" stroke="#10b981" strokeWidth={2} fill="url(#colorAct)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Revenue Recovered Over Time" description="Daily recovered revenue" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatINRShort(v)} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" strokeWidth={2} fill="url(#colorRec)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Recovery by Intervention" description="Success rate per action type" height={260}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Recovery by Customer Segment" description="Recovered revenue by segment" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="segment" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => formatINRShort(v)} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="recovered" name="Recovered" fill="#14b886" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Intervention Success Rate" description="Total attempts vs success rate" height={260}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interventionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="total" name="Total Attempts" fill="#c7d9fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recovered" name="Recovered (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Expected vs Actual table */}
      <SectionCard title="Expected vs Actual Recovery" description="Per-case variance analysis" noPadding>
        <DataTable
          columns={
            [
              { key: 'caseId', header: 'Case ID', render: (r: ExpectedActualRow) => <span className="font-mono text-xs text-primary-700">{r.caseId}</span> },
              {
                key: 'customer',
                header: 'Customer',
                render: (r: ExpectedActualRow) => {
                  const c = state.customers.find((x: Customer) => x.id === r.customer);
                  return <span className="text-sm">{c?.name ?? r.customer}</span>;
                },
              },
              { key: 'expected', header: 'Expected', align: 'right' as const, render: (r: ExpectedActualRow) => <span className="tabular-nums font-medium">{formatINR(r.expected)}</span> },
              { key: 'actual', header: 'Actual', align: 'right' as const, render: (r: ExpectedActualRow) => <span className={`tabular-nums font-semibold ${r.actual > 0 ? 'text-success-700' : 'text-gray-400'}`}>{formatINR(r.actual)}</span> },
              { key: 'variance', header: 'Variance', align: 'right' as const, render: (r: ExpectedActualRow) => <span className={`tabular-nums ${r.variance >= 0 ? 'text-success-600' : 'text-error-600'}`}>{r.variance >= 0 ? '+' : ''}{formatINR(r.variance)}</span> },
              { key: 'outcome', header: 'Outcome', align: 'center' as const, render: (r: ExpectedActualRow) => <OutcomeBadge outcome={r.outcome} /> },
            ] as Column<ExpectedActualRow>[]
          }
          data={expectedActual}
          rowKey={(r) => r.caseId + r.expected}
          emptyMessage="No recovery outcomes recorded yet."
        />
      </SectionCard>
    </div>
  );
}
