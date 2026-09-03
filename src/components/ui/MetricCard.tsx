// MetricCard — KPI display card with label, value, optional icon and trend.
import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  sublabel?: string;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  className?: string;
}

const TONE_VALUE: Record<string, string> = {
  default: 'text-gray-900',
  success: 'text-success-700',
  warning: 'text-warning-700',
  error: 'text-error-700',
  primary: 'text-primary-700',
};

const TONE_ICON: Record<string, string> = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  primary: 'bg-primary-50 text-primary-600',
};

export function MetricCard({ label, value, icon, sublabel, tone = 'default', className = '' }: MetricCardProps) {
  return (
    <div className={`card card-hover p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className={`mt-2 font-serif text-2xl font-bold tabular-nums ${TONE_VALUE[tone]}`}>{value}</p>
          {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
        </div>
        {icon && (
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${TONE_ICON[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
