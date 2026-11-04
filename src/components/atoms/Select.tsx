import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  options,
  className = '',
  ...props
}) => {
  return (
    <select
      className={`bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none cursor-pointer hover:bg-slate-200/70 transition ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
