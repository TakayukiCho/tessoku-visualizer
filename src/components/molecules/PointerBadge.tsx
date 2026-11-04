import React from 'react';

export interface PointerBadgeProps {
  L: number;
  mid: number;
  R: number;
}

export const PointerBadge: React.FC<PointerBadgeProps> = ({ L, mid, R }) => {
  if (L < 0 || R < 0) {
    return <span className="text-slate-400 font-mono text-sm">L: - | M: - | R: -</span>;
  }

  return (
    <div className="flex items-center gap-2 font-mono text-sm font-bold">
      <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
        L: {L}
      </span>
      <span className="text-slate-500">|</span>
      <span className="text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800">
        M: {mid >= 0 ? mid : '-'}
      </span>
      <span className="text-slate-500">|</span>
      <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
        R: {R}
      </span>
    </div>
  );
};
