// StatusBadge — renders colored status badges for case status, risk, policy, etc.
import type { ReactNode } from 'react';

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal';

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-primary-50 text-primary-700 border-primary-200',
  green: 'bg-success-50 text-success-700 border-success-200',
  amber: 'bg-warning-50 text-warning-700 border-warning-200',
  red: 'bg-error-50 text-error-700 border-error-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  teal: 'bg-accent-50 text-accent-700 border-accent-200',
};

interface StatusBadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ tone = 'gray', children, dot = false, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge ${TONE_CLASSES[tone]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-70`} />}
      {children}
    </span>
  );
}

// Convenience mappers
export function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    READY: { tone: 'gray', label: 'Ready' },
    ANALYZING: { tone: 'blue', label: 'Analyzing' },
    RECOVERING: { tone: 'blue', label: 'Recovering' },
    RECOVERED: { tone: 'green', label: 'Recovered' },
    ESCALATED: { tone: 'amber', label: 'Escalated' },
    STOPPED: { tone: 'purple', label: 'Stopped' },
    FAILED: { tone: 'red', label: 'Failed' },
  };
  const cfg = map[status] ?? { tone: 'gray' as Tone, label: status };
  return <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>;
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    LOW: { tone: 'green', label: 'Low' },
    MEDIUM: { tone: 'amber', label: 'Medium' },
    HIGH: { tone: 'red', label: 'High' },
    CRITICAL: { tone: 'red', label: 'Critical' },
  };
  const cfg = map[level] ?? { tone: 'gray' as Tone, label: level };
  return <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>;
}

export function PolicyBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    PASS: { tone: 'green', label: 'Pass' },
    REJECT: { tone: 'red', label: 'Reject' },
    WARNING: { tone: 'amber', label: 'Warning' },
  };
  const cfg = map[status] ?? { tone: 'gray' as Tone, label: status };
  return <StatusBadge tone={cfg.tone}>{cfg.label}</StatusBadge>;
}

export function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    SUCCESS: { tone: 'green', label: 'Success' },
    FAILURE: { tone: 'red', label: 'Failure' },
    PARTIAL: { tone: 'amber', label: 'Partial' },
    PENDING: { tone: 'gray', label: 'Pending' },
    ESCALATED: { tone: 'amber', label: 'Escalated' },
  };
  const cfg = map[outcome] ?? { tone: 'gray' as Tone, label: outcome };
  return <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>;
}

export function AgentEventBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    PENDING: { tone: 'gray', label: 'Pending' },
    RUNNING: { tone: 'blue', label: 'Running' },
    COMPLETED: { tone: 'green', label: 'Completed' },
    FAILED: { tone: 'red', label: 'Failed' },
    STOPPED: { tone: 'purple', label: 'Stopped' },
  };
  const cfg = map[status] ?? { tone: 'gray' as Tone, label: status };
  return <StatusBadge tone={cfg.tone} dot>{cfg.label}</StatusBadge>;
}
