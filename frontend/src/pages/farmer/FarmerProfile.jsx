import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { useUI } from '../../context/UIContext';
import { 
  User, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  Smartphone, 
  Upload, 
  X, 
  Save, 
  Lock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FarmerProfile() {
  const navigate = useNavigate();
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load current farmer details on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        // We can retrieve the farmer details from /me or we can define a portal me or fetch using farmer ID from storage
        const userObj = JSON.parse(localStorage.getItem('user'));
        const response = await axios.get(`${baseUrl}/api/v1/farmers/${userObj.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.success) {
          const f = response.data.data;
          setProfile(f);
          reset({
            bankHolderName: f.bankDetails?.accountHolderName || '',
            bankAccountNumber: f.bankDetails?.accountNumber || '',
            bankIfscCode: f.bankDetails?.ifscCode || '',
            bankName: f.bankDetails?.bankName || '',
            upiId: f.upiId || ''
          });

          if (f.photo) {
            setPhotoPreview(`${baseUrl}${f.photo}`);
          }
        }
      } catch (err) {
        showToast('Failed to load profile details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset, showToast]);

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
      const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('bankHolderName', data.bankHolderName || '');
      formData.append('bankAccountNumber', data.bankAccountNumber || '');
      formData.append('bankIfscCode', data.bankIfscCode || '');
      formData.append('bankName', data.bankName || '');
      formData.append('upiId', data.upiId || '');

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await axios.put(`${baseUrl}/api/v1/farmers/portal/profile`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.success) {
        showToast('Profile details updated successfully', 'success');
        
        // Update name/photo caching in local user storage if needed
        const currentCached = JSON.parse(localStorage.getItem('user'));
        const updated = response.data.data;
        localStorage.setItem('user', JSON.stringify({
          ...currentCached,
          name: updated.name
        }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile details', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">My Profile Settings</h1>
          <p className="text-xs text-slate-450 mt-1">Manage your portal credentials, profile picture, and banking settings.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/farmer/change-password')}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md hover:bg-slate-50 transition"
        >
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Grid container */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Photo Upload & Administrative defaults */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Photo upload container */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-850 dark:text-slate-200">
              Profile Photo
            </h2>

            {/* Preview Dropzone */}
            <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-slate-350 dark:border-dark-border bg-slate-50 dark:bg-slate-800/10 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Farmer Profile" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemovePhotoPreview}
                    className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-650 text-white rounded-full transition shadow-sm"
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
            <label className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300 dark:border-dark-border rounded-md cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-blue-500" />
              <span>{photoPreview ? 'Replace Photo' : 'Upload Photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>

          {/* Read-Only preferences */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-400">
            <h2 className="text-sm font-semibold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              System Registration Data
            </h2>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Farmer Code</label>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-50 dark:bg-slate-850/30 p-2 rounded border border-slate-100 dark:border-dark-border">{profile?.farmerCode}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Milk Type</label>
                <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm bg-slate-50 dark:bg-slate-855/30 p-2 rounded border border-slate-100 dark:border-dark-border">{profile?.milkType}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Shift preference</label>
                <p className="font-bold text-slate-800 dark:text-slate-200 capitalize text-sm bg-slate-50 dark:bg-slate-855/30 p-2 rounded border border-slate-100 dark:border-dark-border">{profile?.collectionPreference}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Form details (banks, names, addresses) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Identity & village details (Read-only for security reasons) */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm text-xs font-medium">
            <h2 className="text-sm font-semibold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Farmer Details (Read Only)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled
                    value={profile?.name || ''}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md text-slate-500 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled
                    value={profile?.phone || ''}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md text-slate-500 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Village</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled
                    value={profile?.village || ''}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md text-slate-500 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-450 italic mt-2">Note: To request modifications to your registered name, mobile number, or village, please contact the dairy operations desk.</p>
          </div>

          {/* Editable Bank accounts & UPI details */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 shadow-sm text-xs">
            <h2 className="text-sm font-semibold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-2">
              Edit Payment Bank Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Holder Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Account Holder Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...register('bankHolderName')}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="Holder name"
                  />
                </div>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Account Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...register('bankAccountNumber')}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="Account number"
                  />
                </div>
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bank Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...register('bankName')}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="e.g. State Bank of India"
                  />
                </div>
              </div>

              {/* IFSC */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">IFSC Code</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...register('bankIfscCode')}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>

              {/* UPI ID */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">UPI ID (Optional)</label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    {...register('upiId')}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100 font-semibold"
                    placeholder="username@okaxis"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Form Action Triggers */}
          <div className="flex justify-end gap-3 select-none">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving updates...' : 'Save Profile Details'}</span>
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}
