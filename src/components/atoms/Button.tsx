import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-transparent',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border-transparent',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg font-semibold gap-1.5',
  md: 'text-xs px-3.5 py-2 rounded-xl font-bold gap-1.5',
  lg: 'text-sm px-4 py-2.5 rounded-xl font-bold gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center border transition-all active:scale-[0.98] ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${
        disabled ? 'opacity-40 cursor-not-allowed active:scale-100' : ''
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
