// ChartCard — wraps a chart with a title and description.
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  height?: number;
}

export function ChartCard({ title, description, children, className = '', height = 280 }: ChartCardProps) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="font-serif text-base font-bold text-gray-900 tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
