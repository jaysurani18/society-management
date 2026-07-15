import React from 'react';

export default function Button({
  children,
  variant = 'primary', // options: 'primary' (navy), 'secondary' (gray outline), 'destructive' (brick red)
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  icon
}) {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-100';
      case 'destructive':
        return 'bg-brand-brick hover:bg-red-800 text-white focus:ring-red-200/50';
      default:
        return 'bg-brand-navy hover:bg-brand-navy-hover active:bg-brand-navy-active text-white focus:ring-slate-800/10';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-brand-md shadow-brand-low transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${getStyles()} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
