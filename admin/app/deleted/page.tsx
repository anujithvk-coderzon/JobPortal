'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { showToast } from '@/components/Toast';
import { api } from '@/lib/api';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  MoreVertical,
  X,
  AlertTriangle,
  MapPin,
  Building2,
  ExternalLink,
  Play,
  ImageIcon,
  UserX,
  Ban,
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
  deletedAt: string;
  deletionReason?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    isBlocked: boolean;
    isDeleted: boolean;
  };
  _count: {
    helpfulVotes: number;
    reports: number;
  };
}

export default function DeletedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string; aspectRatio?: string } | null>(null);
  const [posterModal, setPosterModal] = useState<{ url: string; title: string } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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

    const response = await api.getSoftDeletedPosts(params) as { success: boolean; data?: { posts: Post[]; pagination: any } };
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

  const handleRestore = async (postId: string) => {
    setConfirmRestore(postId);
  };

  const confirmRestorePost = async () => {
    if (!confirmRestore) return;
    setActionLoading(confirmRestore);
    const response = await api.restorePost(confirmRestore);
    if (response.success) {
      showToast('Post restored successfully', 'success');
      setConfirmRestore(null);
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to restore post', 'error');
    }
    setActionLoading(null);
  };

  const handlePermanentDelete = async (postId: string) => {
    setActionLoading(postId);
    const response = await api.permanentDeletePost(postId);
    if (response.success) {
      showToast('Post permanently deleted', 'success');
      setConfirmPermanentDelete(null);
      fetchPosts(pagination?.page || 1);
      window.dispatchEvent(new Event('post-moderated'));
    } else {
      showToast(response.error || 'Failed to delete post', 'error');
    }
    setActionLoading(null);
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
          {user.isBlocked && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
              <Ban className="h-2.5 w-2.5" />
            </span>
          )}
          {user.isDeleted && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              <UserX className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
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
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Deleted Posts</h1>
                <p className="text-red-100 text-sm mt-0.5">Review and manage soft-deleted content</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <span className="text-2xl sm:text-3xl font-bold">{pagination?.total || 0}</span>
                <span className="text-red-100 text-sm ml-2">Deleted Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by post title, description, user name, or email..."
                className="w-full pl-10 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
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
              <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Loading deleted posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No deleted posts</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              {search ? 'Try adjusting your search terms' : 'All posts are currently active'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  {/* Delete Info Banner */}
                  <div className="flex items-start justify-between gap-3 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-start gap-2 flex-1">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Deleted on {formatDate(post.deletedAt)}
                        </p>
                        {post.deletionReason && (
                          <p className="text-sm text-red-700 mt-0.5">
                            <strong>Reason:</strong> {post.deletionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mobile Actions Toggle */}
                    <div className="lg:hidden relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileActionsOpen(mobileActionsOpen === post.id ? null : post.id);
                        }}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-red-600" />
                      </button>

                      {mobileActionsOpen === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => { handleRestore(post.id); setMobileActionsOpen(null); }}
                            disabled={actionLoading === post.id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore Post
                          </button>
                          <div className="my-1 border-t border-gray-100" />
                          <button
                            onClick={() => { setConfirmPermanentDelete(post.id); setMobileActionsOpen(null); }}
                            disabled={actionLoading === post.id}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Permanently
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4 mb-3">
                    <UserAvatar user={post.user} />
                  </div>

                  {/* Post Title & Info */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Posted {formatDateShort(post.createdAt)}
                      </span>
                      {post._count.reports > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          {post._count.reports} reports
                        </span>
                      )}
                      {post._count.helpfulVotes > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          {post._count.helpfulVotes} helpful
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
                      {post.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className={`text-sm text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                    {post.description}
                  </p>
                  {post.description.length > 200 && (
                    <button
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-1"
                    >
                      {expandedPost === post.id ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {/* Meta Info */}
                  {(post.companyName || post.location) && (
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
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

                  {/* Media Buttons */}
                  <div className="flex items-center gap-2 flex-wrap mt-4">
                    {post.poster && (
                      <button
                        onClick={() => setPosterModal({ url: post.poster!, title: post.title })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        View Poster
                      </button>
                    )}
                    {post.video && (
                      <button
                        onClick={() => setVideoModal({ url: post.video!, title: post.title, aspectRatio: post.videoAspectRatio })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <Play className="h-3.5 w-3.5" fill="currentColor" />
                        Watch Video
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
                        External Link
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100 hidden lg:flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRestore(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
                  >
                    {actionLoading === post.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmPermanentDelete(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Permanently
                  </button>
                </div>
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

        {/* Confirm Restore Modal */}
        {confirmRestore && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Restore Post</h3>
                  </div>
                  <button onClick={() => setConfirmRestore(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm text-gray-600">
                  This will restore the post and make it visible again to all users.
                </p>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestorePost}
                  disabled={actionLoading === confirmRestore}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === confirmRestore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Permanent Delete Modal */}
        {confirmPermanentDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Permanent Deletion</h3>
                  </div>
                  <button onClick={() => setConfirmPermanentDelete(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm text-gray-600 mb-4">
                  This action <strong className="text-red-600">cannot be undone</strong>. The post and all associated media (images, videos) will be permanently deleted from the system.
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> All helpful votes, reports, and other data associated with this post will also be deleted.
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setConfirmPermanentDelete(null)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePermanentDelete(confirmPermanentDelete)}
                  disabled={actionLoading === confirmPermanentDelete}
                  className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === confirmPermanentDelete ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Permanently
                    </>
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
