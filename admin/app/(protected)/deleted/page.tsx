'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  X,
  AlertTriangle,
  MapPin,
  Building2,
  ExternalLink,
  Play,
  ImageIcon,
  UserX,
  Ban,
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

const DeletedPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string; aspectRatio?: string } | null>(null);
  const [posterModal, setPosterModal] = useState<{ url: string; title: string } | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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
      minute: '2-digit',
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
    <div className="flex items-center gap-2">
      {user.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt={user.name}
          className="h-7 w-7 rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div
        className={`h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center ${user.profilePhoto ? 'hidden' : ''}`}
      >
        <span className="text-[11px] font-semibold text-primary">{user.name?.[0]?.toUpperCase() || 'U'}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium text-gray-900 truncate">{user.name}</p>
          {user.isBlocked && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700">
              <Ban className="h-2.5 w-2.5" />
            </span>
          )}
          {user.isDeleted && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
              <UserX className="h-2.5 w-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4 max-w-[1400px]">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Deleted Posts</h1>
          <p className="text-[13px] text-gray-500">
            Review and manage soft-deleted content{pagination ? ` \u00b7 ${pagination.total} posts` : ''}
          </p>
        </div>

        {/* Search */}
        <div className="rounded-lg border bg-white p-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by post title, description, user name, or email..."
              className="w-full h-9 rounded-md border text-sm pl-9 pr-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </form>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trash2 className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-[13px] text-gray-500">
              {search ? 'No deleted posts match your search' : 'No deleted posts'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-lg border bg-white p-4 overflow-hidden">
                {/* Delete info banner */}
                <div className="rounded-md bg-red-50 border border-red-100 p-3 text-[13px] mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">
                        Deleted on {formatDate(post.deletedAt)}
                      </p>
                      {post.deletionReason && (
                        <p className="text-red-600 mt-0.5">Reason: {post.deletionReason}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="mb-3">
                  <UserAvatar user={post.user} />
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[12px] text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Posted {formatDateShort(post.createdAt)}
                  </span>
                  {post._count.reports > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">
                      {post._count.reports} reports
                    </span>
                  )}
                  {post._count.helpfulVotes > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700">
                      {post._count.helpfulVotes} helpful
                    </span>
                  )}
                </div>

                {/* Post Title */}
                <h3 className="text-[14px] font-semibold text-gray-900 mb-1.5">{post.title}</h3>

                {/* Description */}
                <p className={`text-[13px] text-gray-600 leading-relaxed ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                  {post.description}
                </p>
                {post.description.length > 200 && (
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="text-[12px] text-primary hover:underline font-medium mt-1"
                  >
                    {expandedPost === post.id ? 'Show less' : 'Read more'}
                  </button>
                )}

                {/* Meta Info - company/location */}
                {(post.companyName || post.location) && (
                  <div className="flex items-center gap-3 flex-wrap min-w-0 mt-2 text-[12px] text-gray-500">
                    {post.companyName && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <Building2 className="h-3 w-3" />
                        {post.companyName}
                      </span>
                    )}
                    {post.location && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="h-3 w-3" />
                        {post.location}
                      </span>
                    )}
                  </div>
                )}

                {/* Media Buttons */}
                {(post.poster || post.video || post.externalLink) && (
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {post.poster && (
                      <button
                        onClick={() => setPosterModal({ url: post.poster!, title: post.title })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200 transition-colors"
                      >
                        <ImageIcon className="h-3 w-3" />
                        View Poster
                      </button>
                    )}
                    {post.video && (
                      <button
                        onClick={() => setVideoModal({ url: post.video!, title: post.title, aspectRatio: post.videoAspectRatio })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 transition-colors"
                      >
                        <Play className="h-3 w-3" fill="currentColor" />
                        Watch Video
                      </button>
                    )}
                    {post.externalLink && (
                      <a
                        href={post.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium border text-gray-700 bg-white hover:bg-gray-50 border-gray-200 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        External Link
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons - inline */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleRestore(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === post.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Restore
                  </button>
                  <button
                    onClick={() => setConfirmPermanentDelete(post.id)}
                    disabled={actionLoading === post.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[12px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="rounded-lg border bg-white p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[12px] text-gray-500">
                {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchPosts(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 rounded-md flex items-center justify-center border text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
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
                      className={`h-8 w-8 rounded-md text-[12px] font-medium transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchPosts(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-8 w-8 rounded-md flex items-center justify-center border text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Restore Modal */}
        {confirmRestore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg border bg-white shadow-lg max-w-sm w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Restore Post</h3>
                </div>
                <button onClick={() => setConfirmRestore(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-gray-600">
                  This will restore the post and make it visible again to all users.
                </p>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmRestore(null)}
                  className="h-9 px-4 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestorePost}
                  disabled={actionLoading === confirmRestore}
                  className="h-9 px-4 rounded-md text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {actionLoading === confirmRestore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg border bg-white shadow-lg max-w-sm w-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Permanent Deletion</h3>
                </div>
                <button onClick={() => setConfirmPermanentDelete(null)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[13px] text-gray-600">
                  This action <strong className="text-red-600">cannot be undone</strong>. The post and all associated media will be permanently deleted.
                </p>
                <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-[13px] text-amber-800">
                  All helpful votes, reports, and other data associated with this post will also be deleted.
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmPermanentDelete(null)}
                  className="h-9 px-4 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePermanentDelete(confirmPermanentDelete)}
                  disabled={actionLoading === confirmPermanentDelete}
                  className="h-9 px-4 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {actionLoading === confirmPermanentDelete ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setVideoModal(null)}
          >
            <div
              className="relative w-full max-w-2xl rounded-lg border bg-white shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">{videoModal.title}</h3>
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
              className="relative rounded-lg border bg-white shadow-lg overflow-hidden"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 truncate pr-4">{posterModal.title}</h3>
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
                  className="max-w-full max-h-[75vh] object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeletedPostsPage;
