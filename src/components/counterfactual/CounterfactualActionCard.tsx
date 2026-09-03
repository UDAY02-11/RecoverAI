// CounterfactualActionCard — single candidate action card.
// Displays all required fields: probability, expected gross, cost, friction, risk, policy, net.
import type { RecoveryAction } from '@/types';
import { PolicyBadge, RiskBadge } from '@/components/ui/StatusBadge';
import { formatINR, formatPercent } from '@/lib/format';
import { Check, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

interface Props {
  action: RecoveryAction;
  recommended: boolean;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export function CounterfactualActionCard({ action, recommended, selected = false, onSelect, compact = false }: Props) {
  const policyIcon =
    action.policyStatus === 'PASS' ? <Check className="w-3.5 h-3.5" /> :
    action.policyStatus === 'WARNING' ? <AlertTriangle className="w-3.5 h-3.5" /> :
    <XCircle className="w-3.5 h-3.5" />;

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left card p-4 transition-all ${
        recommended
          ? 'ring-2 ring-accent-400 shadow-card-hover'
          : selected
          ? 'ring-2 ring-primary-400'
          : 'hover:shadow-card-hover hover:border-gray-300'
      } ${action.policyStatus === 'REJECT' ? 'opacity-60' : ''}`}
    >
      {recommended && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <TrendingUp className="w-3 h-3" />
            Recommended
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{action.label}</h4>
        <div className="flex items-center gap-1.5">
          <RiskBadge level={action.riskLevel} />
          <PolicyBadge status={action.policyStatus} />
        </div>
      </div>

      {/* Net recovery — the hero number */}
      <div className="flex items-baseline justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expected Net Recovery</p>
          <p className={`text-xl font-bold tabular-nums ${recommended ? 'text-accent-700' : 'text-gray-900'}`}>
            {formatINR(action.expectedNetRecovery)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Recovery Probability</p>
          <p className="text-lg font-semibold tabular-nums text-primary-700">
            {formatPercent(action.recoveryProbability, 0)}
          </p>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Metric label="Expected Gross" value={formatINR(action.expectedGrossRecovery)} />
          <Metric label="Intervention Cost" value={formatINR(action.interventionCost)} />
          <Metric label="Incentive Cost" value={formatINR(action.incentiveCost)} />
          <Metric label="Customer Friction" value={`${Math.round(action.customerFriction * 100)}%`} />
        </div>
      )}

      {action.policyReason && (
        <div className={`mt-3 flex items-start gap-1.5 text-xs ${action.policyStatus === 'PASS' ? 'text-success-700' : action.policyStatus === 'WARNING' ? 'text-warning-700' : 'text-error-700'}`}>
          {policyIcon}
          <span className="leading-tight">{action.policyReason}</span>
        </div>
      )}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-700 tabular-nums">{value}</p>
    </div>
  );
}
