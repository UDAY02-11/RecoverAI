// Recovery Queue — operations queue with search, filters, and sorting.
import { useState, useMemo } from 'react';
import { useApp } from '@/state/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { RecoveryQueueTable } from '@/components/RecoveryQueueTable';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import type { RecoveryCase } from '@/types';

type StatusFilter = 'ALL' | RecoveryCase['status'];
type RiskFilter = 'ALL' | RecoveryCase['riskLevel'];
type TypeFilter = 'ALL' | RecoveryCase['type'];
type SortKey = 'expectedRecovery' | 'amountAtRisk' | 'recoveryProbability' | 'riskScore' | 'updatedAt';

interface Props {
  onSelectCase: (caseId: string) => void;
}

export function RecoveryQueue({ onSelectCase }: Props) {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('expectedRecovery');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = state.recoveryCases;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const cust = state.customers.find((x) => x.id === c.customerId);
        return (
          c.id.toLowerCase().includes(q) ||
          (cust?.name.toLowerCase().includes(q) ?? false) ||
          c.type.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'ALL') result = result.filter((c) => c.status === statusFilter);
    if (riskFilter !== 'ALL') result = result.filter((c) => c.riskLevel === riskFilter);
    if (typeFilter !== 'ALL') result = result.filter((c) => c.type === typeFilter);

    result = [...result].sort((a, b) => {
      let av: string | number = a[sortKey];
      let bv: string | number = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
      }
      av = av as number;
      bv = bv as number;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

    return result;
  }, [state.recoveryCases, state.customers, search, statusFilter, riskFilter, typeFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const statuses: StatusFilter[] = ['ALL', 'READY', 'ANALYZING', 'RECOVERING', 'RECOVERED', 'ESCALATED', 'STOPPED', 'FAILED'];
  const risks: RiskFilter[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const types: TypeFilter[] = ['ALL', 'PAYMENT_FAILURE', 'CHECKOUT_ABANDONMENT', 'SUBSCRIPTION_FAILURE', 'INVOICE_OVERDUE', 'PROMISE_MISSED'];

  return (
    <div>
      <PageHeader title="Recovery Queue" description="Prioritized by expected recoverable revenue" />

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by case ID, customer, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Status filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="input lg:w-40">
            {statuses.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          {/* Risk filter */}
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskFilter)} className="input lg:w-36">
            {risks.map((r) => (
              <option key={r} value={r}>{r === 'ALL' ? 'All Risk Levels' : r}</option>
            ))}
          </select>

          {/* Type filter */}
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="input lg:w-44">
            {types.map((t) => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Sort by:</span>
          {([
            ['expectedRecovery', 'Expected Recovery'],
            ['amountAtRisk', 'Amount At Risk'],
            ['recoveryProbability', 'Recovery Probability'],
            ['riskScore', 'Risk Score'],
            ['updatedAt', 'Last Activity'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortKey === key ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {label} {sortKey === key && (sortDir === 'desc' ? '↓' : '↑')}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5 inline mr-1" />
            {filtered.length} of {state.recoveryCases.length} cases
          </span>
        </div>
      </div>

      {/* Table */}
      <SectionCard noPadding>
        <RecoveryQueueTable
          cases={filtered}
          customers={state.customers}
          onRowClick={(c) => onSelectCase(c.id)}
        />
      </SectionCard>
    </div>
  );
}
