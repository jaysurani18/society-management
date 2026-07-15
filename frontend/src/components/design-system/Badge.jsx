import React from 'react';

export default function Badge({ label, status = 'pending' }) {
  const getStyles = () => {
    switch (status) {
      case 'approved':
      case 'paid':
      case 'resolved':
      case 'success':
        // Approved / Paid / Resolved -> green, filled-tint style
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'assigned':
      case 'in-progress':
      case 'info':
        // Assigned / In Progress -> blue, filled-tint style
        return 'bg-blue-50 border-blue-250 text-blue-800';
      case 'late':
      case 'overdue':
      case 'rejected':
      case 'danger':
        // Late / Overdue / Rejected -> red, filled-tint style
        return 'bg-rose-50 border-rose-200 text-rose-800';
      case 'pending':
      case 'unpaid':
      case 'warning':
      default:
        // Pending / Unpaid -> amber, outlined style
        return 'border-amber-400 text-amber-700 bg-amber-50/10';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getStyles()}`}>
      {label}
    </span>
  );
}
