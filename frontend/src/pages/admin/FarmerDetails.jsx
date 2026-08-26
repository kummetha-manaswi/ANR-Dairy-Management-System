import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getFarmerById } from '../../services/farmerService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Smartphone, 
  Edit, 
  BookOpen, 
  FileText, 
  Wallet,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useUI();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passbook'); // tabs: passbook, billing, payments

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const response = await getFarmerById(id);
        if (response && response.success) {
          setFarmer(response.data);
        }
      } catch (error) {
        showToast('Failed to load farmer profile details', 'error');
        navigate('/admin/farmers');
      } finally {
        setLoading(false);
      }
    };
    fetchFarmer();
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded col-span-1" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded col-span-2" />
        </div>
      </div>
    );
  }

  if (!farmer) return null;

  const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  const avatarUrl = farmer.photo ? `${baseUrl}${farmer.photo}` : '';

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex justify-between items-start gap-4">
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
                { label: farmer.farmerCode }
              ]} 
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
              Farmer Passbook: {farmer.farmerCode}
            </h1>
          </div>
        </div>

        <Link
          to={`/admin/farmers/${farmer._id}/edit`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-dark-border rounded-md shadow-sm transition"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </Link>
      </div>

      {/* Main Grid: Left Profile Card, Right Passbook Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-1"
        >
          {/* Card 1: Core Avatar & Identity */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 flex flex-col items-center justify-center text-center space-y-4">
            
            {/* Profile Avatar */}
            <div className="relative w-28 h-28 rounded-full border-2 border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-800/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={farmer.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            {/* Name & Code */}
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {farmer.name}
              </h2>
              <p className="text-xs font-semibold text-slate-400">
                Farmer ID: {farmer.farmerCode}
              </p>
              
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5 ${
                farmer.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {farmer.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Card 2: Contact & Bank Details */}
          <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-4 text-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-dark-border pb-2">
              Contact & Payouts
            </h3>

            {/* Contact Details */}
            <div className="space-y-2.5">
              <div className="flex gap-3">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{farmer.phone}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Village & Address</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {farmer.village}
                    {farmer.address && <span className="block font-normal text-xs text-slate-500 mt-0.5">{farmer.address}</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border-t border-slate-100 dark:border-dark-border pt-3 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bank Details
              </h4>
              
              {farmer.bankDetails?.accountNumber ? (
                <>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Bank Name</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{farmer.bankDetails.bankName || 'SBI'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Holder Name</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{farmer.bankDetails.accountHolderName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <p className="text-slate-400 font-medium">Account No.</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{farmer.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">IFSC Code</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{farmer.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">No bank account details provided</p>
              )}

              {farmer.upiId && (
                <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-dark-border text-xs">
                  <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium mr-1.5">UPI ID:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{farmer.upiId}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Side: Passbook log tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-6 space-y-6 lg:col-span-2"
        >
          {/* Tabs Menu */}
          <div className="flex border-b border-slate-200 dark:border-dark-border select-none">
            <button
              onClick={() => setActiveTab('passbook')}
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'passbook'
                  ? 'border-blue-500 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Passbook Entries</span>
            </button>
            
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'billing'
                  ? 'border-blue-500 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Billing Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Payout Ledger</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div>
            {activeTab === 'passbook' && (
              <EmptyState
                icon={Activity}
                title="No Milk Collections Yet"
                description="Daily milk collection entries will display in this passbook once recorded by the Employee shift agent."
              />
            )}
            
            {activeTab === 'billing' && (
              <EmptyState
                icon={FileText}
                title="No Invoices Generated"
                description="10-day, 15-day, or monthly billing logs will display here once invoice runs are triggered."
              />
            )}

            {activeTab === 'payments' && (
              <EmptyState
                icon={Wallet}
                title="No Payouts Logged"
                description="Completed transaction summaries and Cash/Bank references will display here."
              />
            )}
          </div>

        </motion.div>

      </div>
    </div>
  );
}
