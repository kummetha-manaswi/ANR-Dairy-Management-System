import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { getFarmers } from '../../services/farmerService';
import { getPassbookTimeline } from '../../services/reportService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import { 
  Users, 
  HelpCircle, 
  TrendingUp, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminFarmerPassbook() {
  const { showToast } = useUI();

  // Farmers list
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Selected Farmer
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [passbookData, setPassbookData] = useState(null);
  const [loadingPassbook, setLoadingPassbook] = useState(false);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const res = await getFarmers({ limit: 1000, status: 'active' });
        if (res.success) {
          setFarmers(res.data.farmers);
        }
      } catch (err) {
        showToast('Failed to load farmers registry', 'error');
      } finally {
        setLoadingFarmers(false);
      }
    };
    fetchFarmers();
  }, [showToast]);

  // Fetch passbook timeline when farmer changes
  useEffect(() => {
    if (!selectedFarmerId) {
      setPassbookData(null);
      return;
    }

    const loadPassbook = async () => {
      setLoadingPassbook(true);
      try {
        const res = await getPassbookTimeline(selectedFarmerId);
        if (res.success) {
          setPassbookData(res.data);
        }
      } catch (err) {
        showToast('Failed to load passbook timeline', 'error');
      } finally {
        setLoadingPassbook(false);
      }
    };
    loadPassbook();
  }, [selectedFarmerId, showToast]);

  const handlePrint = () => {
    window.print();
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
      <div className="flex justify-between items-start gap-4 print:hidden">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'Farmer Passbook' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Digital Passbook Ledger
          </h1>
        </div>

        {passbookData && (
          <a
            href={`/admin/print/passbook/${selectedFarmerId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Preview / PDF</span>
          </a>
        )}
      </div>

      {/* Select Farmer dropdown */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 shadow-sm select-none print:hidden w-full max-w-sm">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Farmer Profile</label>
          <div className="relative">
            <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <select
              value={selectedFarmerId}
              onChange={(e) => setSelectedFarmerId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
            >
              <option value="">-- Choose Registered Farmer --</option>
              {farmers.map(f => (
                <option key={f._id} value={f._id}>{f.name} ({f.farmerCode})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Passbook timeline content */}
      {loadingPassbook ? (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-12 text-center text-slate-400">
          Loading passbook ledger timeline...
        </div>
      ) : !passbookData ? (
        <EmptyState
          icon={BookOpen}
          title="No Passbook Selected"
          description="Please choose a farmer from the filter dropdown above to visualize their chronological financial ledger."
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Print Title Header (Visible only when printing) */}
          <div className="hidden print:block border-b border-slate-300 pb-3 mb-6">
            <h1 className="text-xl font-bold text-slate-900">ANR Dairy Management System</h1>
            <p className="text-xs text-slate-500">Farmer Passbook Statement Ledger</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <p><span className="font-semibold">Farmer ID:</span> {passbookData.farmer.farmerCode}</p>
                <p><span className="font-semibold">Farmer Name:</span> {passbookData.farmer.name}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Phone:</span> {passbookData.farmer.phone}</p>
                <p><span className="font-semibold">Village:</span> {passbookData.farmer.village}</p>
              </div>
            </div>
          </div>

          {/* Running Balance Card */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm flex items-center justify-between select-none print:bg-slate-50 print:border-slate-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-955 flex items-center justify-center text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance Due to Farmer</p>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                  ₹{passbookData.runningBalance.toFixed(2)}
                </h2>
              </div>
            </div>

            <div className="text-xs text-right text-slate-400 font-medium">
              <p>Farmer: {passbookData.farmer.name}</p>
              <p>Code: {passbookData.farmer.farmerCode} | {passbookData.farmer.village}</p>
            </div>
          </div>

          {/* Ledger event timeline list */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm print:border-slate-300">
            <div className="p-4 border-b border-slate-100 dark:border-dark-border print:hidden">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Transaction Timeline Events
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Transaction Date</th>
                    <th className="p-4">Event Details</th>
                    <th className="p-4">Reference ID</th>
                    <th className="p-4 text-right">Debit (Paid)</th>
                    <th className="p-4 text-right">Credit (Invoice)</th>
                    <th className="p-4 text-right">Running Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                  {passbookData.passbook.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/40">
                      {/* Date */}
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-350">
                        {formatDate(item.date)}
                      </td>

                      {/* Description */}
                      <td className="p-4 leading-normal font-medium text-slate-650 dark:text-slate-300 max-w-xs">
                        <p>{item.description}</p>
                        {item.liters > 0 && (
                          <span className="text-[10px] text-slate-400">Milk Volume: {item.liters.toFixed(2)} L</span>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="p-4 font-mono font-bold text-slate-500">
                        {item.reference}
                      </td>

                      {/* Debit (Payment paid out to farmer) */}
                      <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                        {item.type === 'payment' ? `-₹${item.amount.toFixed(2)}` : '-'}
                      </td>

                      {/* Credit (Invoice created/dairy owes farmer) */}
                      <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.type === 'invoice' ? `+₹${item.amount.toFixed(2)}` : '-'}
                      </td>

                      {/* Running balance */}
                      <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                        ₹{item.runningBalance.toFixed(2)}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
}
