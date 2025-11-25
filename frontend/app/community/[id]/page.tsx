'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Clock,
  ExternalLink as ExternalLinkIcon,
  Loader2,
  Pencil,
  Trash2,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';

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
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
    credibilityScore?: CredibilityScore;
  };
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [updatingHelpful, setUpdatingHelpful] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const response = await jobNewsAPI.getJobNewsById(params.id as string);
      const postData = response.data.data;
      setPost(postData);
      setHelpfulCount(postData.helpfulCount || 0);
      setIsHelpful(postData.userHasMarkedHelpful || false);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post. Please try again.',
        variant: 'destructive',
      });
      router.push('/community');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to mark posts as helpful.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingHelpful(true);
    try {
      const response = await jobNewsAPI.toggleHelpful(params.id as string);
      const { isHelpful: newIsHelpful, helpfulCount: newCount } = response.data.data;

      setIsHelpful(newIsHelpful);
      setHelpfulCount(newCount);

      toast({
        title: newIsHelpful ? 'Marked as helpful!' : 'Unmarked',
        description: newIsHelpful ? 'Thank you for your feedback.' : 'Removed your helpful vote.',
      });
    } catch (error: any) {
      console.error('Error updating helpful:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingHelpful(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await jobNewsAPI.deleteJobNews(params.id as string);
      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
      });
      router.push('/community');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete post.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-20 text-center">
              <h3 className="text-lg font-semibold mb-2">Post not found</h3>
              <p className="text-muted-foreground mb-4">
                The post you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/community">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Community
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.id === post.user.id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Back Button */}
        <Link
          href="/community"
          className="inline-flex items-center text-xs md:text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
          Back to Community
        </Link>

        {/* Post Card */}
        <Card>
          <CardHeader className="space-y-4">
            {/* Author Info */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                  <AvatarImage
                    src={post.user.profilePhoto || undefined}
                    alt={post.user.name}
                  />
                  <AvatarFallback>{getInitials(post.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm md:text-base truncate">{post.user.name}</p>
                    {/* Credibility Badge - Inline next to name */}
                    {post.user.credibilityScore && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border-2 flex-shrink-0 ${
                        post.user.credibilityScore.level === 'Newbie' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                        post.user.credibilityScore.level === 'Contributor' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        post.user.credibilityScore.level === 'Trusted' ? 'bg-slate-50 text-slate-800 border-slate-400' :
                        post.user.credibilityScore.level === 'Expert' ? 'bg-yellow-50 text-yellow-800 border-yellow-400' :
                        'bg-purple-50 text-purple-800 border-purple-400'
                      }`}>
                        <span className="text-base leading-none">
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
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Actions (only for author) */}
              {isAuthor && (
                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                    onClick={() => router.push(`/community/${post.id}/edit`)}
                  >
                    <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 md:h-9 md:w-9"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">{post.title}</h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-2">
              {post.companyName && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {post.companyName}
                </Badge>
              )}
              {post.location && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {post.location}
                </Badge>
              )}
              {post.source && (
                <Badge variant="outline" className="text-xs">
                  Source: {post.source}
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Media Section - Separate section with max-width like LinkedIn */}
          {(post.poster || post.video) && (
            <div className="px-6 py-4 border-b">
              {/* Poster Image */}
              {post.poster && (
                <div className="relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 mx-auto" style={{ maxWidth: '680px' }}>
                  <img
                    src={post.poster}
                    alt={post.title}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '450px' }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Video */}
              {post.video && (
                <VideoPlayer videoUrl={post.video} title={post.title} maxWidth="680px" />
              )}
            </div>
          )}

          <CardContent className="space-y-6">
            {/* Description */}
            <div className="prose prose-sm md:prose-base max-w-none">
              <p className="whitespace-pre-wrap text-sm md:text-base text-foreground leading-relaxed">{post.description}</p>
            </div>

            {/* External Link */}
            {post.externalLink && (
              <div className="border-t pt-6">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={post.externalLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    <span>View Original Link</span>
                  </a>
                </Button>
              </div>
            )}

            {/* Helpful Counter */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={isHelpful ? "default" : "outline"}
                    size="sm"
                    onClick={handleHelpful}
                    disabled={updatingHelpful}
                    className={`gap-2 ${isHelpful ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  >
                    {updatingHelpful ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className={`h-4 w-4 ${isHelpful ? 'fill-current' : ''}`} />
                    )}
                    <span className="hidden sm:inline">
                      {isHelpful ? 'You marked this helpful' : 'Mark as helpful'}
                    </span>
                    <span className="sm:hidden">{isHelpful ? 'Marked' : 'Helpful'}</span>
                  </Button>
                  {helpfulCount > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {helpfulCount} {helpfulCount === 1 ? 'person' : 'people'} found this helpful
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Related Actions */}
        <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Want to share something?</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Share job leads, tips, or insights with the community
              </p>
              <Button asChild className="w-full" size="sm">
                <Link href="/community/create">Create Post</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6 space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Looking for official jobs?</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Browse verified job postings from companies
              </p>
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href="/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
