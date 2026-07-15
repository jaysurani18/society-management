import React from 'react';

export default function SidebarShell({ logo, navItems, activePath, onItemClick }) {
  return (
    <aside className="w-64 bg-brand-navy text-slate-200 flex flex-col min-h-screen border-r border-slate-700/45">
      {/* Logo container */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/45 gap-3">
        {logo}
      </div>

      {/* Nav Item Queue */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => onItemClick(item.path)}
              className={`w-full flex items-center gap-3 py-2.5 text-xs font-mono uppercase tracking-wider text-left transition-all duration-200 cursor-pointer border-y border-y-transparent ${
                isActive
                  ? 'bg-brand-navy-active text-brand-gold border-l-4 border-l-brand-gold pl-2.5 font-bold'
                  : 'hover:bg-brand-navy-hover text-slate-400 hover:text-slate-200 border-l-4 border-l-transparent pl-2.5'
              }`}
            >
              {item.icon && <span className={`${isActive ? 'text-brand-gold' : 'text-slate-400'} shrink-0`}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer metadata */}
      <div className="p-4 border-t border-slate-800">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block text-center">
          AES-256 System Secure
        </span>
      </div>
    </aside>
  );
}
