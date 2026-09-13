import React from 'react';
import { CheckCircle, Circle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import type { PipelineStageStatus } from '../types';

interface PipelineStageCardProps {
  id: string;
  name: string;
  status: PipelineStageStatus;
  durationMs?: number;
  index: number;
}

const statusConfig = {
  pending: {
    icon: Circle,
    cls: 'text-slate-600',
    bg: 'bg-slate-800/60 border-white/5',
    label: 'Pending',
    labelCls: 'text-slate-500',
  },
  processing: {
    icon: Loader2,
    cls: 'text-cyan-400 animate-spin',
    bg: 'bg-cyan-500/5 border-cyan-500/20',
    label: 'Processing…',
    labelCls: 'text-cyan-400',
  },
  completed: {
    icon: CheckCircle,
    cls: 'text-emerald-400',
    bg: 'bg-emerald-500/5 border-emerald-500/20',
    label: 'Completed',
    labelCls: 'text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    cls: 'text-amber-400',
    bg: 'bg-amber-500/5 border-amber-500/20',
    label: 'Warning',
    labelCls: 'text-amber-400',
  },
  failed: {
    icon: XCircle,
    cls: 'text-red-400',
    bg: 'bg-red-500/5 border-red-500/20',
    label: 'Failed',
    labelCls: 'text-red-400',
  },
};

export const PipelineStageCard: React.FC<PipelineStageCardProps> = ({
  name, status, durationMs, index,
}) => {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-300 ${cfg.bg}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Step number */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 bg-white/5 flex-shrink-0">
        {index + 1}
      </div>

      {/* Icon */}
      <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.cls}`} />

      {/* Name */}
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{name}</div>
        <div className={`text-xs ${cfg.labelCls}`}>{cfg.label}</div>
      </div>

      {/* Duration */}
      {durationMs !== undefined && status === 'completed' && (
        <div className="text-xs text-slate-500 font-mono">
          {(durationMs / 1000).toFixed(2)}s
        </div>
      )}

      {/* Processing indicator */}
      {status === 'processing' && (
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1 h-3 rounded-full bg-cyan-400"
              style={{ animation: `pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Full Pipeline View ───────────────────────────────────────────────────────

interface PipelineViewProps {
  stages: Array<{ id: string; name: string; status: PipelineStageStatus; durationMs?: number }>;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ stages }) => {
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <React.Fragment key={stage.id}>
          <PipelineStageCard {...stage} index={i} />
          {i < stages.length - 1 && (
            <div className="flex justify-center">
              <div
                className={`w-0.5 h-4 rounded transition-colors duration-500 ${
                  stage.status === 'completed' ? 'bg-emerald-500/50' :
                  stage.status === 'warning' ? 'bg-amber-500/50' :
                  stage.status === 'processing' ? 'bg-cyan-500/50' : 'bg-white/5'
                }`}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
