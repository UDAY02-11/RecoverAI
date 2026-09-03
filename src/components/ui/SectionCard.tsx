// SectionCard — titled container card for grouping content.
import type { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            {title && <h3 className="font-serif text-base font-bold text-gray-900 tracking-tight">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : `p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
