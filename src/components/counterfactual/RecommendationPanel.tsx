// RecommendationPanel — shows the selected/recommended action with reasoning.
import type { RecoveryAction } from '@/types';
import { formatINR, formatPercent } from '@/lib/format';
import { TrendingUp, Lightbulb } from 'lucide-react';

interface Props {
  action: RecoveryAction;
  reason: string;
  amountAtRisk: number;
  customerName: string;
}

export function RecommendationPanel({ action, reason, amountAtRisk, customerName }: Props) {
  return (
    <div className="card p-5 ring-2 ring-accent-400 bg-gradient-to-br from-accent-50/50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent-500 text-white flex items-center justify-center">
          <TrendingUp className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recommended Action</h3>
          <p className="text-xs text-gray-500">Highest safe expected net recovery</p>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div>
          <p className="text-2xl font-bold text-accent-700">{action.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">For {customerName} · {formatINR(amountAtRisk)} at risk</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatINR(action.expectedNetRecovery)}</p>
          <p className="text-xs text-gray-500">Expected Net Recovery</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Recovery Probability" value={formatPercent(action.recoveryProbability, 0)} tone="primary" />
        <Stat label="Expected Gross" value={formatINR(action.expectedGrossRecovery)} tone="default" />
        <Stat label="Total Cost" value={formatINR(action.interventionCost + action.incentiveCost)} tone="warning" />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-accent-200">
        <Lightbulb className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1">Why this action?</p>
          <p className="text-xs text-gray-600 leading-relaxed">{reason}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'default' | 'warning' }) {
  const toneClass = tone === 'primary' ? 'text-primary-700' : tone === 'warning' ? 'text-warning-700' : 'text-gray-900';
  return (
    <div className="p-2.5 rounded-lg bg-white border border-gray-100">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
