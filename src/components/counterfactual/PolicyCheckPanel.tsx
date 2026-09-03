// PolicyCheckPanel — displays policy guardrail checks before execution.
import type { PolicyCheck } from '@/types';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';

interface Props {
  checks: PolicyCheck[];
}

export function PolicyCheckPanel({ checks }: Props) {
  const allPass = checks.every((c) => c.status === 'PASS');
  const anyReject = checks.some((c) => c.status === 'REJECT');

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${allPass ? 'bg-success-50 text-success-600' : anyReject ? 'bg-error-50 text-error-600' : 'bg-warning-50 text-warning-600'}`}>
            <Shield className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Policy Check</h3>
            <p className="text-xs text-gray-500">Guardrails validated before execution</p>
          </div>
        </div>
        <span className={`badge ${allPass ? 'bg-success-50 text-success-700 border-success-200' : anyReject ? 'bg-error-50 text-error-700 border-error-200' : 'bg-warning-50 text-warning-700 border-warning-200'}`}>
          {allPass ? 'All Passed' : anyReject ? 'Rejected' : 'Warning'}
        </span>
      </div>

      <div className="space-y-2">
        {checks.map((check) => {
          const Icon = check.status === 'PASS' ? Check : check.status === 'REJECT' ? X : AlertTriangle;
          const tone = check.status === 'PASS' ? 'text-success-600 bg-success-50' : check.status === 'REJECT' ? 'text-error-600 bg-error-50' : 'text-warning-600 bg-warning-50';
          return (
            <div key={check.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${tone}`}>
                <Icon className="w-3.5 h-3.5" style={{ width: 14, height: 14 }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{check.rule}</p>
                <p className="text-xs text-gray-500">{check.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
