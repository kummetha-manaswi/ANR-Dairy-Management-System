import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { getFarmers } from '../../services/farmerService';
import { 
  getBillingReport, 
  getOutstandingReport, 
  getCollectionsReport, 
  getQualityReport,
  getBillingExcelUrl, 
  getOutstandingExcelUrl,
  getCollectionsExcelUrl,
  getQualityExcelUrl,
  getCollectionsPdfUrl,
  getQualityPdfUrl
} from '../../services/reportService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  IndianRupee, 
  HelpCircle, 
  Users,
  Droplet,
  Search,
  Filter,
  Printer,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Reports() {
  const { showToast } = useUI();

  // Active Tab: billing, collections, quality, outstanding
  const [activeTab, setActiveTab] = useState('billing');

  // Farmers lookup list
  const [farmers, setFarmers] = useState([]);
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        const res = await getFarmers({ limit: 1000, status: 'active' });
        if (res.success) setFarmers(res.data.farmers);
      } catch (err) {
        console.error(err);
      }
    };
    loadFarmers();
  }, []);

  // --- REPORT TAB 1: BILLING & INVOICES ---
  const [billStart, setBillStart] = useState('');
  const [billEnd, setBillEnd] = useState('');
  const [billStatus, setBillStatus] = useState('');
  const [billData, setBillData] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);

  const fetchBillingReport = async () => {
    setLoadingBill(true);
    try {
      const res = await getBillingReport({
        startDate: billStart || undefined,
        endDate: billEnd || undefined,
        status: billStatus || undefined
      });
      if (res.success) {
        setBillData(res.data);
        showToast('Billing report compiled successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to compile billing report', 'error');
    } finally {
      setLoadingBill(false);
    }
  };

  // --- REPORT TAB 2: MILK COLLECTIONS ---
  const [colStart, setColStart] = useState('');
  const [colEnd, setColEnd] = useState('');
  const [colFarmer, setColFarmer] = useState('');
  const [colVillage, setColVillage] = useState('');
  const [colShift, setColShift] = useState('');
  const [colType, setColType] = useState('');
  const [colSortBy, setColSortBy] = useState('date');
  const [colSortOrder, setColSortOrder] = useState('desc');
  const [colPage, setColPage] = useState(1);
  const [colData, setColData] = useState(null);
  const [loadingCol, setLoadingCol] = useState(false);

  const fetchCollectionsReport = async () => {
    setLoadingCol(true);
    try {
      const res = await getCollectionsReport({
        startDate: colStart || undefined,
        endDate: colEnd || undefined,
        farmerId: colFarmer || undefined,
        village: colVillage || undefined,
        shift: colShift || undefined,
        milkType: colType || undefined,
        sortBy: colSortBy,
        sortOrder: colSortOrder,
        page: colPage,
        limit: 15
      });
      if (res.success) {
        setColData(res.data);
      }
    } catch (err) {
      showToast('Failed to load collections report', 'error');
    } finally {
      setLoadingCol(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'collections') {
      fetchCollectionsReport();
    }
  }, [colPage, colSortBy, colSortOrder, activeTab]);

  // --- REPORT TAB 3: FAT & SNF QUALITY ---
  const [qStart, setQStart] = useState('');
  const [qEnd, setQEnd] = useState('');
  const [qFarmer, setQFarmer] = useState('');
  const [qType, setQType] = useState('');
  const [qSortBy, setQSortBy] = useState('date');
  const [qSortOrder, setQSortOrder] = useState('desc');
  const [qPage, setQPage] = useState(1);
  const [qData, setQData] = useState(null);
  const [loadingQ, setLoadingQ] = useState(false);

  const fetchQualityReport = async () => {
    setLoadingQ(true);
    try {
      const res = await getQualityReport({
        startDate: qStart || undefined,
        endDate: qEnd || undefined,
        farmerId: qFarmer || undefined,
        milkType: qType || undefined,
        sortBy: qSortBy,
        sortOrder: qSortOrder,
        page: qPage,
        limit: 15
      });
      if (res.success) {
        setQData(res.data);
      }
    } catch (err) {
      showToast('Failed to compile quality report', 'error');
    } finally {
      setLoadingQ(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'quality') {
      fetchQualityReport();
    }
  }, [qPage, qSortBy, qSortOrder, activeTab]);

  // --- REPORT TAB 4: OUTSTANDING PAYMENT ---
  const [outData, setOutData] = useState(null);
  const [loadingOut, setLoadingOut] = useState(false);

  const fetchOutstandingReport = async () => {
    setLoadingOut(true);
    try {
      const res = await getOutstandingReport();
      if (res.success) {
        setOutData(res.data);
      }
    } catch (err) {
      showToast('Failed to load outstanding balance ledger', 'error');
    } finally {
      setLoadingOut(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'outstanding' && !outData) {
      fetchOutstandingReport();
    }
  }, [activeTab]);

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
        <Breadcrumbs items={[{ label: 'System Reports' }]} />
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          Reports Center
        </h1>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 dark:border-dark-border select-none overflow-x-auto whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'billing' ? 'border-blue-500 text-blue-600 dark:text-brand-400' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Billing & Invoices
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'collections' ? 'border-blue-500 text-blue-600 dark:text-brand-400' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Milk Collection ledger
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'quality' ? 'border-blue-500 text-blue-600 dark:text-brand-400' : 'border-transparent hover:text-slate-800'
          }`}
        >
          FAT & SNF Quality Reports
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`pb-3 px-4 border-b-2 transition ${
            activeTab === 'outstanding' ? 'border-blue-500 text-blue-600 dark:text-brand-400' : 'border-transparent hover:text-slate-800'
          }`}
        >
          Outstanding Liabilities
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* --- TAB 1: BILLING --- */}
        {activeTab === 'billing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col md:flex-row gap-4 items-end justify-between shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:max-w-2xl text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    value={billStart}
                    onChange={(e) => setBillStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    value={billEnd}
                    onChange={(e) => setBillEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-202"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Invoice Status</label>
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-650"
                  >
                    <option value="">All Statuses</option>
                    <option value="Generated">Generated (Due)</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={fetchBillingReport}
                  disabled={loadingBill}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
                >
                  {loadingBill ? 'Compiling...' : 'Run Query'}
                </button>
                {billData && (
                  <>
                    <a
                      href={getBillingExcelUrl({ startDate: billStart, endDate: billEnd, status: billStatus })}
                      download
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-705 dark:text-slate-350 bg-white dark:bg-dark-surface hover:bg-slate-50 border border-slate-200 rounded-md shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </a>
                    <a
                      href={`/admin/print/monthly?month=${billStart ? new Date(billStart).getMonth() + 1 : new Date().getMonth() + 1}&year=${billStart ? new Date(billStart).getFullYear() : new Date().getFullYear()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-705 dark:text-slate-355 bg-white dark:bg-dark-surface hover:bg-slate-50 border border-slate-200 rounded-md shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Monthly Report</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {billData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
                  <div className="p-4 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Invoices</p>
                    <h4 className="text-lg font-black text-slate-700 dark:text-slate-205 mt-1">{billData.summary.count} Bills</h4>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Quantity</p>
                    <h4 className="text-lg font-black text-slate-700 dark:text-slate-205 mt-1 font-mono">{billData.summary.totalLiters.toFixed(2)} L</h4>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Payout Paid</p>
                    <h4 className="text-lg font-black text-emerald-600 mt-1 font-mono">₹{billData.summary.paidAmount.toFixed(2)}</h4>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding Pending</p>
                    <h4 className="text-lg font-black text-amber-600 mt-1 font-mono">₹{billData.summary.pendingAmount.toFixed(2)}</h4>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3">Invoice Number</th>
                          <th className="p-3">Farmer</th>
                          <th className="p-3">Range</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3">FAT/SNF</th>
                          <th className="p-3">Net Due</th>
                          <th className="p-3 text-right">Pending</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {billData.invoices.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-semibold">{inv.invoiceNumber}</td>
                            <td className="p-3 font-bold text-slate-700 dark:text-slate-250">{inv.farmer?.name} ({inv.farmer?.farmerCode})</td>
                            <td className="p-3 font-medium text-slate-400">{formatDate(inv.startDate)} to {formatDate(inv.endDate)}</td>
                            <td className="p-3 font-semibold">{inv.totalLiters.toFixed(2)} L</td>
                            <td className="p-3">{inv.avgFat.toFixed(1)}% / {inv.avgSnf.toFixed(1)}%</td>
                            <td className="p-3 font-bold">₹{inv.netAmount.toFixed(2)}</td>
                            <td className="p-3 font-extrabold text-amber-600 text-right">₹{inv.pendingAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* --- TAB 2: MILK COLLECTIONS --- */}
        {activeTab === 'collections' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Filters panel */}
            <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 pb-2">
                Query Filters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={colStart}
                    onChange={(e) => setColStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={colEnd}
                    onChange={(e) => setColEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Farmer</label>
                  <select
                    value={colFarmer}
                    onChange={(e) => setColFarmer(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  >
                    <option value="">All Farmers</option>
                    {farmers.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.farmerCode})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Village</label>
                  <input
                    type="text"
                    value={colVillage}
                    onChange={(e) => setColVillage(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                    placeholder="Search village name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Shift</label>
                  <select
                    value={colShift}
                    onChange={(e) => setColShift(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  >
                    <option value="">All Shifts</option>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Milk Type</label>
                  <select
                    value={colType}
                    onChange={(e) => setColType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  >
                    <option value="">All Types</option>
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setColPage(1); fetchCollectionsReport(); }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                >
                  Apply Query Filters
                </button>
                {colData && (
                  <>
                    <a
                      href={getCollectionsExcelUrl({ startDate: colStart, endDate: colEnd, farmerId: colFarmer, village: colVillage, shift: colShift, milkType: colType })}
                      download
                      className="flex items-center gap-1 px-4 py-2 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </a>
                    <a
                      href={`/admin/print/collections?startDate=${colStart}&endDate=${colEnd}&farmerId=${colFarmer}&village=${colVillage}&shift=${colShift}&milkType=${colType}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-4 py-2 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Preview</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Results deck */}
            {loadingCol ? (
              <TableSkeleton />
            ) : colData?.collections.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="No Collections Found"
                description="Adjust query filter boundaries. No entries match your selected criteria."
              />
            ) : (
              colData && (
                <div className="space-y-6">
                  {/* Totals deck */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center select-none text-xs">
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Intake</p>
                      <p className="text-base font-extrabold mt-0.5">{colData.summary.totalLiters.toFixed(2)} L</p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Quality FAT% / SNF%</p>
                      <p className="text-base font-extrabold mt-0.5">{colData.summary.avgFat.toFixed(1)}% / {colData.summary.avgSnf.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Milk Value</p>
                      <p className="text-base font-extrabold text-emerald-600 mt-0.5">₹{colData.summary.totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Record Entries</p>
                      <p className="text-base font-extrabold mt-0.5">{colData.summary.count} logs</p>
                    </div>
                  </div>

                  {/* List Table */}
                  <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3">Shift</th>
                            <th className="p-3">Farmer</th>
                            <th className="p-3">Village</th>
                            <th className="p-3">Milk Type</th>
                            <th className="p-3">Quantity</th>
                            <th className="p-3">FAT / SNF</th>
                            <th className="p-3">Rate / L</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                          {colData.collections.map((col) => (
                            <tr key={col._id} className="hover:bg-slate-50/40">
                              <td className="p-3 font-semibold">{formatDate(col.date)}</td>
                              <td className="p-3 capitalize">{col.shift}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-250">{col.farmerName} ({col.farmerCode})</td>
                              <td className="p-3 text-slate-500">{col.village}</td>
                              <td className="p-3 uppercase">{col.milkType}</td>
                              <td className="p-3 font-semibold">{col.quantity.toFixed(2)} L</td>
                              <td className="p-3">{col.fat.toFixed(1)}% / {col.snf.toFixed(1)}%</td>
                              <td className="p-3 font-semibold">₹{col.ratePerLiter.toFixed(2)}</td>
                              <td className="p-3 font-extrabold text-slate-800 dark:text-slate-202 text-right">₹{col.totalAmount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* --- TAB 3: QUALITY REPORT --- */}
        {activeTab === 'quality' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Filters */}
            <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 pb-2">
                Quality Filters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={qStart}
                    onChange={(e) => setQStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">End Date</label>
                  <input
                    type="date"
                    value={qEnd}
                    onChange={(e) => setQEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Farmer</label>
                  <select
                    value={qFarmer}
                    onChange={(e) => setQFarmer(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  >
                    <option value="">All Farmers</option>
                    {farmers.map(f => (
                      <option key={f._id} value={f._id}>{f.name} ({f.farmerCode})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase">Milk Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-650"
                  >
                    <option value="">All Types</option>
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setQPage(1); fetchQualityReport(); }}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                >
                  Query Quality
                </button>
                {qData && (
                  <>
                    <a
                      href={getQualityExcelUrl({ startDate: qStart, endDate: qEnd, farmerId: qFarmer, milkType: qType })}
                      download
                      className="flex items-center gap-1 px-4 py-2 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </a>
                    <a
                      href={getQualityPdfUrl({ startDate: qStart, endDate: qEnd, farmerId: qFarmer, milkType: qType })}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-4 py-2 font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {loadingQ ? (
              <TableSkeleton />
            ) : qData?.qualityLogs.length === 0 ? (
              <EmptyState
                icon={Droplet}
                title="No Quality Data"
                description="No quality logs match your filters."
              />
            ) : (
              qData && (
                <div className="space-y-6">
                  {/* Quality metrics summaries */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center select-none text-xs">
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-850 rounded-lg">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">FAT % (Avg / Min / Max)</p>
                      <p className="text-base font-extrabold mt-0.5">
                        {qData.summary.avgFat.toFixed(2)}% <span className="text-[10px] text-slate-400 font-medium">({qData.summary.minFat.toFixed(1)}% - {qData.summary.maxFat.toFixed(1)}%)</span>
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-850 rounded-lg">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">SNF % (Avg / Min / Max)</p>
                      <p className="text-base font-extrabold mt-0.5">
                        {qData.summary.avgSnf.toFixed(2)}% <span className="text-[10px] text-slate-400 font-medium">({qData.summary.minSnf.toFixed(1)}% - {qData.summary.maxSnf.toFixed(1)}%)</span>
                      </p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-850 rounded-lg">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Total Checked Logs</p>
                      <p className="text-base font-extrabold mt-0.5">{qData.summary.count} entries</p>
                    </div>
                  </div>

                  {/* List Table */}
                  <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-3">Date</th>
                            <th className="p-3">Shift</th>
                            <th className="p-3">Farmer ID</th>
                            <th className="p-3">Farmer Name</th>
                            <th className="p-3">Milk Type</th>
                            <th className="p-3">Milk Vol (L)</th>
                            <th className="p-3">FAT %</th>
                            <th className="p-3">SNF %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                          {qData.qualityLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50/40">
                              <td className="p-3 font-semibold">{formatDate(log.date)}</td>
                              <td className="p-3 capitalize">{log.shift}</td>
                              <td className="p-3 font-mono font-bold text-slate-550">{log.farmerCode}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-250">{log.farmerName}</td>
                              <td className="p-3 uppercase">{log.milkType}</td>
                              <td className="p-3 font-semibold">{log.quantity.toFixed(2)} L</td>
                              <td className="p-3 font-extrabold text-amber-600">{log.fat.toFixed(1)}%</td>
                              <td className="p-3 font-extrabold text-indigo-600">{log.snf.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* --- TAB 4: OUTSTANDING PAYMENT --- */}
        {activeTab === 'outstanding' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {outData && (
              <div className="flex justify-between items-center bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-4 shadow-sm select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-955 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Liabilities</p>
                    <h3 className="text-xl font-black text-amber-600 font-mono">₹{outData.totalOutstanding.toFixed(2)}</h3>
                  </div>
                </div>
                
                <a
                  href={getOutstandingExcelUrl()}
                  download
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-white dark:bg-dark-surface border border-slate-200 rounded-md shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel Sheet</span>
                </a>
              </div>
            )}

            {loadingOut ? (
              <TableSkeleton />
            ) : outData?.outstanding.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="All Paid"
                description="Zero outstanding liabilities. All farmers invoices have been paid."
              />
            ) : (
              outData && (
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3">Farmer ID</th>
                          <th className="p-3">Farmer Name</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Village</th>
                          <th className="p-3">Unpaid Bills</th>
                          <th className="p-3 text-right">Outstanding Due Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                        {outData.outstanding.map((row) => (
                          <tr key={row.farmerId} className="hover:bg-slate-50/40">
                            <td className="p-3 font-semibold">{row.farmerCode}</td>
                            <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{row.name}</td>
                            <td className="p-3 text-slate-500">{row.phone}</td>
                            <td className="p-3 text-slate-500">{row.village}</td>
                            <td className="p-3 font-semibold">{row.invoiceCount} Bills</td>
                            <td className="p-3 font-extrabold text-amber-600 text-right">₹{row.outstandingAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </motion.div>
        )}
      </div>

    </div>
  );
}
