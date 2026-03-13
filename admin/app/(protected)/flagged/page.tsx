'use client';

import { useEffect, useState } from 'react';
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
  MoreVertical,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Loader2,
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
  SPAM: 'Spam',
  MISLEADING: 'Misleading',
  INAPPROPRIATE: 'Inappropriate',
  HARASSMENT: 'Harassment',
  OTHER: 'Other',
};

const REASON_COLORS: Record<string, { bg: string; text: string }> = {
  SPAM: { bg: 'bg-orange-50', text: 'text-orange-700' },
  MISLEADING: { bg: 'bg-amber-50', text: 'text-amber-700' },
  INAPPROPRIATE: { bg: 'bg-red-50', text: 'text-red-700' },
  HARASSMENT: { bg: 'bg-rose-50', text: 'text-rose-700' },
  OTHER: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

const REASON_LABELS_FULL: Record<string, string> = {
  SPAM: 'Spam / Advertisement',
  MISLEADING: 'Misleading / False Information',
  INAPPROPRIATE: 'Inappropriate Content',
  HARASSMENT: 'Harassment / Bullying',
  OTHER: 'Other',
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

  return (
    <>
      <div className="space-y-4 max-w-[1400px]">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Flagged Posts</h1>
            {pagination && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[12px] font-medium">
                {pagination.total}
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Posts with {threshold}+ community reports requiring review
          </p>
        </div>

        {/* Info Banner */}
        <div className="rounded-md bg-amber-50 border border-amber-100 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <p className="text-[13px] text-amber-700">
            Review reported posts and take appropriate action. Dismissed reports are cleared; deleted posts are permanently removed and the user is notified.
          </p>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ShieldCheck className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-[13px] text-gray-500">No flagged posts to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const reportSummary = getReportSummary(post.reports);

              return (
                <div
                  key={post.id}
                  className="rounded-lg border bg-white"
                >
                  {/* Report Banner */}
                  <div className="bg-red-50/50 border-b border-red-100 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-[13px] font-medium text-red-700 whitespace-nowrap">
                        {post._count.reports} {post._count.reports === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {Object.entries(reportSummary).map(([reason, count]) => {
                        const colors = REASON_COLORS[reason] || REASON_COLORS.OTHER;
                        return (
                          <span
                            key={reason}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}
                          >
                            {count}x {REASON_LABELS[reason] || reason}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        {/* User Info */}
                        <div className="flex items-center gap-2 mb-2">
                          {post.user.profilePhoto ? (
                            <img
                              src={post.user.profilePhoto}
                              alt={post.user.name}
                              className="h-7 w-7 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center ${post.user.profilePhoto ? 'hidden' : ''}`}>
                            <span className="text-primary text-[11px] font-medium">{post.user.name?.[0]?.toUpperCase() || 'U'}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-gray-900 truncate">{post.user.name}</p>
                            <p className="text-[12px] text-gray-500 truncate">{post.user.email}</p>
                          </div>
                          <span className="text-[12px] text-gray-400 ml-auto flex items-center gap-1 flex-shrink-0">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Company / Location */}
                        {(post.companyName || post.location) && (
                          <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-500 flex-wrap min-w-0">
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

                        {mobileActionsOpen === post.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md shadow-lg border py-1 z-20">
                            <button
                              onClick={() => { handleDismiss(post.id); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Dismiss Reports
                            </button>
                            <button
                              onClick={() => { setDeleteModal({ postId: post.id, title: post.title }); setMobileActionsOpen(null); }}
                              disabled={actionLoading === post.id}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-700 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className={`text-[13px] text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-2'}`}>
                      {post.description}
                    </p>
                    {post.description.length > 150 && (
                      <button
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        className="text-[12px] text-primary hover:underline font-medium mt-1"
                      >
                        {expandedPost === post.id ? 'Show less' : 'Read more'}
                      </button>
                    )}

                    {/* Reports Section */}
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedReports(expandedReports === post.id ? null : post.id)}
                        className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 rounded-md p-2.5 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-[13px] font-medium text-gray-700">
                            View {post.reports.length} {post.reports.length === 1 ? 'report' : 'reports'}
                          </span>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${expandedReports === post.id ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedReports === post.id && (
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                          {post.reports.map((report) => (
                            <div
                              key={report.id}
                              className="rounded-md border p-3 text-[13px]"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <span className="font-medium text-gray-900">
                                  {REASON_LABELS_FULL[report.reason] || report.reason}
                                </span>
                                <span className="text-gray-400 text-[12px] flex-shrink-0">
                                  {formatDate(report.createdAt)}
                                </span>
                              </div>
                              {report.description && (
                                <p className="text-gray-600 mb-1.5">{report.description}</p>
                              )}
                              <p className="text-gray-400 text-[12px] truncate">
                                by {report.reporter.name} ({report.reporter.email})
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
                      {/* Media & Link Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.poster && (
                          <button
                            onClick={() => setPosterModal({ url: post.poster!, title: post.title })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            <ImageIcon className="h-3 w-3" />
                            Poster
                          </button>
                        )}
                        {post.video && (
                          <button
                            onClick={() => setVideoModal({ url: post.video!, title: post.title, aspectRatio: post.videoAspectRatio })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            <Play className="h-3 w-3" fill="currentColor" />
                            Video
                          </button>
                        )}
                        {post.externalLink && (
                          <a
                            href={post.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Link
                          </a>
                        )}
                        {post._count.helpfulVotes > 0 && (
                          <span className="text-[11px] text-gray-400 ml-1">
                            {post._count.helpfulVotes} helpful
                          </span>
                        )}
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden lg:flex items-center gap-2">
                        <button
                          onClick={() => handleDismiss(post.id)}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === post.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Dismiss
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ postId: post.id, title: post.title })}
                          disabled={actionLoading === post.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="rounded-lg border bg-white p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[13px] text-gray-500 order-2 sm:order-1">
                Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium text-gray-900">{pagination.total}</span>
              </p>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => fetchFlaggedPosts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 px-1">
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
                        className={`w-8 h-8 rounded-md text-[13px] font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-primary text-white'
                            : 'text-gray-500 hover:bg-gray-100'
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
                  className="p-1.5 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border shadow-lg max-w-sm w-full">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <h3 className="text-[14px] font-semibold text-gray-900">Delete Post</h3>
                  </div>
                  <button
                    onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600 mb-2">
                  You are about to delete:
                </p>
                <p className="text-[13px] font-medium text-gray-900 mb-3 p-2.5 bg-gray-50 rounded-md">
                  &quot;{deleteModal.title}&quot;
                </p>
                <p className="text-[13px] text-gray-500 mb-3">
                  This will permanently delete the post and notify the user.
                </p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Reason for deletion (optional)..."
                  className="w-full px-3 py-2 bg-gray-50 border rounded-md text-[13px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  rows={3}
                />
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                  className="flex-1 px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deleteModal.postId}
                  className="flex-1 px-3 py-1.5 text-[12px] font-medium bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === deleteModal.postId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setVideoModal(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-lg border shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="text-[13px] font-medium text-gray-900 truncate pr-4">{videoModal.title}</h3>
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPosterModal(null)}
          >
            <div
              className="relative bg-white rounded-lg border shadow-lg overflow-hidden"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="text-[13px] font-medium text-gray-900 truncate pr-4">{posterModal.title}</h3>
                <button
                  onClick={() => setPosterModal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="bg-gray-50 flex items-center justify-center p-4">
                <img
                  src={posterModal.url}
                  alt={posterModal.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-md"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dismiss Reports Modal */}
        {dismissingPostId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border shadow-lg max-w-sm w-full">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-[14px] font-semibold text-gray-900">Dismiss Reports</h3>
                  </div>
                  <button onClick={() => setDismissingPostId(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600">
                  Dismiss all reports for this post? The post will remain visible and reporters will not be notified.
                </p>
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => setDismissingPostId(null)}
                  className="flex-1 px-3 py-1.5 text-[12px] font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDismiss}
                  disabled={actionLoading === dismissingPostId}
                  className="flex-1 px-3 py-1.5 text-[12px] font-medium bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {actionLoading === dismissingPostId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Dismissing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dismiss
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
