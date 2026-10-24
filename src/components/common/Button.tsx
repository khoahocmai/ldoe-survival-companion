import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-md gap-2',
    lg: 'text-base px-5 py-2.5 rounded-lg gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-charcoal-950 font-bold border border-amber-500 shadow-sm shadow-amber-950/40',
    secondary: 'bg-charcoal-800 hover:bg-charcoal-750 active:bg-charcoal-700 text-slate-200 border border-charcoal-700 hover:border-slate-500',
    danger: 'bg-red-900/80 hover:bg-red-800 text-red-200 border border-red-700 active:bg-red-950',
    ghost: 'bg-transparent hover:bg-charcoal-800 text-slate-400 hover:text-slate-200 border border-transparent',
    outline: 'bg-transparent hover:bg-charcoal-800 text-amber-400 border border-amber-600/60 hover:border-amber-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
