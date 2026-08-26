import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useUI } from '../../context/UIContext';
import { useTranslation } from 'react-i18next';
import { getDairyProfile, updateDairyProfile, uploadDairyLogo } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { Save, Upload, Building, Phone, Mail, MapPin, User, FileText, Settings as SettingsIcon, MessageSquare, ToggleLeft, ToggleRight, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [activeTab, setActiveTab] = useState('business');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  // Watch toggles to conditionally display API config panels
  const watchWhatsApp = watch('enableWhatsApp');
  const watchSMS = watch('enableSMS');

  // Fetch dairy profile details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getDairyProfile();
        if (response && response.success && response.data) {
          setProfile(response.data);
          reset({
            dairyName: response.data.dairyName,
            ownerName: response.data.ownerName,
            phone: response.data.phone,
            email: response.data.email,
            address: response.data.address,
            gstNumber: response.data.gstNumber,
            minFat: response.data.minFat || 1.5,
            maxFat: response.data.maxFat || 15.0,
            minSnf: response.data.minSnf || 5.0,
            maxSnf: response.data.maxSnf || 12.0,
            
            // Administrative & Regional settings
            rateMode: response.data.rateMode || 'fat-snf',
            language: response.data.language || 'en',
            theme: response.data.theme || 'light',
            printLayout: response.data.printLayout || 'a4',
            backupFrequency: response.data.backupFrequency || 'daily',
            backupRetentionDays: response.data.backupRetentionDays || 30,
            sessionTimeout: response.data.sessionTimeout || 30,
            timezone: response.data.timezone || 'Asia/Kolkata',
            dateFormat: response.data.dateFormat || 'DD/MM/YYYY',
            currency: response.data.currency || 'INR',
            defaultMilkType: response.data.defaultMilkType || 'buffalo',
            rememberMilkType: response.data.rememberMilkType || false,
            defaultShift: response.data.defaultShift || 'morning',
            useFarmerPreferredMilkType: response.data.useFarmerPreferredMilkType || false,
            rememberFarmerMilkType: response.data.rememberFarmerMilkType || false,

            // Notification provider settings
            enableWhatsApp: response.data.enableWhatsApp || false,
            enableSMS: response.data.enableSMS || false,
            whatsappProvider: response.data.whatsappProvider || 'development',
            whatsappApiUrl: response.data.whatsappApiUrl || 'https://api.whatsapp.example.com/v1/messages',
            whatsappApiKey: response.data.whatsappApiKey || '',
            whatsappSenderNumber: response.data.whatsappSenderNumber || '',
            smsProvider: response.data.smsProvider || 'development',
            smsApiUrl: response.data.smsApiUrl || '',
            smsApiKey: response.data.smsApiKey || '',
            smsSenderId: response.data.smsSenderId || '',
            
            reason: '' // Reset audit log reason
          });
          if (response.data.logo) {
            const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
            setLogoPreview(`${baseUrl}${response.data.logo}`);
          }
        }
      } catch (error) {
        showToast('Failed to load dairy profile settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset, showToast]);

  const onUpdateProfile = async (data) => {
    setSaving(true);
    try {
      const response = await updateDairyProfile(data);
      if (response && response.success) {
        showToast('Dairy settings updated successfully', 'success');
        setProfile(response.data);
        reset({ ...data, reason: '' });
        
        // Immediately apply language toggle
        if (data.language) {
          i18n.changeLanguage(data.language);
          localStorage.setItem('language', data.language);
        }
        
        // Immediately apply theme toggle
        if (data.theme) {
          const root = window.document.documentElement;
          if (data.theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          localStorage.setItem('theme', data.theme);
        }

        // Immediately apply session timeout value
        if (data.sessionTimeout) {
          localStorage.setItem('sessionTimeout', data.sessionTimeout);
        }
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to update settings details';
      showToast(serverMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        showToast('Invalid file type. Only JPEG, JPG, and PNG are allowed.', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds the 5MB maximum limit.', 'error');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      const response = await uploadDairyLogo(logoFile);
      if (response && response.success) {
        showToast('Dairy logo uploaded and updated successfully', 'success');
        setProfile(response.data);
        setLogoFile(null);
      }
    } catch (error) {
      showToast('Failed to upload logo image file', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded md:col-span-1 animate-pulse" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded md:col-span-2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'System Settings' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          ANR Dairy Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card: Logo Upload */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 flex flex-col items-center justify-center text-center space-y-6 md:col-span-1 h-fit"
        >
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Dairy Brand Logo
            </h2>
            <p className="text-xs text-slate-500">
              Recommended dimensions: square PNG or JPG. Max file size: 5MB.
            </p>
          </div>

          {/* Logo Frame */}
          <div className="relative w-36 h-36 rounded-lg border-2 border-dashed border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-slate-800/20 flex items-center justify-center overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Branding Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <Building className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            )}
          </div>

          {/* Upload triggers */}
          <div className="space-y-3 w-full">
            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-dark-border rounded-md cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Select File</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>

            {logoFile && (
              <button
                type="button"
                onClick={handleLogoUpload}
                disabled={uploading}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
              >
                {uploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Card: Tabbed Details Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden md:col-span-2 shadow-sm"
        >
          {/* Tabs Navigation Header */}
          <div className="flex border-b border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30">
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'business'
                  ? 'border-blue-600 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Business Details</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('communication')}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'communication'
                  ? 'border-blue-600 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Communication Channels</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                activeTab === 'system'
                  ? 'border-blue-600 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>System Configuration</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onUpdateProfile)} className="p-6 space-y-6">
            
            {activeTab === 'business' ? (
              /* TAB 1: Business details form block */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Dairy Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Dairy Name
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        {...register('dairyName', { required: 'Dairy name is required' })}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        placeholder="ANR Dairy"
                      />
                    </div>
                    {errors.dairyName && (
                      <p className="text-[10px] text-red-500 font-semibold">{errors.dairyName.message}</p>
                    )}
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Owner Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        {...register('ownerName', { required: 'Owner name is required' })}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        placeholder="A.N. Ramulu"
                      />
                    </div>
                    {errors.ownerName && (
                      <p className="text-[10px] text-red-500 font-semibold">{errors.ownerName.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        {...register('phone', { 
                          required: 'Phone number is required',
                          pattern: { value: /^[6-9]\d{9}$/, message: 'Must be a valid 10-digit number' }
                        })}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        placeholder="9999999999"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: { value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, message: 'Must be a valid email' }
                        })}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        placeholder="info@anrdairy.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] text-red-500 font-semibold">{errors.email.message}</p>
                    )}
                  </div>

                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <textarea
                      rows="2"
                      {...register('address', { required: 'Physical address is required' })}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      placeholder="Dairy office address..."
                    />
                  </div>
                  {errors.address && (
                    <p className="text-[10px] text-red-500 font-semibold">{errors.address.message}</p>
                  )}
                </div>

                {/* GST Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    GST Number (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      {...register('gstNumber')}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      placeholder="37AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                {/* FAT & SNF limits */}
                <div className="border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Milk Collection Validation Limits
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min FAT %</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('minFat', { required: 'Min FAT is required' })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max FAT %</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('maxFat', { required: 'Max FAT is required' })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Min SNF %</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('minSnf', { required: 'Min SNF is required' })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Max SNF %</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('maxSnf', { required: 'Max SNF is required' })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'communication' ? (
              /* TAB 2: Communication channels setup block */
              <div className="space-y-6">
                
                {/* WHATSAPP CONTAINER */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        WhatsApp Business Integration
                      </h3>
                      <p className="text-xs text-slate-500">
                        Automatically dispatch collections summaries, invoices, and payment payouts.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register('enableWhatsApp')}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {watchWhatsApp && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fadeIn">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">WhatsApp Gateway Provider</label>
                        <select 
                          {...register('whatsappProvider')}
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        >
                          <option value="development">Development Provider</option>
                          <option value="meta">Meta WhatsApp Cloud API (v2)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">Sender Number ID / ID Token</label>
                        <input 
                          type="text"
                          {...register('whatsappSenderNumber')}
                          placeholder="e.g. 109385038592"
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">WhatsApp Gateway Endpoint URL</label>
                        <input 
                          type="text"
                          {...register('whatsappApiUrl')}
                          placeholder="https://graph.facebook.com/v18.0/..."
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">Authentication Token key (Bearer Key)</label>
                        <input 
                          type="password"
                          {...register('whatsappApiKey')}
                          placeholder="EAACW..."
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS fallback CONTAINER */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        SMS Fallback Service Gateway
                      </h3>
                      <p className="text-xs text-slate-500">
                        Send notifications via SMS automatically if WhatsApp delivery fails.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register('enableSMS')}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {watchSMS && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-fadeIn">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">SMS Gateway Provider</label>
                        <select 
                          {...register('smsProvider')}
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        >
                          <option value="development">Development Provider</option>
                          <option value="twilio">Twilio SMS API Gateway (v2)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">Sender Identifier / Header / Phone</label>
                        <input 
                          type="text"
                          {...register('smsSenderId')}
                          placeholder="e.g. +14155550199 or ANRDairy"
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">API Endpoint URL / Account SID Credentials</label>
                        <input 
                          type="text"
                          {...register('smsApiUrl')}
                          placeholder="e.g. Twilio Account SID"
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="font-semibold text-slate-600 dark:text-slate-400">Auth Token Key / API Private Key</label>
                        <input 
                          type="password"
                          {...register('smsApiKey')}
                          placeholder="e.g. Twilio Auth Token"
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* TAB 3: System Configuration setup block */
              <div className="space-y-6">
                
                {/* Rate & Billing Configuration */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Billing & Rate Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Billing Cycle Period</label>
                      <select 
                        {...register('billingCycle')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100"
                      >
                        <option value="10-day">10-Day Billing (Standard)</option>
                        <option value="15-day">15-Day Cycle</option>
                        <option value="monthly">Monthly Cycle</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-655 dark:text-slate-400">Milk Pricing Rate Mode</label>
                      <select 
                        {...register('rateMode')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100"
                      >
                        <option value="fat-snf">FAT & SNF Combined Chart</option>
                        <option value="fat-only">FAT Percentage Chart Only</option>
                        <option value="fixed">Fixed Rate per Liter</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Milk Collection Settings */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Milk Collection Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Default Milk Type</label>
                      <select 
                        {...register('defaultMilkType')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100 font-semibold"
                      >
                        <option value="buffalo">Buffalo</option>
                        <option value="cow">Cow</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-655 dark:text-slate-400">Default Shift</label>
                      <select 
                        {...register('defaultShift')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100 font-semibold"
                      >
                        <option value="morning">Morning Shift</option>
                        <option value="evening">Evening Shift</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-3 justify-center pt-2 sm:pt-4 sm:col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rememberMilkType"
                          {...register('rememberMilkType')}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="rememberMilkType" className="font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                          Remember last selected milk type during current session
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="useFarmerPreferredMilkType"
                          {...register('useFarmerPreferredMilkType')}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="useFarmerPreferredMilkType" className="font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                          Automatically use Farmer Preferred Milk Type
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rememberFarmerMilkType"
                          {...register('rememberFarmerMilkType')}
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="rememberFarmerMilkType" className="font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                          Automatically update Farmer Preferred Milk Type whenever operator changes Milk Type
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance & Localization settings */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Localization & Regional preferences
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">System Theme</label>
                      <select 
                        {...register('theme')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Default Language</label>
                      <select 
                        {...register('language')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="en">English</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-655 dark:text-slate-400">Print Preview Layout</label>
                      <select 
                        {...register('printLayout')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="a4">Standard A4 Sheet Layout</option>
                        <option value="thermal">80mm Thermal POS Receipt Layout</option>
                      </select>
                    </div>

                    {/* Regional settings */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Local Time Zone</label>
                      <select 
                        {...register('timezone')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Display Date Format</label>
                      <select 
                        {...register('dateFormat')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (E.g. 09/07/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (E.g. 2026-07-09)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Base Currency Symbol</label>
                      <select 
                        {...register('currency')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Database Backups Scheduler Configuration */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Database Auto Backup Policy
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-650 dark:text-slate-400">Backup Frequency Schedule</label>
                      <select 
                        {...register('backupFrequency')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100"
                      >
                        <option value="disabled">Disabled (Do not run auto backups)</option>
                        <option value="manual-only">Manual-Only (Refinement 8)</option>
                        <option value="daily">Daily Scheduled Backup</option>
                        <option value="weekly">Weekly Scheduled Backup</option>
                        <option value="monthly">Monthly Scheduled Backup</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-655 dark:text-slate-400">Backup Retention Policy (Days)</label>
                      <input 
                        type="number"
                        min="1"
                        max="365"
                        {...register('backupRetentionDays')}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Security & Session Configuration */}
                <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-slate-50/50 dark:bg-slate-800/10 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-1.5 uppercase tracking-wide">
                    Security & Session Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-655 dark:text-slate-400">Inactivity Session Timeout (Minutes)</label>
                      <input 
                        type="number"
                        min="5"
                        max="1440"
                        {...register('sessionTimeout', { required: 'Session timeout is required', min: { value: 5, message: 'Minimum timeout is 5 minutes' } })}
                        className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-855 dark:text-slate-100 font-semibold"
                      />
                      {errors.sessionTimeout && (
                        <p className="text-[10px] text-red-500 font-semibold">{errors.sessionTimeout.message}</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Audit Log Security Change Reason */}
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/10 p-3 rounded-lg border border-slate-200 dark:border-dark-border">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reason for Settings Change (Required for Security Audit Log)
              </label>
              <textarea
                rows="1"
                {...register('reason', { required: 'You must provide a reason for editing the profile settings' })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                placeholder="Describe why you are modifying these configurations... (e.g. Update WhatsApp templates/credentials)"
              />
              {errors.reason && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.reason.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

          </form>
        </motion.div>

      </div>
    </div>
  );
}
