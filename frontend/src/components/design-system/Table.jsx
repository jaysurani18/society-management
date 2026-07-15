import React from 'react';

export default function Table({ headers, rows, keyExtractor, renderCell }) {
  return (
    <div className="overflow-x-auto w-full border border-slate-200 rounded-brand-md bg-white">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {headers.map((h, idx) => (
              <th
                key={h.key || idx}
                className={`p-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 ${
                  h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                }`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-slate-400 text-xs italic font-sans">
                No database records to display.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIdx) => (
              <tr key={keyExtractor ? keyExtractor(row, rowIdx) : rowIdx} className="hover:bg-slate-50/30 transition-colors duration-150">
                {headers.map((h, colIdx) => (
                  <td
                    key={colIdx}
                    className={`p-4 text-xs font-sans text-slate-700 ${
                      h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {renderCell ? renderCell(row, h.key, rowIdx) : row[h.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
