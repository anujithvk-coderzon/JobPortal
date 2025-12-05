'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';
import {
  Flag,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Building2,
  ExternalLink,
  Play,
  ImageIcon,
  Calendar,
  User,
  MoreVertical,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  description?: string;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

interface FlaggedPost {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  poster?: string;
  video?: string;
  videoAspectRatio?: string;
  externalLink?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  reports: Report[];
  _count: {
    helpfulVotes: number;
    reports: number;
  };
}

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam / Advertisement',
  MISLEADING: 'Misleading / False Information',
  INAPPROPRIATE: 'Inappropriate Content',
  HARASSMENT: 'Harassment / Bullying',
  OTHER: 'Other',
};

const REASON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SPAM: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  MISLEADING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  INAPPROPRIATE: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  HARASSMENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  OTHER: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export default function FlaggedPostsPage() {
  const [posts, setPosts] = useState<FlaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<any>(null);
  const [threshold, setThreshold] = useState(5);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string; aspectRatio?: string } | null>(null);
  const [posterModal, setPosterModal] = useState<{ url: string; title: string } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<string | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ postId: string; title: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [dismissingPostId, setDismissingPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchFlaggedPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setMobileActionsOpen(null);
    if (mobileActionsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileActionsOpen]);

  const fetchFlaggedPosts = async (page = 1) => {
    setLoading(true);
    const response = await api.getFlaggedPosts({ page, limit: 20 }) as any;
    if (response.success && response.data) {
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
      if (response.data.threshold) {
        setThreshold(response.data.threshold);
      }
    }
    setLoading(false);
  };

  const handleDismiss = (postId: string) => {
    setDismissingPostId(postId);
  };

  const confirmDismiss = async () => {
    if (!dismissingPostId) return;
    setActionLoading(dismissingPostId);
    const response = await api.dismissReports(dismissingPostId) as any;
    if (response.success) {
      showToast('Reports dismissed successfully', 'success');
      setDismissingPostId(null);
      fetchFlaggedPosts(pagination?.page || 1);
      // Dispatch event to update sidebar badge count
      window.dispatchEvent(new CustomEvent('post-moderated'));
    } else {
      showToast(response.error || 'Failed to dismiss reports', 'error');
    }
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal.postId);
    const response = await api.deleteFlaggedPost(deleteModal.postId, deleteReason || undefined) as any;
    if (response.success) {
      showToast('Post deleted successfully', 'success');
      setDeleteModal(null);
      setDeleteReason('');
      fetchFlaggedPosts(pagination?.page || 1);
      // Dispatch event to update sidebar badge count
      window.dispatchEvent(new CustomEvent('post-moderated'));
    } else {
      showToast(response.error || 'Failed to delete post', 'error');
    }
    setActionLoading(null);
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

  const getReportSummary = (reports: Report[]) => {
    const summary: Record<string, number> = {};
    reports.forEach((r) => {
      summary[r.reason] = (summary[r.reason] || 0) + 1;
    });
    return summary;
  };

  const UserAvatar = ({ user }: { user: FlaggedPost['user'] }) => (
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
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Flag className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Flagged Posts</h1>
                <p className="text-red-100 text-sm mt-0.5">
                  Posts with {threshold}+ community reports
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <span className="text-2xl sm:text-3xl font-bold">{pagination?.total || 0}</span>
                <span className="text-red-100 text-sm ml-2">Flagged Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Review Required</p>
            <p className="text-sm text-amber-700 mt-1">
              These posts have been reported by multiple community members. Review the reports and take appropriate action.
            </p>
          </div>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Loading flagged posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">All Clear!</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              No posts have reached the report threshold. The community is in good shape.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const reportSummary = getReportSummary(post.reports);

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Report Alert Banner */}
                  <div className="bg-red-50 border-b border-red-100 px-4 sm:px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-semibold text-red-800">
                        {post._count.reports} Reports
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(reportSummary).map(([reason, count]) => {
                        const colors = REASON_COLORS[reason] || REASON_COLORS.OTHER;
                        return (
                          <span
                            key={reason}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                          >
                            {count}x {REASON_LABELS[reason] || reason}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </span>
                          {post._count.helpfulVotes > 0 && (
                            <span className="text-xs text-emerald-600 font-medium">
                              {post._count.helpfulVotes} helpful votes
                            </span>
                          )}
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

                        {mobileActionsOpen === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => { handleDismiss(post.id); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Dismiss Reports
                            </button>
                            <button
                              onClick={() => { setDeleteModal({ postId: post.id, title: post.title }); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Post
                            </button>
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
                  </div>

                  {/* Reports Section */}
                  <div className="px-4 sm:px-5 pb-4">
                    <button
                      onClick={() => setExpandedReports(expandedReports === post.id ? null : post.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          View {post.reports.length} Reports
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedReports === post.id ? 'rotate-90' : ''}`} />
                    </button>

                    {expandedReports === post.id && (
                      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                        {post.reports.map((report) => {
                          const colors = REASON_COLORS[report.reason] || REASON_COLORS.OTHER;
                          return (
                            <div
                              key={report.id}
                              className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`text-xs font-semibold ${colors.text}`}>
                                  {REASON_LABELS[report.reason] || report.reason}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(report.createdAt)}
                                </span>
                              </div>
                              {report.description && (
                                <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Reported by: {report.reporter.name} ({report.reporter.email})
                              </p>
                            </div>
                          );
                        })}
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
                      <button
                        onClick={() => handleDismiss(post.id)}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Dismiss Reports
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteModal({ postId: post.id, title: post.title })}
                        disabled={actionLoading === post.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Post
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  onClick={() => fetchFlaggedPosts(pagination.page - 1)}
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
                        onClick={() => fetchFlaggedPosts(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-red-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => fetchFlaggedPosts(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Post</h3>
                  </div>
                  <button
                    onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-2">
                  You are about to delete:
                </p>
                <p className="text-sm font-medium text-gray-900 mb-4 p-3 bg-gray-50 rounded-lg">
                  &quot;{deleteModal.title}&quot;
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  This action will permanently delete the post, all associated media files, and notify the user. This cannot be undone.
                </p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Reason for deletion (will be sent to the user)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                  rows={3}
                />
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deleteModal.postId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === deleteModal.postId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Post'
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

        {/* Dismiss Reports Modal */}
        {dismissingPostId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Dismiss Reports</h3>
                  </div>
                  <button onClick={() => setDismissingPostId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm text-gray-600">
                  Dismiss all reports for this post? The post will remain visible to all users and reporters will not be notified.
                </p>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setDismissingPostId(null)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDismiss}
                  disabled={actionLoading === dismissingPostId}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === dismissingPostId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Dismissing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Dismiss Reports
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
