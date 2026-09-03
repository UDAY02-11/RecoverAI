// Audit Trail — every decision, action, and outcome logged.
import { useState, useMemo } from 'react';
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { AgentEventBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/States';
import { formatTime, formatDateTime } from '@/lib/format';
import type { AgentEvent, Customer, RecoveryCase } from '@/types';
import { Search, Download, ScrollText } from 'lucide-react';

export function AuditTrail() {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [caseFilter, setCaseFilter] = useState('ALL');

  const caseIds = useMemo(() => {
    const ids = new Set(state.agentEvents.map((e) => e.caseId));
    return ['ALL', ...Array.from(ids)];
  }, [state.agentEvents]);

  const filtered = useMemo(() => {
    let result = state.agentEvents;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.caseId.toLowerCase().includes(q)
      );
    }
    if (caseFilter !== 'ALL') result = result.filter((e) => e.caseId === caseFilter);
    return result;
  }, [state.agentEvents, search, caseFilter]);

  const columns: Column<AgentEvent>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (e) => (
        <div>
          <span className="text-sm font-medium text-gray-700 tabular-nums">{formatTime(e.timestamp)}</span>
          <p className="text-xs text-gray-400">{formatDateTime(e.timestamp)}</p>
        </div>
      ),
      width: '140px',
    },
    {
      key: 'caseId',
      header: 'Case ID',
      render: (e) => {
        const c = state.recoveryCases.find((x: RecoveryCase) => x.id === e.caseId);
        const cust = c ? state.customers.find((x: Customer) => x.id === c.customerId) : undefined;
        return (
          <div>
            <span className="font-mono text-xs font-medium text-primary-700">{e.caseId}</span>
            <p className="text-xs text-gray-500">{cust?.name ?? e.customerId}</p>
          </div>
        );
      },
    },
    {
      key: 'step',
      header: 'Step',
      align: 'center',
      render: (e) => <span className="font-mono text-xs text-gray-500">{e.step}</span>,
      width: '60px',
    },
    {
      key: 'event',
      header: 'Event',
      render: (e) => <span className="text-sm font-medium text-gray-900">{e.title}</span>,
    },
    {
      key: 'description',
      header: 'Description / Reason',
      render: (e) => <span className="text-xs text-gray-600">{e.description}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (e) => <AgentEventBadge status={e.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Every decision, action, and outcome logged"
        actions={
          <button className="btn-secondary text-xs">
            <Download className="w-4 h-4" /> Export
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, descriptions, or case IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select value={caseFilter} onChange={(e) => setCaseFilter(e.target.value)} className="input lg:w-48">
            {caseIds.map((id) => (
              <option key={id} value={id}>{id === 'ALL' ? 'All Cases' : id}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 flex items-center gap-1.5 px-2">
            <ScrollText className="w-3.5 h-3.5" />
            {filtered.length} events
          </span>
        </div>
      </div>

      {/* Table */}
      <SectionCard noPadding>
        {filtered.length === 0 ? (
          <EmptyState
            title="No audit events yet"
            description="Run a recovery agent on a case to generate audit trail entries."
            icon={<ScrollText className="w-6 h-6" />}
          />
        ) : (
          <DataTable columns={columns} data={filtered} rowKey={(e) => e.id} />
        )}
      </SectionCard>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{state.agentEvents.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Cases Audited</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{new Set(state.agentEvents.map((e) => e.caseId)).size}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Completed Steps</p>
          <p className="text-2xl font-bold text-success-700 mt-1">{state.agentEvents.filter((e) => e.status === 'COMPLETED').length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Failed/Stopped</p>
          <p className="text-2xl font-bold text-error-700 mt-1">{state.agentEvents.filter((e) => e.status === 'FAILED' || e.status === 'STOPPED').length}</p>
        </div>
      </div>
    </div>
  );
}
