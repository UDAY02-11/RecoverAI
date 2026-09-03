// TopHeader — page title, demo badge, system status, notifications, profile.
import { Bell, Menu, Zap } from 'lucide-react';
import type { PageKey } from '@/App';

const PAGE_TITLES: Record<PageKey, { title: string; description: string }> = {
  command: { title: 'Command Center', description: 'Real-time revenue recovery overview' },
  queue: { title: 'Recovery Queue', description: 'Prioritized by expected recoverable revenue' },
  case: { title: 'Case Details', description: 'Counterfactual recovery planner' },
  agent: { title: 'Agent Activity', description: 'Live recovery agent workflow timeline' },
  analytics: { title: 'Analytics', description: 'Recovery performance and expected vs actual' },
  audit: { title: 'Audit Trail', description: 'Every decision, action, and outcome logged' },
  architecture: { title: 'System Architecture', description: 'RecoverAI pipeline and guardrails' },
};

interface TopHeaderProps {
  current: PageKey;
  onToggleSidebar: () => void;
  activeCases: number;
}

export function TopHeader({ current, onToggleSidebar, activeCases }: TopHeaderProps) {
  const info = PAGE_TITLES[current];
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 h-16 flex items-center justify-between gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-bold text-gray-900 truncate tracking-tight">{info.title}</h2>
          <p className="text-xs text-gray-500 truncate hidden sm:block">{info.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Demo badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          DEMO / SIMULATION
        </span>

        {/* System status */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-soft" />
          <span className="font-medium">{activeCases} Active</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-500 ring-2 ring-white" />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
            RA
          </div>
          <span className="hidden sm:block text-xs font-medium text-gray-700">Recovery Admin</span>
        </button>
      </div>
    </header>
  );
}
