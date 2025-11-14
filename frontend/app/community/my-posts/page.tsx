'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Loader2,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  ThumbsUp,
  Edit,
  Trash2,
  Plus,
  Newspaper,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto py-3 md:py-6 lg:py-8 px-2 md:px-4 lg:px-6 max-w-7xl">
        {/* Header */}
        <div className="mb-3 md:mb-4 lg:mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2 md:mb-3 lg:mb-4 h-8 md:h-9 px-2 md:px-4"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            <span className="text-xs md:text-sm">Back</span>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                My Community Posts
              </h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-600">
                {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} shared
              </p>
            </div>
            <Button
              onClick={() => router.push('/community/create')}
              className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              <span className="hidden xs:inline">Create New Post</span>
              <span className="xs:hidden">New Post</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-3 md:mb-4 lg:mb-6 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-3 md:pt-4 lg:pt-6 pb-3 md:pb-4 lg:pb-6">
            <form onSubmit={handleSearch} className="flex gap-2 md:gap-3 lg:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 md:h-4 md:w-4" />
                  <Input
                    type="text"
                    placeholder="Search your posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 md:pl-10 h-9 md:h-10 text-xs md:text-sm"
                  />
                </div>
              </div>
              <Button type="submit" className="h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm">
                <span className="hidden sm:inline">Search</span>
                <Search className="h-3.5 w-3.5 sm:hidden" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-8 md:py-12 lg:py-16 px-3 md:px-6 text-center">
              <Newspaper className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 text-gray-400 mx-auto mb-3 md:mb-4 opacity-50" />
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-1.5 md:mb-2">No posts yet</h3>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-4 md:mb-6 max-w-md mx-auto">
                {searchQuery
                  ? 'No posts found matching your search.'
                  : 'Share your first community post and connect with others!'}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push('/community/create')} className="h-9 md:h-10 text-xs md:text-sm">
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Create Your First Post
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-3 md:mb-4 lg:mb-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-purple-500"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 lg:pt-6 px-3 md:px-4 lg:px-6">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <Badge
                        variant={post.isActive !== false ? 'default' : 'secondary'}
                        className="text-[9px] md:text-xs px-1.5 md:px-2 h-4 md:h-5"
                      >
                        {post.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-0.5 md:gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/community/${post.id}/edit`);
                          }}
                        >
                          <Edit className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Poster or Video Thumbnail */}
                    {post.poster && (
                      <div className="relative w-full h-36 md:h-44 lg:h-48 mb-2 md:mb-3 lg:mb-4 rounded-md md:rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        <Image
                          src={post.poster}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    {post.video && !post.poster && (
                      <div className="mb-2 md:mb-3 lg:mb-4">
                        <VideoPlayer videoUrl={post.video} />
                      </div>
                    )}

                    <CardTitle className="text-sm md:text-base lg:text-lg font-semibold mb-1.5 md:mb-2 line-clamp-2 leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 pb-3 md:pb-4 lg:pb-6 px-3 md:px-4 lg:px-6">
                    <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-3 leading-relaxed">
                      {post.description}
                    </p>

                    <div className="space-y-1.5 md:space-y-2">
                      {post.companyName && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-500">
                          <Building2 className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                          <span className="truncate">{post.companyName}</span>
                        </div>
                      )}

                      {post.location && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-500">
                          <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                          <span className="truncate">{post.location}</span>
                        </div>
                      )}

                      {post.externalLink && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-blue-600">
                          <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                          <span className="truncate text-xs md:text-sm">External link attached</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t">
                      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <ThumbsUp className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <span>{post.helpfulCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          <span className="truncate">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm px-4 md:px-6"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Posts</span>
                      <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1.5 md:ml-2" />
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
        <div className="min-h-screen bg-gray-50">
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <MyPostsPageContent />
    </Suspense>
  );
}
