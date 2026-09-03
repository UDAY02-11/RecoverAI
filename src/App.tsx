import { useState } from 'react';
import { AppProvider, useApp } from '@/state/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { CommandCenter } from '@/pages/CommandCenter';
import { RecoveryQueue } from '@/pages/RecoveryQueue';
import { CaseDetails } from '@/pages/CaseDetails';
import { AgentActivity } from '@/pages/AgentActivity';
import { Analytics } from '@/pages/Analytics';
import { AuditTrail } from '@/pages/AuditTrail';
import { SystemArchitecture } from '@/pages/SystemArchitecture';

export type PageKey = 'command' | 'queue' | 'case' | 'agent' | 'analytics' | 'audit' | 'architecture';

function AppContent() {
  const { state, dispatch } = useApp();
  const [page, setPage] = useState<PageKey>('command');

  const handleNavigate = (key: PageKey) => {
    if (key === 'case') return; // case is only navigated to via selection
    setPage(key);
  };

  const handleSelectCase = (caseId: string) => {
    dispatch({ type: 'SELECT_CASE', caseId });
    setPage('case');
  };

  const handleBack = () => {
    setPage('queue');
  };

  const activeCases = state.dashboardMetrics.activeCases;

  return (
    <AppShell current={page} onNavigate={handleNavigate} activeCases={activeCases}>
      {page === 'command' && <CommandCenter onNavigate={handleNavigate} onSelectCase={handleSelectCase} />}
      {page === 'queue' && <RecoveryQueue onSelectCase={handleSelectCase} />}
      {page === 'case' && <CaseDetails onBack={handleBack} />}
      {page === 'agent' && <AgentActivity />}
      {page === 'analytics' && <Analytics />}
      {page === 'audit' && <AuditTrail />}
      {page === 'architecture' && <SystemArchitecture />}
    </AppShell>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
