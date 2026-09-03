// RecoveryQueueTable — the operations queue table.
import type { RecoveryCase, Customer } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { CaseStatusBadge, RiskBadge } from '@/components/ui/StatusBadge';
import { formatINR, formatPercent, timeAgo } from '@/lib/format';
import { failReasonText } from '@/lib/data';

const ACTION_LABELS: Record<string, string> = {
  IMMEDIATE_RETRY: 'Immediate Retry',
  DELAYED_RETRY: 'Delayed Retry',
  PAYMENT_LINK: 'Payment Link',
  REMINDER: 'Reminder',
  SMALL_INCENTIVE: 'Small Incentive',
  HUMAN_ESCALATION: 'Human Escalation',
  NO_ACTION: 'No Action',
};

interface Props {
  cases: RecoveryCase[];
  customers: Customer[];
  onRowClick: (c: RecoveryCase) => void;
}

export function RecoveryQueueTable({ cases, customers, onRowClick }: Props) {
  const columns: Column<RecoveryCase>[] = [
    {
      key: 'id',
      header: 'Case ID',
      render: (c) => <span className="font-mono text-xs font-medium text-primary-700">{c.id}</span>,
      sortable: true,
      sortValue: (c) => c.id,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (c) => {
        const cust = customers.find((x) => x.id === c.customerId);
        return (
          <div>
            <p className="font-medium text-gray-900">{cust?.name ?? c.customerId}</p>
            <p className="text-xs text-gray-500">{cust?.segment}</p>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <span className="text-xs text-gray-600">{c.type.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'amountAtRisk',
      header: 'Revenue At Risk',
      align: 'right',
      render: (c) => <span className="font-semibold tabular-nums text-gray-900">{formatINR(c.amountAtRisk)}</span>,
      sortable: true,
      sortValue: (c) => c.amountAtRisk,
    },
    {
      key: 'riskScore',
      header: 'Risk',
      align: 'center',
      render: (c) => (
        <div className="flex flex-col items-center gap-1">
          <RiskBadge level={c.riskLevel} />
          <span className="text-xs text-gray-400 tabular-nums">{c.riskScore}</span>
        </div>
      ),
      sortable: true,
      sortValue: (c) => c.riskScore,
    },
    {
      key: 'recoveryProbability',
      header: 'Recovery Prob.',
      align: 'center',
      render: (c) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${c.recoveryProbability * 100}%` }} />
          </div>
          <span className="text-xs tabular-nums text-gray-600">{formatPercent(c.recoveryProbability, 0)}</span>
        </div>
      ),
      sortable: true,
      sortValue: (c) => c.recoveryProbability,
    },
    {
      key: 'expectedRecovery',
      header: 'Expected Recovery',
      align: 'right',
      render: (c) => <span className="font-semibold tabular-nums text-accent-700">{formatINR(c.expectedRecovery)}</span>,
      sortable: true,
      sortValue: (c) => c.expectedRecovery,
    },
    {
      key: 'recommendedAction',
      header: 'Recommended Action',
      render: (c) => <span className="text-xs text-gray-700">{ACTION_LABELS[c.recommendedAction] ?? c.recommendedAction}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (c) => <CaseStatusBadge status={c.status} />,
      sortable: true,
      sortValue: (c) => c.status,
    },
    {
      key: 'updatedAt',
      header: 'Last Activity',
      render: (c) => <span className="text-xs text-gray-500">{timeAgo(c.updatedAt)}</span>,
      sortable: true,
      sortValue: (c) => c.updatedAt,
    },
  ];

  return <DataTable columns={columns} data={cases} onRowClick={onRowClick} rowKey={(c) => c.id} />;
}

export { failReasonText };
