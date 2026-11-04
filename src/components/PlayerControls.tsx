import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface PlayerControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onStepNext: () => void;
  onStepPrev: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onSeek?: (step: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onStepNext,
  onStepPrev,
  onTogglePlay,
  onReset,
  onChangeSpeed,
  onSeek,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 再生ボタングループ */}
      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
        <button
          onClick={onStepPrev}
          disabled={currentStep === 0}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span>1手戻る</span>
        </button>

        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>停止</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>自動再生</span>
            </>
          )}
        </button>

        <button
          onClick={onStepNext}
          disabled={currentStep >= totalSteps}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>1手進む</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          className="px-3 py-2 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>リセット</span>
        </button>
      </div>

      {/* スピード & ステップカウンター */}
      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-semibold text-slate-600 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span>速度:</span>
          <select
            value={speed}
            onChange={e => onChangeSpeed(Number(e.target.value))}
            className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value={1500}>ゆっくり (1.5s)</option>
            <option value={800}>標準 (0.8s)</option>
            <option value={350}>高速 (0.35s)</option>
          </select>
        </div>

        <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono flex items-center gap-2">
          {onSeek ? (
            <input
              type="range"
              min={0}
              max={Math.max(1, totalSteps)}
              value={currentStep}
              onChange={e => onSeek(Number(e.target.value))}
              className="w-20 sm:w-28 h-1.5 bg-slate-300 rounded appearance-none cursor-pointer accent-indigo-600"
            />
          ) : null}
          <span>
            Step: <strong className="text-indigo-600 font-bold">{currentStep}</strong> / {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
};
