import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDairyProfile } from '../../../services/dairyService';
import api from '../../../services/api';
import { Printer, Download, ArrowLeft, Layout, FileText } from 'lucide-react';

export default function PrintPayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [profile, setProfile] = useState(null);
  const [layoutMode, setLayoutMode] = useState('a4'); // 'a4' or 'thermal'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payRes, profRes] = await Promise.all([
          api.get(`/payments/${id}`),
          getDairyProfile()
        ]);
        if (payRes.data && payRes.data.success) setPayment(payRes.data.data);
        if (profRes && profRes.success) setProfile(profRes.data);
      } catch (error) {
        console.error('Failed to load payment receipt print details', error);
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
          <p className="text-sm font-semibold text-slate-500">Preparing Payment Receipt Preview...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-main text-slate-500">
        Payment receipt details not found.
      </div>
    );
  }

  const dairyName = profile?.dairyName || 'ANR Dairy';
  const ownerName = profile?.ownerName || 'ANR Owner';
  const dairyPhone = profile?.phone || '9999999999';
  const dairyAddress = profile?.address || 'Penugonda, AP';
  
  const getPdfUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/payments/${id}/pdf`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-dark-main p-4 sm:p-6 print:p-0 print:bg-white text-slate-800">
      
      {/* Floating Action Menu Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={() => navigate('/admin/payments')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payments</span>
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
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Render Document Container */}
      {layoutMode === 'a4' ? (
        /* layout mode: STANDARD A4 SHEET */
        <div className="w-[210mm] min-h-[148mm] p-[15mm] bg-white border border-slate-200 shadow-md mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 text-sm leading-relaxed rounded-md">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black tracking-tight text-blue-800">{dairyName}</h1>
              <p className="text-[10px] text-slate-550 font-semibold mt-0.5">ANR Dairy Management ERP Payout</p>
              <p className="text-[10px] text-slate-600 mt-1.5">Owner: {ownerName} | Ph: {dairyPhone}</p>
              <p className="text-[10px] text-slate-650 leading-none">{dairyAddress}</p>
            </div>
            <div className="text-right">
              <h2 className="text-sm font-black text-slate-800 tracking-wider">PAYMENT CONFIRMATION VOUCHER</h2>
              <p className="text-xs font-bold text-blue-650 mt-1">{payment.paymentNumber}</p>
              <p className="text-[10px] text-slate-500 mt-1">Date: {new Date(payment.paymentDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 my-4" />

          {/* Details Metadata grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Farmer Account Details</p>
              <p className="font-extrabold text-slate-850 mt-1">{payment.farmer?.name}</p>
              <p className="font-semibold text-slate-600">Farmer Code ID: {payment.farmer?.farmerCode}</p>
              <p className="text-slate-500">Phone: {payment.farmer?.phone} | Village: {payment.farmer?.village}</p>
            </div>
            <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Invoice & Transaction Reference</p>
              <p className="font-extrabold text-slate-850 mt-1">Invoice Ref: {payment.invoice?.invoiceNumber}</p>
              <p className="font-semibold text-slate-600">Payment Mode: <span className="capitalize">{payment.paymentMode}</span></p>
              {payment.referenceNumber && <p className="text-slate-500">Transaction ID: {payment.referenceNumber}</p>}
            </div>
          </div>

          {/* Receipt Amount Box */}
          <div className="bg-slate-900 text-white rounded p-4 flex justify-between items-center text-xs">
            <span className="font-extrabold uppercase tracking-wider">Total Amount Disbursed:</span>
            <span className="text-base font-black">₹{payment.paidAmount?.toFixed(2)}</span>
          </div>

          {payment.notes && (
            <p className="text-[10px] text-slate-450 italic mt-3">Remarks: {payment.notes}</p>
          )}

          {/* Signatures */}
          <div className="mt-12 flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Farmer Sign: _____________________</span>
            <span>Authorized Signature: _____________________</span>
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
            <p className="text-center font-bold text-[10px] uppercase pb-1">PAYMENT RECEIPT</p>
            <p><strong>Receipt No:</strong> {payment.paymentNumber}</p>
            <p><strong>Date:</strong> {new Date(payment.paymentDate).toLocaleDateString()}</p>
            <p><strong>Farmer:</strong> {payment.farmer?.name} ({payment.farmer?.farmerCode})</p>
            <p><strong>Invoice Ref:</strong> {payment.invoice?.invoiceNumber}</p>
            <p><strong>Method Mode:</strong> {payment.paymentMode}</p>
            {payment.referenceNumber && <p><strong>Tx Ref:</strong> {payment.referenceNumber}</p>}
            <p className="text-center my-1 text-slate-300">-----------------</p>
            <p className="text-[11px] font-black uppercase text-slate-900 text-right">
              Paid Amt: ₹{payment.paidAmount.toFixed(2)}
            </p>
          </div>

          <p className="text-center my-3 text-slate-450">---------------------------------</p>

          <div className="text-center space-y-1 pt-2">
            <p className="text-[7.5px] text-slate-500">Thank you for partnership!</p>
            <p className="text-[7px] text-slate-400">ANR Dairy SaaS Systems</p>
          </div>
        </div>
      )}

    </div>
  );
}
