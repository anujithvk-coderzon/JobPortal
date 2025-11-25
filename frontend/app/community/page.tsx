'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CredibilityBadgeCompact } from '@/components/CredibilityBadge';
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;

      const response = await jobNewsAPI.getAllJobNews(params);
      setPosts(response.data.data.jobNews);
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
      fetchPosts();
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

      const response = await jobNewsAPI.getAllJobNews(params);
      setPosts([...posts, ...response.data.data.jobNews]);
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

      // Update the post in the list
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Community</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-3">
            Share and discover job leads, career tips, industry insights, and articles
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              <span>Mark helpful posts to support contributors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span>Build credibility: 🌱 Newbie → 🥉 Contributor → 🥈 Trusted → 🥇 Expert → 👑 Authority</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 flex-shrink-0" />
              <Input
                placeholder="Search posts..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="w-auto h-10 sm:h-11 px-4 sm:px-6 md:px-8 text-sm sm:text-base">
              <span className="hidden sm:inline">Search</span>
              <Search className="h-4 w-4 sm:hidden" />
            </Button>
          </form>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 py-20 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or be the first to share something!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 md:space-y-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                    {/* Author Info with Credibility Badge */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={post.user.profilePhoto || undefined} alt={post.user.name} />
                          <AvatarFallback className="text-xs">{getInitials(post.user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{post.user.name}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/user/${post.user.id}`);
                              }}
                              className="text-xs text-primary hover:underline flex-shrink-0"
                            >
                              View Profile
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{timeAgo(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Credibility Badge - Inline on the right */}
                      {post.user.credibilityScore && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 flex-shrink-0 ${
                          post.user.credibilityScore.level === 'Newbie' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                          post.user.credibilityScore.level === 'Contributor' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                          post.user.credibilityScore.level === 'Trusted' ? 'bg-slate-50 text-slate-800 border-slate-400' :
                          post.user.credibilityScore.level === 'Expert' ? 'bg-yellow-50 text-yellow-800 border-yellow-400' :
                          'bg-purple-50 text-purple-800 border-purple-400'
                        }`}>
                          <span className="text-xl leading-none">
                            {post.user.credibilityScore.level === 'Newbie' ? '🌱' :
                             post.user.credibilityScore.level === 'Contributor' ? '🥉' :
                             post.user.credibilityScore.level === 'Trusted' ? '🥈' :
                             post.user.credibilityScore.level === 'Expert' ? '🥇' : '👑'}
                          </span>
                          <span className="text-xs font-bold leading-tight">
                            {post.user.credibilityScore.level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-semibold mb-2 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    {/* Description Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {post.description}
                    </p>
                  </CardHeader>

                  {/* Media Section - Separate section with max-width like LinkedIn */}
                  {(post.poster || post.video) && (
                    <div className="px-6 py-3">
                      {/* Poster Image */}
                      {post.poster && (
                        <div className="relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 mx-auto" style={{ maxWidth: '550px' }}>
                          <img
                            src={post.poster}
                            alt="Post poster"
                            className="w-full h-auto object-contain"
                            style={{ maxHeight: '350px' }}
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Video */}
                      {post.video && (
                        <VideoPlayer videoUrl={post.video} title={post.title} maxWidth="550px" />
                      )}
                    </div>
                  )}

                  <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {post.companyName && (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          {post.companyName}
                        </Badge>
                      )}
                      {post.location && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {post.location}
                        </Badge>
                      )}
                      {post.source && (
                        <Badge variant="outline" className="text-xs">
                          {post.source}
                        </Badge>
                      )}
                    </div>
                  </CardContent>

                  {/* Footer with Actions */}
                  <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 pt-3 border-t">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant={post.isHelpful ? "default" : "outline"}
                          size="sm"
                          className={`h-8 text-xs ${post.isHelpful ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'border-border'}`}
                          onClick={(e) => handleToggleHelpful(post.id, e)}
                        >
                          <ThumbsUp className={`h-3 w-3 mr-1.5 ${post.isHelpful ? 'fill-current' : ''}`} />
                          {post.isHelpful ? 'Helpful' : 'Mark as Helpful'}
                          {(post.helpfulCount ?? 0) > 0 && (
                            <span className="ml-1.5">({post.helpfulCount})</span>
                          )}
                        </Button>
                        {post.externalLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-border"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(post.externalLink, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" />
                            External Link
                          </Button>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap hidden sm:inline">
                        Read more →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 md:mt-8">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Showing {posts.length} of {pagination.total} posts
                </p>
                <Button
                  onClick={loadMorePosts}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="flex items-center justify-center min-h-screen">Loading...</div></div>}>
      <CommunityPageContent />
    </Suspense>
  );
}
