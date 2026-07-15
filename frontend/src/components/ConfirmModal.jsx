import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isAlert = false,
  type = 'default'
}) {
  if (!isOpen) return null;

  // Icon selector based on type
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-indigo-600" />;
    }
  };

  // Border & background selector for the header icon container
  const getIconContainerStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 border-rose-100 text-rose-700';
      case 'warning':
        return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'success':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      default:
        return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    }
  };

  // Confirm Button style selector (Light pastel)
  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 focus:ring-rose-200/50';
      case 'warning':
        return 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 focus:ring-amber-200/50';
      case 'success':
        return 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800 focus:ring-emerald-200/50';
      default:
        return 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 focus:ring-indigo-100/50';
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        onClick={isAlert ? onConfirm : onCancel}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Dialog Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Block */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${getIconContainerStyle()}`}>
            {getIcon()}
          </div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>

        {/* Message details */}
        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>

        {/* Footer Actions */}
        <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
          {!isAlert && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}
          
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 font-bold text-xs rounded-md transition-colors focus:outline-none focus:ring-2 cursor-pointer ${getConfirmButtonStyle()}`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
