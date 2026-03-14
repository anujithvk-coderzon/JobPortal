'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';

const UsersPage = () => {
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
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
          Deleted
        </span>
      );
    } else if (user.isBlocked) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700">
          Blocked
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
          Active
        </span>
      );
    }
  };

  const renderPageButtons = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const pages: number[] = [];
    const total = pagination.totalPages;
    const current = pagination.page;

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-2);
      pages.push(total);
    }

    return pages.map((p, idx) =>
      p < 0 ? (
        <span key={`ellipsis-${idx}`} className="px-1 text-[13px] text-gray-400">...</span>
      ) : (
        <button
          key={p}
          onClick={() => fetchUsers(p)}
          className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
            p === current
              ? 'bg-slate-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      )
    );
  };

  return (
    <>
      <div className="space-y-4 max-w-[1400px]">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
          <p className="text-[13px] text-gray-500">
            Manage and monitor platform users
            {pagination ? ` \u00b7 ${pagination.total || 0} total users` : ''}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border bg-white p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full h-9 rounded-md border text-sm pl-9 pr-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </form>
            <div className="flex items-center gap-1.5">
              {(['all', 'blocked', 'deleted'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                    filter === f
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px] rounded-lg border bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border bg-white">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-[13px] font-medium text-gray-900">No users found</p>
            <p className="text-[12px] text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block rounded-lg border bg-white overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {user.profilePhoto ? (
                              <img
                                className="h-9 w-9 rounded-full object-cover"
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
                            <div className={`h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center ${user.profilePhoto ? 'hidden' : ''}`}>
                              <span className="text-sm font-medium">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-gray-900">{user.name}</div>
                            <div className="text-[12px] text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-[13px] text-gray-900">{user.phone || 'N/A'}</div>
                        <div className="text-[12px] text-gray-500">{user.location || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[13px] text-gray-900">{user._count?.jobNews || 0}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(user)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {!user.isDeleted && (
                          <div className="flex items-center justify-end gap-1.5">
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblock(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                Unblock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5" />
                                )}
                                Block
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
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

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      {user.profilePhoto ? (
                        <img
                          className="h-9 w-9 rounded-full object-cover"
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
                      <div className={`h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center ${user.profilePhoto ? 'hidden' : ''}`}>
                        <span className="text-sm font-medium">
                          {user.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-900 truncate">{user.name}</span>
                        {getStatusBadge(user)}
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-3 flex-wrap">
                    <span className="truncate max-w-[120px]">{user.phone || 'No phone'}</span>
                    <span className="truncate max-w-[120px]">{user.location || 'No location'}</span>
                    <span>{user._count?.jobNews || 0} posts</span>
                  </div>

                  {!user.isDeleted && (
                    <div className="flex gap-1.5 flex-wrap">
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblock(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(user.id)}
                          disabled={actionLoading === user.id}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserX className="h-3.5 w-3.5" />
                          )}
                          Block
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-[12px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
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
          <div className="rounded-lg border bg-white p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[13px] text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8 px-3 rounded-md text-[13px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              {renderPageButtons()}
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-8 px-3 rounded-md text-[13px] font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Block User Modal */}
        {blockingUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg border bg-white shadow-lg max-w-sm w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Block User</h3>
                <button onClick={() => setBlockingUserId(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600">
                  Are you sure you want to block this user? They will no longer be able to access the platform or create new posts.
                </p>
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end">
                <button
                  onClick={() => setBlockingUserId(null)}
                  className="h-9 px-4 rounded-md text-sm font-medium text-gray-700 border hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlock}
                  disabled={actionLoading === blockingUserId}
                  className="h-9 px-4 rounded-md text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {actionLoading === blockingUserId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                  Block User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {deletingUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg border bg-white shadow-lg max-w-sm w-full">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Delete User</h3>
                <button onClick={() => setDeletingUserId(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600 mb-3">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="p-3 bg-red-50 rounded-md">
                  <p className="text-[12px] text-red-700">
                    <strong>Warning:</strong> All user data and posts will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end">
                <button
                  onClick={() => setDeletingUserId(null)}
                  className="h-9 px-4 rounded-md text-sm font-medium text-gray-700 border hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoading === deletingUserId}
                  className="h-9 px-4 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {actionLoading === deletingUserId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UsersPage;
