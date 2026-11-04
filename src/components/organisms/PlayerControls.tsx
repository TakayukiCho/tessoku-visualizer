import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';

export interface PlayerControlsProps {
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

const SPEED_OPTIONS = [
  { value: 1500, label: 'ゆっくり (1.5s)' },
  { value: 800, label: '標準 (0.8s)' },
  { value: 350, label: '高速 (0.35s)' },
];

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
        <Button
          onClick={onStepPrev}
          disabled={currentStep === 0}
          variant="secondary"
          size="md"
          icon={<SkipBack className="w-3.5 h-3.5" />}
        >
          1手戻る
        </Button>

        <Button
          onClick={onTogglePlay}
          variant={isPlaying ? 'warning' : 'primary'}
          size="md"
          icon={
            isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )
          }
        >
          {isPlaying ? '停止' : '自動再生'}
        </Button>

        <Button
          onClick={onStepNext}
          disabled={currentStep >= totalSteps}
          variant="secondary"
          size="md"
        >
          <span>1手進む</span>
          <SkipForward className="w-3.5 h-3.5 ml-1" />
        </Button>

        <Button
          onClick={onReset}
          variant="outline"
          size="md"
          icon={<RotateCcw className="w-3 h-3 text-slate-500" />}
        >
          リセット
        </Button>
      </div>

      {/* スピード & ステップカウンター */}
      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-semibold text-slate-600 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span>速度:</span>
          <Select
            options={SPEED_OPTIONS}
            value={speed}
            onChange={e => onChangeSpeed(Number(e.target.value))}
          />
        </div>

        <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono flex items-center gap-2 border border-slate-200">
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
