// DiagnosisPanel — AI-style failure diagnosis.
import type { RecoveryCase, Customer } from '@/types';
import { Stethoscope, AlertCircle } from 'lucide-react';

interface Props {
  caseData: RecoveryCase;
  customer: Customer;
}

export function DiagnosisPanel({ caseData, customer }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          <Stethoscope className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Failure Diagnosis</h3>
          <p className="text-xs text-gray-500">AI-powered root cause analysis</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Why revenue is at risk</p>
          <p className="text-sm text-gray-700 leading-relaxed">{caseData.failureDescription}</p>
        </div>

        <div className="p-3 rounded-lg bg-primary-50/50 border border-primary-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary-700 mb-1">AI Diagnosis</p>
              <p className="text-xs text-gray-700 leading-relaxed">{caseData.diagnosis}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Supporting Customer Behavior</p>
          <p className="text-sm text-gray-700 leading-relaxed">{caseData.supportingBehavior}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Tag label={`Failure: ${caseData.failureReason.replace(/_/g, ' ')}`} />
          <Tag label={`${customer.successfulPayments} successful payments`} />
          <Tag label={`${customer.previousFailures} previous failures`} />
          <Tag label={`Prefers ${customer.preferredChannel}`} />
        </div>
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600 font-medium">
      {label}
    </span>
  );
}
