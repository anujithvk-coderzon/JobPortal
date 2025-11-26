'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { api } from '@/lib/api';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  MapPin,
  Building2,
  ExternalLink,
  X,
  Shield,
  Play,
  ImageIcon,
  FileText,
  Calendar,
  User,
  MoreVertical,
  Eye,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  poster?: string;
  video?: string;
  videoAspectRatio?: string;
  externalLink?: string;
  moderationStatus: string;
  rejectionReason?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [pagination, setPagination] = useState<any>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string; aspectRatio?: string } | null>(null);
  const [posterModal, setPosterModal] = useState<{ url: string; title: string } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  // Close mobile actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMobileActionsOpen(null);
    if (mobileActionsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileActionsOpen]);

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    const params: any = { page, limit: 20 };
    if (search) params.search = search;
    params.status = filter;

    const response = await api.getPosts(params) as { success: boolean; data?: { posts: Post[]; pagination: any } };
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
      showToast('Post approved successfully', 'success');
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to approve post', 'error');
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
      showToast('Post rejected successfully', 'success');
      setRejectingPostId(null);
      setRejectionReason('');
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to reject post', 'error');
    }
    setActionLoading(null);
  };

  const cancelReject = () => {
    setRejectingPostId(null);
    setRejectionReason('');
  };

  const handleBlockUser = async (userId: string, postId: string) => {
    if (!confirm('Block this user and reject their post?')) return;
    setActionLoading(postId);
    const blockResponse = await api.blockUser(userId, 'Posted inappropriate content');
    if (!blockResponse.success) {
      showToast(blockResponse.error || 'Failed to block user', 'error');
      setActionLoading(null);
      return;
    }
    const rejectResponse = await api.rejectPost(postId);
    if (rejectResponse.success) {
      showToast('User blocked and post rejected', 'success');
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast('User blocked but failed to reject post', 'error');
    }
    setActionLoading(null);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Permanently delete this post?')) return;
    setActionLoading(postId);
    const response = await api.deletePost(postId);
    if (response.success) {
      showToast('Post deleted successfully', 'success');
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to delete post', 'error');
    }
    setActionLoading(null);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    alert(message);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending Review' },
      APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, label: 'Approved' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
    }[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertCircle, label: status };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="h-3 w-3" />
        <span className="hidden sm:inline">{config.label}</span>
        <span className="sm:hidden">{status === 'PENDING' ? 'Pending' : config.label}</span>
      </span>
    );
  };

  const UserAvatar = ({ user }: { user: Post['user'] }) => (
    <div className="flex items-center gap-2.5">
      {user.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow-sm ${user.profilePhoto ? 'hidden' : ''}`}>
        <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase() || 'U'}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Post Moderation</h1>
                <p className="text-indigo-100 text-sm mt-0.5">Review and manage community content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <span className="text-2xl sm:text-3xl font-bold">{pagination?.total || 0}</span>
                <span className="text-indigo-100 text-sm ml-2">{filter === 'PENDING' ? 'Awaiting Review' : 'Approved'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('PENDING')}
              className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-all relative ${
                filter === 'PENDING'
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Pending</span>
                {filter === 'PENDING' && pagination?.total > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-600 text-white rounded-full">
                    {pagination.total}
                  </span>
                )}
              </div>
              {filter === 'PENDING' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
              )}
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`flex-1 sm:flex-none px-6 py-3.5 text-sm font-medium transition-all relative ${
                filter === 'APPROVED'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Approved</span>
              </div>
              {filter === 'APPROVED' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 sm:p-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts by title or description..."
                className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No posts found</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              {search ? 'Try adjusting your search terms' : `No ${filter.toLowerCase()} posts at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <StatusBadge status={post.moderationStatus} />
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                    </div>

                    {/* Mobile Actions Toggle */}
                    <div className="lg:hidden relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileActionsOpen(mobileActionsOpen === post.id ? null : post.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>

                      {/* Mobile Actions Dropdown */}
                      {mobileActionsOpen === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                          {post.moderationStatus === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => { handleApprove(post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve Post
                              </button>
                              <button
                                onClick={() => { handleReject(post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject Post
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              <button
                                onClick={() => { handleBlockUser(post.user.id, post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <Shield className="h-4 w-4" />
                                Block User
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { handleDelete(post.id); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Post
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4 mb-3">
                    <UserAvatar user={post.user} />
                    {(post.companyName || post.location) && (
                      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                        {post.companyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {post.companyName}
                          </span>
                        )}
                        {post.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {post.location}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-sm text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-2'}`}>
                    {post.description}
                  </p>
                  {post.description.length > 150 && (
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                    >
                      {expandedPost === post.id ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {/* Mobile Meta Info */}
                  {(post.companyName || post.location) && (
                    <div className="flex sm:hidden items-center gap-3 mt-3 text-xs text-gray-500">
                      {post.companyName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {post.companyName}
                        </span>
                      )}
                      {post.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {post.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  {/* Media & Link Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.poster && (
                      <button
                        onClick={() => setPosterModal({ url: post.poster!, title: post.title })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span> Poster
                      </button>
                    )}
                    {post.video && (
                      <button
                        onClick={() => setVideoModal({ url: post.video!, title: post.title, aspectRatio: post.videoAspectRatio })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                        <span className="hidden sm:inline">Watch</span> Video
                      </button>
                    )}
                    {post.externalLink && (
                      <a
                        href={post.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">External</span> Link
                      </a>
                    )}
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:flex items-center gap-2">
                    {post.moderationStatus === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApprove(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
                        >
                          {actionLoading === post.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleBlockUser(post.user.id, post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                        >
                          <Shield className="h-4 w-4" />
                          Block
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {post.rejectionReason && (
                  <div className="px-4 sm:px-5 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-800">
                      <strong className="font-semibold">Rejection Reason:</strong> {post.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 order-2 sm:order-1">
                Showing <span className="font-semibold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => fetchPosts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchPosts(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => fetchPosts(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingPostId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Reject Post</h3>
                  </div>
                  <button onClick={cancelReject} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-4">
                  Provide a reason for rejection. This will be sent to the user as a notification.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  rows={4}
                />
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={cancelReject}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={actionLoading === rejectingPostId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === rejectingPostId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {videoModal && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setVideoModal(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">{videoModal.title}</h3>
                <button
                  onClick={() => setVideoModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="bg-black">
                <VideoPlayer
                  videoUrl={videoModal.url}
                  title={videoModal.title}
                  aspectRatio={(videoModal.aspectRatio as any) || 'auto'}
                  autoPlay={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Poster Modal */}
        {posterModal && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPosterModal(null)}
          >
            <div
              className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">{posterModal.title}</h3>
                <button
                  onClick={() => setPosterModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={posterModal.url}
                  alt={posterModal.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
