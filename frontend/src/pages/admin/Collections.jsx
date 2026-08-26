import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import { 
  getCollections, 
  addCollection, 
  updateCollection, 
  deleteCollection, 
  unlockCollection, 
  getTodaySummary 
} from '../../services/collectionService';
import { getFarmers, updateFarmer } from '../../services/farmerService';
import { calculateRatePreview } from '../../services/rateService';
import { getDairyProfile } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  Unlock, 
  Lock, 
  Filter, 
  HelpCircle, 
  Save, 
  X, 
  Plus, 
  AlertTriangle,
  User,
  Activity,
  Droplets,
  DollarSign,
  Info,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Collections() {
  const { showToast } = useUI();
  const { t } = useTranslation();

  // Role detection
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'employee' };
  const isAdmin = user.role === 'admin';

  // Data states
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shift, setShift] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Summary stats state
  const [summaryStats, setSummaryStats] = useState({
    totalFarmersCollected: 0,
    morningCollections: 0,
    eveningCollections: 0,
    totalCowMilk: 0,
    totalBuffaloMilk: 0,
    totalMilk: 0,
    totalAmount: 0
  });

  // New Collection Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [entryMode, setEntryMode] = useState('manual'); // 'manual' | 'machine'
  const [saving, setSaving] = useState(false);

  // Form Fields States
  const [newFarmerSearch, setNewFarmerSearch] = useState('');
  const [farmerSuggestions, setFarmerSuggestions] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Date and Shift Defaults
  const getInitialShift = () => {
    const hours = new Date().getHours();
    return hours < 12 ? 'morning' : 'evening';
  };
  const getTodayDateString = () => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const adjusted = new Date(local.getTime() - offset * 60 * 1000);
    return adjusted.toISOString().split('T')[0];
  };

  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newShift, setNewShift] = useState(getInitialShift());
  const [newMilkType, setNewMilkType] = useState('buffalo');
  const [newQuantity, setNewQuantity] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newSnf, setNewSnf] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Settings defaults
  const [defaultMilkTypeSetting, setDefaultMilkTypeSetting] = useState('buffalo');
  const [rememberMilkTypeSetting, setRememberMilkTypeSetting] = useState(false);
  const [sessionLastMilkType, setSessionLastMilkType] = useState(null);
  const [defaultShiftSetting, setDefaultShiftSetting] = useState('morning');
  const [useFarmerPreferredMilkTypeSetting, setUseFarmerPreferredMilkTypeSetting] = useState(false);
  const [rememberFarmerMilkTypeSetting, setRememberFarmerMilkTypeSetting] = useState(false);

  // Expanded edit modal states
  const [editMilkType, setEditMilkType] = useState('buffalo');
  const [editDate, setEditDate] = useState('');
  const [editShift, setEditShift] = useState('morning');
  const [editNotes, setEditNotes] = useState('');
  const [overrideEdit, setOverrideEdit] = useState(false);

  // Live Calculations state
  const [calcRate, setCalcRate] = useState(0);
  const [calcTotal, setCalcTotal] = useState(0);
  const [calcMethod, setCalcMethod] = useState('');
  const [calcChartName, setCalcChartName] = useState('');
  const [calcError, setCalcError] = useState('');

  // Collision and Duplicate check warning
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // Keyboard Refs
  const farmerSearchRef = useRef(null);
  const dateInputRef = useRef(null);
  const shiftInputRef = useRef(null);
  const milkTypeInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const fatInputRef = useRef(null);
  const snfInputRef = useRef(null);
  const notesInputRef = useRef(null);
  const saveBtnRef = useRef(null);

  // Edit / Action Modal states
  const [editingItem, setEditingItem] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editSnf, setEditSnf] = useState('');

  // Unlock Modal states
  const [unlockingItem, setUnlockingItem] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');

  // Delete Modal states
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch summary stats
  const fetchSummary = useCallback(async () => {
    try {
      const response = await getTodaySummary();
      if (response && response.success) {
        setSummaryStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load today summary stats', error);
    }
  }, []);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCollections({
        page,
        limit: 10,
        search: search || undefined,
        shift: shift || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (response && response.success) {
        setCollections(response.data.collections);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      showToast('Failed to load milk collection records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, shift, startDate, endDate, showToast]);

  useEffect(() => {
    fetchCollections();
    fetchSummary();
  }, [fetchCollections, fetchSummary]);

  // Fetch dairy profile default settings
  useEffect(() => {
    const loadProfileSettings = async () => {
      try {
        const response = await getDairyProfile();
        if (response && response.success && response.data) {
          const defaultType = response.data.defaultMilkType || 'buffalo';
          setDefaultMilkTypeSetting(defaultType);
          setRememberMilkTypeSetting(response.data.rememberMilkType || false);
          
          const defaultShift = response.data.defaultShift || 'morning';
          setDefaultShiftSetting(defaultShift);
          setUseFarmerPreferredMilkTypeSetting(response.data.useFarmerPreferredMilkType || false);
          setRememberFarmerMilkTypeSetting(response.data.rememberFarmerMilkType || false);

          setNewMilkType(defaultType);
        }
      } catch (error) {
        console.error('Failed to load dairy profile default settings', error);
      }
    };
    loadProfileSettings();
  }, []);

  // Farmer Search Suggestions Fetching
  useEffect(() => {
    if (newFarmerSearch.trim().length < 1) {
      setFarmerSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await getFarmers({ search: newFarmerSearch, limit: 8, status: 'active' });
        if (response && response.success && response.data) {
          setFarmerSuggestions(response.data.farmers);
        }
      } catch (error) {
        console.error('Error fetching farmer suggestions', error);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [newFarmerSearch]);

  // Live calculation trigger
  useEffect(() => {
    if (!newQuantity || !newFat || !newSnf || isNaN(newQuantity) || isNaN(newFat) || isNaN(newSnf)) {
      setCalcRate(0);
      setCalcTotal(0);
      setCalcMethod('');
      setCalcChartName('');
      setCalcError('');
      return;
    }

    const fetchRatePreview = async () => {
      try {
        const response = await calculateRatePreview(newMilkType, parseFloat(newFat), parseFloat(newSnf));
        if (response && response.success && response.data) {
          const rateVal = response.data.rate;
          setCalcRate(rateVal);
          setCalcTotal(rateVal * parseFloat(newQuantity));
          setCalcMethod(response.data.calculationMethod);
          setCalcChartName(response.data.rateChartName);
          setCalcError('');
        }
      } catch (error) {
        setCalcRate(0);
        setCalcTotal(0);
        setCalcMethod('');
        setCalcChartName('');
        setCalcError(error.response?.data?.message || 'No active rate chart configuration matches these parameters');
      }
    };

    fetchRatePreview();
  }, [newMilkType, newQuantity, newFat, newSnf]);

  // Check duplicates on shift/farmer selection changes
  useEffect(() => {
    if (!selectedFarmer || !newDate || !newShift) {
      setDuplicateWarning('');
      return;
    }

    const checkDuplicateLocal = async () => {
      try {
        const response = await getCollections({
          farmerId: selectedFarmer._id,
          startDate: newDate,
          endDate: newDate,
          shift: newShift
        });
        if (response && response.success && response.data.collections.length > 0) {
          setDuplicateWarning(t('shiftOverlapMsg'));
        } else {
          setDuplicateWarning('');
        }
      } catch (error) {
        console.error('Failed checking local duplicate collections', error);
      }
    };
    checkDuplicateLocal();
  }, [selectedFarmer, newDate, newShift]);

  // Keyboard helper
  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  // Open Add Collection Modal
  const handleOpenNewCollection = () => {
    setSelectedFarmer(null);
    setNewFarmerSearch('');
    setNewQuantity('');
    setNewFat('');
    setNewSnf('');
    setNewNotes('');
    setCalcRate(0);
    setCalcTotal(0);
    setCalcError('');
    setDuplicateWarning('');
    setNewDate(getTodayDateString());
    setNewShift(defaultShiftSetting);
    
    // Auto-select based on settings and session history
    if (rememberMilkTypeSetting && sessionLastMilkType) {
      setNewMilkType(sessionLastMilkType);
    } else {
      setNewMilkType(defaultMilkTypeSetting);
    }

    setShowAddModal(true);

    // Focus input on mount
    setTimeout(() => {
      if (farmerSearchRef.current) farmerSearchRef.current.focus();
    }, 100);
  };

  // Select Farmer Suggestion
  const handleSelectFarmer = (farmer) => {
    setSelectedFarmer(farmer);
    setNewFarmerSearch(`${farmer.name} (${farmer.farmerCode})`);
    
    // If useFarmerPreferredMilkType is enabled, automatically select that farmer's preference
    if (useFarmerPreferredMilkTypeSetting && farmer.milkType && farmer.milkType !== 'mix') {
      setNewMilkType(farmer.milkType);
    }
    
    setFarmerSuggestions([]);
    
    // Shift focus to next logical element
    if (quantityInputRef.current) quantityInputRef.current.focus();
  };

  // Core Save Method
  const handleSaveCollectionSubmit = async (closeAfterSave) => {
    if (!selectedFarmer) {
      showToast('Please search and select a farmer first', 'warning');
      if (farmerSearchRef.current) farmerSearchRef.current.focus();
      return;
    }
    if (!newQuantity || parseFloat(newQuantity) <= 0) {
      showToast('Please enter a valid milk quantity (liters)', 'warning');
      if (quantityInputRef.current) quantityInputRef.current.focus();
      return;
    }
    if (!newFat || parseFloat(newFat) <= 0) {
      showToast('Please enter a valid FAT percentage', 'warning');
      if (fatInputRef.current) fatInputRef.current.focus();
      return;
    }
    if (!newSnf || parseFloat(newSnf) <= 0) {
      showToast('Please enter a valid SNF percentage', 'warning');
      if (snfInputRef.current) snfInputRef.current.focus();
      return;
    }
    if (calcError) {
      showToast(calcError, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        farmerId: selectedFarmer._id,
        quantity: parseFloat(newQuantity),
        fat: parseFloat(newFat),
        snf: parseFloat(newSnf),
        milkType: newMilkType,
        date: newDate,
        shift: newShift,
        notes: newNotes
      };

      const response = await addCollection(payload);
      if (response && response.success) {
        showToast('Milk collection record saved successfully', 'success');

        // Automatically update farmer preferred milk type if enabled
        if (rememberFarmerMilkTypeSetting && selectedFarmer.milkType !== newMilkType) {
          try {
            await updateFarmer(selectedFarmer._id, {
              milkType: newMilkType,
              reason: 'System automatically updated preferred milk type on collection entry save'
            });
            selectedFarmer.milkType = newMilkType;
          } catch (err) {
            console.error('Failed to auto-update farmer preferred milk type', err);
          }
        }
        
        // Refresh grid and summary stats
        fetchCollections();
        fetchSummary();

        if (closeAfterSave) {
          setShowAddModal(false);
        } else {
          // Rapid loop entry mode: Clear only input fields, keep date/shift
          setSelectedFarmer(null);
          setNewFarmerSearch('');
          setNewQuantity('');
          setNewFat('');
          setNewSnf('');
          setNewNotes('');
          setCalcRate(0);
          setCalcTotal(0);
          setCalcError('');
          setDuplicateWarning('');
          
          // Focus search bar immediately for keyboard-only speed
          if (farmerSearchRef.current) {
            farmerSearchRef.current.focus();
          }
        }
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to save collection';
      showToast(serverMessage, 'error');
      
      // If server duplicate error happens, show warning
      if (serverMessage.toLowerCase().includes('duplicate') || serverMessage.toLowerCase().includes('already has a record')) {
        setDuplicateWarning(`Milk collection for this farmer has already been recorded for this shift.`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditMilkType(item.milkType || 'cow');
    setEditQty(item.quantity);
    setEditFat(item.fat);
    setEditSnf(item.snf);
    setEditDate(item.date ? item.date.split('T')[0] : '');
    setEditShift(item.shift || 'morning');
    setEditNotes(item.notes || '');
    setActionReason('');
    setOverrideEdit(false);
  };

  // Submit Edit API
  const handleSaveEdit = async () => {
    if (!actionReason) {
      showToast('Please state a reason for editing this record', 'warning');
      return;
    }
    try {
      const response = await updateCollection(editingItem._id, {
        milkType: editMilkType,
        quantity: parseFloat(editQty),
        fat: parseFloat(editFat),
        snf: parseFloat(editSnf),
        date: editDate,
        shift: editShift,
        notes: editNotes,
        overrideEdit,
        reason: actionReason
      });

      if (response && response.success) {
        showToast('Milk collection record updated successfully', 'success');
        setEditingItem(null);
        fetchCollections();
        fetchSummary();
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to edit record';
      showToast(serverMessage, 'error');
    }
  };

  // Submit Unlock API
  const handleSaveUnlock = async () => {
    if (!unlockReason) {
      showToast('A reason is required to unlock invoice collections', 'warning');
      return;
    }
    try {
      const response = await unlockCollection(unlockingItem._id, unlockReason);
      if (response && response.success) {
        showToast('Record unlocked successfully', 'success');
        setUnlockingItem(null);
        setUnlockReason('');
        fetchCollections();
        fetchSummary();
      }
    } catch (error) {
      showToast('Failed to unlock record', 'error');
    }
  };

  // Submit Delete API
  const handleSaveDelete = async () => {
    if (!deleteReason) {
      showToast('A deletion audit reason is required', 'warning');
      return;
    }
    try {
      const response = await deleteCollection(deletingItem._id, deleteReason);
      if (response && response.success) {
        showToast('Record deleted successfully', 'success');
        setDeletingItem(null);
        setDeleteReason('');
        fetchCollections();
        fetchSummary();
      }
    } catch (error) {
      showToast('Failed to delete record', 'error');
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
      
      {/* Header panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Breadcrumbs items={[{ label: t('milkCollections') }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
            {t('milkCollections')}
          </h1>
        </div>
        <button
          onClick={handleOpenNewCollection}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('newCollectionLog')}</span>
        </button>
      </div>

      {/* Summary statistics panels cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('farmers')}</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{summaryStats.totalFarmersCollected}</span>
            <span className="text-[10px] font-bold text-slate-400">{t('farmers')}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('shift')} (AM)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-slate-850 dark:text-slate-100">{summaryStats.morningCollections}</span>
            <span className="text-[10px] font-bold text-slate-400">Entries</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('shift')} (PM)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-slate-850 dark:text-slate-100">{summaryStats.eveningCollections}</span>
            <span className="text-[10px] font-bold text-slate-400">Entries</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('milkType')} (Cow)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-blue-650 dark:text-blue-400">{summaryStats.totalCowMilk?.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400">Liters</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('milkType')} (Buffalo)</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-amber-655 dark:text-amber-400">{summaryStats.totalBuffaloMilk?.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400">Liters</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('totalLitersCollected')}</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-500">{summaryStats.totalMilk?.toFixed(1)}</span>
            <span className="text-[10px] font-bold text-slate-400">Liters</span>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-100 dark:border-dark-border shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('todayAmount')}</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">₹{summaryStats.totalAmount?.toFixed(0)}</span>
            <span className="text-[10px] font-bold text-slate-400">Total</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
              placeholder="Search by ID, Name, Mobile, Village..."
            />
          </div>

          {/* Shift filter */}
          <div>
            <select
              value={shift}
              onChange={(e) => { setShift(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
            >
              <option value="">All Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
            />
          </div>

        </div>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <TableSkeleton />
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-center">
          <HelpCircle className="w-12 h-12 text-slate-350 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No milk collections have been recorded today.</h3>
          <p className="text-xs text-slate-450 mt-1 max-w-sm mb-4">Start recording collections by clicking the New Collection button below.</p>
          <button
            onClick={handleOpenNewCollection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition"
          >
            New Collection
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Date / Shift</th>
                  <th className="p-4">Farmer</th>
                  <th className="p-4">Quantity (L)</th>
                  <th className="p-4">FAT / SNF</th>
                  <th className="p-4">Rate / L</th>
                  <th className="p-4">Total Pay</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {collections.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    
                    {/* Date / Shift */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {formatDate(item.date)}
                      </p>
                      <span className="capitalize text-[10px] font-bold text-slate-400">
                        {item.shift} Shift
                      </span>
                    </td>

                    {/* Farmer Identity */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {item.farmer?.name || 'Deleted'}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400">
                        ID: {item.farmer?.farmerCode || 'N/A'}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                      {item.quantity.toFixed(2)} L
                    </td>

                    {/* FAT / SNF */}
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      {item.fat.toFixed(1)}% / {item.snf.toFixed(1)}%
                    </td>

                    {/* Rate per Liter */}
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      ₹{item.ratePerLiter.toFixed(2)}
                    </td>

                    {/* Total Amount */}
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-455">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.isLocked
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {item.isLocked ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Unlocked</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit is available to both admin and employee */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                          title="Edit Collection Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete is Admin only */}
                        {isAdmin && (
                          <button
                            onClick={() => { setDeletingItem(item); setDeleteReason(''); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded transition"
                            title="Delete Collection Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Unlock is Admin only */}
                        {isAdmin && item.isLocked && (
                          <button
                            onClick={() => { setUnlockingItem(item); setUnlockReason(''); }}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 rounded transition"
                            title="Unlock this collection record"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-500 dark:text-slate-400">
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

      {/* New Daily Collection Modal Form */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 dark:border-dark-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span>Daily Milk Collection Recording</span>
                  </h3>
                  <p className="text-xs text-slate-450">Record today's milk entries quickly. Press Enter to navigate fields.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Manual/Machine Entry */}
              <div className="px-6 pt-4 flex justify-between items-center">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-dark-border rounded-lg w-fit">
                  <button 
                    type="button" 
                    onClick={() => setEntryMode('manual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm transition ${
                      entryMode === 'manual' 
                        ? 'bg-white dark:bg-dark-surface text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-dark-border' 
                        : 'text-slate-500'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button 
                    type="button" 
                    disabled 
                    className="px-3 py-1.5 text-xs font-bold text-slate-400 flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Machine Entry (Coming Soon)</span>
                  </button>
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-455">ANR Dairy POS v1.0</div>
              </div>

              {/* Modal Body Container */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Inputs Columns (Left) */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Farmer Selection autocomplete */}
                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Farmer Code / Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        ref={farmerSearchRef}
                        value={newFarmerSearch}
                        onChange={(e) => {
                          setNewFarmerSearch(e.target.value);
                          if (selectedFarmer) setSelectedFarmer(null);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, dateInputRef)}
                        placeholder="Search by Code (e.g. ANRF0001), Name or Phone..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-medium"
                      />
                    </div>

                    {/* Autocomplete Dropdown suggestions */}
                    {farmerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-lg z-25 max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
                        {farmerSuggestions.map(farmer => (
                          <button
                            key={farmer._id}
                            type="button"
                            onClick={() => handleSelectFarmer(farmer)}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center transition"
                          >
                            <div>
                              <p className="text-slate-850 dark:text-slate-200 font-bold">{farmer.name}</p>
                              <p className="text-[10px] text-slate-400">ID: {farmer.farmerCode} | Ph: {farmer.phone}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 text-[9px] rounded font-bold uppercase">{farmer.village}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date & Shift Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection Date</label>
                      <input
                        type="date"
                        ref={dateInputRef}
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, shiftInputRef)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection Shift</label>
                      <select
                        ref={shiftInputRef}
                        value={newShift}
                        onChange={(e) => setNewShift(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, milkTypeInputRef)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300 font-medium"
                      >
                        <option value="morning">Morning Shift</option>
                        <option value="evening">Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  {/* Milk Type, Liters, FAT & SNF Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    
                    {/* Milk Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Milk Type</label>
                      <select
                        ref={milkTypeInputRef}
                        value={newMilkType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewMilkType(val);
                          setSessionLastMilkType(val);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, quantityInputRef)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300 font-semibold"
                      >
                        <option value="cow">Cow</option>
                        <option value="buffalo">Buffalo</option>
                        <option value="mix">Mix</option>
                      </select>
                    </div>

                    {/* Liters */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity (L)</label>
                      <input
                        type="number"
                        step="0.01"
                        ref={quantityInputRef}
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, fatInputRef)}
                        placeholder="e.g. 10.50"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </div>

                    {/* FAT % */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FAT %</label>
                      <input
                        type="number"
                        step="0.1"
                        ref={fatInputRef}
                        value={newFat}
                        onChange={(e) => setNewFat(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, snfInputRef)}
                        placeholder="e.g. 4.5"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </div>

                    {/* SNF % */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SNF %</label>
                      <input
                        type="number"
                        step="0.1"
                        ref={snfInputRef}
                        value={newSnf}
                        onChange={(e) => setNewSnf(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, notesInputRef)}
                        placeholder="e.g. 8.0"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-bold"
                      />
                    </div>

                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
                    <textarea
                      rows="2"
                      ref={notesInputRef}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, saveBtnRef)}
                      placeholder="Remarks, exceptions, containers description..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Collision/Duplicate Warning Alerts */}
                  {duplicateWarning && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-lg flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p>{duplicateWarning}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Please check shift dates or select a different farmer.</p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Billing Summary Box (Right Sidebar) */}
                <div className="lg:col-span-1 border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/10 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-dark-border pb-2">Calculation Preview</h4>
                  
                  {/* Selected Farmer Mini Info Card */}
                  {selectedFarmer ? (
                    <div className="p-3 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs space-y-1.5 shadow-sm">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{selectedFarmer.name}</p>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                        <div>Code: <strong className="text-slate-600 dark:text-slate-350">{selectedFarmer.farmerCode}</strong></div>
                        <div>Village: <strong className="text-slate-600 dark:text-slate-350">{selectedFarmer.village}</strong></div>
                        <div className="col-span-2">Mobile: <strong className="text-slate-600 dark:text-slate-350">{selectedFarmer.phone}</strong></div>
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 rounded">ACTIVE FARMER</span>
                    </div>
                  ) : (
                    <div className="p-6 bg-white dark:bg-dark-surface/50 border border-dashed border-slate-300 dark:border-dark-border rounded-lg text-center text-xs text-slate-400">
                      No farmer selected. Use search autocomplete on the left.
                    </div>
                  )}

                  {/* Rates Breakdown */}
                  {calcError ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-lg text-xs text-red-650 flex items-start gap-2">
                      <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{calcError}</span>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      
                      {/* Price Badge */}
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                        <span>Rate/Litre:</span>
                        <span className="text-base font-bold text-slate-800 dark:text-slate-100">₹{calcRate.toFixed(2)}</span>
                      </div>

                      {/* Total Pay Badge */}
                      <div className="flex justify-between items-center border-t border-slate-200 dark:border-dark-border pt-3.5 text-xs font-semibold text-slate-500">
                        <span>Total Payout:</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">₹{calcTotal.toFixed(2)}</span>
                      </div>

                      {/* Pricing Mode summary */}
                      {calcMethod && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/20 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 space-y-1 font-medium">
                          <p className="font-bold text-blue-650 dark:text-blue-450 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Pricing Chart Detected</span>
                          </p>
                          <p>Chart Name: <strong>{calcChartName}</strong></p>
                          <p>Pricing Method: <span className="uppercase text-blue-600 font-bold">{calcMethod === 'formula' ? 'Fat + SNF Formula' : calcMethod === 'matrix' ? 'Fat + SNF Matrix Grid' : 'Fixed Pricing'}</span></p>
                          <p className="text-[9px] text-slate-400 mt-1 leading-normal">System calculates pricing parameters in real-time according to active charts matching Cow/Buffalo specifications.</p>
                        </div>
                      )}

                    </div>
                  )}

                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-350 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md hover:bg-slate-100 transition focus:outline-none"
                >
                  Cancel
                </button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={saving || !!calcError}
                    onClick={() => handleSaveCollectionSubmit(false)}
                    className="flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-md transition focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    <span>Save & Collect Next Farmer</span>
                  </button>
                  <button
                    type="button"
                    ref={saveBtnRef}
                    disabled={saving || !!calcError}
                    onClick={() => handleSaveCollectionSubmit(true)}
                    className="flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save & Close'}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Record Modal Dialog overlay */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 z-10"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border pb-2.5 select-none">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Edit Collection record: {editingItem.farmer?.farmerCode}
                  </h3>
                  <p className="text-[10px] text-slate-400">Updating this record will automatically recalculate total amounts based on the historical rate chart used.</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                
                {/* Lock Warning banner */}
                {(editingItem.invoice || editingItem.isLocked) && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35 rounded-lg text-[11px] text-amber-700 dark:text-amber-300 space-y-1.5">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Locked Record Alert</span>
                    </p>
                    <p>
                      This collection is already included in Invoice <strong>{editingItem.invoice?.invoiceNumber || 'INV-XXXX'}</strong>.
                    </p>
                    {isAdmin ? (
                      <div className="flex items-center gap-2 pt-1.5 border-t border-amber-200/50">
                        <input
                          type="checkbox"
                          id="overrideEditCheckbox"
                          checked={overrideEdit}
                          onChange={(e) => setOverrideEdit(e.target.checked)}
                          className="w-3.5 h-3.5 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <label htmlFor="overrideEditCheckbox" className="font-bold cursor-pointer select-none">
                          Override Edit (Admin Only)
                        </label>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 font-bold">Editing is restricted. Contact an Administrator to override or cancel the invoice.</p>
                    )}
                  </div>
                )}

                {/* Date & Shift Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Collection Date</label>
                    <input
                      type="date"
                      value={editDate}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Shift</label>
                    <select
                      value={editShift}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditShift(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60 text-slate-650 dark:text-slate-350"
                    >
                      <option value="morning">Morning Shift</option>
                      <option value="evening">Evening Shift</option>
                    </select>
                  </div>
                </div>

                {/* Milk Type & Liters Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Milk Type</label>
                    <select
                      value={editMilkType}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditMilkType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60 text-slate-650 dark:text-slate-350"
                    >
                      <option value="buffalo">Buffalo</option>
                      <option value="cow">Cow</option>
                      <option value="mix">Mix</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Quantity (Liters)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editQty}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditQty(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* FAT / SNF row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">FAT %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFat}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditFat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">SNF %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editSnf}
                      disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                      onChange={(e) => setEditSnf(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold text-sm disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Notes</label>
                  <textarea
                    rows="2"
                    value={editNotes}
                    disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-xs disabled:opacity-60"
                    placeholder="Add collection notes here..."
                  />
                </div>

                {/* Reason */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason for Edit (Required for security log)</label>
                  <textarea
                    rows="2"
                    value={actionReason}
                    disabled={(editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit)}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-xs disabled:opacity-60"
                    placeholder="Enter reason..."
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-650 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !actionReason || ((editingItem.invoice || editingItem.isLocked) && (!isAdmin || !overrideEdit))}
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Edits</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unlock Dialog pop-up */}
      <AnimatePresence>
        {unlockingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnlockingItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10"
            >
              <div className="flex justify-between items-start select-none border-b border-slate-100 dark:border-dark-border pb-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                  <h3>Unlock Collection Entry?</h3>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-normal">
                This record is locked because it belongs to an invoice run. Modifying it will generate audit records tracking your security clearance and reason.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for Unlock (Audit Logged)</label>
                <textarea
                  rows="2"
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-xs"
                  placeholder="Explain why you are unlocking this record..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                <button
                  onClick={() => setUnlockingItem(null)}
                  className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUnlock}
                  className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm"
                >
                  Unlock Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Reason Modal */}
      <AnimatePresence>
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingItem(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4 z-10"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border pb-2.5 select-none">
                <h3 className="text-sm font-bold text-red-650 dark:text-red-400">
                  Delete Milk Collection?
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-normal">
                Are you sure you want to permanently delete farmer <strong>{deletingItem.farmer?.farmerCode}</strong>'s milk record on <strong>{formatDate(deletingItem.date)}</strong>? This action is logged.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for Deletion (Audit Logged)</label>
                <textarea
                  rows="2"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-xs"
                  placeholder="Describe reason for deletion..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="px-3.5 py-2 font-semibold border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-600 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDelete}
                  className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
