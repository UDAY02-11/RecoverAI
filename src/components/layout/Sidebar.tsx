// Sidebar — primary navigation.
import { LayoutDashboard, ListTodo, Bot, BarChart3, ScrollText, Network, ShieldCheck, Settings, Sparkles } from 'lucide-react';
import type { PageKey } from '@/App';

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'command', label: 'Command Center', icon: LayoutDashboard },
  { key: 'queue', label: 'Recovery Queue', icon: ListTodo },
  { key: 'agent', label: 'Agent Activity', icon: Bot },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'audit', label: 'Audit Trail', icon: ScrollText },
  { key: 'architecture', label: 'System Architecture', icon: Network },
];

interface SidebarProps {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  collapsed: boolean;
  onClose?: () => void;
}

export function Sidebar({ current, onNavigate, collapsed, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 flex h-screen min-h-screen flex-col bg-[#111827] text-gray-300 shadow-[12px_0_32px_-24px_rgba(15,23,42,0.7)] transition-all duration-300 ${
        collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-60'
      }`}
    >
      {/* Logo */}
      <div className="relative flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f1d89c]/60 bg-gradient-to-br from-[#f6dfaa] via-[#d4a94f] to-[#9b6d20] shadow-[0_8px_18px_-8px_rgba(240,191,90,0.8)]">
          <ShieldCheck className="h-5 w-5 text-[#152033]" strokeWidth={2.4} />
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-[#f7e7bd]" fill="currentColor" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-serif text-[17px] font-bold tracking-[-0.02em] text-white">RecoverAI</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-px w-5 bg-[#d7b765]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#d7b765]">Revenue Recovery</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-5">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>}
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key);
                onClose?.();
              }}
              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-white/10 to-transparent text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'lg:justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-[#d7b765]" />}
              <Icon className={`shrink-0 transition-colors ${active ? 'text-[#d7b765]' : 'group-hover:text-slate-200'}`} style={{ width: 18, height: 18 }} />
              {!collapsed && <span className="truncate font-medium tracking-tight">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-white/10 px-2.5 py-3.5">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${collapsed ? 'lg:justify-center' : ''}`}>
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-success-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-success-400 animate-ping opacity-60" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-success-300">Demo Mode</p>
              <p className="text-[10px] text-slate-500">System Online</p>
            </div>
          )}
        </div>
        <button
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${collapsed ? 'lg:justify-center' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="shrink-0 group-hover:text-slate-200" style={{ width: 18, height: 18 }} />
          {!collapsed && <span className="font-medium tracking-tight">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
