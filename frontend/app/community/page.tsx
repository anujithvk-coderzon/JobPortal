'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSWRConfig } from 'swr';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI, followAPI, api } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CredibilityBadgeCompact } from '@/components/CredibilityBadge';
import { FollowingDrawer } from '@/components/FollowingDrawer';
import { FollowButton } from '@/components/FollowButton';
import { ReportModal } from '@/components/ReportModal';
import { useAuthStore } from '@/store/authStore';
import { AuthGate } from '@/components/AuthGate';
import { useProfile } from '@/hooks/use-profile';
import { useFollowing } from '@/hooks/use-follow';
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
  Sparkles,
  Pencil,
  X,
  Plus,
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
  isSeen?: boolean;
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
  const { mutate: globalMutate } = useSWRConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  // SWR hooks for following and profile/interests
  const { data: followingData } = useFollowing({ limit: 100 });
  const { data: profileData, mutate: mutateProfile } = useProfile();

  // followingData may be the data envelope or contain users directly
  const followingUsersList = followingData?.users || [];
  const followingIds = followingUsersList.map((u: any) => u.id);
  const followingUsers = followingUsersList;
  const followingLoaded = followingData !== undefined || !isAuthenticated;

  // Interests from profile
  const userInterests: string[] = profileData?.profile?.interests || [];

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<{ id: string; title: string } | null>(null);

  // Interests editing state
  const [editingInterests, setEditingInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [savingInterests, setSavingInterests] = useState(false);

  const saveInterests = async (updated: string[]) => {
    setSavingInterests(true);
    try {
      await api.put('/users/profile', { interests: updated });
      mutateProfile();
      // Re-fetch posts to apply new sorting
      fetchPosts(activeTab);
    } catch {
      toast({ title: 'Error', description: 'Failed to save interests', variant: 'destructive' });
    } finally {
      setSavingInterests(false);
    }
  };

  const addInterest = () => {
    const trimmed = newInterest.trim().toLowerCase();
    if (!trimmed || userInterests.includes(trimmed)) {
      setNewInterest('');
      return;
    }
    const updated = [...userInterests, trimmed];
    setNewInterest('');
    saveInterests(updated);
  };

  const removeInterest = (interest: string) => {
    const updated = userInterests.filter((i) => i !== interest);
    saveInterests(updated);
  };

  // Fetch posts when tab or filters change
  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, selectedUserId]);

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    // Invalidate follow caches
    globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/follow/'), undefined, { revalidate: true });
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

  const loadingMoreRef = useRef(false);
  const postObserver = useRef<IntersectionObserver | null>(null);

  const lastPostRef = useCallback(
    (node: HTMLElement | null) => {
      if (postObserver.current) postObserver.current.disconnect();
      if (!node || loadingMore || pagination.page >= pagination.totalPages) return;
      if (!isAuthenticated && pagination.page >= 1) return;

      postObserver.current = new IntersectionObserver(
        async (entries) => {
          if (!entries[0].isIntersecting || loadingMoreRef.current) return;
          loadingMoreRef.current = true;
          setLoadingMore(true);
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const nextPage = pagination.page + 1;
            const params: any = { page: nextPage, limit: pagination.limit };
            if (filters.search) params.search = filters.search;
            if (filters.location) params.location = filters.location;
            if (activeTab === 'following' && !selectedUserId) params.followingOnly = 'true';
            const response = await jobNewsAPI.getAllJobNews(params);
            const newPosts = response.data.data.jobNews;
            setPosts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const unique = newPosts.filter((p: Post) => !existingIds.has(p.id));
              return [...prev, ...unique];
            });
            setPagination(response.data.data.pagination);
          } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load more posts.', variant: 'destructive' });
          }
          setLoadingMore(false);
          loadingMoreRef.current = false;
        },
        { threshold: 0.1 }
      );
      postObserver.current.observe(node);
    },
    [loadingMore, pagination, filters, activeTab, selectedUserId]
  );

  const handleToggleHelpful = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please log in to mark posts as helpful.', variant: 'warning' });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    try {
      const response = await jobNewsAPI.toggleHelpful(postId);
      const { isHelpful: newIsHelpful, helpfulCount: newCount } = response.data.data;

      setPosts(posts.map(post =>
        post.id === postId
          ? { ...post, isHelpful: newIsHelpful, helpfulCount: newCount }
          : post
      ));
      globalMutate(`/job-news/${postId}`);

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
        title: 'Sign in required',
        description: 'Please log in to report posts.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
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
          {mounted && isAuthenticated && (
            <div className="mb-3">
              {!editingInterests ? (
                userInterests.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    {userInterests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-[10px] h-5 font-medium">
                        {interest}
                      </Badge>
                    ))}
                    <button
                      onClick={() => setEditingInterests(true)}
                      className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                      edit
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium mb-1">Personalize your feed</p>
                        <p className="text-[11px] text-muted-foreground mb-2.5">
                          Add topics you care about — matching posts and unseen content will appear first.
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                          {['security', 'AI', 'frontend', 'remote', 'devops', 'salary'].map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => {
                                const trimmed = suggestion.toLowerCase();
                                if (!userInterests.includes(trimmed)) {
                                  const updated = [...userInterests, trimmed];
                                  saveInterests(updated);
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setEditingInterests(true)}
                          className="text-[11px] text-primary font-medium hover:underline"
                        >
                          Or type your own interests
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-lg border bg-card p-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[12px] font-medium">Your interests</span>
                    </div>
                    <button
                      onClick={() => setEditingInterests(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {userInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {userInterests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-[11px] gap-1 pr-1">
                          {interest}
                          <button
                            onClick={() => removeInterest(interest)}
                            className="ml-0.5 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <form
                    onSubmit={(e) => { e.preventDefault(); addInterest(); }}
                    className="flex gap-1.5"
                  >
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Type an interest and press add..."
                      className="h-8 text-[12px] flex-1"
                      maxLength={30}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-[11px]"
                      disabled={!newInterest.trim() || savingInterests}
                    >
                      {savingInterests ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </form>
                  {userInterests.length === 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-muted-foreground">Suggestions:</span>
                      {['security', 'AI', 'frontend', 'remote', 'devops', 'salary', 'interview', 'cloud'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            const trimmed = suggestion.toLowerCase();
                            if (!userInterests.includes(trimmed)) {
                              const updated = [...userInterests, trimmed];
                              saveInterests(updated);
                            }
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded-full border border-border hover:border-primary/30 hover:text-primary text-muted-foreground transition-colors"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

          <div className="flex items-center justify-between gap-3">
            {mounted ? (
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
            ) : (
              <div className="h-8" />
            )}

            {mounted && isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 h-8 text-[12px] border-border/60"
                onClick={() => setDrawerOpen(true)}
              >
                <Users className="h-3.5 w-3.5" />
                Following ({followingIds.length})
              </Button>
            )}
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
              {posts.map((post, index) => (
                <Card
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostRef : null}
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
                                if (!isAuthenticated) {
                                  toast({ title: 'Sign in required', description: 'Please log in to view profiles.', variant: 'warning' });
                                  setTimeout(() => router.push('/auth/login'), 1500);
                                  return;
                                }
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
                    <h3 className="text-sm font-semibold mb-1.5 leading-snug group-hover:text-primary transition-colors flex items-start gap-1.5">
                      <span>{post.title}</span>
                      {mounted && isAuthenticated && !post.isSeen && (
                        <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
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
                        className={`h-7 text-[11px] ${post.isHelpful ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600' : ''}`}
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

            {loadingMore && (
              <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
                <span className="text-[11px] text-muted-foreground">Loading</span>
              </div>
            )}

            {!isAuthenticated && pagination.page >= 1 && pagination.totalPages > 1 && posts.length > 0 && (
              <AuthGate type="posts" />
            )}

            {isAuthenticated && pagination.page >= pagination.totalPages && posts.length > 0 && !loadingMore && (
              <p className="text-center text-[11px] text-muted-foreground py-4 border-t border-border/60 mt-4">
                All {pagination.total} posts loaded
              </p>
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
