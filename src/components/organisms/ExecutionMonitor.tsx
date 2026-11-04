import React from 'react';

export interface MonitorItem {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
}

export interface ExecutionMonitorProps {
  statusText: string;
  statusVariant?: 'idle' | 'running' | 'success' | 'danger';
  items: MonitorItem[];
  commentaryHtml: string;
}

const statusStyles = {
  idle: 'bg-slate-800 text-slate-300',
  running: 'bg-indigo-600 text-white',
  success: 'bg-emerald-500 text-white animate-bounce-short',
  danger: 'bg-red-500 text-white',
};

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({
  statusText,
  statusVariant = 'idle',
  items,
  commentaryHtml,
}) => {
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative border border-slate-800 overflow-hidden">
      {/* 上部ヘッダー */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Execution Monitor
          </span>
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded ${statusStyles[statusVariant]}`}>
          {statusText}
        </div>
      </div>

      {/* グリッド項目 */}
      <div
        className={`grid grid-cols-1 gap-4 mb-3 ${
          items.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
        }`}
      >
        {items.map((item, idx) => (
          <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-semibold mb-1">{item.label}</div>
            <div className="text-lg sm:text-xl font-bold font-mono flex items-center justify-between">
              {item.value}
              {item.subValue && (
                <span className="text-xs font-normal text-slate-400">{item.subValue}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ステップ解説 */}
      <div
        className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200 font-sans"
        dangerouslySetInnerHTML={{ __html: commentaryHtml }}
      />
    </div>
  );
};
