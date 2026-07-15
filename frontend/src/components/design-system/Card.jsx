import React from 'react';

export default function Card({ title, subtitle, badge, children, className = '' }) {
  const hasHeader = title || subtitle || badge;

  return (
    <div className={`bg-white border border-slate-200/80 rounded-brand-lg shadow-brand-med p-6 space-y-4 ${className}`}>
      {hasHeader && (
        <div className="flex items-start justify-between border-b border-slate-100/80 pb-3 gap-4">
          <div className="space-y-1 text-left">
            {subtitle && (
              <p className="text-[9px] font-mono uppercase tracking-widest text-brand-gold font-bold">
                {subtitle}
              </p>
            )}
            {title && (
              <h3 className="font-serif text-md font-extrabold text-slate-900 leading-tight">
                {title}
              </h3>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
      <div className="text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </div>
  );
}
