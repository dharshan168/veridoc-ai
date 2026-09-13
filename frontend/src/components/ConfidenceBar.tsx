import React from 'react';

interface ConfidenceBarProps {
  value: number;     // 0–100
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  colorByValue?: boolean;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  value, label, showValue = true, size = 'md', colorByValue = true,
}) => {
  const color = colorByValue
    ? value >= 80 ? 'bg-emerald-400'
    : value >= 50 ? 'bg-amber-400'
    : 'bg-red-400'
    : 'bg-cyan-400';

  const height = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className="space-y-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono font-medium text-white ml-auto">{value.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={`progress-bar ${height}`}>
        <div
          className={`progress-fill ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
