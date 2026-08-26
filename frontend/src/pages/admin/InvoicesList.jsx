import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getInvoices, cancelInvoice, getInvoicePdfUrl } from '../../services/billingService';
import { recordPayment } from '../../services/paymentService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  XSquare, 
  CreditCard, 
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvoicesList() {
  const navigate = useNavigate();
  const { showToast, askConfirmation } = useUI();

  // Role
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'employee' };
  const isAdmin = user.role === 'admin';

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cancellation Modal State
  const [cancellingItem, setCancellingItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Payment Modal State
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined
      });
      if (res.success) {
        setInvoices(res.data.invoices);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to load bills directory', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Open Cancel dialog
  const handleOpenCancel = (item) => {
    setCancellingItem(item);
    setCancelReason('');
  };

  // Submit Cancel API
  const handleSaveCancel = async () => {
    if (!cancelReason) {
      showToast('A cancellation audit reason is required', 'warning');
      return;
    }
    try {
      const res = await cancelInvoice(cancellingItem._id, cancelReason);
      if (res.success) {
        showToast(`Invoice ${cancellingItem.invoiceNumber} cancelled successfully`, 'success');
        setCancellingItem(null);
        fetchInvoices();
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Cancellation failed';
      showToast(serverMessage, 'error');
    }
  };

  // Open Pay dialog
  const handleOpenPay = (item) => {
    setPayingInvoice(item);
    setPayAmount(item.pendingAmount.toFixed(2));
    setPayMode('Cash');
    setPayRef('');
    setPayNotes('');
  };

  // Submit Pay API
  const handleSavePayment = async () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Amount must be greater than 0', 'warning');
      return;
    }

    setSubmittingPay(true);
    try {
      const response = await recordPayment({
        invoiceId: payingInvoice._id,
        paidAmount: amt,
        paymentMode: payMode,
        referenceNumber: payRef,
        notes: payNotes
      });

      if (response && response.success) {
        showToast(`Payment of ₹${amt.toFixed(2)} recorded successfully`, 'success');
        setPayingInvoice(null);
        fetchInvoices();
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to save payment';
      showToast(serverMessage, 'error');
    } finally {
      setSubmittingPay(false);
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
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'Billing & Invoices' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Billing & Invoices
          </h1>
        </div>

        {isAdmin && (
          <Link
            to="/admin/billing/generate"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Bill Run</span>
          </Link>
        )}
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

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="Generated">Generated (Due)</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

      </div>

      {/* Grid Table */}
      {loading ? (
        <TableSkeleton />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices Compiled"
          description="Compile your first farmer billing run cycle using the top action button."
        />
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Invoice Details</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Range</th>
                  <th className="p-4">Liters</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4">Outstanding</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {invoices.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    
                    {/* Invoice Number */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.invoiceNumber}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Date: {formatDate(item.generatedDate)}
                      </span>
                    </td>

                    {/* Farmer */}
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                      {item.farmer?.name || 'Deleted'} ({item.farmer?.farmerCode || 'N/A'})
                    </td>

                    {/* Billing Cycle Range */}
                    <td className="p-4 text-slate-500 font-medium text-xs leading-snug">
                      {formatDate(item.startDate)} <br />
                      <span className="text-slate-400 text-[10px]">to {formatDate(item.endDate)}</span>
                    </td>

                    {/* Liters */}
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                      {item.totalLiters.toFixed(2)} L
                    </td>

                    {/* Net Amount */}
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">
                      ₹{item.netAmount.toFixed(2)}
                    </td>

                    {/* Outstanding Balance */}
                    <td className="p-4 font-extrabold text-amber-600 dark:text-amber-400">
                      ₹{item.pendingAmount.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : item.status === 'Cancelled'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions Row */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/admin/invoices/${item._id}`)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                          title="View Invoice Sheet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <a
                          href={getInvoicePdfUrl(item._id)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                          title="Print/Download PDF Bill"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Record Payment (Admin only, if generated/due) */}
                        {isAdmin && item.status === 'Generated' && (
                          <button
                            onClick={() => handleOpenPay(item)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/15 border border-emerald-250 dark:border-emerald-900/30 rounded transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}

                        {/* Cancel Invoice (Admin only, only if uncollected balance == net balance) */}
                        {isAdmin && item.status === 'Generated' && item.paidAmount === 0 && (
                          <button
                            onClick={() => handleOpenCancel(item)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/15 rounded transition"
                            title="Cancel Invoice compilation"
                          >
                            <XSquare className="w-4 h-4" />
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

      {/* Record Payment Dialog overlay */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayingInvoice(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Record Farmer Payout
                  </h3>
                  <p className="text-[10px] text-slate-400">Invoice: {payingInvoice.invoiceNumber}</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                
                {/* Paid Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-sm"
                    max={payingInvoice.pendingAmount}
                  />
                  <p className="text-[10px] text-slate-400">Outstanding: ₹{payingInvoice.pendingAmount.toFixed(2)}</p>
                </div>

                {/* Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Ref Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference No. (Optional)</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    placeholder="e.g. UPI transaction hash or bank IMPS ref"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    placeholder="Describe memo..."
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={submittingPay}
                  className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition"
                >
                  {submittingPay ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Cancel Dialog overlay */}
      <AnimatePresence>
        {cancellingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancellingItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10"
            >
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 pb-2 border-b border-slate-100 dark:border-dark-border">
                Cancel Bill Invoice {cancellingItem.invoiceNumber}?
              </h3>

              <p className="text-xs text-slate-400 leading-normal">
                Cancelling this invoice will automatically unlock all associated daily milk collection entries and make them available for another billing run.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for Cancellation (Audit Logged)</label>
                <textarea
                  rows="2"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                  placeholder="State reason..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                <button
                  onClick={() => setCancellingItem(null)}
                  className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCancel}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                >
                  Cancel Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
