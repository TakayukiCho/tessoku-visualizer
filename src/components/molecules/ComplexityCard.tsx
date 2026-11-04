import React from 'react';

export interface ComplexityCardProps {
  title: string;
  order: string;
  description: string;
  opsLabel: string;
  opsSubLabel?: string;
  timeLabel: string;
  statusBadge: {
    icon: string;
    text: string;
    isPass: boolean;
  };
  variant: 'danger' | 'success';
}

export const ComplexityCard: React.FC<ComplexityCardProps> = ({
  title,
  order,
  description,
  opsLabel,
  opsSubLabel,
  timeLabel,
  statusBadge,
  variant,
}) => {
  const isDanger = variant === 'danger';

  return (
    <div
      className={`border-2 rounded-2xl p-5 flex flex-col justify-between ${
        isDanger ? 'border-red-200 bg-red-50/40' : 'border-emerald-300 bg-emerald-50/40'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-white text-xs font-bold px-2.5 py-1 rounded-md ${
              isDanger ? 'bg-red-500' : 'bg-emerald-600'
            }`}
          >
            {title}
          </span>
          <span
            className={`text-xs font-mono font-bold ${
              isDanger ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {order}
          </span>
        </div>

        <div className="text-xs text-slate-600 mb-4">{description}</div>

        <div className="space-y-3 font-mono">
          <div>
            <div className="text-[11px] text-slate-500">計算回数 / メモリ:</div>
            <div
              className={`text-2xl font-black ${
                isDanger ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {opsLabel}
            </div>
            {opsSubLabel && (
              <div
                className={`text-xs font-sans font-bold ${
                  isDanger ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {opsSubLabel}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] text-slate-500">推定実行時間 / 判定:</div>
            <div className="text-lg font-bold text-slate-800">{timeLabel}</div>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 pt-3 border-t flex items-center gap-2 text-xs font-bold ${
          isDanger ? 'border-red-200/60 text-red-700' : 'border-emerald-200/60 text-emerald-700'
        }`}
      >
        <span>{statusBadge.icon}</span>
        <span>{statusBadge.text}</span>
      </div>
    </div>
  );
};
