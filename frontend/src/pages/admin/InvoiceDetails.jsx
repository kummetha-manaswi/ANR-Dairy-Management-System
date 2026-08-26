import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getInvoiceById, getInvoicePdfUrl } from '../../services/billingService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { ArrowLeft, Download, FileText, Calendar, User, Landmark, HelpCircle, Activity, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await getInvoiceById(id);
        if (response && response.success) {
          setInvoice(response.data);
        }
      } catch (error) {
        showToast('Failed to load invoice details', 'error');
        navigate('/admin/collections');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  if (!invoice) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/collections')}
            className="p-2 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="flex flex-col gap-1.5">
            <Breadcrumbs 
              items={[
                { label: 'Billing Ledger', path: '/admin/collections' }, 
                { label: invoice.invoiceNumber }
              ]} 
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
              Invoice Statement: {invoice.invoiceNumber}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/admin/print/invoice/${invoice._id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-705 dark:text-slate-350 bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Preview</span>
          </Link>
          <a
            href={getInvoicePdfUrl(invoice._id)}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition animate-none"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Cards */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card 1: Bill Status */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm text-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border pb-2 flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-blue-500" />
              <span>Invoice Overview</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Invoice Number:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Billing Period:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(invoice.startDate)} to {formatDate(invoice.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Date Compiled:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(invoice.generatedDate)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100 dark:border-dark-border">
                <span className="text-slate-400 font-medium">Billing Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Farmer Info */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm text-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border pb-2 flex items-center gap-1.5">
              <User className="w-4.5 h-4.5 text-blue-500" />
              <span>Farmer Account details</span>
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Farmer ID & Name</p>
                <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{invoice.farmer?.name} ({invoice.farmer?.farmerCode})</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone & Village</p>
                <p className="font-semibold text-slate-800 dark:text-slate-300 mt-0.5">{invoice.farmer?.phone} | {invoice.farmer?.village}</p>
              </div>

              {/* Bank Transfer info */}
              {invoice.farmer?.bankDetails?.accountNumber && (
                <div className="pt-2.5 border-t border-slate-100 dark:border-dark-border space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Payout Bank Details</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400">Bank Name</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{invoice.farmer.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Account No.</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{invoice.farmer.bankDetails.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Collections list table & Summary pricing */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Table List */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Invoiced Milk Deliveries
              </h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Shift</th>
                    <th className="p-3">Quantity (L)</th>
                    <th className="p-3">FAT / SNF</th>
                    <th className="p-3">Rate / Liter</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {invoice.collections.map((col) => (
                    <tr key={col._id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{formatDate(col.date)}</td>
                      <td className="p-3 capitalize">{col.shift}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{col.quantity.toFixed(2)} L</td>
                      <td className="p-3">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                      <td className="p-3 font-semibold">₹{col.ratePerLiter.toFixed(2)}</td>
                      <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200 text-right">₹{col.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Compiled Statement Totals
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center select-none text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Total Liters</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white mt-0.5">{invoice.totalLiters.toFixed(2)} L</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Avg FAT% / SNF%</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white mt-0.5">{invoice.avgFat.toFixed(1)}% / {invoice.avgSnf.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Gross Sum</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white mt-0.5">₹{invoice.grossAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">Adjustments</p>
                <p className="text-sm font-bold text-slate-700 dark:text-white mt-0.5">
                  +₹{invoice.bonus.toFixed(2)} / -₹{invoice.deductions.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payout Details */}
            <div className="border-t border-slate-100 dark:border-dark-border pt-4 flex flex-col items-end space-y-2 select-none">
              <div className="flex justify-between w-64 text-sm">
                <span className="text-slate-400 font-semibold">Net Payout Due:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{invoice.netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 text-sm">
                <span className="text-slate-400 font-semibold">Total Paid:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-64 border-t border-dashed border-slate-200 dark:border-dark-border pt-2 text-base">
                <span className="font-black text-slate-800 dark:text-slate-100">Outstanding Due:</span>
                <span className="font-black text-blue-600 dark:text-blue-400 font-mono">₹{invoice.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
