import React from 'react';

export default function FormInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = '',
  className = '',
  suffix
}) {
  return (
    <div className={`flex flex-col text-left w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`block w-full ${suffix ? 'pr-10' : 'pr-3.5'} pl-3.5 py-2.5 border rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 ${
            error
              ? 'border-brand-brick focus:border-brand-brick focus:ring-brand-brick/50'
              : 'border-slate-200'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed select-none' : 'text-slate-800'}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <span className="text-[10px] text-brand-brick font-medium mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
