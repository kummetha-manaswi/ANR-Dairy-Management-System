import React, { useState, useEffect } from 'react';
import { useUI } from '../../context/UIContext';
import { getTemplates, updateTemplate, getLogs, retryLog, sendBulkNotification, sendIndividualNotification } from '../../services/notificationService';
import { getFarmers } from '../../services/farmerService';
import { getDairyProfile } from '../../services/dairyService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { 
  MessageSquare, RefreshCw, Send, Search, Filter, AlertCircle, 
  CheckCircle, XCircle, Clock, Info, Users, User, Smartphone, 
  ChevronLeft, ChevronRight, HelpCircle, Save, FileText, LayoutList 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error in CommunicationCenter:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-lg text-center space-y-3 select-none">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Something went wrong rendering this tab</h3>
          <p className="text-xs text-red-655 dark:text-red-500/80 max-w-md mx-auto">{this.state.error?.message || "An unexpected rendering error occurred."}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition shadow-sm"
          >
            Try Refreshing Tab
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CommunicationCenter() {
  const { showToast, askConfirmation } = useUI();
  const [activeTab, setActiveTab] = useState('logs');
  
  // Global settings state
  const [globalSettings, setGlobalSettings] = useState({ enableWhatsApp: false, enableSMS: false });

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryingLogId, setRetryingLogId] = useState(null);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState('collection');
  const [templateText, setTemplateText] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Broadcast state
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [broadcastType, setBroadcastType] = useState('all'); // 'all', 'individual', 'selected'
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastMedium, setBroadcastMedium] = useState('whatsapp');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Autocomplete / search helper states
  const [individualSearch, setIndividualSearch] = useState('');
  const [bulkSearch, setBulkSearch] = useState('');
  const [showIndividualDropdown, setShowIndividualDropdown] = useState(false);

  // Mock data for template preview compilation
  const mockVariables = {
    FarmerName: 'M. Ramakrishna',
    FarmerID: 'ANRF0024',
    Mobile: '+91 0000000000',
    Village: 'Anarpura',
    Date: '2026-07-09',
    Liters: '14.50',
    FAT: '4.2',
    SNF: '8.6',
    Rate: '46.50',
    Amount: '674.25',
    BillNumber: 'ANR-INV-202607-0012',
    PaymentMode: 'Bank Transfer',
    PaymentAmount: '2500.00',
    DairyName: 'ANR Dairy',
    Shift: 'Morning',
    MilkType: 'Buffalo'
  };

  // Compile placeholders dynamically for the preview block
  const compilePreview = (text) => {
    if (!text) return '';
    let compiled = text;
    Object.keys(mockVariables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      compiled = compiled.replace(regex, mockVariables[key]);
      
      // Support lowercase snake_case fallback forms in UI preview compilation
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase().substring(1);
      const snakeRegex = new RegExp(`\\{${snakeKey}\\}`, 'g');
      compiled = compiled.replace(snakeRegex, mockVariables[key]);
    });
    // Add additional placeholder replacements explicitly
    compiled = compiled.replace(/{invoice_number}/g, mockVariables.BillNumber);
    compiled = compiled.replace(/{payment_amount}/g, mockVariables.PaymentAmount);
    compiled = compiled.replace(/{milk_type}/g, mockVariables.MilkType);
    compiled = compiled.replace(/{mode}/g, mockVariables.PaymentMode);
    
    return compiled;
  };

  // Fetch Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await getLogs({
        page,
        limit: 10,
        status: filterStatus,
        type: filterType,
        search: searchQuery
      });
      if (response && response.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.pagination.pages);
        setTotalLogs(response.data.pagination.total);
      }
    } catch (error) {
      showToast('Failed to fetch communication logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await getTemplates();
      if (response && response.success) {
        setTemplates(response.data);
        const selected = response.data.find(t => t.type === selectedTemplateType);
        if (selected) {
          setTemplateText(selected.templateText);
        }
      }
    } catch (error) {
      showToast('Failed to load templates', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch Global Settings
  const fetchSettings = async () => {
    try {
      const response = await getDairyProfile();
      if (response && response.success && response.data) {
        setGlobalSettings({
          enableWhatsApp: response.data.enableWhatsApp,
          enableSMS: response.data.enableSMS
        });
      }
    } catch (error) {
      console.error('Failed to load dairy settings', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch Active Farmers (for Broadcast lists)
  const fetchFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const response = await getFarmers({ status: 'active', limit: 100 });
      if (response && response.success) {
        setFarmers(response.data.farmers);
      }
    } catch (error) {
      showToast('Failed to retrieve farmers list', 'error');
    } finally {
      setLoadingFarmers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'broadcast') {
      fetchFarmers();
    }
  }, [activeTab, page, filterStatus, filterType, searchQuery]);

  // Handle template selection change
  useEffect(() => {
    if (templates.length > 0) {
      const selected = templates.find(t => t.type === selectedTemplateType);
      if (selected) {
        setTemplateText(selected.templateText);
      }
    }
  }, [selectedTemplateType, templates]);

  // Handle Save Template
  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const response = await updateTemplate(selectedTemplateType, templateText);
      if (response && response.success) {
        showToast(`Template for ${selectedTemplateType} saved successfully`, 'success');
        // Refresh templates local state
        setTemplates(prev => prev.map(t => t.type === selectedTemplateType ? response.data : t));
      }
    } catch (error) {
      showToast('Failed to update notification template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Handle Retry Log
  const handleRetryLog = async (id) => {
    setRetryingLogId(id);
    try {
      const response = await retryLog(id);
      if (response && response.success) {
        showToast('Notification retried and status updated successfully', 'success');
        fetchLogs();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to retry notification delivery', 'error');
    } finally {
      setRetryingLogId(null);
    }
  };

  // Validation helper
  const getValidationError = () => {
    const notificationsDisabled = !globalSettings.enableWhatsApp && !globalSettings.enableSMS;
    if (notificationsDisabled) {
      return "WhatsApp and SMS channels are globally disabled in Settings.";
    }
    if (!broadcastMessage.trim()) {
      return "Please compose a message campaign body.";
    }
    if (broadcastType === 'individual' && !selectedFarmerId) {
      return "Please select a target farmer profile.";
    }
    if (broadcastType === 'selected' && selectedFarmerIds.length === 0) {
      return "Please select at least one farmer checkbox for the bulk campaign.";
    }
    if (broadcastType === 'all' && farmers.length === 0) {
      return "No active farmers found in directory to message.";
    }
    return null;
  };

  // Handle Broadcast Dispatch Submission
  const handleSendBroadcast = async () => {
    const validationError = getValidationError();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    let targetCount = 0;
    let targetIds = [];

    if (broadcastType === 'all') {
      targetCount = farmers.length;
    } else if (broadcastType === 'individual') {
      targetCount = 1;
      targetIds = [selectedFarmerId];
    } else if (broadcastType === 'selected') {
      targetCount = selectedFarmerIds.length;
      targetIds = selectedFarmerIds;
    }

    const confirmed = await askConfirmation({
      title: 'Confirm Notification Broadcast',
      message: `You are about to dispatch this custom broadcast via ${broadcastMedium === 'whatsapp' ? 'WhatsApp' : 'SMS'} to ${targetCount} active farmer(s). Would you like to proceed?`,
      confirmText: 'Launch Broadcast',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      setSendingBroadcast(true);
      try {
        if (broadcastType === 'individual') {
          await sendIndividualNotification({
            farmerId: selectedFarmerId,
            message: broadcastMessage,
            medium: broadcastMedium
          });
        } else {
          await sendBulkNotification({
            farmerIds: broadcastType === 'selected' ? targetIds : [],
            message: broadcastMessage,
            medium: broadcastMedium
          });
        }
        showToast(`Broadcast queued successfully for ${targetCount} farmers`, 'success');
        // Reset form fields
        setBroadcastMessage('');
        setSelectedFarmerId('');
        setSelectedFarmerIds([]);
        setIndividualSearch('');
        // Switch to logs to see updates
        setActiveTab('logs');
      } catch (error) {
        showToast('Failed to dispatch broadcast', 'error');
      } finally {
        setSendingBroadcast(false);
      }
    }
  };

  const handlePlaceholderClick = (placeholder) => {
    if (activeTab === 'templates') {
      setTemplateText(prev => prev + `{${placeholder}}`);
    } else if (activeTab === 'broadcast') {
      setBroadcastMessage(prev => prev + `{${placeholder}}`);
    }
  };

  const toggleSelectFarmerId = (id) => {
    setSelectedFarmerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <Breadcrumbs items={[{ label: 'Communication Center' }]} />
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          ANR Dairy Communication Center
        </h1>
      </div>

      {/* Tabs Headers */}
      <div className="flex border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <LayoutList className="w-4.5 h-4.5" />
          <span>Delivery History Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <FileText className="w-4.5 h-4.5" />
          <span>Notification Templates</span>
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'broadcast'
              ? 'border-blue-600 text-blue-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          <Send className="w-4.5 h-4.5" />
          <span>Custom Broadcasts</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <ErrorBoundary key={activeTab}>
          {activeTab === 'logs' && (
          /* TAB 1: Notification logs history */
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filters panel */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder="Search farmer name, phone..."
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                >
                  <option value="">All Statuses</option>
                  <option value="Queued">Queued</option>
                  <option value="Sending">Sending</option>
                  <option value="Sent">Sent</option>
                  <option value="Failed">Failed</option>
                  <option value="Retried">Retried (Succeeded)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400 uppercase tracking-wider">Trigger Type</label>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-800 dark:text-slate-100"
                >
                  <option value="">All Types</option>
                  <option value="collection">Milk Collection Summary</option>
                  <option value="bill">Bill Invoice Alert</option>
                  <option value="payment">Payment Confirmation</option>
                  <option value="bulk">Custom Broadcast</option>
                  <option value="individual">Individual Msg</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilterStatus('');
                    setFilterType('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-semibold transition"
                >
                  Reset
                </button>
                <button
                  onClick={fetchLogs}
                  className="py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-brand-400 dark:hover:bg-blue-900/30 rounded-md font-semibold transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>

            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-dark-border text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-3.5">Farmer Info</th>
                      <th className="p-3.5">Mobile</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Medium</th>
                      <th className="p-3.5">Message ID</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Sent Time</th>
                      <th className="p-3.5">Err Details / Logs</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                    {loadingLogs ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-12" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-20" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-14" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-28" /></td>
                          <td className="p-3.5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24" /></td>
                          <td className="p-3.5 text-right"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-10 ml-auto" /></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-400">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold">No notification logs matching filters found</p>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const statusColors = {
                          Queued: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                          Sending: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
                          Sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
                          Failed: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
                          Retried: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                        };
                        return (
                          <tr key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                            <td className="p-3.5">
                              {log.farmer ? (
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">{log.farmer.name}</p>
                                  <span className="text-[10px] text-slate-400 font-semibold">{log.farmer.farmerCode}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">System Broadcast</span>
                              )}
                            </td>
                            <td className="p-3.5 font-semibold">{log.recipient}</td>
                            <td className="p-3.5 capitalize">{log.type}</td>
                            <td className="p-3.5">
                              <span className="inline-flex items-center gap-1">
                                {log.medium === 'whatsapp' ? (
                                  <span className="text-emerald-600 dark:text-emerald-500 font-medium">WhatsApp</span>
                                ) : log.medium === 'sms' ? (
                                  <span className="text-blue-600 dark:text-blue-500 font-medium">SMS</span>
                                ) : (
                                  <span className="text-slate-500">Both</span>
                                )}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-slate-450">{log.messageId || 'N/A'}</td>
                            <td className="p-3.5">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[log.status] || ''}`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500">
                              {log.deliveryTime || log.createdAt ? (
                                new Date(log.deliveryTime || log.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })
                              ) : (
                                'Pending'
                              )}
                            </td>
                            <td className="p-3.5 max-w-xs truncate">
                              {log.errorMessage ? (
                                <span className="text-red-500 flex items-center gap-1" title={log.errorMessage}>
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{log.errorMessage}</span>
                                </span>
                              ) : log.attempts > 1 ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Retried successfully ({log.attempts} attempts)</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">Delivered successfully</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {log.status === 'Failed' && (
                                <button
                                  onClick={() => handleRetryLog(log._id)}
                                  disabled={retryingLogId === log._id}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:bg-blue-100 disabled:text-blue-400 dark:bg-blue-950/20 dark:text-brand-400 dark:hover:bg-blue-900/30 rounded transition flex items-center gap-1.5 ml-auto"
                                >
                                  <RefreshCw className={`w-3 h-3 ${retryingLogId === log._id ? 'animate-spin' : ''}`} />
                                  <span>{retryingLogId === log._id ? 'Retrying...' : 'Retry'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/10 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing Page <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalLogs} total logs)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className="p-1.5 border border-slate-200 dark:border-dark-border rounded bg-white dark:bg-dark-surface hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <ChevronLeft className="w-4.5 h-4.5 text-slate-650" />
                    </button>
                    <button
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className="p-1.5 border border-slate-200 dark:border-dark-border rounded bg-white dark:bg-dark-surface hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      <ChevronRight className="w-4.5 h-4.5 text-slate-650" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          /* TAB 2: Notification Template Manager with Live Preview */
          <motion.div
            key="templates-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Editor Block (Left column) */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border pb-3.5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Edit Notification Template</h3>
                    <p className="text-xs text-slate-500">Configure default texts sent on system events.</p>
                  </div>
                  
                  <select
                    value={selectedTemplateType}
                    onChange={(e) => setSelectedTemplateType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-dark-border rounded-md text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value="collection">Milk Collection Notification</option>
                    <option value="bill">Invoice Bill Generated Notification</option>
                    <option value="payment">Payout Payment Confirmation</option>
                    <option value="custom">Custom Default Broadcast</option>
                  </select>
                </div>

                {loadingTemplates ? (
                  <div className="h-44 bg-slate-50 dark:bg-slate-850 rounded animate-pulse" />
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Template Text Body</label>
                      <textarea
                        rows="6"
                        value={templateText}
                        onChange={(e) => setTemplateText(e.target.value)}
                        className="w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Write template message here..."
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-450 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        <span>Placeholders are replaced dynamically during dispatch.</span>
                      </span>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="flex items-center gap-1.5 py-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition shadow-sm"
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingTemplate ? 'Saving...' : 'Save Template'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview block */}
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-3.5 flex items-center gap-1.5">
                  <Smartphone className="w-4.5 h-4.5 text-blue-500" />
                  <span>Live Compiled Preview (Smartphone Render)</span>
                </h3>
                
                {/* Simulated smartphone chat screen */}
                <div className="max-w-md mx-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-105 shadow-sm text-xs font-sans">
                  {/* Phone Header */}
                  <div className="bg-slate-800 text-white py-2 px-4 flex justify-between items-center text-[10px] font-bold">
                    <span>ANR Dairy Gateway</span>
                    <span>12:00 PM</span>
                  </div>
                  {/* Chat Bubbles */}
                  <div className="p-4 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-36 flex flex-col justify-end">
                    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3.5 rounded-lg rounded-tl-none shadow-sm max-w-[85%] self-start border border-slate-150 dark:border-dark-border space-y-1">
                      <p className="whitespace-pre-wrap leading-relaxed">{compilePreview(templateText) || '...'}</p>
                      <span className="text-[9px] text-slate-400 block text-right font-medium">12:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Placeholders Help block (Right column) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-3.5 uppercase tracking-wide flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <span>Placeholder Helpers</span>
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Click on any placeholder tag below to insert it at the end of your template text body.
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { label: 'Farmer Name', placeholder: 'FarmerName' },
                    { label: 'Farmer ID', placeholder: 'FarmerID' },
                    { label: 'Date', placeholder: 'Date' },
                    { label: 'Shift', placeholder: 'Shift' },
                    { label: 'Milk Type', placeholder: 'MilkType' },
                    { label: 'Liters', placeholder: 'Liters' },
                    { label: 'FAT %', placeholder: 'FAT' },
                    { label: 'SNF %', placeholder: 'SNF' },
                    { label: 'Rate / L', placeholder: 'Rate' },
                    { label: 'Amount', placeholder: 'Amount' },
                    { label: 'Bill Number', placeholder: 'BillNumber' },
                    { label: 'Payment Mode', placeholder: 'PaymentMode' },
                    { label: 'Dairy Name', placeholder: 'DairyName' }
                  ].map((chip) => (
                    <button
                      key={chip.placeholder}
                      type="button"
                      onClick={() => handlePlaceholderClick(chip.placeholder)}
                      className="p-2 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-md font-semibold text-center select-none cursor-pointer transition truncate"
                      title={`Insert {${chip.placeholder}}`}
                    >
                      <span className="block font-bold text-blue-600 dark:text-brand-400">{`{${chip.placeholder}}`}</span>
                      <span className="text-[8px] text-slate-400 mt-0.5 block">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          /* TAB 3: Custom Broadcast Subsystem with Autocomplete & Styled Previews */
          <motion.div
            key="broadcast-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Broadcast config form (Left side) */}
            <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 dark:border-dark-border pb-3.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Compose Custom Broadcast</h3>
                <p className="text-xs text-slate-500">Send custom WhatsApp or SMS campaigns directly to your farmer ledger directory.</p>
              </div>

              {/* Warning alert if notifications are globally disabled */}
              {(!globalSettings.enableWhatsApp && !globalSettings.enableSMS) && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-bold leading-normal flex items-center gap-2 select-none animate-pulse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Notifications are globally disabled in Dairy Settings. Please enable WhatsApp or SMS in settings to allow campaign dispatches.</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                
                {/* Dispatch Target options */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Recipient Target Groups</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => { setBroadcastType('all'); setSelectedFarmerId(''); setSelectedFarmerIds([]); }}
                      className={`p-3 border rounded-lg text-center font-bold transition flex flex-col items-center gap-1.5 ${
                        broadcastType === 'all'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                          : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span>All Active Farmers ({farmers.length})</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => { setBroadcastType('individual'); setSelectedFarmerIds([]); setIndividualSearch(''); }}
                      className={`p-3 border rounded-lg text-center font-bold transition flex flex-col items-center gap-1.5 ${
                        broadcastType === 'individual'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                          : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Individual Farmer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setBroadcastType('selected'); setSelectedFarmerId(''); setBulkSearch(''); }}
                      className={`p-3 border rounded-lg text-center font-bold transition flex flex-col items-center gap-1.5 ${
                        broadcastType === 'selected'
                          ? 'border-blue-600 bg-blue-50/20 text-blue-600 dark:border-brand-500 dark:text-brand-400'
                          : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <LayoutList className="w-5 h-5" />
                      <span>Select Specific Bulk ({selectedFarmerIds.length})</span>
                    </button>
                  </div>
                </div>

                {/* Recipient selectors */}
                {broadcastType === 'individual' && (
                  <div className="space-y-2 animate-fadeIn relative">
                    <label className="font-bold text-slate-400 uppercase tracking-wider block">Target Farmer Recipient</label>
                    {selectedFarmerId ? (
                      (() => {
                        const farmer = farmers.find(f => f._id === selectedFarmerId);
                        return (
                          <div className="flex justify-between items-center p-3.5 border border-emerald-250 bg-emerald-50/15 dark:bg-emerald-950/10 rounded-md">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{farmer?.name || 'Selected Farmer'}</p>
                              <span className="text-[10px] text-slate-500 font-semibold">{farmer?.farmerCode} • {farmer?.phone}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSelectedFarmerId(''); setIndividualSearch(''); }}
                              className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/15 border border-red-200 rounded transition font-bold"
                            >
                              Change Farmer
                            </button>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={individualSearch}
                          onFocus={() => setShowIndividualDropdown(true)}
                          onChange={(e) => { setIndividualSearch(e.target.value); setShowIndividualDropdown(true); }}
                          className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-250 dark:border-dark-border rounded-md text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          placeholder="Search farmer by Name, Farmer ID, or Mobile number..."
                        />
                        {showIndividualDropdown && (
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-dark-surface border border-slate-205 dark:border-dark-border rounded-md shadow-lg z-25 text-xs">
                            {(() => {
                              const query = individualSearch.toLowerCase();
                              const filtered = farmers.filter(f =>
                                f.name.toLowerCase().includes(query) ||
                                f.farmerCode.toLowerCase().includes(query) ||
                                f.phone.includes(query)
                              );
                              if (filtered.length === 0) {
                                return <div className="p-3 text-center text-slate-400 italic">No matching active farmers found</div>;
                              }
                              return filtered.map(f => (
                                <button
                                  key={f._id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFarmerId(f._id);
                                    setIndividualSearch(f.name);
                                    setShowIndividualDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-dark-border flex justify-between items-center transition"
                                >
                                  <div>
                                    <p className="font-bold text-slate-850 dark:text-slate-200">{f.name}</p>
                                    <span className="text-[10px] text-slate-400 font-semibold">{f.farmerCode}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-550 font-semibold">{f.phone}</span>
                                </button>
                              ));
                            })()}
                          </div>
                        )}
                        {showIndividualDropdown && (
                          <div className="fixed inset-0 z-20" onClick={() => setShowIndividualDropdown(false)} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {broadcastType === 'selected' && (
                  <div className="space-y-2 animate-fadeIn border border-slate-200 dark:border-dark-border rounded-lg p-3 bg-slate-50/40 dark:bg-slate-900/10">
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider block">Check Farmers for Bulk Campaign</label>
                      <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-brand-400 px-2.5 py-0.5 rounded text-[10px] font-bold">
                        Selected: {selectedFarmerIds.length} / {farmers.length}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                      className="w-full px-3 py-1.5 mb-2 bg-white dark:bg-dark-surface border border-slate-250 dark:border-dark-border rounded-md text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      placeholder="Filter farmers in list..."
                    />

                    {(() => {
                      const query = bulkSearch.toLowerCase();
                      const filtered = farmers.filter(f =>
                        f.name.toLowerCase().includes(query) ||
                        f.farmerCode.toLowerCase().includes(query) ||
                        f.village.toLowerCase().includes(query)
                      );
                      const allFilteredIds = filtered.map(f => f._id);
                      const isAllChecked = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedFarmerIds.includes(id));
                      
                      const handleToggleAll = () => {
                        if (isAllChecked) {
                          setSelectedFarmerIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                        } else {
                          setSelectedFarmerIds(prev => {
                            const updated = [...prev];
                            allFilteredIds.forEach(id => {
                              if (!updated.includes(id)) updated.push(id);
                            });
                            return updated;
                          });
                        }
                      };

                      return (
                        <div className="flex items-center gap-2 p-2.5 border border-slate-200/50 dark:border-dark-border/40 bg-slate-50 dark:bg-slate-800/40 rounded mb-2 select-none">
                          <input
                            type="checkbox"
                            checked={isAllChecked}
                            onChange={handleToggleAll}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            id="select-all-checkbox"
                          />
                          <label htmlFor="select-all-checkbox" className="font-bold text-[11px] text-slate-650 dark:text-slate-400 cursor-pointer">
                            Select All Filtered ({allFilteredIds.length})
                          </label>
                        </div>
                      );
                    })()}

                    <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                      {(() => {
                        const query = bulkSearch.toLowerCase();
                        const filtered = farmers.filter(f =>
                          f.name.toLowerCase().includes(query) ||
                          f.farmerCode.toLowerCase().includes(query) ||
                          f.village.toLowerCase().includes(query)
                        );
                        if (filtered.length === 0) {
                          return <div className="col-span-2 text-center py-4 text-slate-400 italic">No matching active farmers found</div>;
                        }
                        return filtered.map(f => (
                          <label 
                            key={f._id} 
                            className="flex items-center gap-2 p-2 border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface rounded hover:bg-slate-50/70 dark:hover:bg-slate-800/70 cursor-pointer select-none transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFarmerIds.includes(f._id)}
                              onChange={() => toggleSelectFarmerId(f._id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <p className="font-bold text-slate-850 dark:text-slate-200">{f.name}</p>
                              <span className="text-[9px] text-slate-400">{f.farmerCode} - {f.village}</span>
                            </div>
                          </label>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Medium Channel */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Broadcast Delivery Channel</label>
                  <select
                    value={broadcastMedium}
                    onChange={(e) => setBroadcastMedium(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100 font-medium"
                  >
                    <option value="whatsapp">WhatsApp Business Notification</option>
                    <option value="sms">SMS Text Alert</option>
                  </select>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider">Message Composition</label>
                  <textarea
                    rows="5"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Compose campaign text. Use placeholders from the sidebar to inject live farmer data..."
                    className="w-full p-4 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs leading-relaxed font-medium"
                  />
                </div>

                {/* Validation Status message block */}
                {(() => {
                  const error = getValidationError();
                  if (error) {
                    return (
                      <p className="text-[10px] text-red-500 font-bold select-none leading-none">
                        * {error}
                      </p>
                    );
                  }
                  return null;
                })()}

                {/* Dispatch Trigger */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSendBroadcast}
                    disabled={sendingBroadcast || getValidationError() !== null}
                    className="flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-650 rounded-md transition shadow-md w-full sm:w-auto"
                  >
                    <Send className="w-4.5 h-4.5" />
                    <span>{sendingBroadcast ? 'Dispatching Campaign...' : 'Launch Broadcast Campaign'}</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Broadcast Live Preview & Placeholders sidebar (Right side) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Live Preview block refinement */}
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-3.5 flex items-center gap-1.5">
                  <Smartphone className="w-4.5 h-4.5 text-blue-500" />
                  <span>Live Broadcast Preview</span>
                </h3>
                
                {/* Smartphone Chat screen bubble representation */}
                <div className={`border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs font-sans shadow-inner ${
                  broadcastMedium === 'whatsapp' ? 'bg-[#efeae2] dark:bg-[#0b141a]' : 'bg-[#f4f4f7] dark:bg-slate-900'
                }`}>
                  {/* Phone Header */}
                  {broadcastMedium === 'whatsapp' ? (
                    <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white py-2 px-3 flex items-center gap-2 text-[10px] font-bold select-none">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-extrabold select-none uppercase shadow-sm">
                        AD
                      </div>
                      <div className="flex-1 leading-tight">
                        <p className="font-bold text-xs">ANR Dairy Notification</p>
                        <span className="text-[8px] text-emerald-250 dark:text-emerald-400/80 font-normal">Business Account • Online</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-250 py-2.5 px-3 flex flex-col items-center justify-center text-[10px] font-bold select-none leading-none">
                      <div className="w-6 h-6 rounded-full bg-slate-350 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-650 dark:text-slate-350 font-black mb-0.5">
                        AD
                      </div>
                      <span className="text-[9px] text-slate-500">ANR-Dairy-Gateway</span>
                    </div>
                  )}
                  {/* Chat Message Bubble area */}
                  <div className="p-4 space-y-4 min-h-36 flex flex-col justify-end">
                    {broadcastMedium === 'whatsapp' ? (
                      <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] self-start border-l border-emerald-200/40 dark:border-emerald-800/40 relative">
                        {/* WhatsApp bubble triangle */}
                        <div className="absolute -left-1.5 top-0 w-2 h-2.5 overflow-hidden">
                          <div className="w-3.5 h-3.5 bg-[#d9fdd3] dark:bg-[#005c4b] rotate-45 transform origin-top-right rounded-br-sm" />
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed break-words" style={{ whiteSpace: 'pre-wrap' }}>
                          {compilePreview(broadcastMessage) || 'Start typing message to compile preview...'}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[8px] text-slate-450 dark:text-slate-400/80 mt-1 select-none font-medium">
                          <span>12:00 PM</span>
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#e9e9eb] dark:bg-slate-850 text-slate-850 dark:text-slate-200 p-3 rounded-xl rounded-tl-none shadow-xs max-w-[80%] self-start relative">
                        {/* SMS Bubble triangle */}
                        <div className="absolute -left-1.5 top-0 w-2 h-2.5 overflow-hidden">
                          <div className="w-3.5 h-3.5 bg-[#e9e9eb] dark:bg-slate-850 rotate-45 transform origin-top-right rounded-br-sm" />
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed break-words" style={{ whiteSpace: 'pre-wrap' }}>
                          {compilePreview(broadcastMessage) || 'Start typing message to compile preview...'}
                        </p>
                        <span className="text-[7.5px] text-slate-400 block mt-1 select-none text-right font-medium">12:00 PM</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Placeholder helpers */}
              <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 border-b border-slate-100 dark:border-dark-border pb-3.5 uppercase tracking-wide">
                  Campaign Placeholders
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Insert dynamic placeholders. For custom campaigns, the following fields are compiled:
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { label: 'Farmer Name', placeholder: 'FarmerName' },
                    { label: 'Farmer ID', placeholder: 'FarmerID' },
                    { label: 'Mobile Number', placeholder: 'Mobile' },
                    { label: 'Village Name', placeholder: 'Village' },
                    { label: 'Milk Type', placeholder: 'MilkType' },
                    { label: 'Date', placeholder: 'Date' },
                    { label: 'Amount Due', placeholder: 'Amount' },
                    { label: 'Volume (L)', placeholder: 'Liters' },
                    { label: 'Dairy Name', placeholder: 'DairyName' }
                  ].map((chip) => (
                    <button
                      key={chip.placeholder}
                      type="button"
                      onClick={() => handlePlaceholderClick(chip.placeholder)}
                      className="p-2.5 border border-slate-205 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 rounded-md font-bold text-left flex justify-between items-center select-none cursor-pointer transition"
                      title={`Insert {${chip.placeholder}}`}
                    >
                      <span className="text-blue-600 dark:text-brand-400">{`{${chip.placeholder}}`}</span>
                      <span className="text-slate-400 text-[8px] font-normal">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
        </ErrorBoundary>

      </AnimatePresence>
    </div>
  );
}
