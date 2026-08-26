import React, { useState, useEffect, useCallback } from 'react';
import { useUI } from '../../context/UIContext';
import { getPayments, deletePayment } from '../../services/paymentService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Search, Filter, Trash2, Calendar, Smartphone, Landmark, FileCheck, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentsList() {
  const { showToast } = useUI();

  // Role
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'employee' };
  const isAdmin = user.role === 'admin';

  // States
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Deletion Modal
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayments({
        page,
        limit: 10,
        search: search || undefined,
        paymentMode: mode || undefined
      });
      if (res.success) {
        setPayments(res.data.payments);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to load payments ledger', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, mode, showToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setDeleteReason('');
  };

  const handleSaveDelete = async () => {
    if (!deleteReason) {
      showToast('A deletion audit reason is required to rollback payments', 'warning');
      return;
    }
    try {
      const res = await deletePayment(deletingItem._id, deleteReason);
      if (res.success) {
        showToast('Payment transaction successfully deleted and invoice balance restored', 'success');
        setDeletingItem(null);
        fetchPayments();
      }
    } catch (err) {
      showToast('Failed to delete payment transaction', 'error');
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
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'Payments History' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Payments Ledger
        </h1>
      </div>

      {/* Filter toolbar */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md"
            placeholder="Search by ID, Name, Mobile..."
          />
        </div>

        {/* Mode filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Mode:</span>
          </span>
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
          >
            <option value="">All Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

      </div>

      {/* Table grid */}
      {loading ? (
        <TableSkeleton />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No Payouts Logged"
          description="Farmer payout history will display here once recorded against compiled bills."
        />
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Payment No.</th>
                  <th className="p-4">Invoice Ref</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4 text-center">Receipt</th>
                  {isAdmin && <th className="p-4 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {payments.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    
                    {/* Payment Number */}
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.paymentNumber}
                    </td>

                    {/* Invoice Number */}
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {item.invoice?.invoiceNumber || 'Deleted'}
                    </td>

                    {/* Farmer */}
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                      {item.farmer?.name || 'Deleted'} ({item.farmer?.farmerCode || 'N/A'})
                    </td>

                    {/* Payment Date */}
                    <td className="p-4 text-slate-500 text-xs">
                      {formatDate(item.paymentDate)}
                    </td>

                    {/* Mode & Reference */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {item.paymentMode}
                      </p>
                      {item.referenceNumber && (
                        <span className="text-[10px] text-slate-400">Ref: {item.referenceNumber}</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{item.paidAmount.toFixed(2)}
                    </td>

                    {/* Print Preview link */}
                    <td className="p-4 text-center">
                      <a
                        href={`/admin/print/payment/${item._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-slate-250 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition text-slate-700 dark:text-slate-300"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Preview</span>
                      </a>
                    </td>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded transition"
                          title="Delete payment and restore invoice balance"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}

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
                  className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Delete Payment justification dialog overlay */}
      <AnimatePresence>
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10"
            >
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 pb-2 border-b border-slate-100 dark:border-dark-border">
                Delete Payment {deletingItem.paymentNumber}?
              </h3>

              <p className="text-xs text-slate-400 leading-normal">
                Deleting this payment will automatically restore the unpaid pending balance of **₹{deletingItem.paidAmount.toFixed(2)}** on the associated invoice.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for Deletion (Audit Logged)</label>
                <textarea
                  rows="2"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                  placeholder="Describe reason for payment rollback..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDelete}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
