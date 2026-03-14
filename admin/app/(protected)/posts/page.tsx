'use client';

import { useEffect, useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';

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

const PostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [pagination, setPagination] = useState<any>(null);
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [approvingPostId, setApprovingPostId] = useState<string | null>(null);
  const [blockingUser, setBlockingUser] = useState<{ userId: string; postId: string } | null>(null);
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

  const handleApprove = (postId: string) => {
    setApprovingPostId(postId);
  };

  const confirmApprove = async () => {
    if (!approvingPostId) return;
    setActionLoading(approvingPostId);
    const response = await api.approvePost(approvingPostId);
    if (response.success) {
      showToast('Post approved successfully', 'success');
      setApprovingPostId(null);
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

  const handleBlockUser = (userId: string, postId: string) => {
    setBlockingUser({ userId, postId });
  };

  const confirmBlockUser = async () => {
    if (!blockingUser) return;
    setActionLoading(blockingUser.postId);
    const blockResponse = await api.blockUser(blockingUser.userId, 'Posted inappropriate content');
    if (!blockResponse.success) {
      showToast(blockResponse.error || 'Failed to block user', 'error');
      setActionLoading(null);
      return;
    }
    const rejectResponse = await api.rejectPost(blockingUser.postId);
    if (rejectResponse.success) {
      showToast('User blocked and post rejected', 'success');
      setBlockingUser(null);
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast('User blocked but failed to reject post', 'error');
    }
    setActionLoading(null);
  };

  const handleSoftDelete = async (postId: string) => {
    setDeletingPostId(postId);
    setDeletionReason('');
  };

  const confirmSoftDelete = async () => {
    if (!deletingPostId) return;
    setActionLoading(deletingPostId);
    const response = await api.softDeletePost(deletingPostId, deletionReason || undefined);
    if (response.success) {
      showToast('Post soft deleted successfully', 'success');
      setDeletingPostId(null);
      setDeletionReason('');
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to delete post', 'error');
    }
    setActionLoading(null);
  };

  const cancelSoftDelete = () => {
    setDeletingPostId(null);
    setDeletionReason('');
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
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
      APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, label: 'Approved' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
    }[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertCircle, label: status };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const UserAvatar = ({ user }: { user: Post['user'] }) => (
    <div className="flex items-center gap-2">
      {user.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt={user.name}
          className="h-8 w-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ${user.profilePhoto ? 'hidden' : ''}`}>
        <span className="text-primary text-[11px] font-semibold">{user.name?.[0]?.toUpperCase() || 'U'}</span>
      </div>
      <span className="text-[13px] font-medium text-gray-900 truncate">{user.name}</span>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Post Moderation</h1>
            <p className="text-[12px] text-gray-500 mt-0.5">Review and manage community content</p>
          </div>
          <div className="text-[12px] text-gray-500">
            <span className="font-semibold text-gray-900 text-[14px]">{pagination?.total || 0}</span> {filter === 'PENDING' ? 'awaiting review' : 'approved'}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="rounded-lg border bg-white overflow-hidden">
          {/* Filter Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setFilter('PENDING')}
              className={`flex-1 sm:flex-none px-5 py-2.5 text-[13px] font-medium transition-colors relative ${
                filter === 'PENDING'
                  ? 'text-amber-700 bg-amber-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Pending</span>
                {filter === 'PENDING' && pagination?.total > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full inline-flex items-center justify-center">
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
              className={`flex-1 sm:flex-none px-5 py-2.5 text-[13px] font-medium transition-colors relative ${
                filter === 'APPROVED'
                  ? 'text-emerald-700 bg-emerald-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approved</span>
              </div>
              {filter === 'APPROVED' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts by title or description..."
                className="w-full pl-9 pr-20 h-9 bg-gray-50 border rounded-md text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-medium rounded transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 rounded-lg border bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <p className="text-[12px] text-gray-400">Loading posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-lg border bg-white">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-1">No posts found</h3>
            <p className="text-[12px] text-gray-500 text-center max-w-sm">
              {search ? 'Try adjusting your search terms' : `No ${filter.toLowerCase()} posts at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border bg-white hover:border-gray-300 transition-colors"
              >
                {/* Post Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <StatusBadge status={post.moderationStatus} />
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">
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
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>

                      {/* Mobile Actions Dropdown */}
                      {mobileActionsOpen === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border py-1 z-20">
                          {post.moderationStatus === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => { handleApprove(post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => { handleReject(post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                              <button
                                onClick={() => { handleSoftDelete(post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                              <div className="my-1 border-t" />
                              <button
                                onClick={() => { handleBlockUser(post.user.id, post.id); setMobileActionsOpen(null); }}
                                disabled={actionLoading === post.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <Shield className="h-3.5 w-3.5" />
                                Block User
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { handleSoftDelete(post.id); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4 mb-2.5">
                    <UserAvatar user={post.user} />
                    {(post.companyName || post.location) && (
                      <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 min-w-0 flex-wrap">
                        {post.companyName && (
                          <span className="flex items-center gap-1 min-w-0">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{post.companyName}</span>
                          </span>
                        )}
                        {post.location && (
                          <span className="flex items-center gap-1 min-w-0">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{post.location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`text-[13px] text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-2'}`}>
                    {post.description}
                  </p>
                  {post.description.length > 150 && (
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="text-[11px] text-primary hover:text-primary/80 font-medium mt-1"
                    >
                      {expandedPost === post.id ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {/* Mobile Meta Info */}
                  {(post.companyName || post.location) && (
                    <div className="flex sm:hidden items-center gap-3 mt-2 text-[11px] text-gray-500 flex-wrap min-w-0">
                      {post.companyName && (
                        <span className="flex items-center gap-1 min-w-0">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{post.companyName}</span>
                        </span>
                      )}
                      {post.location && (
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{post.location}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="px-4 py-2.5 bg-gray-50/50 border-t flex items-center justify-between gap-3">
                  {/* Media & Link Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.poster && (
                      <button
                        onClick={() => setPosterModal({ url: post.poster!, title: post.title })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">View</span> Poster
                      </button>
                    )}
                    {post.video && (
                      <button
                        onClick={() => setVideoModal({ url: post.video!, title: post.title, aspectRatio: post.videoAspectRatio })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                      >
                        <Play className="h-3 w-3" fill="currentColor" />
                        <span className="hidden sm:inline">Watch</span> Video
                      </button>
                    )}
                    {post.externalLink && (
                      <a
                        href={post.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-700 bg-white hover:bg-gray-100 border rounded-md transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden sm:inline">External</span> Link
                      </a>
                    )}
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    {post.moderationStatus === 'PENDING' ? (
                      <>
                        <button
                          onClick={() => handleApprove(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          {actionLoading === post.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleSoftDelete(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border rounded-md transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        <button
                          onClick={() => handleBlockUser(post.user.id, post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Block
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSoftDelete(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {post.rejectionReason && (
                  <div className="px-4 py-2.5 bg-red-50/50 border-t border-red-100">
                    <p className="text-[11px] text-red-800">
                      <strong className="font-semibold">Rejection Reason:</strong> {post.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Mobile Action Bar for Approved Posts */}
                {post.moderationStatus === 'APPROVED' && (
                  <div className="lg:hidden px-4 py-2.5 bg-gray-50/50 border-t">
                    <button
                      onClick={() => handleSoftDelete(post.id)}
                      disabled={actionLoading === post.id}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                    >
                      {actionLoading === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="rounded-lg border bg-white p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[12px] text-gray-500 order-2 sm:order-1">
                Showing <span className="font-semibold text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => fetchPosts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-0.5 px-1">
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
                        className={`min-w-[32px] h-8 rounded-md text-[12px] font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:bg-gray-100'
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
                  className="p-1.5 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingPostId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-amber-100 rounded-md flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-gray-900">Reject Post</h3>
                  </div>
                  <button onClick={cancelReject} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600 mb-3">
                  Provide a reason for rejection. This will be sent to the user as a notification.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)..."
                  className="w-full px-3 py-2.5 bg-gray-50 border rounded-md text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  rows={3}
                />
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={cancelReject}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={actionLoading === rejectingPostId}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === rejectingPostId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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

        {/* Approve Modal */}
        {approvingPostId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-emerald-100 rounded-md flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-gray-900">Approve Post</h3>
                  </div>
                  <button onClick={() => setApprovingPostId(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600">
                  This post will be published and visible to all users. Make sure the content follows community guidelines.
                </p>
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={() => setApprovingPostId(null)}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={actionLoading === approvingPostId}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === approvingPostId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block User Modal */}
        {blockingUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-red-100 rounded-md flex items-center justify-center">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-gray-900">Block User</h3>
                  </div>
                  <button onClick={() => setBlockingUser(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600 mb-3">
                  This will block the user and reject their post. The user will no longer be able to access the platform.
                </p>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-[12px] text-amber-800">
                    <strong>Warning:</strong> This action can be reversed from the Users page.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={() => setBlockingUser(null)}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBlockUser}
                  disabled={actionLoading === blockingUser.postId}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === blockingUser.postId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Blocking...
                    </>
                  ) : (
                    <>
                      <Shield className="h-3.5 w-3.5" />
                      Block User
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deletingPostId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-red-100 rounded-md flex items-center justify-center">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-gray-900">Delete Post</h3>
                  </div>
                  <button onClick={cancelSoftDelete} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600 mb-3">
                  This will hide the post from all users. It can be restored later from the Deleted Posts section.
                </p>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Enter reason for deletion (optional but recommended)..."
                  className="w-full px-3 py-2.5 bg-gray-50 border rounded-md text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  rows={3}
                />
              </div>
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button
                  onClick={cancelSoftDelete}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSoftDelete}
                  disabled={actionLoading === deletingPostId}
                  className="flex-1 px-3 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === deletingPostId ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
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
              className="relative w-full max-w-2xl bg-white rounded-lg overflow-hidden shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-[13px] font-semibold text-gray-900 truncate pr-4">{videoModal.title}</h3>
                <button
                  onClick={() => setVideoModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
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
              className="relative bg-white rounded-lg overflow-hidden shadow-lg"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-[13px] font-semibold text-gray-900 truncate pr-4">{posterModal.title}</h3>
                <button
                  onClick={() => setPosterModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="bg-gray-100 flex items-center justify-center p-4">
                <img
                  src={posterModal.url}
                  alt={posterModal.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PostsPage;
