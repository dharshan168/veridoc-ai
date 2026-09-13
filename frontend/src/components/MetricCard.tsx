import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  accentColor?: 'cyan' | 'emerald' | 'red' | 'amber' | 'blue';
}

const colorMap = {
  cyan:    { icon: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  red:     { icon: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  amber:   { icon: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  blue:    { icon: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
};

const MetricCard: React.FC<MetricCardProps> = ({
  label, value, sub, icon: Icon, trend, accentColor = 'cyan',
}) => {
  const colors = colorMap[accentColor];

  return (
    <div className={`metric-card group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg border ${colors.bg} ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1 font-mono">{value}</div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
    </div>
  );
};

export default MetricCard;
