'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';
import {
  Search,
  Filter,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'blocked' | 'deleted'>('all');
  const [pagination, setPagination] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    const params: any = { page, limit: 20 };

    if (search) params.search = search;
    if (filter === 'blocked') params.isBlocked = true;
    if (filter === 'deleted') params.isDeleted = true;

    const response = await api.getUsers(params) as { success: boolean; data?: { users: any[]; pagination: any } };
    if (response.success && response.data) {
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleBlock = (userId: string) => {
    setBlockingUserId(userId);
  };

  const confirmBlock = async () => {
    if (!blockingUserId) return;
    setActionLoading(blockingUserId);
    const response = await api.blockUser(blockingUserId);
    if (response.success) {
      showToast('User blocked successfully', 'success');
      setBlockingUserId(null);
      fetchUsers(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to block user', 'error');
    }
    setActionLoading(null);
  };

  const handleUnblock = async (userId: string) => {
    setActionLoading(userId);
    const response = await api.unblockUser(userId);
    if (response.success) {
      showToast('User unblocked successfully', 'success');
      fetchUsers(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to unblock user', 'error');
    }
    setActionLoading(null);
  };

  const handleDelete = (userId: string) => {
    setDeletingUserId(userId);
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;
    setActionLoading(deletingUserId);
    const response = await api.deleteUser(deletingUserId);
    if (response.success) {
      showToast('User deleted successfully', 'success');
      setDeletingUserId(null);
      fetchUsers(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to delete user', 'error');
    }
    setActionLoading(null);
  };


  const getStatusBadge = (user: any) => {
    if (user.isDeleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
          <Trash2 className="h-3 w-3" />
          Deleted
        </span>
      );
    } else if (user.isBlocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
          <UserX className="h-3 w-3" />
          Blocked
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
          <UserCheck className="h-3 w-3" />
          Active
        </span>
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Manage and monitor platform users
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {pagination?.total || 0} total users
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400 hidden sm:block" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('blocked')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === 'blocked'
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Blocked
                </button>
                <button
                  onClick={() => setFilter('deleted')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === 'deleted'
                      ? 'bg-gray-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Deleted
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table/Cards */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 text-center">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Posts
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {user.profilePhoto ? (
                                <img
                                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                  src={user.profilePhoto}
                                  alt={user.name}
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 ${user.profilePhoto ? 'hidden' : ''}`}>
                                <span className="text-white font-bold text-lg">
                                  {user.name?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.location || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {user._count?.jobNews || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {!user.isDeleted && (
                            <div className="flex items-center justify-end gap-2">
                              {user.isBlocked ? (
                                <button
                                  onClick={() => handleUnblock(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                  Unblock
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlock(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserX className="h-4 w-4" />
                                  )}
                                  Block
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === user.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0">
                      {user.profilePhoto ? (
                        <img
                          className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                          src={user.profilePhoto}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 ${user.profilePhoto ? 'hidden' : ''}`}>
                        <span className="text-white font-bold text-xl">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{user.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="mt-2">
                        {getStatusBadge(user)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{user.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Posts</p>
                      <p className="text-sm font-medium text-gray-900">{user._count?.jobNews || 0}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{user.location || 'N/A'}</p>
                    </div>
                  </div>

                  {!user.isDeleted && (
                    <div className="flex gap-2">
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(user.id)}
                          disabled={actionLoading === user.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                          Block
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                      >
                        {actionLoading === user.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.total}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <div className="flex items-center gap-1">
                <span className="px-4 py-2 text-sm font-semibold text-gray-900">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Block User Modal */}
        {blockingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                      <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Block User</h3>
                  </div>
                  <button onClick={() => setBlockingUserId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm text-gray-600">
                  Are you sure you want to block this user? They will no longer be able to access the platform or create new posts.
                </p>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setBlockingUserId(null)}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlock}
                  disabled={actionLoading === blockingUserId}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-2.5 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === blockingUserId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4" />
                      Block User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {deletingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete User</h3>
                  </div>
                  <button onClick={() => setDeletingUserId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> All user data and posts will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setDeletingUserId(null)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading === deletingUserId}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === deletingUserId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
