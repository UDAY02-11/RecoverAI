// DemoControls — control panel for running the recovery agent and simulating outcomes.
import { useApp } from '@/state/AppContext';
import { Play, CheckCircle, XCircle, AlertTriangle, RotateCcw, Zap } from 'lucide-react';
import type { RecoveryCase } from '@/types';

interface Props {
  caseData: RecoveryCase;
}

export function DemoControls({ caseData }: Props) {
  const { dispatch } = useApp();
  const isRunning = false; // synchronous, no async running state needed
  const isClosed = ['RECOVERED', 'FAILED', 'ESCALATED', 'STOPPED'].includes(caseData.status);
  const canRun = !isClosed && caseData.status !== 'ANALYZING';

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4.5 h-4.5 text-warning-500" style={{ width: 18, height: 18 }} />
        <h3 className="text-sm font-bold text-gray-900">Demo Controls</h3>
        <span className="badge bg-warning-50 text-warning-700 border-warning-200 ml-auto">Simulation</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => dispatch({ type: 'RUN_AGENT', simulate: 'AUTO' })}
          disabled={!canRun || isRunning}
          className="btn-primary col-span-2"
        >
          <Play className="w-4 h-4" />
          Run Recovery Agent
        </button>

        <button
          onClick={() => dispatch({ type: 'SIMULATE_SUCCESS' })}
          disabled={isClosed}
          className="btn-success"
        >
          <CheckCircle className="w-4 h-4" />
          Simulate Success
        </button>

        <button
          onClick={() => dispatch({ type: 'SIMULATE_FAILURE' })}
          disabled={isClosed}
          className="btn-danger"
        >
          <XCircle className="w-4 h-4" />
          Simulate Failure
        </button>

        <button
          onClick={() => dispatch({ type: 'ESCALATE_CASE' })}
          disabled={isClosed}
          className="btn-warning"
        >
          <AlertTriangle className="w-4 h-4" />
          Escalate
        </button>

        <button
          onClick={() => dispatch({ type: 'RESET_DEMO' })}
          className="btn-secondary"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Demo
        </button>
      </div>

      {isClosed && (
        <p className="mt-3 text-xs text-gray-500 text-center">
          Case is closed ({caseData.status}). Reset demo to run again.
        </p>
      )}
    </div>
  );
}
