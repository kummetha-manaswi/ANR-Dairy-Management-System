import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { getFarmers, deleteFarmer, toggleFarmerStatus } from '../../services/farmerService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { TableSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FarmersList() {
  const { showToast, askConfirmation } = useUI();
  const navigate = useNavigate();

  // Component states
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [milkType, setMilkType] = useState('');
  const [preference, setPreference] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  // Fetch farmers list from server
  const fetchFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getFarmers({
        page,
        limit: 10,
        search: search || undefined,
        milkType: milkType || undefined,
        collectionPreference: preference || undefined,
        status: status || undefined
      });

      if (response && response.success && response.data) {
        setFarmers(response.data.farmers);
        setTotalPages(response.data.pagination.pages);
        setStats({
          total: response.data.pagination.total,
          active: response.data.farmers.filter(f => f.status === 'active').length, // approximate for local page
          inactive: response.data.farmers.filter(f => f.status === 'inactive').length
        });
      }
    } catch (error) {
      showToast('Failed to load farmers registry', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, milkType, preference, status, showToast]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Handle Soft-Delete
  const handleDelete = async (id, code, name) => {
    const approved = await askConfirmation({
      title: `Delete Farmer ${code}?`,
      message: `Are you sure you want to soft-delete ${name}? This action is irreversible. Historical milk logs will be preserved but the profile will be hidden.`,
      confirmText: 'Delete Farmer',
      cancelText: 'Cancel'
    });

    if (approved) {
      try {
        const response = await deleteFarmer(id, 'Soft-deleted via Farmer Management List');
        if (response && response.success) {
          showToast(`Farmer ${code} deleted successfully`, 'success');
          fetchFarmers();
        }
      } catch (error) {
        showToast('Failed to delete farmer profile', 'error');
      }
    }
  };

  // Handle Status Toggle (Activate/Deactivate)
  const handleToggleStatus = async (id, code, name, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const approved = await askConfirmation({
      title: `${nextStatus === 'active' ? 'Activate' : 'Deactivate'} Farmer ${code}?`,
      message: `Are you sure you want to toggle the status of ${name} to ${nextStatus.toUpperCase()}?`,
      confirmText: nextStatus === 'active' ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel'
    });

    if (approved) {
      try {
        const response = await toggleFarmerStatus(id, nextStatus, `Farmer status toggled to ${nextStatus}`);
        if (response && response.success) {
          showToast(`Farmer ${code} successfully ${nextStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
          fetchFarmers();
        }
      } catch (error) {
        showToast('Failed to toggle status', 'error');
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset to first page on search
  };

  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'employee' };
  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      
      {/* Breadcrumbs Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <Breadcrumbs items={[{ label: 'Farmers Registry' }]} />
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Farmer Registry
          </h1>
        </div>

        {isAdmin && (
          <Link
            to="/admin/farmers/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farmer</span>
          </Link>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Farmers</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{stats.total}</h3>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Farmers</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{farmers.filter(f=>f.status==='active').length}</h3>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Farmers</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{farmers.filter(f=>f.status==='inactive').length}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Field */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded-md"
            placeholder="Search by ID, Name, Mobile, Village..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Milk Type */}
          <select
            value={milkType}
            onChange={(e) => { setMilkType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
          >
            <option value="">All Milk Types</option>
            <option value="cow">Cow</option>
            <option value="buffalo">Buffalo</option>
            <option value="mix">Mix</option>
          </select>

          {/* Collection Preference */}
          <select
            value={preference}
            onChange={(e) => { setPreference(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
          >
            <option value="">All Preferences</option>
            <option value="morning">Morning Only</option>
            <option value="evening">Evening Only</option>
            <option value="both">Both Shifts</option>
            <option value="flexible">Flexible</option>
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-slate-600 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      </div>

      {/* Main Table Grid */}
      {loading ? (
        <TableSkeleton />
      ) : farmers.length === 0 ? (
        <EmptyState 
          title="No Farmers Found"
          description="We couldn't find any farmers matching your filters. Try adjusting your search query."
          actionButton={
            <Link
              to="/admin/farmers/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Farmer</span>
            </Link>
          }
        />
      ) : (
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Farmer ID</th>
                  <th className="p-4">Farmer Details</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Village</th>
                  <th className="p-4">Milk Type</th>
                  <th className="p-4">Shift Pref.</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                {farmers.map((farmer) => {
                  const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
                  const avatarUrl = farmer.photo ? `${baseUrl}${farmer.photo}` : '';

                  return (
                    <tr key={farmer._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      {/* Code */}
                      <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                        {farmer.farmerCode}
                      </td>

                      {/* Photo & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={farmer.name} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-dark-border" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                              {farmer.name[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                              {farmer.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {farmer.phone}
                      </td>

                      {/* Village */}
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {farmer.village}
                      </td>

                      {/* Milk Type */}
                      <td className="p-4">
                        <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                          {farmer.milkType}
                        </span>
                      </td>

                      {/* Shift Pref */}
                      <td className="p-4">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                          {farmer.collectionPreference === 'both' ? 'Both Shifts' : farmer.collectionPreference}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          farmer.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${farmer.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {farmer.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* View */}
                          <button
                            onClick={() => navigate(isAdmin ? `/admin/farmers/${farmer._id}` : `/employee/farmers/${farmer._id}`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                            title="View passbook details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => navigate(`/admin/farmers/${farmer._id}/edit`)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                                title="Edit Farmer Profile"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Toggle Status */}
                              <button
                                onClick={() => handleToggleStatus(farmer._id, farmer.farmerCode, farmer.name, farmer.status)}
                                className={`p-1.5 rounded transition ${
                                  farmer.status === 'active'
                                    ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/15'
                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={farmer.status === 'active' ? 'Deactivate Farmer' : 'Activate Farmer'}
                              >
                                {farmer.status === 'active' ? (
                                  <ToggleRight className="w-5 h-5" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5" />
                                )}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(farmer._id, farmer.farmerCode, farmer.name)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 rounded transition"
                                title="Delete Farmer Profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border px-4 py-3 bg-slate-50/50 dark:bg-slate-800/10 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
              <div>
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
