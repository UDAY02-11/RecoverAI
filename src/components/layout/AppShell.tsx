// AppShell — layout wrapper: sidebar + top header + main content area.
import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import type { PageKey } from '@/App';

interface AppShellProps {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  activeCases: number;
  children: ReactNode;
}

export function AppShell({ current, onNavigate, activeCases, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`h-screen shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform`}>
        <Sidebar
          current={current}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader current={current} onToggleSidebar={toggle} activeCases={activeCases} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
