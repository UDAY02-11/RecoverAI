// LoadingState, EmptyState, ErrorState — shared state components.
import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 animate-fade-in">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'No data available',
  description,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-error-50 flex items-center justify-center text-error-500">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 text-xs text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
