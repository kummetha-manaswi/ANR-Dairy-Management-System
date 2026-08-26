import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Database,
  title = 'No records found',
  description = 'Try adjusting your search filters or add a new record to get started.',
  actionButton,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface space-y-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
}
