'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Loader2,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  Edit,
  Plus,
  Newspaper,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Breadcrumb } from '@/components/Breadcrumb';
import Image from 'next/image';

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
  isActive?: boolean;
}

function MyPostsPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchPosts();
  }, [isAuthenticated, isHydrated, pagination.page]);

  const fetchPosts = async () => {
    if (pagination.page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await api.get('/job-news/user/my-news', { params });

      if (response.success) {
        const postsData = response.data?.jobNews || response.data?.data?.jobNews || [];
        const paginationData = response.data?.pagination || response.data?.data?.pagination || {};

        if (pagination.page === 1) {
          setPosts(postsData);
        } else {
          setPosts(prev => [...prev, ...postsData]);
        }

        setPagination(prev => ({
          ...prev,
          ...paginationData,
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load your posts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  const handleLoadMore = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  };

  if (!isHydrated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Community', href: '/community' }, { label: 'My Posts' }]} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <div>
              <h1 className="text-lg font-semibold mb-0.5">My Community Posts</h1>
              <p className="text-[13px] text-muted-foreground">
                {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} shared
              </p>
            </div>
            <Button
              onClick={() => router.push('/community/create')}
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create New Post
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
              <Input
                type="text"
                placeholder="Search your posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-[13px]"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 px-4">
              <span className="hidden sm:inline text-[13px]">Search</span>
              <Search className="h-3.5 w-3.5 sm:hidden" />
            </Button>
          </form>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <Card className="rounded-lg border bg-card">
            <CardContent className="py-16 text-center">
              <div className="p-3 rounded-lg bg-primary/8 w-fit mx-auto mb-4">
                <Newspaper className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No posts yet</h3>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-sm mx-auto">
                {searchQuery
                  ? 'No posts found matching your search.'
                  : 'Share your first community post and connect with others!'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/community/create')} size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="rounded-lg border bg-card group hover:border-primary/20 transition-colors cursor-pointer flex flex-col"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <div className="p-4 pb-2 flex-shrink-0">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant={post.isActive !== false ? 'success' : 'secondary'}
                        className="text-[10px]"
                      >
                        {post.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/community/${post.id}/edit`);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Poster or Video Thumbnail */}
                    {post.poster && (
                      <div className="relative w-full rounded-lg overflow-hidden aspect-video mb-3 bg-muted">
                        <Image
                          src={post.poster}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    {post.video && !post.poster && (
                      <div className="mb-3 rounded-lg overflow-hidden aspect-video">
                        <VideoPlayer videoUrl={post.video} />
                      </div>
                    )}

                    <h3 className="text-sm font-semibold mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </div>

                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <p className="text-[13px] text-muted-foreground mb-3 line-clamp-3 leading-relaxed flex-1">
                      {post.description}
                    </p>

                    <div className="space-y-1.5">
                      {post.companyName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{post.companyName}</span>
                        </div>
                      )}
                      {post.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{post.location}</span>
                        </div>
                      )}
                      {post.externalLink && (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary">
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">External link attached</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{post.helpfulCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="min-w-[160px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Posts
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
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

export default function MyPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <MyPostsPageContent />
    </Suspense>
  );
}
