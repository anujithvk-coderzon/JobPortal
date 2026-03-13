'use client';

import { useState, useEffect } from 'react';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';
import {
  Shield,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  Crown,
  AlertCircle,
  X,
  Trash2,
  Users,
} from 'lucide-react';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchAdmins();
    fetchCurrentAdmin();
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      const response = await api.getMe();
      if (response.success && response.data) {
        setCurrentAdmin(response.data as Admin);
      }
    } catch (err) {}
  };

  const fetchAdmins = async () => {
    try {
      const response = await api.getAdmins();
      if (response.success && response.data) {
        setAdmins(response.data as Admin[]);
      }
    } catch (err) {
      showToast('Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const response = await api.createAdmin(formData);
      if (response.success) {
        showToast('Admin created successfully', 'success');
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '' });
        fetchAdmins();
      } else {
        setFormError(response.error || 'Failed to create admin');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    setToggling(admin.id);
    try {
      const response = admin.isActive
        ? await api.deactivateAdmin(admin.id)
        : await api.activateAdmin(admin.id);

      if (response.success) {
        showToast(
          `${admin.name} has been ${admin.isActive ? 'deactivated' : 'activated'}`,
          'success'
        );
        fetchAdmins();
      } else {
        showToast(response.error || 'Failed to update admin status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin status', 'error');
    } finally {
      setToggling(null);
    }
  };

  const canToggle = (admin: Admin) => {
    if (currentAdmin && admin.id === currentAdmin.id) return false;
    if (admin.role === 'SUPER_ADMIN') return false;
    return true;
  };

  const canDelete = (admin: Admin) => {
    if (currentAdmin && admin.id === currentAdmin.id) return false;
    if (admin.role === 'SUPER_ADMIN') return false;
    return true;
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to permanently delete ${admin.name}? This cannot be undone.`)) return;
    setDeleting(admin.id);
    try {
      const response = await api.deleteAdmin(admin.id);
      if (response.success) {
        showToast(`${admin.name} has been deleted`, 'success');
        fetchAdmins();
      } else {
        showToast(response.error || 'Failed to delete admin', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete admin', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="space-y-4 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Management</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Create and manage admin accounts</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setFormError('');
            }}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showCreateForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="rounded-lg border bg-white p-5">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-4">Create New Admin</h3>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 flex items-start gap-2 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{formError}</span>
                <button onClick={() => setFormError('')} className="flex-shrink-0">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full h-9 sm:h-10 px-3 rounded-md border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Admin name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full h-9 sm:h-10 px-3 rounded-md border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full h-9 sm:h-10 px-3 pr-10 rounded-md border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-[13px] text-gray-500">No admins found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-lg border bg-white overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b">
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="text-right px-4 py-3 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {admin.name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 truncate">{admin.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {admin.role === 'SUPER_ADMIN' && <Crown className="h-3 w-3" />}
                          {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-500">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canToggle(admin) ? (
                            <button
                              onClick={() => handleToggleActive(admin)}
                              disabled={toggling === admin.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                admin.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {toggling === admin.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {admin.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">
                              {currentAdmin?.id === admin.id ? 'You' : 'Protected'}
                            </span>
                          )}
                          {canDelete(admin) && (
                            <button
                              onClick={() => handleDelete(admin)}
                              disabled={deleting === admin.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {deleting === admin.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-2">
              {admins.map((admin) => (
                <div key={admin.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {admin.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{admin.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{admin.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] flex-shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          admin.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-start sm:items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {admin.role === 'SUPER_ADMIN' && <Crown className="h-2.5 w-2.5" />}
                        {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canToggle(admin) ? (
                        <button
                          onClick={() => handleToggleActive(admin)}
                          disabled={toggling === admin.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50 ${
                            admin.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {toggling === admin.id && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          {currentAdmin?.id === admin.id ? 'You' : 'Protected'}
                        </span>
                      )}
                      {canDelete(admin) && (
                        <button
                          onClick={() => handleDelete(admin)}
                          disabled={deleting === admin.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {deleting === admin.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
