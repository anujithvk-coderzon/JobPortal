'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI, followAPI } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CredibilityBadgeCompact } from '@/components/CredibilityBadge';
import { FollowingDrawer } from '@/components/FollowingDrawer';
import { FollowButton } from '@/components/FollowButton';
import { ReportModal } from '@/components/ReportModal';
import { useAuthStore } from '@/store/authStore';
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Loader2,
  ChevronRight,
  ExternalLink,
  User,
  ThumbsUp,
  Eye,
  Award,
  Users,
  Flag,
  MessageSquarePlus,
  Briefcase,
  Shield,
  Share2,
} from 'lucide-react';

interface CredibilityScore {
  level: string;
  score: number;
  nextLevel: string;
  nextLevelAt: number;
}

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  source?: string;
  externalLink?: string;
  poster?: string;
  video?: string;
  videoAspectRatio?: string;
  createdAt: string;
  helpfulCount?: number;
  isHelpful?: boolean;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    credibilityScore?: CredibilityScore;
  };
}

function CommunityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
  });

  // Follow/Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingUsers, setFollowingUsers] = useState<{ id: string; name: string; profilePhoto?: string; headline?: string }[]>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<{ id: string; title: string } | null>(null);

  // Fetch following IDs first when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFollowingIds();
    } else {
      setFollowingLoaded(true);
    }
  }, [isAuthenticated]);

  // Fetch posts when tab or filters change
  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, selectedUserId]);

  const fetchFollowingIds = async () => {
    try {
      const response = await followAPI.getFollowing({ limit: 100 });
      const users = response.data.users;
      setFollowingIds(users.map((u: any) => u.id));
      setFollowingUsers(users);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setFollowingLoaded(true);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (isFollowing) {
      setFollowingIds((prev) => [...prev, userId]);
    } else {
      setFollowingIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const fetchPosts = async (currentTab: 'all' | 'following' = 'all') => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;

      if (selectedUserId) {
        params.userId = selectedUserId;
      }

      if (currentTab === 'following' && !selectedUserId) {
        params.followingOnly = 'true';
      }

      const response = await jobNewsAPI.getAllJobNews(params);
      const fetchedPosts = response.data.data.jobNews;

      setPosts(fetchedPosts);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load community posts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pagination.page === 1) {
      fetchPosts(activeTab);
    } else {
      setPagination({ ...pagination, page: 1 });
    }
  };

  const loadMorePosts = async () => {
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const params: any = {
        page: nextPage,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;

      if (activeTab === 'following' && !selectedUserId) {
        params.followingOnly = 'true';
      }

      const response = await jobNewsAPI.getAllJobNews(params);
      const newPosts = response.data.data.jobNews;

      setPosts([...posts, ...newPosts]);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load more posts.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleHelpful = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await jobNewsAPI.toggleHelpful(postId);
      const { isHelpful: newIsHelpful, helpfulCount: newCount } = response.data.data;

      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, isHelpful: newIsHelpful, helpfulCount: newCount }
          : post
      ));

      toast({
        title: newIsHelpful ? 'Marked as helpful!' : 'Unmarked',
        description: newIsHelpful ? 'Thank you for your feedback.' : 'Removed your helpful vote.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFilterByUser = (userId: string | null) => {
    setSelectedUserId(userId);
    if (userId) {
      setActiveTab('all');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'all' | 'following');
    setSelectedUserId(null);
  };

  const handleReportClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to report posts.',
        variant: 'destructive',
      });
      return;
    }
    setReportingPost({ id: post.id, title: post.title });
    setReportModalOpen(true);
  };

  const getCredibilityStyle = (level: string) => {
    switch (level) {
      case 'Newbie': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Contributor': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Trusted': return 'bg-slate-50 text-slate-800 border-slate-300';
      case 'Expert': return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      default: return 'bg-purple-50 text-purple-800 border-purple-300';
    }
  };

  const getCredibilityEmoji = (level: string) => {
    switch (level) {
      case 'Newbie': return '🌱';
      case 'Contributor': return '🥉';
      case 'Trusted': return '🥈';
      case 'Expert': return '🥇';
      default: return '👑';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold mb-1">Community</h1>
          <p className="text-[13px] text-muted-foreground mb-3">
            Share and discover job leads, career tips, industry insights, and articles
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-primary/8">
                <ThumbsUp className="h-3 w-3 text-primary" />
              </div>
              <span>Mark helpful posts to support contributors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-primary/8">
                <Award className="h-3 w-3 text-primary" />
              </div>
              <span>Build credibility: Newbie, Contributor, Trusted, Expert, Authority</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                placeholder="Search posts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-9 text-[13px]"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-4">
              <span className="hidden sm:inline text-[13px]">Search</span>
              <Search className="h-3.5 w-3.5 sm:hidden" />
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-[12px] px-3">
                  All Posts
                </TabsTrigger>
                <TabsTrigger value="following" className="text-[12px] px-3" disabled={!isAuthenticated}>
                  Following
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {selectedUserId && (
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-muted-foreground">Filtering by user:</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedUserId(null)}
                className="h-7 text-[11px]"
              >
                Clear filter
              </Button>
            </div>
          )}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="rounded-lg border bg-card">
            <CardContent className="py-16 text-center">
              <div className="p-3 rounded-lg bg-primary/8 w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">
                {activeTab === 'following'
                  ? (followingIds.length === 0 ? "You're not following anyone yet" : 'No posts from people you follow')
                  : 'No posts found'}
              </h3>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-sm mx-auto">
                {activeTab === 'following'
                  ? (followingIds.length === 0
                      ? 'Start following users to see their posts here!'
                      : 'The users you follow haven\'t posted anything yet.')
                  : 'Try adjusting your search or be the first to share something!'}
              </p>
              {activeTab === 'following' && followingIds.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('all')}>
                  Browse All Posts
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="rounded-lg border bg-card hover:border-primary/20 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <div className="p-4 sm:p-5">
                    {/* Author Row */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={post.user.profilePhoto || undefined} alt={post.user.name} />
                          <AvatarFallback className="text-[11px]">{getInitials(post.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-medium truncate">{post.user.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/user/${post.user.id}`);
                              }}
                              className="text-[11px] text-primary hover:underline flex-shrink-0"
                            >
                              View Profile
                            </button>
                            <div onClick={(e) => e.stopPropagation()}>
                              <FollowButton
                                userId={post.user.id}
                                size="sm"
                                showIcon={false}
                                className="h-5 text-[10px] px-1.5"
                                onFollowChange={(isFollowing) => handleFollowChange(post.user.id, isFollowing)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{timeAgo(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {post.user.credibilityScore && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded border flex-shrink-0 ${getCredibilityStyle(post.user.credibilityScore.level)}`}>
                          <span className="text-sm leading-none">
                            {getCredibilityEmoji(post.user.credibilityScore.level)}
                          </span>
                          <span className="text-[11px] font-semibold">
                            {post.user.credibilityScore.level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold mb-1.5 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[13px] text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed mb-3">
                      {post.description}
                    </p>
                  </div>

                  {/* Poster Image */}
                  {post.poster && (
                    <div className="px-4 sm:px-5 pb-3">
                      <div className="relative rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '600px' }}>
                        <img
                          src={post.poster}
                          alt="Post poster"
                          className="w-full h-auto"
                          style={{ maxHeight: '60vh', objectFit: 'contain' }}
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video */}
                  {post.video && (
                    <div className="px-4 sm:px-5 pb-3">
                      <VideoPlayer
                        videoUrl={post.video}
                        title={post.title}
                        aspectRatio={post.videoAspectRatio as any || 'auto'}
                      />
                    </div>
                  )}

                  {/* Meta Badges */}
                  <div className="px-4 sm:px-5 pb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.companyName && (
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          <Building2 className="h-2.5 w-2.5 mr-1" />
                          {post.companyName}
                        </Badge>
                      )}
                      {post.location && (
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          <MapPin className="h-2.5 w-2.5 mr-1" />
                          {post.location}
                        </Badge>
                      )}
                      {post.source && (
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {post.source}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-4 sm:px-5 py-3 border-t flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant={post.isHelpful ? "default" : "outline"}
                        size="sm"
                        className={`h-7 text-[11px] ${post.isHelpful ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : ''}`}
                        onClick={(e) => handleToggleHelpful(post.id, e)}
                      >
                        <ThumbsUp className={`h-3 w-3 mr-1 ${post.isHelpful ? 'fill-current' : ''}`} />
                        {post.isHelpful ? 'Helpful' : 'Mark Helpful'}
                        {(post.helpfulCount ?? 0) > 0 && (
                          <span className="ml-1">({post.helpfulCount})</span>
                        )}
                      </Button>
                      {post.externalLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(post.externalLink, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Link
                        </Button>
                      )}
                      {user?.id !== post.user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleReportClick(post, e)}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Report
                        </Button>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors hidden sm:inline">
                      Read more
                      <ChevronRight className="h-3 w-3 inline ml-0.5" />
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="flex flex-col items-center gap-2 mt-6">
                <p className="text-[11px] text-muted-foreground">
                  Showing {posts.length} of {pagination.total} posts
                </p>
                <Button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  variant="outline"
                  size="sm"
                  className="min-w-[160px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Following Drawer */}
      <FollowingDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onFilterByUser={handleFilterByUser}
        selectedUserId={selectedUserId}
        onFollowChange={handleFollowChange}
      />

      {/* Report Modal */}
      {reportingPost && (
        <ReportModal
          postId={reportingPost.id}
          postTitle={reportingPost.title}
          open={reportModalOpen}
          onOpenChange={setReportModalOpen}
        />
      )}
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
      <CommunityPageContent />
    </Suspense>
  );
}
