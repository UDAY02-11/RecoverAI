// CounterfactualComparison — bar chart comparing expected net recovery across actions.
import type { RecoveryAction } from '@/types';
import { formatINR } from '@/lib/format';

interface Props {
  actions: RecoveryAction[];
  recommendedAction: string;
}

export function CounterfactualComparison({ actions, recommendedAction }: Props) {
  const max = Math.max(...actions.map((a) => a.expectedNetRecovery), 1);

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const widthPct = (action.expectedNetRecovery / max) * 100;
        const isRecommended = action.type === recommendedAction;
        return (
          <div key={action.type}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-medium ${isRecommended ? 'text-accent-700' : 'text-gray-700'}`}>
                {action.label}
                {isRecommended && <span className="ml-2 text-[10px] text-accent-600 uppercase tracking-wider">Recommended</span>}
              </span>
              <span className="tabular-nums text-gray-600">{formatINR(action.expectedNetRecovery)}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isRecommended ? 'bg-accent-500' : 'bg-primary-300'
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
