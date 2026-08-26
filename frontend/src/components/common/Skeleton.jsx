import React from 'react';

export function CardSkeleton() {
  return (
    <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 animate-pulse">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-dark-border">
      <td className="p-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-12" /></td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-14" /></td>
      <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
      <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16" /></td>
      <td className="p-4"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="w-full overflow-x-auto border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40">
            <th className="p-4 h-12 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <th className="p-4 h-12 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <TableRowSkeleton key={idx} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
