import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react';
import type { RiskLevel, ValidationStatus } from '../types';

// ─── Risk Level Badge ─────────────────────────────────────────────────────────

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const config = {
    LOW: {
      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      dot: 'bg-emerald-400',
    },
    MEDIUM: {
      cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      dot: 'bg-amber-400',
    },
    HIGH: {
      cls: 'bg-red-500/10 text-red-400 border-red-500/25',
      dot: 'bg-red-400',
    },
  }[level];

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider ${config.cls} ${sizes}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dot}`} />
      {level} RISK
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
};

// ─── Validation Status Badge ──────────────────────────────────────────────────

interface ValidationBadgeProps {
  status: ValidationStatus;
  showLabel?: boolean;
}

export const ValidationBadge: React.FC<ValidationBadgeProps> = ({ status, showLabel = true }) => {
  const config = {
    passed: { icon: CheckCircle, cls: 'text-emerald-400', label: 'Passed' },
    warning: { icon: AlertTriangle, cls: 'text-amber-400', label: 'Warning' },
    failed: { icon: XCircle, cls: 'text-red-400', label: 'Failed' },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${config.cls}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {showLabel && config.label}
    </span>
  );
};

// ─── Tampering Status Badge ───────────────────────────────────────────────────

interface TamperingBadgeProps {
  status: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const TamperingBadge: React.FC<TamperingBadgeProps> = ({ status }) => {
  const config = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    HIGH: 'bg-red-500/10 text-red-400 border-red-500/25',
  }[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config}`}>
      {status}
    </span>
  );
};

// ─── Document Type Badge ──────────────────────────────────────────────────────

interface DocTypeBadgeProps {
  type: string;
}

export const DocTypeBadge: React.FC<DocTypeBadgeProps> = ({ type }) => {
  const labels: Record<string, string> = {
    passport: 'Passport',
    visa: 'Visa',
    national_id: 'National ID',
    driving_licence: 'Driving Licence',
    permit: 'Permit',
  };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium">
      {labels[type] ?? type}
    </span>
  );
};
