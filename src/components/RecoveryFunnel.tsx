// RecoveryFunnel — visual funnel of recovery stages.
import type { FunnelRow } from '@/lib/repositories';
import { formatNumber } from '@/lib/format';

interface Props {
  stages: FunnelRow[];
}

export function RecoveryFunnel({ stages }: Props) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const widthPct = (stage.value / max) * 100;
        const tones = [
          'bg-error-400',
          'bg-warning-400',
          'bg-primary-400',
          'bg-accent-400',
          'bg-success-500',
        ];
        return (
          <div key={stage.stage} className="flex items-center gap-3">
            <span className="text-xs text-gray-600 w-36 shrink-0 text-right">{stage.stage}</span>
            <div className="flex-1 h-7 rounded-md bg-gray-50 overflow-hidden relative">
              <div
                className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 ${tones[idx] ?? 'bg-gray-400'}`}
                style={{ width: `${Math.max(widthPct, 8)}%` }}
              >
                <span className="text-xs font-bold text-white tabular-nums">{formatNumber(stage.value)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
