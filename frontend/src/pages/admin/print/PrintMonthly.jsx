import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDairyProfile } from '../../../services/dairyService';
import api from '../../../services/api';
import { Printer, Download, ArrowLeft, Layout, FileText } from 'lucide-react';

export default function PrintMonthly() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [billingData, setBillingData] = useState(null);
  const [collectionData, setCollectionData] = useState(null);
  const [layoutMode, setLayoutMode] = useState('a4'); // 'a4' or 'thermal'
  const [loading, setLoading] = useState(true);

  // Parse Month and Year from query params
  const searchParams = new URLSearchParams(location.search);
  const month = searchParams.get('month') || new Date().getMonth() + 1; // 1-indexed
  const year = searchParams.get('year') || new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Calculate start and end date for the selected month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const [profRes, billRes, colRes] = await Promise.all([
          getDairyProfile(),
          api.get('/reports/billing', { params: { startDate, endDate } }),
          api.get('/reports/collections', { params: { startDate, endDate, limit: 1 } }) // Just need the summary aggregate
        ]);

        if (profRes && profRes.success) setProfile(profRes.data);
        if (billRes.data && billRes.data.success) setBillingData(billRes.data.data);
        if (colRes.data && colRes.data.success) setCollectionData(colRes.data.data);
      } catch (error) {
        console.error('Failed to load monthly operations report print', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month, year]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Preparing Monthly Report Preview...</p>
        </div>
      </div>
    );
  }

  const dairyName = profile?.dairyName || 'ANR Dairy';
  const ownerName = profile?.ownerName || 'ANR Owner';
  const dairyPhone = profile?.phone || '9999999999';
  const dairyAddress = profile?.address || 'Penugonda, AP';

  const billingSummary = billingData?.summary || { totalLiters: 0, netAmount: 0, paidAmount: 0, pendingAmount: 0, count: 0 };
  const collectionSummary = collectionData?.summary || { totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0, count: 0 };
  const invoices = billingData?.invoices || [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const selectedMonthName = monthNames[parseInt(month) - 1];

  const getExcelUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return `${baseUrl}/reports/billing/excel?startDate=${startDate}&endDate=${endDate}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-main p-4 sm:p-6 print:p-0 print:bg-white text-slate-800">
      
      {/* Floating Action Menu Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Reports</span>
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
          {/* Direct report download */}
          <a
            href={getExcelUrl()}
            download
            className="flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-250 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </a>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Render Document Container */}
      {layoutMode === 'a4' ? (
        /* layout mode: STANDARD A4 SHEET */
        <div className="w-[210mm] min-h-[297mm] p-[20mm] bg-white border border-slate-200 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 text-sm leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-blue-800">{dairyName}</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">ANR Dairy Management SaaS System</p>
              <p className="text-xs text-slate-650 mt-2 font-medium">Owner: {ownerName} | Ph: {dairyPhone}</p>
              <p className="text-xs text-slate-650">{dairyAddress}</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-850">MONTHLY OPERATIONS REPORT</h2>
              <p className="text-sm font-bold text-blue-600 mt-1">{selectedMonthName} {year}</p>
              <p className="text-xs text-slate-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-6" />

          {/* Report Summary Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded">
              <h3 className="font-bold text-slate-400 uppercase tracking-wide">Milk Collections Summary</h3>
              <div className="mt-2 space-y-1">
                <p>Total milk quantity: <strong className="text-slate-850">{collectionSummary.totalLiters?.toFixed(2)} L</strong></p>
                <p>Total collection runs: <strong className="text-slate-850">{collectionSummary.count} entries</strong></p>
                <p>Average FAT: <strong className="text-slate-850">{collectionSummary.avgFat?.toFixed(2)}%</strong></p>
                <p>Average SNF: <strong className="text-slate-850">{collectionSummary.avgSnf?.toFixed(2)}%</strong></p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded">
              <h3 className="font-bold text-slate-400 uppercase tracking-wide">Billing & Invoices</h3>
              <div className="mt-2 space-y-1">
                <p>Invoices generated: <strong className="text-slate-850">{billingSummary.count} bills</strong></p>
                <p>Net Invoiced value: <strong className="text-slate-850">₹{billingSummary.netAmount?.toFixed(2)}</strong></p>
                <p>Invoiced liters: <strong className="text-slate-850">{billingSummary.totalLiters?.toFixed(2)} L</strong></p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded">
              <h3 className="font-bold text-slate-400 uppercase tracking-wide">Disbursements & Dues</h3>
              <div className="mt-2 space-y-1">
                <p>Total payouts paid: <strong className="text-emerald-600">₹{billingSummary.paidAmount?.toFixed(2)}</strong></p>
                <p>Outstanding pending: <strong className="text-red-500">₹{billingSummary.pendingAmount?.toFixed(2)}</strong></p>
                <p>Disbursement Ratio: <strong className="text-slate-850">
                  {billingSummary.netAmount > 0 
                    ? `${((billingSummary.paidAmount / billingSummary.netAmount) * 100).toFixed(1)}%` 
                    : '100%'}
                </strong></p>
              </div>
            </div>
          </div>

          {/* Invoice lists table */}
          <h3 className="font-bold text-slate-800 text-xs uppercase mb-3 tracking-wide">Monthly Invoice Summary Ledger</h3>
          <table className="w-full text-left text-xs mb-8">
            <thead>
              <tr className="border-b border-slate-300 font-bold text-slate-700">
                <th className="pb-2">Invoice No</th>
                <th className="pb-2">Farmer</th>
                <th className="pb-2">Liters</th>
                <th className="pb-2">Avg FAT/SNF</th>
                <th className="pb-2 text-right">Net Due</th>
                <th className="pb-2 text-right">Paid</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="py-2">
                  <td className="py-2 font-mono font-semibold text-blue-650">{inv.invoiceNumber}</td>
                  <td className="py-2">
                    <p className="font-bold text-slate-850 leading-none mb-0.5">{inv.farmer?.name}</p>
                    <span className="text-[9px] text-slate-405 font-semibold">{inv.farmer?.farmerCode}</span>
                  </td>
                  <td className="py-2">{inv.totalLiters.toFixed(2)} L</td>
                  <td className="py-2">{inv.avgFat.toFixed(1)}%/{inv.avgSnf.toFixed(1)}%</td>
                  <td className="py-2 text-right font-semibold">₹{inv.netAmount.toFixed(2)}</td>
                  <td className="py-2 text-right text-emerald-600">₹{inv.paidAmount.toFixed(2)}</td>
                  <td className="py-2 text-right font-semibold uppercase text-[10px]">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer signature */}
          <div className="mt-20 flex justify-between items-center text-xs text-slate-400">
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Operations Head
            </div>
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Managing Owner Signature
            </div>
          </div>
        </div>
      ) : (
        /* layout mode: 80mm THERMAL RECEIPT */
        <div className="w-[80mm] p-[4mm] bg-white border border-slate-250 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-mono text-[9px] leading-tight">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h1 className="text-sm font-black uppercase tracking-tight">{dairyName}</h1>
            <p className="text-[8px] text-slate-500">ANR Dairy Management</p>
            <p className="text-[8px] text-slate-655">Ph: {dairyPhone}</p>
            <p className="text-[7.5px] leading-none text-slate-655">{dairyAddress}</p>
          </div>

          <p className="text-center my-2 text-slate-450">---------------------------------</p>

          <div className="space-y-1">
            <p className="text-center font-bold text-[10px] uppercase pb-1">MONTHLY BUSINESS SUMMARY</p>
            <p><strong>Month:</strong> {selectedMonthName} {year}</p>
            <p><strong>Total Liters:</strong> {billingSummary.totalLiters?.toFixed(1)} L</p>
            <p><strong>Billing Count:</strong> {billingSummary.count} invoices</p>
            <p><strong>Total Net Invoiced:</strong> ₹{billingSummary.netAmount?.toFixed(2)}</p>
            <p><strong>Total Paid Payouts:</strong> ₹{billingSummary.paidAmount?.toFixed(2)}</p>
            <p><strong>Total Outstanding:</strong> ₹{billingSummary.pendingAmount?.toFixed(2)}</p>
          </div>

          <p className="text-center my-3 text-slate-450">---------------------------------</p>

          <div className="text-center space-y-1 pt-2">
            <p className="text-[7px] text-slate-400">ANR Dairy Management SaaS</p>
          </div>
        </div>
      )}

    </div>
  );
}
