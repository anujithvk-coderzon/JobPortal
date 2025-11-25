'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/lib/api';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  MapPin,
  Building2,
  ExternalLink,
  X,
  Shield,
  Info,
} from 'lucide-react';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [pagination, setPagination] = useState<any>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    const params: any = { page, limit: 20 };

    if (search) params.search = search;
    params.status = filter;

    const response = await api.getPosts(params);
    if (response.success && response.data) {
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1);
  };

  const handleApprove = async (postId: string) => {
    if (!confirm('Approve this post?')) return;

    setActionLoading(postId);
    const response = await api.approvePost(postId);
    if (response.success) {
      showToast('Post approved successfully');
      fetchPosts(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to approve post');
    }
    setActionLoading(null);
  };

  const handleReject = async (postId: string) => {
    setRejectingPostId(postId);
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!rejectingPostId) return;

    setActionLoading(rejectingPostId);
    const response = await api.rejectPost(rejectingPostId, rejectionReason || undefined);
    if (response.success) {
      showToast('Post rejected and deleted successfully');
      setRejectingPostId(null);
      setRejectionReason('');
      fetchPosts(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to reject post');
    }
    setActionLoading(null);
  };

  const cancelReject = () => {
    setRejectingPostId(null);
    setRejectionReason('');
  };

  const handleBlockUser = async (userId: string, postId: string) => {
    if (!confirm('Are you sure you want to block this user? This will also reject their post.')) return;

    setActionLoading(postId);
    const blockResponse = await api.blockUser(userId, 'Posted inappropriate content');
    if (!blockResponse.success) {
      showToast(blockResponse.error || 'Failed to block user');
      setActionLoading(null);
      return;
    }

    const rejectResponse = await api.rejectPost(postId);
    if (rejectResponse.success) {
      showToast('User blocked and post rejected successfully');
      fetchPosts(pagination?.page || 1);
    } else {
      showToast('User blocked but failed to reject post');
    }
    setActionLoading(null);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    setActionLoading(postId);
    const response = await api.deletePost(postId);
    if (response.success) {
      showToast('Post deleted successfully');
      fetchPosts(pagination?.page || 1);
    } else {
      showToast(response.error || 'Failed to delete post');
    }
    setActionLoading(null);
  };

  const showToast = (message: string) => {
    alert(message);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Post Moderation
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Review and moderate community posts
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <Info className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">
              {pagination?.total || 0} {filter.toLowerCase()} posts
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
                  placeholder="Search by title or description..."
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
                  onClick={() => setFilter('PENDING')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === 'PENDING'
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('APPROVED')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === 'APPROVED'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500 text-center">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">
                        {post.title}
                      </h3>
                      {getStatusBadge(post.moderationStatus)}
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                      {post.user && (
                        <div className="flex items-center gap-2">
                          {post.user.profilePhoto ? (
                            <img
                              src={post.user.profilePhoto}
                              alt={post.user.name}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${post.user.profilePhoto ? 'hidden' : ''}`}>
                            <span className="text-white text-xs font-semibold">
                              {post.user.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-700">{post.user.name}</span>
                        </div>
                      )}
                      {post.companyName && (
                        <>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{post.companyName}</span>
                          </div>
                        </>
                      )}
                      {post.location && (
                        <>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{post.location}</span>
                          </div>
                        </>
                      )}
                      <span className="text-gray-300 hidden sm:inline">•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* External Link */}
                    {post.externalLink && (
                      <a
                        href={post.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors mb-4"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View External Link
                      </a>
                    )}

                    {/* Rejection Reason */}
                    {post.rejectionReason && (
                      <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs sm:text-sm text-red-800">
                          <strong className="font-semibold">Rejection Reason:</strong> {post.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                    {post.moderationStatus === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApprove(post.id)}
                          disabled={actionLoading === post.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === post.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          disabled={actionLoading === post.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === post.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Reject</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleBlockUser(post.user.id, post.id)}
                          disabled={actionLoading === post.id}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === post.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Shield className="h-4 w-4" />
                              <span className="hidden lg:inline">Block User</span>
                              <span className="lg:hidden">Block</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={actionLoading === post.id}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === post.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold text-gray-900">{pagination.total}</span> posts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPosts(pagination.page - 1)}
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
                onClick={() => fetchPosts(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {rejectingPostId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Reject Post</h3>
                  <button
                    onClick={cancelReject}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Optionally provide a reason for rejection. This will be shown to the user as a notification.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (optional)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white transition-colors"
                  rows={4}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={cancelReject}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={actionLoading === rejectingPostId}
                    className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === rejectingPostId ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Rejecting...</span>
                      </div>
                    ) : (
                      'Reject Post'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
