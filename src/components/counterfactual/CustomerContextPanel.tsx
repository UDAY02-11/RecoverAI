// CustomerContextPanel — shows customer segment, LTV, history, channel, etc.
import type { Customer } from '@/types';
import { formatINR } from '@/lib/format';
import { User, Mail, Phone, Building2, Wallet, Clock, MessageSquare, Activity } from 'lucide-react';

interface Props {
  customer: Customer;
}

export function CustomerContextPanel({ customer }: Props) {
  const items = [
    { icon: Building2, label: 'Customer Segment', value: customer.segment },
    { icon: Wallet, label: 'Lifetime Value', value: formatINR(customer.lifetimeValue) },
    { icon: Activity, label: 'Successful Payments', value: String(customer.successfulPayments) },
    { icon: AlertCircle, label: 'Previous Failures', value: String(customer.previousFailures) },
    { icon: Wallet, label: 'Average Payment', value: formatINR(customer.averagePayment) },
    { icon: Clock, label: 'Previous Recovery Attempts', value: String(customer.previousRecoveryAttempts) },
    { icon: MessageSquare, label: 'Preferred Channel', value: customer.preferredChannel },
    { icon: User, label: 'Customer ID', value: customer.id },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
          {customer.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 truncate">{customer.name}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" style={{ width: 14, height: 14 }} />
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-sm font-semibold text-gray-800">{item.value}</p>
            </div>
          );
        })}
      </div>

      {(customer.optedOut || customer.flaggedSuspicious) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {customer.optedOut && (
            <span className="badge bg-error-50 text-error-700 border-error-200">Opted Out</span>
          )}
          {customer.flaggedSuspicious && (
            <span className="badge bg-warning-50 text-warning-700 border-warning-200">Flagged Suspicious</span>
          )}
        </div>
      )}
    </div>
  );
}

import { AlertCircle } from 'lucide-react';
