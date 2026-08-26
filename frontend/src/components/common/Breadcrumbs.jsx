import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 select-none">
      {/* Home Anchor */}
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 transition"
      >
        <Home className="w-4 h-4" />
      </Link>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
