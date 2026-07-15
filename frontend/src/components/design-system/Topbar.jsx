import React from 'react';
import { LogOut } from 'lucide-react';

export default function Topbar({ eyebrow, modeLabel, userName, metaInfo, onSignOut }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between h-16 w-full">
      {/* Left side: Eyebrow + Mode */}
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 leading-none">
          {eyebrow}
        </span>
        <h2 className="text-md font-serif font-bold text-slate-900 mt-1">
          {modeLabel}
        </h2>
      </div>

      {/* Right side: User Metadata & Sign Out */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right hidden sm:flex">
          <span className="text-xs font-semibold text-slate-900 leading-none">
            {userName}
          </span>
          <span className="text-[10px] font-mono text-slate-450 tracking-wider mt-1 uppercase">
            {metaInfo}
          </span>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Destructive red sign out button */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-brick hover:bg-red-800 text-white text-xs font-semibold rounded-brand-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 cursor-pointer"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
