import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getRateCharts, activateRateChart, deleteRateChart } from '../../services/rateService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Plus, Search, CheckCircle, HelpCircle, Eye, Edit3, ShieldAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RateChartsList() {
  const { showToast, askConfirmation } = useUI();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || { role: 'employee' };
  const isAdmin = user.role === 'admin';

  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRateCharts({
        page,
        limit: 10,
        search: search || undefined
      });
      if (response && response.success) {
        setCharts(response.data.charts);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      showToast('Failed to load rate configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  const handleActivate = async (id, name, milkType) => {
    const approved = await askConfirmation({
      title: 'Activate Rate Chart?',
      message: `Are you sure you want to activate '${name}'? Doing so will automatically deactivate any other active rate charts for ${milkType.toUpperCase()} milk.`,
      confirmText: 'Activate Chart',
      cancelText: 'Cancel'
    });

    if (approved) {
      try {
        const response = await activateRateChart(id, `Activated rate chart via dashboard list`);
        if (response && response.success) {
          showToast(`Rate chart '${name}' is now active`, 'success');
          fetchCharts();
        }
      } catch (error) {
        showToast('Failed to activate rate chart', 'error');
      }
    }
  };

  const handleDelete = async (id, name) => {
    const approved = await askConfirmation({
      title: 'Delete Rate Chart?',
      message: `Delete this old rate chart? This action cannot be undone.`,
      confirmText: 'Delete Chart',
      cancelText: 'Cancel'
    });

    if (approved) {
      try {
        const response = await deleteRateChart(id, `Deleted rate chart via dashboard list`);
        if (response && response.success) {
          showToast(`Rate chart '${name}' deleted successfully`, 'success');
          fetchCharts();
        }
      } catch (error) {
        const errMsg = error.response?.data?.message || 'Failed to delete rate chart';
        showToast(errMsg, 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'Rate Management' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Rate Configurations
          </h1>
        </div>

        <Link
          to="/admin/rates/new"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Rate Chart</span>
        </Link>
      </div>

      {/* Info Warning Alert */}
      <div className="bg-slate-50 dark:bg-slate-800/10 border border-slate-200 dark:border-dark-border rounded-lg p-4 flex gap-3 text-slate-600 dark:text-slate-400 text-xs">
        <ShieldAlert className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong>Important Rule</strong>: Only one rate chart can be active per milk type (Cow, Buffalo, Mix) at any given time. Activating a chart automatically archives the competing chart. Modifying or deleting active rate charts is locked to protect historical milk invoice records from retroactively changing pricing.
        </p>
      </div>

      {/* Toolbar Search */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex gap-4 items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md"
            placeholder="Search rate charts by name..."
          />
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <TableSkeleton />
      ) : charts.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No Rate Charts Found"
          description="Create a rate chart first to define milk pricing parameters."
          actionButton={
            <Link
              to="/admin/rates/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Rate Chart</span>
            </Link>
          }
        />
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Chart Name</th>
                  <th className="p-4">Milk Type</th>
                  <th className="p-4">Base Rate</th>
                  <th className="p-4">SNF Threshold</th>
                  <th className="p-4">Deduction</th>
                  <th className="p-4">Effective From</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {charts.map((chart) => (
                  <tr key={chart._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                      {chart.name}
                    </td>
                    <td className="p-4 capitalize text-slate-600 dark:text-slate-400">
                      {chart.milkType}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      ₹{(chart.baseRate || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {(chart.snfThreshold || 0).toFixed(1)}%
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      ₹{(chart.deduction || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {formatDate(chart.effectiveFrom)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        chart.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${chart.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {chart.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/admin/rates/${chart._id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                          title="View Rate Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit: Only allowed for archived/inactive charts */}
                        {!chart.isActive && (
                          <button
                            onClick={() => navigate(`/admin/rates/${chart._id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="Edit Chart Parameters"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Activate Button */}
                        {!chart.isActive && (
                          <button
                            onClick={() => handleActivate(chart._id, chart.name, chart.milkType)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-900/30 rounded transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </button>
                        )}

                        {/* Delete Button (Only Admin) */}
                        {isAdmin && (
                          <button
                            disabled={chart.isActive}
                            onClick={() => handleDelete(chart._id, chart.name)}
                            className={`p-1.5 rounded transition ${
                              chart.isActive
                                ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15'
                            }`}
                            title={chart.isActive ? 'Active rate charts cannot be deleted' : 'Delete Rate Chart'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div>Page {page} of {totalPages}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
