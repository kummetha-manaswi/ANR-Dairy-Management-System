import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDairyProfile } from '../../../services/dairyService';
import api from '../../../services/api';
import { Printer, Download, ArrowLeft, Layout, FileText } from 'lucide-react';

export default function PrintCollections() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [layoutMode, setLayoutMode] = useState('a4'); // 'a4' or 'thermal'
  const [loading, setLoading] = useState(true);

  // Parse filters from URL search params
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const shift = searchParams.get('shift') || '';
  const milkType = searchParams.get('milkType') || '';
  const village = searchParams.get('village') || '';
  const farmerId = searchParams.get('farmerId') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repRes, profRes] = await Promise.all([
          api.get('/reports/collections', {
            params: {
              startDate,
              endDate,
              shift,
              milkType,
              village,
              farmerId,
              limit: 500 // Fetch a large list for full printable report
            }
          }),
          getDairyProfile()
        ]);
        if (repRes.data && repRes.data.success) setReportData(repRes.data.data);
        if (profRes && profRes.success) setProfile(profRes.data);
      } catch (error) {
        console.error('Failed to load collections print report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate, shift, milkType, village, farmerId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Preparing Collection Report Preview...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main text-slate-500">
        Collection report details not found.
      </div>
    );
  }

  const dairyName = profile?.dairyName || 'ANR Dairy';
  const ownerName = profile?.ownerName || 'ANR Owner';
  const dairyPhone = profile?.phone || '9999999999';
  const dairyAddress = profile?.address || 'Penugonda, AP';
  const collections = reportData.collections || [];
  const summary = reportData.summary || {};

  const getPdfUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const params = new URLSearchParams({
      startDate,
      endDate,
      shift,
      milkType,
      village,
      farmerId
    });
    return `${baseUrl}/reports/collections/pdf?${params.toString()}`;
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
          {/* PDF Download */}
          <a
            href={getPdfUrl()}
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
              <h2 className="text-lg font-bold text-slate-850">MILK COLLECTION REPORT</h2>
              <p className="text-xs text-slate-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-6" />

          {/* Details Metadata grid */}
          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
            <div className="space-y-1 bg-slate-50 p-4 rounded border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Report Scope Filters</p>
              <p className="font-extrabold text-slate-850 mt-1">Period: {startDate || 'All Time'} {endDate ? `to ${endDate}` : ''}</p>
              {shift && <p className="font-semibold text-slate-650">Shift filter: <span className="capitalize">{shift}</span></p>}
              {milkType && <p className="font-semibold text-slate-650">Milk Type filter: <span className="uppercase">{milkType}</span></p>}
              {village && <p className="font-semibold text-slate-650">Village filter: {village}</p>}
            </div>
            <div className="space-y-1.5 bg-slate-50 p-4 rounded border border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Liters</p>
                <p className="text-base font-extrabold text-slate-850">{summary.totalLiters?.toFixed(2) || '0.00'} L</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Value</p>
                <p className="text-base font-extrabold text-slate-850">₹{summary.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Avg FAT%</p>
                <p className="text-xs font-bold text-slate-700">{summary.avgFat?.toFixed(2) || '0.0'}%</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Avg SNF%</p>
                <p className="text-xs font-bold text-slate-700">{summary.avgSnf?.toFixed(2) || '0.0'}%</p>
              </div>
            </div>
          </div>

          {/* Table list */}
          <table className="w-full text-left text-xs mb-8">
            <thead>
              <tr className="border-b-2 border-slate-300 font-bold text-slate-800">
                <th className="pb-2">Date</th>
                <th className="pb-2">Shift</th>
                <th className="pb-2">Farmer</th>
                <th className="pb-2">Milk</th>
                <th className="pb-2">Qty (L)</th>
                <th className="pb-2">FAT / SNF</th>
                <th className="pb-2">Rate / L</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {collections.map((col) => (
                <tr key={col._id} className="py-2">
                  <td className="py-2">{new Date(col.date).toLocaleDateString()}</td>
                  <td className="py-2 capitalize text-[10px]">{col.shift}</td>
                  <td className="py-2">
                    <p className="font-bold text-slate-850 leading-none mb-0.5">{col.farmerName}</p>
                    <span className="text-[9px] text-slate-400 font-semibold">{col.farmerCode}</span>
                  </td>
                  <td className="py-2 uppercase text-[10px]">{col.milkType}</td>
                  <td className="py-2 font-semibold">{col.quantity.toFixed(2)} L</td>
                  <td className="py-2">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                  <td className="py-2">₹{col.ratePerLiter.toFixed(2)}</td>
                  <td className="py-2 text-right font-bold text-slate-900">₹{col.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer signature */}
          <div className="mt-20 flex justify-between items-center text-xs text-slate-400">
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Prepared By
            </div>
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Authorized Inspector
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
            <p className="text-center font-bold text-[10px] uppercase pb-1">DAILY COLLECTION SUMMARY</p>
            <p><strong>Period:</strong> {startDate || 'All'} {endDate ? `to ${endDate}` : ''}</p>
            {shift && <p><strong>Shift:</strong> {shift.toUpperCase()}</p>}
            {milkType && <p><strong>Milk Type:</strong> {milkType.toUpperCase()}</p>}
            <p><strong>Total Liters:</strong> {summary.totalLiters?.toFixed(2) || '0.00'} L</p>
            <p><strong>Total Value:</strong> ₹{summary.totalAmount?.toFixed(2) || '0.00'}</p>
            <p><strong>Avg FAT/SNF:</strong> {summary.avgFat?.toFixed(1)}%/{summary.avgSnf?.toFixed(1)}%</p>
          </div>

          <p className="text-center my-2 text-slate-450">---------------------------------</p>

          {/* Table Header */}
          <div className="grid grid-cols-4 font-bold border-b border-dashed border-slate-300 pb-1 mb-1 text-[8px]">
            <span>Farmer (Sh)</span>
            <span className="text-right">Qty(L)</span>
            <span className="text-right">FAT/SNF</span>
            <span className="text-right">Amt</span>
          </div>

          {/* Table Rows */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-1 mb-2 text-[8px]">
            {collections.map((col, idx) => (
              <div key={idx} className="grid grid-cols-4">
                <span className="truncate pr-1">{col.farmerName} ({col.shift.substring(0, 1).toUpperCase()})</span>
                <span className="text-right">{col.quantity.toFixed(1)}</span>
                <span className="text-right">{col.fat.toFixed(0)}/{col.snf.toFixed(0)}</span>
                <span className="text-right font-bold">₹{col.totalAmount.toFixed(0)}</span>
              </div>
            ))}
          </div>

          <p className="text-center my-3 text-slate-400">---------------------------------</p>

          <div className="text-center space-y-1 pt-2">
            <p className="text-[7px] text-slate-400">ANR Dairy SaaS Systems</p>
          </div>
        </div>
      )}

    </div>
  );
}
