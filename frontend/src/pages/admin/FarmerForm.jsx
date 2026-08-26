import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useUI } from '../../context/UIContext';
import { addFarmer, getFarmerById, updateFarmer } from '../../services/farmerService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  Smartphone, 
  Settings, 
  Upload, 
  X,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUI();
  
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const watchLoginEnabled = watch('isLoginEnabled');

  // Load farmer details if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const loadFarmer = async () => {
        try {
          const response = await getFarmerById(id);
          if (response && response.success && response.data) {
            const f = response.data;
            reset({
              name: f.name,
              phone: f.phone,
              farmerCode: f.farmerCode || '',
              village: f.village,
              address: f.address,
              upiId: f.upiId,
              milkType: f.milkType,
              collectionPreference: f.collectionPreference,
              isLoginEnabled: f.isLoginEnabled || false,
              bankHolderName: f.bankDetails?.accountHolderName || '',
              bankAccountNumber: f.bankDetails?.accountNumber || '',
              bankIfscCode: f.bankDetails?.ifscCode || '',
              bankName: f.bankDetails?.bankName || '',
              reason: ''
            });

            if (f.photo) {
              const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
              setPhotoPreview(`${baseUrl}${f.photo}`);
            }
          }
        } catch (error) {
          showToast('Failed to load farmer details', 'error');
          navigate('/admin/farmers');
        } finally {
          setLoading(false);
        }
      };
      loadFarmer();
    }
  }, [id, isEditMode, reset, navigate, showToast]);

  const handlePhotoChange = (e) => {
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
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhotoPreview = () => {
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // Pack parameters into FormData for Multer processing
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone);
      formData.append('village', data.village);
      formData.append('address', data.address || '');
      formData.append('upiId', data.upiId || '');
      formData.append('milkType', data.milkType);
      formData.append('collectionPreference', data.collectionPreference);
      formData.append('bankHolderName', data.bankHolderName || '');
      formData.append('bankAccountNumber', data.bankAccountNumber || '');
      formData.append('bankIfscCode', data.bankIfscCode || '');
      formData.append('bankName', data.bankName || '');
      formData.append('isLoginEnabled', data.isLoginEnabled ? 'true' : 'false');
      if (data.isLoginEnabled) {
        if (data.farmerCode) {
          formData.append('farmerCode', data.farmerCode);
        }
        if (data.password) {
          formData.append('password', data.password);
        }
      }
      
      if (isEditMode) {
        formData.append('reason', data.reason);
      }

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      let response;
      if (isEditMode) {
        response = await updateFarmer(id, formData);
      } else {
        response = await addFarmer(formData);
      }

      if (response && response.success) {
        showToast(
          isEditMode ? 'Farmer profile updated successfully' : 'Farmer registered successfully',
          'success'
        );
        navigate('/admin/farmers');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Failed to submit farmer profile';
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
          onClick={() => navigate('/admin/farmers')}
          className="p-2 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex flex-col gap-1.5">
          <Breadcrumbs 
            items={[
              { label: 'Farmers Registry', path: '/admin/farmers' }, 
              { label: isEditMode ? 'Edit Profile' : 'Add Farmer' }
            ]} 
          />
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
            {isEditMode ? 'Edit Farmer Profile' : 'Register New Farmer'}
          </h1>
        </div>
      </div>

      {/* Main Grid form container */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Photo upload frame & preference configs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-1"
        >
          {/* Photo upload container */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Farmer Profile Image
            </h2>

            {/* Preview Dropzone */}
            <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-slate-800/20 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Farmer Profile" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemovePhotoPreview}
                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <User className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {/* Select Trigger */}
            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-dark-border rounded-md cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>{photoPreview ? 'Replace Photo' : 'Upload Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          {/* Collection preferences */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Collection Defaults
            </h2>

            {/* Milk Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Milk Type
              </label>
              <select
                {...register('milkType', { required: true })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
              >
                <option value="cow">Cow</option>
                <option value="buffalo">Buffalo</option>
                <option value="mix">Mix</option>
              </select>
            </div>

            {/* Preference */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Shift Preference
              </label>
              <select
                {...register('collectionPreference', { required: true })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
              >
                <option value="flexible">Flexible</option>
                <option value="both">Both Shifts</option>
                <option value="morning">Morning Only</option>
                <option value="evening">Evening Only</option>
              </select>
            </div>
          </div>

          {/* Portal Login Credentials */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Farmer Portal Credentials
            </h2>

            {/* Enable Login Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLoginEnabled"
                {...register('isLoginEnabled')}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isLoginEnabled" className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer">
                Enable Farmer Portal Login
              </label>
            </div>

            {watchLoginEnabled && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-dark-border mt-3">
                {/* Farmer Code Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Farmer Code (Optional, auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    {...register('farmerCode')}
                    disabled={isEditMode}
                    placeholder="e.g. ANRF0001"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md disabled:opacity-60"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isEditMode ? 'Change Password (Optional)' : 'Temporary Password'}
                  </label>
                  <input
                    type="text"
                    {...register('password', { 
                      required: watchLoginEnabled && !isEditMode ? 'Temporary password is required' : false 
                    })}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                  />
                  {errors.password && (
                    <p className="text-[10px] text-red-500 font-semibold">{errors.password.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Side: Identity, Addresses, and Banks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-2"
        >
          {/* Profile form */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('name', { required: 'Farmer name is required' })}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.name.message}</p>
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="9999999999"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.phone.message}</p>
                )}
              </div>

              {/* Village */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Village
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('village', { required: 'Village name is required' })}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="Penugonda"
                  />
                </div>
                {errors.village && (
                  <p className="text-[10px] text-red-500 font-semibold">{errors.village.message}</p>
                )}
              </div>

              {/* UPI ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  UPI ID (Optional)
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('upiId')}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="username@okaxis"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Address
              </label>
              <textarea
                rows="2"
                {...register('address')}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                placeholder="Farmer house number, street, landmark details..."
              />
            </div>
          </div>

          {/* Bank credentials */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Bank Account Details (For Invoicing & Payouts)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Holder Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Account Holder Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('bankHolderName')}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="Farmer name as in passbook"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Account Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('bankAccountNumber')}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="Enter account number"
                  />
                </div>
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Bank Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('bankName')}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="e.g. State Bank of India"
                  />
                </div>
              </div>

              {/* IFSC */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  IFSC Code
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    {...register('bankIfscCode')}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                    placeholder="SBIN0001234"
                  />
                </div>
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
                  {...register('reason', { required: 'A reason must be provided to edit the profile' })}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md"
                  placeholder="Describe why you are modifying this details..."
                />
              </div>
              {errors.reason && (
                <p className="text-[10px] text-red-500 font-semibold">{errors.reason.message}</p>
              )}
            </div>
          )}

          {/* Form action triggers */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/farmers')}
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
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

        </motion.div>

      </form>
    </div>
  );
}
