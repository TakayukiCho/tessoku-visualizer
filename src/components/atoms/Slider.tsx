import React from 'react';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  displayValue?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  displayValue,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {(label || displayValue !== undefined) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-bold text-slate-700">{label}</span>}
          {displayValue !== undefined && (
            <span className="font-mono text-xl font-black text-indigo-600">{displayValue}</span>
          )}
        </div>
      )}
      <input
        type="range"
        className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${className}`}
        {...props}
      />
    </div>
  );
};
