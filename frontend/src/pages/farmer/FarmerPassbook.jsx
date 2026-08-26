import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUI } from '../../context/UIContext';
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  Download, 
  FileDown, 
  Droplet 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FarmerPassbook() {
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('milk'); // 'milk' | 'bills' | 'payments'
  
  // Data lists
  const [collections, setCollections] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCollectionsData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await axios.get(`${baseUrl}/api/v1/farmers/portal/collections?page=${page}&limit=10`, { headers });
      if (response.data && response.data.success) {
        setCollections(response.data.data.collections);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to load collections history logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  const fetchInvoicesData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await axios.get(`${baseUrl}/api/v1/farmers/portal/invoices?page=${page}&limit=10`, { headers });
      if (response.data && response.data.success) {
        setInvoices(response.data.data.invoices);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to load invoice statements list', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  const fetchPaymentsData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const response = await axios.get(`${baseUrl}/api/v1/farmers/portal/payments?page=${page}&limit=10`, { headers });
      if (response.data && response.data.success) {
        setPayments(response.data.data.payments);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      showToast('Failed to retrieve payments history list', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  // Load data based on tab or page shifts
  useEffect(() => {
    if (activeTab === 'milk') {
      fetchCollectionsData();
    } else if (activeTab === 'bills') {
      fetchInvoicesData();
    } else if (activeTab === 'payments') {
      fetchPaymentsData();
    }
  }, [activeTab, page, fetchCollectionsData, fetchInvoicesData, fetchPaymentsData]);

  // Tab switcher resets page to 1
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setPage(1);
  };

  // PDF Trigger
  const handleDownloadInvoicePDF = async (invoiceId, invoiceNumber) => {
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const response = await axios({
        url: `${baseUrl}/api/v1/invoices/${invoiceId}/pdf`,
        method: 'GET',
        responseType: 'blob', // Important for downloading PDF files
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(fileBlob);
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      showToast('Bill Invoice PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download invoice statement PDF file', 'error');
    }
  };

  const handleDownloadPaymentPDF = async (paymentId, paymentNumber) => {
    try {
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const response = await axios({
        url: `${baseUrl}/api/v1/payments/${paymentId}/pdf`,
        method: 'GET',
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const fileUrl = window.URL.createObjectURL(fileBlob);
      const fileLink = document.createElement('a');
      fileLink.href = fileUrl;
      fileLink.setAttribute('download', `Receipt_${paymentNumber}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
      showToast('Payment Receipt PDF downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to download payment receipt PDF file', 'error');
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
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{t('myPassbook')}</h1>
        <p className="text-xs text-slate-450 mt-1">{t('farmerPassbookSub')}</p>
      </div>

      {/* Tabs list bar */}
      <div className="flex border-b border-slate-200 dark:border-dark-border select-none">
        <button
          onClick={() => handleTabChange('milk')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'milk'
              ? 'border-blue-600 text-blue-650 dark:text-brand-400'
              : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>{t('milkDeliveries')}</span>
        </button>
        
        <button
          onClick={() => handleTabChange('bills')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'bills'
              ? 'border-blue-600 text-blue-650 dark:text-brand-400'
              : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('billingInvoices')}</span>
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-650 dark:text-brand-400'
              : 'border-transparent text-slate-455 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('paymentsLedger')}</span>
        </button>
      </div>

      {/* Main Grid table view */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            
            {/* TABS 1: Milk Deliveries history */}
            {activeTab === 'milk' && (
              collections.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450">{t('noCollections')}</div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/45 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">{t('dateShiftCol')}</th>
                      <th className="p-4">{t('milkTypeCol')}</th>
                      <th className="p-4">{t('litersCol')}</th>
                      <th className="p-4">{t('fatPercentage')}</th>
                      <th className="p-4">{t('snfPercentage')}</th>
                      <th className="p-4">{t('rateLCol')}</th>
                      <th className="p-4">{t('totalAmountCol')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {collections.map(col => (
                      <tr key={col._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-semibold">
                          <p>{formatDate(col.date)}</p>
                          <span className="text-[9px] font-bold text-slate-400 capitalize">{col.shift}</span>
                        </td>
                        <td className="p-4 font-bold capitalize text-slate-700 dark:text-slate-300">{col.milkType}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{col.quantity.toFixed(2)} L</td>
                        <td className="p-4 font-semibold text-slate-600">{col.fat.toFixed(1)}%</td>
                        <td className="p-4 font-semibold text-slate-600">{col.snf.toFixed(1)}%</td>
                        <td className="p-4 font-semibold text-slate-655 dark:text-slate-350">₹{col.ratePerLiter.toFixed(2)}</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-455">₹{col.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* TABS 2: Bills & Invoices list */}
            {activeTab === 'bills' && (
              invoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450">{t('noInvoices')}</div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/45 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">{t('invoiceNo')}</th>
                      <th className="p-4">{t('periodRange')}</th>
                      <th className="p-4">{t('totalLiters')}</th>
                      <th className="p-4">{t('avgFatSnf')}</th>
                      <th className="p-4">{t('netPayout')}</th>
                      <th className="p-4">{t('paidPending')}</th>
                      <th className="p-4">{t('status')}</th>
                      <th className="p-4 text-right">{t('pdf')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {invoices.map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-200">{inv.invoiceNumber}</td>
                        <td className="p-4 font-medium text-slate-500">
                          {formatDate(inv.startDate)} to {formatDate(inv.endDate)}
                        </td>
                        <td className="p-4 font-semibold">{inv.totalLiters.toFixed(2)} L</td>
                        <td className="p-4 text-slate-500">{inv.avgFat.toFixed(1)}% / {inv.avgSnf.toFixed(1)}%</td>
                        <td className="p-4 font-bold text-emerald-650">₹{inv.netAmount.toFixed(2)}</td>
                        <td className="p-4">
                          <p className="font-semibold text-emerald-600">Paid: ₹{inv.paidAmount.toFixed(2)}</p>
                          <span className="text-[9px] font-bold text-red-500">Pending: ₹{inv.pendingAmount.toFixed(2)}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDownloadInvoicePDF(inv._id, inv.invoiceNumber)}
                            className="p-1.5 hover:bg-slate-105 border border-slate-200 dark:border-dark-border hover:border-slate-300 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-205 transition"
                            title="Download Invoice Statement PDF"
                          >
                            <FileDown className="w-4 h-4 text-blue-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* TABS 3: Payment payouts receipts */}
            {activeTab === 'payments' && (
              payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450">{t('noPayments')}</div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850/45 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">{t('receiptNo')}</th>
                      <th className="p-4">{t('paymentDate')}</th>
                      <th className="p-4">{t('invoiceRef')}</th>
                      <th className="p-4">{t('paidPayout')}</th>
                      <th className="p-4">{t('payoutMethod')}</th>
                      <th className="p-4">{t('refNumber')}</th>
                      <th className="p-4 text-right">{t('receiptPdf')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                    {payments.map(pay => (
                      <tr key={pay._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-200">{pay.paymentNumber}</td>
                        <td className="p-4 font-semibold">{formatDate(pay.paymentDate)}</td>
                        <td className="p-4 font-medium text-slate-500">{pay.invoice?.invoiceNumber || 'N/A'}</td>
                        <td className="p-4 font-bold text-emerald-600">₹{pay.paidAmount.toFixed(2)}</td>
                        <td className="p-4 font-semibold text-slate-600">{pay.paymentMode}</td>
                        <td className="p-4 font-medium text-slate-400">{pay.referenceNumber || 'N/A'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDownloadPaymentPDF(pay._id, pay.paymentNumber)}
                            className="p-1.5 hover:bg-slate-105 border border-slate-200 dark:border-dark-border hover:border-slate-300 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-205 transition"
                            title="Download Receipt Statement PDF"
                          >
                            <Download className="w-4 h-4 text-blue-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-dark-border px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
