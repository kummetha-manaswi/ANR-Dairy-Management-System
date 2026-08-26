import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useUI } from '../../context/UIContext';
import { getFarmers } from '../../services/farmerService';
import { getRateCharts, calculateRatePreview } from '../../services/rateService';
import { addCollection, getCollections } from '../../services/collectionService';
import { getDairyProfile } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { PlusSquare, Play, RefreshCw, Sun, Moon, ArrowRight, CheckCircle, HelpCircle, Droplet, IndianRupee, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollectionEntry() {
  const { showToast } = useUI();

  // Reference elements to loop focus keyboard mouse-free
  const farmerSelectRef = useRef(null);
  const qtyInputRef = useRef(null);
  const fatInputRef = useRef(null);
  const snfInputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // States
  const [farmers, setFarmers] = useState([]);
  const [rateCharts, setRateCharts] = useState([]);
  const [validationLimits, setValidationLimits] = useState({ minFat: 1.5, maxFat: 15.0, minSnf: 5.0, maxSnf: 12.0 });
  const [todayStats, setTodayStats] = useState({ totalLiters: 0, totalAmount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState(new Date().getHours() < 12 ? 'morning' : 'evening');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Live calculator states
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [livePreview, setLivePreview] = useState(null); // holds preview details
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Input states
  const [farmerCodeQuery, setFarmerCodeQuery] = useState('');
  const [qtyVal, setQtyVal] = useState('');
  const [fatVal, setFatVal] = useState('');
  const [snfVal, setSnfVal] = useState('');

  // Fetch today's summary metrics
  const fetchTodayStats = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await getCollections({ startDate: todayStr, endDate: todayStr });
      if (res && res.success) {
        const logs = res.data.collections;
        const totalLiters = logs.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = logs.reduce((sum, item) => sum + item.totalAmount, 0);
        setTodayStats({
          totalLiters,
          totalAmount,
          totalCount: logs.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch today stats', error);
    }
  };

  // Fetch farmers registry, active rate charts, and settings ranges on load
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [farmersRes, ratesRes, profileRes] = await Promise.all([
          getFarmers({ limit: 1000, status: 'active' }),
          getRateCharts({ isActive: 'true' }),
          getDairyProfile()
        ]);
        if (farmersRes.success) setFarmers(farmersRes.data.farmers);
        if (ratesRes.success) setRateCharts(ratesRes.data.charts);
        if (profileRes && profileRes.success && profileRes.data) {
          setValidationLimits({
            minFat: profileRes.data.minFat || 1.5,
            maxFat: profileRes.data.maxFat || 15.0,
            minSnf: profileRes.data.minSnf || 5.0,
            maxSnf: profileRes.data.maxSnf || 12.0
          });
        }
        await fetchTodayStats();
      } catch (error) {
        showToast('Failed to load active pricing configuration', 'error');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [showToast]);

  // Trigger calculations whenever inputs change
  useEffect(() => {
    if (!selectedFarmer || !qtyVal || !fatVal || !snfVal) {
      setLivePreview(null);
      return;
    }

    const qty = parseFloat(qtyVal);
    const fat = parseFloat(fatVal);
    const snf = parseFloat(snfVal);

    if (isNaN(qty) || qty <= 0 || isNaN(fat) || isNaN(snf)) {
      setLivePreview(null);
      return;
    }

    // Find the active rate chart matching farmer's milkType
    const chart = rateCharts.find((c) => c.milkType === selectedFarmer.milkType);
    if (!chart) {
      setLivePreview({ error: 'No active pricing configuration found.' });
      return;
    }

    // Calculate Rate per Liter using new rule-based formula
    const baseRate = Number(chart.baseRate ?? 0);
    const snfThreshold = Number(chart.snfThreshold ?? 0);
    const deduction = Number(chart.deduction ?? 0);

    let calculatedRate = baseRate;

    // SNF deduction check
    if (snf < snfThreshold) {
      calculatedRate -= deduction;
    }

    calculatedRate = Math.max(0, calculatedRate);

    if (calculatedRate <= 0) {
      setLivePreview({ error: 'Calculated rate is ₹0.00. Please verify the active rate configuration rules.' });
      return;
    }

    const calculatedTotal = calculatedRate * qty;

    setLivePreview({
      rate: Number(calculatedRate ?? 0),
      total: Number(calculatedTotal ?? 0),
      baseRate,
      snfThreshold,
      deduction,
      chartId: chart._id,
      chartName: chart.name,
      milkType: selectedFarmer.milkType
    });

  }, [selectedFarmer, qtyVal, fatVal, snfVal, rateCharts]);

  // Handle Code lookup
  const handleCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setFarmerCodeQuery(code);
    
    // Auto-select farmer if exact code matches
    const found = farmers.find(f => f.farmerCode.toUpperCase() === code || f.farmerCode === `ANRF${code.padStart(4, '0')}`);
    if (found) {
      setSelectedFarmer(found);
    } else {
      setSelectedFarmer(null);
    }
  };

  // Keyboard Navigation Events
  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'code') {
        if (!selectedFarmer) {
          showToast('Please type a valid registered Farmer Code', 'warning');
          return;
        }
        qtyInputRef.current.focus();
      } else if (field === 'qty') {
        if (!qtyVal || parseFloat(qtyVal) <= 0) {
          showToast('Quantity must be greater than 0', 'warning');
          return;
        }
        fatInputRef.current.focus();
      } else if (field === 'fat') {
        const f = parseFloat(fatVal);
        if (!fatVal || f < validationLimits.minFat || f > validationLimits.maxFat) {
          showToast(`FAT % must be between ${validationLimits.minFat}% and ${validationLimits.maxFat}%`, 'warning');
          return;
        }
        snfInputRef.current.focus();
      } else if (field === 'snf') {
        const s = parseFloat(snfVal);
        if (!snfVal || s < validationLimits.minSnf || s > validationLimits.maxSnf) {
          showToast(`SNF % must be between ${validationLimits.minSnf}% and ${validationLimits.maxSnf}%`, 'warning');
          return;
        }
        if (!livePreview || livePreview.error) {
          showToast(livePreview?.error || 'Pricing calculation failed', 'error');
          return;
        }
        // Open live preview modal
        setShowPreviewModal(true);
        // Delay focus shifting to confirm button slightly
        setTimeout(() => {
          confirmBtnRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleSaveCollection = async () => {
    if (!livePreview || livePreview.error) return;
    setSubmitting(true);
    try {
      const response = await addCollection({
        farmerId: selectedFarmer._id,
        quantity: parseFloat(qtyVal),
        fat: parseFloat(fatVal),
        snf: parseFloat(snfVal),
        date,
        shift
      });

      if (response && response.success) {
        showToast(`Saved entry successfully for ${selectedFarmer.farmerCode}`, 'success');
        
        // Reset inputs for next farmer
        setFarmerCodeQuery('');
        setSelectedFarmer(null);
        setQtyVal('');
        setFatVal('');
        setSnfVal('');
        setLivePreview(null);
        setShowPreviewModal(false);

        // Auto-refresh today's collection summary statistics
        await fetchTodayStats();

        // Focus cursor back to Farmer Code Select
        farmerSelectRef.current.focus();
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to record entry';
      showToast(serverMessage, 'error');
      setShowPreviewModal(false);
      snfInputRef.current.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowPreviewModal(false);
    setTimeout(() => {
      snfInputRef.current.focus();
    }, 50);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <Breadcrumbs items={[{ label: 'Daily Collection Entry' }]} />
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
          Milk Collection Logger
        </h1>
      </div>

      {/* Settings Row */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm select-none">
        
        {/* Shift Toggle Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-dark-border">
          <button
            onClick={() => setShift('morning')}
            className={`flex items-center gap-2 py-1.5 px-4 text-xs font-semibold rounded-md transition ${
              shift === 'morning'
                ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-dark-border'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Morning Shift</span>
          </button>
          <button
            onClick={() => setShift('evening')}
            className={`flex items-center gap-2 py-1.5 px-4 text-xs font-semibold rounded-md transition ${
              shift === 'evening'
                ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-dark-border'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>Evening Shift</span>
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
          />
        </div>

      </div>

      {/* Today's Collection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        {/* Liters Card */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Liters</p>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-205 font-mono">{todayStats.totalLiters.toFixed(2)} L</h3>
          </div>
        </div>

        {/* Payouts Card */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Payouts</p>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-205 font-mono">₹{todayStats.totalAmount.toFixed(2)}</h3>
          </div>
        </div>

        {/* Entries Card */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Entries</p>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-205 font-mono">{todayStats.totalCount}</h3>
          </div>
        </div>
      </div>

      {/* Form & Live metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Keyboard Input Cards */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-6 md:col-span-2 shadow-sm">
          
          <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex justify-between items-center select-none">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Keyboard Milk Entry
            </h2>
            <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Press Enter to Navigate
            </span>
          </div>

          <div className="space-y-4">
            {/* Farmer ID Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Farmer Code (e.g. 1 or ANRF0001)
              </label>
              <input
                ref={farmerSelectRef}
                type="text"
                value={farmerCodeQuery}
                onChange={handleCodeChange}
                onKeyDown={(e) => handleKeyDown(e, 'code')}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold tracking-wide"
                placeholder="Type code..."
                autoFocus
              />
              {selectedFarmer ? (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 flex items-center gap-1 leading-none select-none">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Selected: {selectedFarmer.name} (Milk: {selectedFarmer.milkType.toUpperCase()})</span>
                </div>
              ) : (
                farmerCodeQuery && (
                  <p className="text-[10px] text-red-500 font-semibold pt-1 leading-none">Farmer code not found in registry</p>
                )
              )}
            </div>

            {/* Liters quantity */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Milk Quantity (Liters)
              </label>
              <input
                ref={qtyInputRef}
                type="number"
                step="0.01"
                value={qtyVal}
                onChange={(e) => setQtyVal(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'qty')}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                placeholder="0.00"
                disabled={!selectedFarmer}
              />
            </div>

            {/* FAT and SNF Row */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* FAT */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  FAT % ({validationLimits.minFat.toFixed(1)} - {validationLimits.maxFat.toFixed(1)})
                </label>
                <input
                  ref={fatInputRef}
                  type="number"
                  step="0.1"
                  value={fatVal}
                  onChange={(e) => setFatVal(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'fat')}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                  placeholder="6.0"
                  disabled={!qtyVal}
                />
              </div>

              {/* SNF */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  SNF % ({validationLimits.minSnf.toFixed(1)} - {validationLimits.maxSnf.toFixed(1)})
                </label>
                <input
                  ref={snfInputRef}
                  type="number"
                  step="0.1"
                  value={snfVal}
                  onChange={(e) => setSnfVal(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'snf')}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                  placeholder="9.0"
                  disabled={!fatVal}
                />
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Live calculation box */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 shadow-sm md:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2 select-none">
              Live Preview
            </h2>

            {livePreview ? (
              livePreview.error ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-100 dark:border-red-900/30 rounded text-xs select-none">
                  {livePreview.error}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Big Price Display */}
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-dark-border rounded-lg p-4 text-center select-none">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                    <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                      ₹{Number(livePreview.total ?? 0).toFixed(2)}
                    </h3>
                  </div>

                  {/* Calculations Details list */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-dark-border pb-1.5">
                      <span className="text-slate-400 font-medium">Milk Type:</span>
                      <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">{livePreview.milkType}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-dark-border pb-1.5">
                      <span className="text-slate-400 font-medium">Base Rate:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">₹{Number(livePreview.baseRate ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-dark-border pb-1.5">
                      <span className="text-slate-400 font-medium">SNF Threshold:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{Number(livePreview.snfThreshold ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-dark-border pb-1.5">
                      <span className="text-slate-400 font-medium">Deduction:</span>
                      <span className="font-semibold text-red-500">₹{Number(livePreview.deduction ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 dark:border-dark-border pb-1.5">
                      <span className="text-slate-400 font-medium">Rate / Liter:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{Number(livePreview.rate ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1 leading-normal select-none">
                      <span>Rate Sheet:</span>
                      <span className="font-semibold text-right truncate max-w-[120px]">{livePreview.chartName}</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500 h-44 select-none">
                <HelpCircle className="w-8 h-8 mb-2.5 text-slate-200 dark:text-slate-700" />
                <p className="text-xs leading-normal">Fill farmer, liters, FAT, and SNF fields to compute pricing.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!livePreview || livePreview.error) return;
              setShowPreviewModal(true);
              setTimeout(() => confirmBtnRef.current?.focus(), 100);
            }}
            disabled={!livePreview || !!livePreview.error}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 rounded-md transition"
          >
            <span>Proceed to Save</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Live Preview pre-save dialog overlay */}
      <AnimatePresence>
        {showPreviewModal && selectedFarmer && livePreview && !livePreview.error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-5 z-10 select-none"
            >
              
              {/* Header */}
              <div className="border-b border-slate-100 dark:border-dark-border pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Confirm Collection Entry
                </h3>
                <p className="text-[11px] text-slate-400">
                  Press Enter to confirm and save, or Esc to cancel.
                </p>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                
                <div>
                  <p className="text-slate-400 font-medium">Farmer ID</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{selectedFarmer.farmerCode}</p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Farmer Name</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 truncate">{selectedFarmer.name}</p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Liters Quantity</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{qtyVal} L</p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Shift / Date</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5 capitalize">
                    {shift} | {date}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-dark-border rounded">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">FAT / SNF</p>
                  <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 text-sm">{fatVal}% / {snfVal}%</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-dark-border rounded">
                  <p className="text-slate-400 font-semibold text-[10px] uppercase">Rate / Liter</p>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm">₹{Number(livePreview.rate ?? 0).toFixed(2)}</p>
                </div>

              </div>

              {/* Big price display */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 text-center">
                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider">Total Payout Due</p>
                <h3 className="text-3xl font-black text-blue-600 dark:text-brand-400 mt-1 font-mono">
                  ₹{Number(livePreview.total ?? 0).toFixed(2)}
                </h3>
              </div>

              {/* Action triggers */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel (Esc)
                </button>
                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={handleSaveCollection}
                  disabled={submitting || !livePreview || !!livePreview.error}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
                >
                  {submitting ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
