import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../../context/UIContext';
import { getRateChartById, createRateChart, updateRateChart } from '../../services/rateService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { Save, ArrowLeft, Settings, Calculator, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RateChartForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUI();
  
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Live Simulator Inputs
  const [simFat, setSimFat] = useState('6.0');
  const [simSnf, setSimSnf] = useState('8.0');
  const [simLitres, setSimLitres] = useState('10');
 
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      milkType: 'cow',
      baseRate: '35.00',
      snfThreshold: '8.0',
      deduction: '3.00',
      standardFat: '4.0',
      fatBonus: '0.00',
      fatPenalty: '0.00',
      reason: ''
    }
  });
 
  const watchAllFields = watch();
  const watchMilkType = watch('milkType');
 
  // Load details in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const loadChart = async () => {
        try {
          const response = await getRateChartById(id);
          if (response && response.success && response.data) {
            const chart = response.data;
            if (chart.isActive) {
              showToast('Active rate charts are locked and cannot be edited. Deactivate first or create a new chart.', 'warning');
              navigate('/admin/rates');
              return;
            }
            reset({
              name: chart.name,
              milkType: chart.milkType,
              effectiveFrom: new Date(chart.effectiveFrom).toISOString().split('T')[0],
              baseRate: Number(chart.baseRate ?? 0).toFixed(2),
              snfThreshold: Number(chart.snfThreshold ?? 0).toFixed(1),
              deduction: Number(chart.deduction ?? 0).toFixed(2),
              standardFat: Number(chart.standardFat ?? 0).toFixed(1),
              fatBonus: Number(chart.fatBonus ?? 0).toFixed(2),
              fatPenalty: Number(chart.fatPenalty ?? 0).toFixed(2),
              reason: ''
            });
            // Update simulator defaults depending on loaded type
            if (chart.milkType === 'buffalo') {
              setSimFat('7.0');
              setSimSnf('8.0');
            } else {
              setSimFat('4.5');
              setSimSnf('8.0');
            }
          }
        } catch (error) {
          showToast('Failed to load rate chart details', 'error');
          navigate('/admin/rates');
        } finally {
          setLoading(false);
        }
      };
      loadChart();
    }
  }, [id, isEditMode, reset, navigate, showToast]);
 
  // Adjust defaults when milk type changes (only in Create Mode)
  useEffect(() => {
    if (!isEditMode) {
      if (watchMilkType === 'buffalo') {
        setValue('baseRate', '55.00');
        setValue('snfThreshold', '8.0');
        setValue('deduction', '3.00');
        setValue('standardFat', '6.0');
        setSimFat('7.0');
        setSimSnf('8.0');
      } else {
        setValue('baseRate', '35.00');
        setValue('snfThreshold', '8.0');
        setValue('deduction', '3.00');
        setValue('standardFat', '4.0');
        setSimFat('4.5');
        setSimSnf('8.0');
      }
    }
  }, [watchMilkType, isEditMode, setValue]);

  // Pricing Simulator Calculation logic
  const calculateSimResult = () => {
    const base = parseFloat(watchAllFields.baseRate) || 0;
    const threshold = parseFloat(watchAllFields.snfThreshold) || 0;
    const deduct = parseFloat(watchAllFields.deduction) || 0;

    const s = parseFloat(simSnf) || 0;
    const l = parseFloat(simLitres) || 0;

    let computedRate = base;

    // SNF Threshold check
    if (s < threshold) {
      computedRate -= deduct;
    }

    const ratePerLitre = Math.max(0, computedRate);
    return {
      ratePerLitre: parseFloat(ratePerLitre.toFixed(2)),
      totalAmount: parseFloat((ratePerLitre * l).toFixed(2))
    };
  };

  const simResult = calculateSimResult();

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name: data.name,
        milkType: data.milkType,
        effectiveFrom: data.effectiveFrom,
        baseRate: parseFloat(data.baseRate),
        snfThreshold: parseFloat(data.snfThreshold),
        deduction: parseFloat(data.deduction),
        standardFat: parseFloat(data.standardFat),
        fatBonus: parseFloat(data.fatBonus),
        fatPenalty: parseFloat(data.fatPenalty),
        reason: data.reason
      };

      let response;
      if (isEditMode) {
        response = await updateRateChart(id, payload);
      } else {
        response = await createRateChart(payload);
      }

      if (response && response.success) {
        showToast(
          isEditMode ? 'Rate chart updated successfully' : 'Rate chart created successfully',
          'success'
        );
        navigate('/admin/rates');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to submit rate chart parameters';
      showToast(serverMessage, 'error');
    } finally {
      setSaving(false);
    }
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
      
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/rates')}
          className="p-2 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex flex-col gap-1.5">
          <Breadcrumbs 
            items={[
              { label: 'Rate Management', path: '/admin/rates' }, 
              { label: isEditMode ? 'Edit Pricing' : 'Create Pricing Rules' }
            ]} 
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
            {isEditMode ? 'Modify Milk Pricing Rules' : 'Create Milk Pricing Rules'}
          </h1>
        </div>
      </div>

      {/* Main Grid layout */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Rule configurations (Col span 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-2"
        >
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-6">
            
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              <Activity className="w-4.5 h-4.5 text-blue-500" />
              <span>Milk Rate Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Chart Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pricing Rule Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Pricing rule name is required' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                  placeholder="e.g. Standard Buffalo Rates - Monsoon 2026"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
                )}
              </div>

              {/* Milk Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Milk Type
                </label>
                <select
                  {...register('milkType', { required: true })}
                  disabled={isEditMode}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md disabled:opacity-50"
                >
                  <option value="cow">Cow</option>
                  <option value="buffalo">Buffalo</option>
                </select>
              </div>

              {/* Effective From */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Effective From Date
                </label>
                <input
                  type="date"
                  {...register('effectiveFrom', { required: 'Effective date is required' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                />
                {errors.effectiveFrom && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.effectiveFrom.message}</p>
                )}
              </div>

              {/* Base Rate */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Base Rate (Per Litre)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('baseRate', { required: 'Base rate is required' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                />
                {errors.baseRate && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.baseRate.message}</p>
                )}
              </div>

              {/* SNF Threshold */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  SNF Threshold %
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('snfThreshold', { required: 'SNF Threshold is required' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                />
                {errors.snfThreshold && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.snfThreshold.message}</p>
                )}
              </div>

              {/* Deduction */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Deduction (₹ per litre below threshold)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('deduction', { required: 'Deduction is required' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                />
                {errors.deduction && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.deduction.message}</p>
                )}
              </div>


            </div>
          </div>

          {/* Edit audit trail config */}
          {isEditMode && (
            <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reason for Profile Change (Required for Security Audit)
              </label>
              <div className="relative">
                <Settings className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows="2"
                  {...register('reason', { required: 'A reason must be provided to edit the rate chart' })}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                  placeholder="Describe why you are modifying this details..."
                />
              </div>
              {errors.reason && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.reason.message}</p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/rates')}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Rate Chart'}</span>
            </button>
          </div>
        </motion.div>

        {/* Right Side: Interactive Live Simulator (Col span 1) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-1"
        >
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              <Calculator className="w-4.5 h-4.5 text-blue-500" />
              <span>Live Pricing Preview Simulator</span>
            </div>

            <div className="space-y-4">
              
              {/* Test FAT */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Test FAT %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simFat}
                  onChange={(e) => setSimFat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                />
              </div>

              {/* Test SNF */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Test SNF %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simSnf}
                  onChange={(e) => setSimSnf(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                />
              </div>

              {/* Test Litres */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Test Volume (Litres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simLitres}
                  onChange={(e) => setSimLitres(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md font-semibold"
                />
              </div>

              {/* Results display panel */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-dark-border rounded-lg space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Pricing Scheme Active</span>
                  <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">{watchAllFields.milkType}</span>
                </div>
                
                <hr className="border-slate-200 dark:border-dark-border" />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Calculated Rate/Litre</span>
                  <span className="text-lg font-bold text-slate-850 dark:text-slate-100 flex items-center">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    {Number(simResult?.ratePerLitre ?? 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Total Simulated Amount</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center">
                    <DollarSign className="w-4.5 h-4.5" />
                    {Number(simResult?.totalAmount ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </form>
    </div>
  );
}
