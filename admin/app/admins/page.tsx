'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  Shield,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ToggleLeft,
  ToggleRight,
  Crown,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchAdmins = async () => {
    try {
      const response = await api.getAdmins();
      if (response.success && response.data) {
        setAdmins(response.data as Admin[]);
      }
    } catch (err) {
      setError('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await api.createAdmin(formData);
      if (response.success) {
        setSuccess('Admin created successfully');
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '' });
        fetchAdmins();
      } else {
        setError(response.error || 'Failed to create admin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
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
        setSuccess(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
        fetchAdmins();
      } else {
        setError(response.error || 'Failed to update admin status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
    } finally {
      setToggling(null);
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);

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
        setSuccess(`${admin.name} has been deleted`);
        fetchAdmins();
      } else {
        setError(response.error || 'Failed to delete admin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete admin');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Create and manage admin accounts</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors w-full sm:w-auto"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {showCreateForm ? 'Cancel' : 'Add Admin'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-red-700 flex-1 min-w-0 break-words">{error}</p>
            <button onClick={() => setError('')} className="flex-shrink-0">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Create New Admin</h3>
            <form onSubmit={handleCreate} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Admin name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {creating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No admins found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table - hidden on small screens */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {admins.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              admin.role === 'SUPER_ADMIN'
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                                : 'bg-gradient-to-br from-gray-500 to-gray-600'
                            }`}>
                              <span className="text-white font-bold text-xs lg:text-sm">
                                {admin.name[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{admin.name}</p>
                              <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {admin.role === 'SUPER_ADMIN' && <Crown className="h-3 w-3" />}
                            {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            admin.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-xs lg:text-sm text-gray-500">
                          {admin.lastLogin
                            ? new Date(admin.lastLogin).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Never'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canToggle(admin) ? (
                              <button
                                onClick={() => handleToggleActive(admin)}
                                disabled={toggling === admin.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                  admin.isActive
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                              >
                                {toggling === admin.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : admin.isActive ? (
                                  <ToggleRight className="h-3.5 w-3.5" />
                                ) : (
                                  <ToggleLeft className="h-3.5 w-3.5" />
                                )}
                                {admin.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                {currentAdmin?.id === admin.id ? 'You' : 'Protected'}
                              </span>
                            )}
                            {canDelete(admin) && (
                              <button
                                onClick={() => handleDelete(admin)}
                                disabled={deleting === admin.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                {deleting === admin.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
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
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      admin.role === 'SUPER_ADMIN'
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600'
                        : 'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      <span className="text-white font-bold text-sm">
                        {admin.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{admin.name}</p>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                      admin.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        admin.role === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role === 'SUPER_ADMIN' && <Crown className="h-2.5 w-2.5" />}
                        {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Moderator'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Never logged in'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canToggle(admin) ? (
                        <button
                          onClick={() => handleToggleActive(admin)}
                          disabled={toggling === admin.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 ${
                            admin.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {toggling === admin.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : admin.isActive ? (
                            <ToggleRight className="h-3 w-3" />
                          ) : (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                          {admin.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">
                          {currentAdmin && admin.id === currentAdmin.id ? 'You' : 'Protected'}
                        </span>
                      )}
                      {canDelete(admin) && (
                        <button
                          onClick={() => handleDelete(admin)}
                          disabled={deleting === admin.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
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
    </AdminLayout>
  );
}
