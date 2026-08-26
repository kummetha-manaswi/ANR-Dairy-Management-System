import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDairyProfile } from '../../../services/dairyService';
import api from '../../../services/api';
import { Printer, Download, ArrowLeft, Layout, FileText } from 'lucide-react';

export default function PrintPassbook() {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const [passbookData, setPassbookData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [layoutMode, setLayoutMode] = useState('a4'); // 'a4' or 'thermal'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [passRes, profRes] = await Promise.all([
          api.get(`/reports/passbook/${farmerId}`),
          getDairyProfile()
        ]);
        if (passRes.data && passRes.data.success) setPassbookData(passRes.data.data);
        if (profRes && profRes.success) setProfile(profRes.data);
      } catch (error) {
        console.error('Failed to load passbook print details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [farmerId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Preparing Ledger Preview...</p>
        </div>
      </div>
    );
  }

  if (!passbookData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main text-slate-500">
        Farmer passbook ledger details not found.
      </div>
    );
  }

  const dairyName = profile?.dairyName || 'ANR Dairy';
  const ownerName = profile?.ownerName || 'ANR Owner';
  const dairyPhone = profile?.phone || '9999999999';
  const dairyAddress = profile?.address || 'Penugonda, AP';
  const farmer = passbookData.farmer || {};
  const passbook = passbookData.passbook || [];
  
  const getPdfUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/reports/passbook/${farmerId}/pdf`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-main p-4 sm:p-6 print:p-0 print:bg-white text-slate-800">
      
      {/* Floating Action Menu Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={() => navigate('/admin/passbook')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ledger</span>
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
            <span>Print Passbook</span>
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
              <h2 className="text-lg font-bold text-slate-850">FARMER PASSBOOK LEDGER</h2>
              <p className="text-xs text-slate-500 mt-2">Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-6" />

          {/* Details Metadata grid */}
          <div className="grid grid-cols-2 gap-8 text-xs mb-8">
            <div className="space-y-1 bg-slate-50 p-4 rounded border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Farmer Account details</p>
              <p className="font-extrabold text-slate-850 text-sm mt-1">{farmer.name}</p>
              <p className="font-semibold text-slate-650">Farmer ID: {farmer.farmerCode}</p>
              <p className="text-slate-500">Phone: {farmer.phone} | Village: {farmer.village}</p>
            </div>
            <div className="space-y-1 bg-slate-50 p-4 rounded border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ledger Balance Summary</p>
              <p className="text-xl font-black text-blue-750 mt-2">
                ₹{passbookData.runningBalance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-[10px] text-slate-500">Total Outstanding Balance due to Farmer</p>
            </div>
          </div>

          {/* Ledger Table */}
          <table className="w-full text-left text-xs mb-8">
            <thead>
              <tr className="border-b-2 border-slate-300 font-bold text-slate-800">
                <th className="pb-2">Date</th>
                <th className="pb-2">Reference No.</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Transaction Amount</th>
                <th className="pb-2 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {passbook.map((row, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-2.5">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="py-2.5 font-mono text-[10px]">{row.reference}</td>
                  <td className="py-2.5 uppercase font-semibold text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded ${
                      row.type === 'invoice' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5">{row.description}</td>
                  <td className="py-2.5 text-right font-semibold">
                    {row.change > 0 ? (
                      <span className="text-blue-600">+₹{row.change.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-600">-₹{Math.abs(row.change).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900">₹{row.runningBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer signature */}
          <div className="mt-20 flex justify-between items-center text-xs text-slate-400">
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Farmer Signature
            </div>
            <div className="w-40 text-center border-t border-slate-200 pt-1">
              Authorized Accountant
            </div>
          </div>

          <p className="text-center text-[8px] text-slate-355 mt-24">
            This statement represents farmer ledger ledger entries compiled via ANR Dairy SaaS and does not require signatures.
          </p>
        </div>
      ) : (
        /* layout mode: 80mm THERMAL RECEIPT */
        <div className="w-[80mm] p-[4mm] bg-white border border-slate-250 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-mono text-[9px] leading-tight">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h1 className="text-sm font-black uppercase tracking-tight">{dairyName}</h1>
            <p className="text-[8px] text-slate-500">ANR Dairy Management</p>
            <p className="text-[8px] text-slate-655">Ph: {dairyPhone}</p>
            <p className="text-[7.5px] leading-none text-slate-600">{dairyAddress}</p>
          </div>

          <p className="text-center my-2 text-slate-450">---------------------------------</p>

          {/* Metadata details */}
          <div className="space-y-1">
            <p className="text-center font-bold text-[10px] uppercase pb-1">PASSBOOK STATEMENT</p>
            <p><strong>Farmer:</strong> {farmer.name}</p>
            <p><strong>ID Code:</strong> {farmer.farmerCode}</p>
            <p><strong>Mobile:</strong> {farmer.phone}</p>
            <p><strong>Village:</strong> {farmer.village}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>

          <p className="text-center my-2 text-slate-450">---------------------------------</p>

          {/* Table Header */}
          <div className="grid grid-cols-4 font-bold border-b border-dashed border-slate-300 pb-1 mb-1 text-[8px]">
            <span>Date</span>
            <span>Ref No.</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Balance</span>
          </div>

          {/* Table Rows */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-1 mb-2">
            {passbook.map((row, idx) => (
              <div key={idx} className="grid grid-cols-4 text-[8px]">
                <span>{new Date(row.date).toLocaleDateString().substring(0, 5)}</span>
                <span className="truncate pr-1">{row.reference.replace('ANR-', '')}</span>
                <span className="text-right font-semibold">
                  {row.change > 0 ? `+${row.change.toFixed(0)}` : `-${Math.abs(row.change).toFixed(0)}`}
                </span>
                <span className="text-right font-bold">₹{row.runningBalance.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Summary values */}
          <div className="space-y-1 text-right text-[10px]">
            <p className="font-black uppercase text-slate-900">
              Ledger Bal: ₹{passbookData.runningBalance?.toFixed(2) || '0.00'}
            </p>
          </div>

          <p className="text-center my-3 text-slate-450">---------------------------------</p>

          <div className="text-center space-y-1 pt-2">
            <p className="text-[7.5px] text-slate-500">Thank you for partnership!</p>
            <p className="text-[7px] text-slate-450">ANR Dairy Management ERP</p>
          </div>
        </div>
      )}

    </div>
  );
}
