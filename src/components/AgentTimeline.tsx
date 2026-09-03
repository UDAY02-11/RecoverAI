// AgentTimeline — operational timeline of agent events.
import type { AgentEvent } from '@/types';
import { AgentEventBadge } from '@/components/ui/StatusBadge';
import { formatTime } from '@/lib/format';
import { Check, X, Loader2, Circle } from 'lucide-react';

interface Props {
  events: AgentEvent[];
}

export function AgentTimeline({ events }: Props) {
  const sorted = [...events].sort((a, b) => a.step - b.step);
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-1">
        {sorted.map((event, idx) => {
          const Icon =
            event.status === 'COMPLETED' ? Check :
            event.status === 'FAILED' ? X :
            event.status === 'RUNNING' ? Loader2 :
            event.status === 'STOPPED' ? X :
            Circle;
          const tone =
            event.status === 'COMPLETED' ? 'bg-success-500 text-white' :
            event.status === 'FAILED' ? 'bg-error-500 text-white' :
            event.status === 'RUNNING' ? 'bg-primary-500 text-white animate-spin' :
            event.status === 'STOPPED' ? 'bg-purple-500 text-white' :
            'bg-gray-300 text-white';

          return (
            <div key={event.id} className="relative flex items-start gap-3 pl-0 py-1.5 animate-slide-in" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tone} ring-4 ring-white`}>
                <Icon className="w-3.5 h-3.5" style={{ width: 14, height: 14 }} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <span className="text-xs text-gray-400 tabular-nums shrink-0">{formatTime(event.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                <div className="mt-1">
                  <AgentEventBadge status={event.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
