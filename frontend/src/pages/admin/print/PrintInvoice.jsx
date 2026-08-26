import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, getInvoicePdfUrl } from '../../../services/billingService';
import { getDairyProfile } from '../../../services/dairyService';
import { Printer, Download, ArrowLeft, Layout, FileText } from 'lucide-react';
import logoCompact from '../../../assets/logo_compact.png';

export default function PrintInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [profile, setProfile] = useState(null);
  const [layoutMode, setLayoutMode] = useState('a4'); // 'a4' or 'thermal'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, profRes] = await Promise.all([
          getInvoiceById(id),
          getDairyProfile()
        ]);
        if (invRes && invRes.success) setInvoice(invRes.data);
        if (profRes && profRes.success) setProfile(profRes.data);
      } catch (error) {
        console.error('Failed to load invoice print details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Preparing Print Preview...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main text-slate-500">
        Invoice details not found.
      </div>
    );
  }

  const dairyName = profile?.dairyName || 'ANR Dairy';
  const ownerName = profile?.ownerName || 'ANR Owner';
  const dairyPhone = profile?.phone || '9999999999';
  const dairyAddress = profile?.address || 'Penugonda, AP';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-main p-4 sm:p-6 print:p-0 print:bg-white text-slate-800">
      
      {/* Floating Action Menu Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={() => navigate(`/admin/invoices/${invoice._id}`)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>

        {/* Layout selector toggles */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setLayoutMode('a4')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
              layoutMode === 'a4'
                ? 'bg-white dark:bg-dark-surface text-blue-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>A4 Page Sheet</span>
          </button>
          <button
            onClick={() => setLayoutMode('thermal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
              layoutMode === 'thermal'
                ? 'bg-white dark:bg-dark-surface text-blue-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>80mm Thermal POS</span>
          </button>
        </div>

        <div className="flex gap-2">
          {/* PDF Download refinement */}
          <a
            href={getInvoicePdfUrl(invoice._id)}
            download
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-250 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Layout</span>
          </button>
        </div>
      </div>

      {/* Render Document Container */}
      {layoutMode === 'a4' ? (
        /* layout mode: STANDARD A4 SHEET */
        <div className="w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-slate-200 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 text-sm leading-relaxed">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img 
                src={logoCompact} 
                alt="ANR Dairy Brand Logo" 
                className="w-12 h-12 object-contain rounded-xl border border-slate-200"
              />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-blue-800">{dairyName}</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">ANR Dairy Management SaaS System</p>
                <p className="text-xs text-slate-600 mt-1 font-medium">Owner: {ownerName} | Ph: {dairyPhone}</p>
                <p className="text-xs text-slate-650">{dairyAddress}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-850">BILL INVOICE</h2>
              <p className="text-xs font-bold text-blue-600 mt-1">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-2">Generated: {new Date(invoice.generatedDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-6" />

          {/* Details Metadata grid */}
          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
            <div className="space-y-1 bg-slate-50 p-4 rounded border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Farmer Account Details</p>
              <p className="font-extrabold text-slate-850 text-sm mt-1">{invoice.farmer?.name}</p>
              <p className="font-semibold text-slate-650">Farmer ID: {invoice.farmer?.farmerCode}</p>
              <p className="text-slate-500">Phone: {invoice.farmer?.phone} | Village: {invoice.farmer?.village}</p>
            </div>
            <div className="space-y-1 bg-slate-50 p-4 rounded border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Invoice Statement Period</p>
              <p className="font-extrabold text-slate-850 text-sm mt-1">
                {new Date(invoice.startDate).toLocaleDateString()} to {new Date(invoice.endDate).toLocaleDateString()}
              </p>
              <p className="font-semibold text-slate-650">Billing Cycle Status: <span className="text-emerald-600 font-bold">{invoice.status}</span></p>
              {invoice.farmer?.bankDetails?.accountNumber && (
                <p className="text-[10px] text-slate-450 mt-1">Payout Target: {invoice.farmer.bankDetails.bankName} (AC: {invoice.farmer.bankDetails.accountNumber})</p>
              )}
            </div>
          </div>

          {/* Collections list table */}
          <table className="w-full text-left text-xs mb-8">
            <thead>
              <tr className="border-b-2 border-slate-300 font-bold text-slate-800">
                <th className="pb-2">Date</th>
                <th className="pb-2">Shift</th>
                <th className="pb-2">Liters</th>
                <th className="pb-2">FAT / SNF</th>
                <th className="pb-2">Rate / L</th>
                <th className="pb-2 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.collections.map((col) => (
                <tr key={col._id} className="py-2">
                  <td className="py-2">{new Date(col.date).toLocaleDateString()}</td>
                  <td className="py-2 capitalize">{col.shift}</td>
                  <td className="py-2 font-semibold">{col.quantity.toFixed(2)} L</td>
                  <td className="py-2">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                  <td className="py-2">₹{col.ratePerLiter.toFixed(2)}</td>
                  <td className="py-2 text-right font-bold text-slate-900">₹{col.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary values */}
          <div className="flex justify-between items-start border-t border-slate-200 pt-6">
            <div className="space-y-1 text-xs text-slate-500">
              <p>Total milk entries: {invoice.collections.length}</p>
              <p>Avg FAT: {invoice.avgFat.toFixed(2)}% | Avg SNF: {invoice.avgSnf.toFixed(2)}%</p>
            </div>
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-650">
                <span>Gross Sum Amount:</span>
                <span>₹{invoice.grossAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Quality Bonus (+):</span>
                <span>₹{invoice.bonus.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-500 font-semibold">
                <span>Deductions (-):</span>
                <span>₹{invoice.deductions.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 my-1" />
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Amount Due:</span>
                <span>₹{invoice.netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                <span>Outstanding:</span>
                <span className="font-semibold text-blue-600">₹{invoice.pendingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer signature */}
          <div className="mt-20 flex justify-between items-center text-xs text-slate-400">
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Farmer Signature
            </div>
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Authorized Collector
            </div>
          </div>

          <p className="text-center text-[8px] text-slate-350 mt-24">
            This invoice is a system generated statement compiled via ANR Dairy SaaS and does not require a physical stamp.
          </p>
        </div>
      ) : (
        /* layout mode: 80mm THERMAL RECEIPT */
        <div className="w-[80mm] p-[4mm] bg-white border border-slate-250 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-mono text-[9px] leading-tight">
          {/* Header */}
          <div className="text-center space-y-1">
            <img 
              src={logoCompact} 
              alt="ANR Logo" 
              className="w-8 h-8 object-contain rounded-lg mx-auto"
            />
            <h1 className="text-sm font-black uppercase tracking-tight leading-none mt-1">{dairyName}</h1>
            <p className="text-[8px] text-slate-500">ANR Dairy Management</p>
            <p className="text-[8px] text-slate-650">Ph: {dairyPhone}</p>
            <p className="text-[7.5px] leading-none text-slate-600">{dairyAddress}</p>
          </div>

          <p className="text-center my-2 text-slate-400">---------------------------------</p>

          {/* Metadata details */}
          <div className="space-y-1">
            <p className="text-center font-bold text-[10px] uppercase pb-1">INVOICE STATEMENT</p>
            <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> {new Date(invoice.generatedDate).toLocaleDateString()}</p>
            <p><strong>Farmer:</strong> {invoice.farmer?.name} ({invoice.farmer?.farmerCode})</p>
            <p><strong>Period:</strong> {new Date(invoice.startDate).toLocaleDateString()} to {new Date(invoice.endDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {invoice.status.toUpperCase()}</p>
          </div>

          <p className="text-center my-2 text-slate-400">---------------------------------</p>

          {/* Table Header */}
          <div className="grid grid-cols-5 font-bold border-b border-dashed border-slate-300 pb-1 mb-1">
            <span className="col-span-2">Date (Sh)</span>
            <span className="text-right">Qty(L)</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amt</span>
          </div>

          {/* Table Rows */}
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-1 mb-2">
            {invoice.collections.map((col) => (
              <div key={col._id} className="grid grid-cols-5">
                <span className="col-span-2 truncate">{new Date(col.date).toLocaleDateString().substring(0, 5)} ({col.shift.substring(0, 1).toUpperCase()})</span>
                <span className="text-right">{col.quantity.toFixed(2)}</span>
                <span className="text-right">{col.ratePerLiter.toFixed(1)}</span>
                <span className="text-right">{col.totalAmount.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Summary values */}
          <div className="space-y-1 text-right">
            <p>Total Qty: <strong className="text-[10px]">{invoice.totalLiters.toFixed(2)} L</strong></p>
            <p>Avg FAT/SNF: <strong>{invoice.avgFat.toFixed(1)}%/{invoice.avgSnf.toFixed(1)}%</strong></p>
            <p>Gross Amount: <strong>₹{invoice.grossAmount.toFixed(2)}</strong></p>
            <p className="text-emerald-600">Bonus (+): <strong>₹{invoice.bonus.toFixed(2)}</strong></p>
            <p className="text-red-500">Deduction (-): <strong>₹{invoice.deductions.toFixed(2)}</strong></p>
            <p className="text-center my-1 text-slate-300">-----------------</p>
            <p className="text-[11px] font-black uppercase text-slate-900">
              Net Due: ₹{invoice.netAmount.toFixed(2)}
            </p>
            <p className="text-[8px] text-slate-500">
              Outstanding: ₹{invoice.pendingAmount.toFixed(2)}
            </p>
          </div>

          <p className="text-center my-3 text-slate-400">---------------------------------</p>

          <div className="text-center space-y-1 pt-2">
            <p className="text-[7.5px] text-slate-500">Thank you for partnership!</p>
            <p className="text-[7px] text-slate-400">Powered by ANR Dairy SaaS</p>
          </div>
        </div>
      )}

    </div>
  );
}
