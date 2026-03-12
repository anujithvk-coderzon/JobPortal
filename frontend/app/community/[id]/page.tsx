'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { timeAgo, getInitials } from '@/lib/utils';
import { VideoPlayer } from '@/components/VideoPlayer';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  ExternalLink as ExternalLinkIcon,
  Loader2,
  Pencil,
  Trash2,
  ThumbsUp,
  X,
  MessageSquarePlus,
  Briefcase,
  Link2,
  Users,
  ChevronRight,
  Share2,
  Shield,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

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
  videoAspectRatio?: '16:9' | '1:1' | '4:5' | '9:16';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(0);
  const [updatingHelpful, setUpdatingHelpful] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const response = await jobNewsAPI.getJobNewsById(params.id as string);
      const postData = response.data.data;
      setPost(postData);
      setHelpfulCount(postData.helpfulCount || 0);
      setIsHelpful(postData.userHasMarkedHelpful || false);
    } catch (error: any) {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingHelpful(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await jobNewsAPI.deleteJobNews(params.id as string);
      toast({
        title: 'Success',
        description: 'Post deleted successfully.',
        variant: 'success',
      });
      setShowDeleteModal(false);
      router.push('/community');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete post.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getCredibilityStyle = (level: string) => {
    switch (level) {
      case 'Newbie': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'Contributor': return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
      case 'Trusted': return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800';
      case 'Expert': return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
      default: return 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
        <Card className="border border-border/60">
          <CardContent className="py-20 text-center">
            <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Post not found</h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              The post you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/community">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to Community
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAuthor = user && user.id === post.user.id;
  const hasMeta = post.companyName || post.location || post.source;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Community', href: '/community' }, { label: post.title }]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* ── Main Content ── */}
          <div className="min-w-0 space-y-0">
            {/* Title & Author Header */}
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-foreground mb-3">
                {post.title}
              </h1>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0 border border-border/40">
                    <AvatarImage src={post.user.profilePhoto || undefined} alt={post.user.name} />
                    <AvatarFallback className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {getInitials(post.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 flex-wrap text-[13px]">
                    <span className="font-semibold text-foreground">{post.user.name}</span>
                    {post.user.credibilityScore && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-1.5 py-0 h-[18px] ${getCredibilityStyle(post.user.credibilityScore.level)}`}
                      >
                        {post.user.credibilityScore.level}
                      </Badge>
                    )}
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[12px] text-muted-foreground">{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
                {isAuthor && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-[12px] text-muted-foreground border-border/60"
                      onClick={() => router.push(`/community/${post.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground border-border/60 hover:border-destructive hover:text-destructive"
                      onClick={() => setShowDeleteModal(true)}
                      disabled={deleting}
                    >
                      {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Body Card */}
            <Card className="border border-border/60 bg-card overflow-hidden">
              {/* Meta Tags — top strip */}
              {hasMeta && (
                <div className="px-5 sm:px-6 pt-5 flex flex-wrap gap-2">
                  {post.companyName && (
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{post.companyName}</span>
                    </div>
                  )}
                  {post.location && (
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{post.location}</span>
                    </div>
                  )}
                  {post.source && (
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <ExternalLinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{post.source}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Media — poster or video */}
              {post.poster && (
                <div className={`px-5 sm:px-6 ${hasMeta ? 'pt-4' : 'pt-5'} pb-1`}>
                  <div className="rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 border border-border/30">
                    <img
                      src={post.poster}
                      alt={post.title}
                      className="w-full h-auto mx-auto block"
                      style={{ maxHeight: '55vh', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {post.video && (
                <div className={`px-5 sm:px-6 ${hasMeta ? 'pt-4' : 'pt-5'} pb-1`}>
                  <VideoPlayer
                    videoUrl={post.video}
                    title={post.title}
                    aspectRatio={post.videoAspectRatio || 'auto'}
                  />
                </div>
              )}

              {/* Description */}
              <div className="px-5 sm:px-6 py-5">
                <p className="whitespace-pre-wrap text-[14px] text-foreground/90 leading-[1.8]">
                  {post.description}
                </p>

                {post.externalLink && (
                  <a
                    href={post.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-5 text-[13px] font-medium text-primary hover:underline"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    View original source
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Engagement Bar */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-border/40 bg-slate-50/40 dark:bg-slate-900/20 flex items-center gap-3">
                <Button
                  variant={isHelpful ? "default" : "outline"}
                  size="sm"
                  onClick={handleHelpful}
                  disabled={updatingHelpful}
                  className={`h-8 gap-1.5 text-[12px] rounded-full px-4 ${
                    isHelpful
                      ? 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                      : 'border-border/60'
                  }`}
                >
                  {updatingHelpful ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ThumbsUp className={`h-3.5 w-3.5 ${isHelpful ? 'fill-current' : ''}`} />
                  )}
                  {helpfulCount > 0 ? helpfulCount : ''}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-[12px] text-muted-foreground rounded-full px-4 border-border/60"
                  onClick={() => {
                    const shareUrl = window.location.href;
                    const shareText = `${post.title}\n\n${shareUrl}`;
                    if (navigator.share) {
                      navigator.share({
                        text: shareText,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }).catch(() => {});
                    }
                  }}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              </div>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block space-y-4">
            {/* Author Card */}
            <Card className="border border-border/60 sticky top-20 overflow-hidden">
              <CardContent className="p-0">
                {/* Author banner */}
                <div className="h-16 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900" />
                <div className="px-4 -mt-7">
                  <Avatar className="h-14 w-14 border-[3px] border-background shadow-sm">
                    <AvatarImage src={post.user.profilePhoto || undefined} alt={post.user.name} />
                    <AvatarFallback className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {getInitials(post.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="px-4 pt-2 pb-4">
                  <Link href={`/user/${post.user.id}`} className="hover:underline">
                    <p className="text-[14px] font-semibold truncate">{post.user.name}</p>
                  </Link>
                  {post.user.credibilityScore && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold px-1.5 py-0 h-[18px] ${getCredibilityStyle(post.user.credibilityScore.level)}`}
                      >
                        {post.user.credibilityScore.level}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground/60">
                        {post.user.credibilityScore.score} pts
                      </span>
                    </div>
                  )}

                  <Button
                    asChild
                    size="sm"
                    className="w-full h-8 text-[12px] mt-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    <Link href={`/user/${post.user.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Profile
                    </Link>
                  </Button>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 border-t border-border/40">
                  <div className="text-center py-3 border-r border-border/40">
                    <p className="text-sm font-bold text-foreground">{helpfulCount}</p>
                    <p className="text-[10px] text-muted-foreground">Helpful</p>
                  </div>
                  <div className="text-center py-3 border-r border-border/40">
                    <p className="text-sm font-bold text-foreground">{timeAgo(post.createdAt)}</p>
                    <p className="text-[10px] text-muted-foreground">Posted</p>
                  </div>
                  <div className="text-center py-3">
                    <p className="text-sm font-bold text-foreground">{post.user.credibilityScore?.level?.charAt(0) || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">Level</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Info */}
            {hasMeta && (
              <Card className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">Post Info</p>
                  <div className="space-y-2.5">
                    {post.companyName && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground/60">Company</p>
                          <p className="text-[12px] font-medium truncate">{post.companyName}</p>
                        </div>
                      </div>
                    )}
                    {post.location && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground/60">Location</p>
                          <p className="text-[12px] font-medium truncate">{post.location}</p>
                        </div>
                      </div>
                    )}
                    {post.source && (
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <ExternalLinkIcon className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground/60">Source</p>
                          <p className="text-[12px] font-medium truncate">{post.source}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="border border-border/60">
              <CardContent className="p-4 space-y-2">
                <Button
                  asChild
                  size="sm"
                  className="w-full h-9 text-[12px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  <Link href="/community/create">
                    <MessageSquarePlus className="h-3.5 w-3.5 mr-1.5" />
                    Share to Community
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-[12px] border-border/60"
                  onClick={() => {
                    const shareText = `${post.title}\n\n${window.location.href}`;
                    if (navigator.share) {
                      navigator.share({ text: shareText }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }).catch(() => {});
                    }
                  }}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  {copied ? 'Copied!' : 'Share Post'}
                </Button>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild variant="ghost" size="sm" className="h-8 text-[11px] text-muted-foreground">
                    <Link href="/jobs">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Jobs
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="h-8 text-[11px] text-muted-foreground">
                    <Link href="/community">
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Feed
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="border border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-[11px] font-semibold text-muted-foreground/70">Community Guidelines</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: '✓', text: 'Be respectful and constructive' },
                    { icon: '✓', text: 'Share verified information only' },
                    { icon: '✗', text: 'No spam or self-promotion' },
                    { icon: '!', text: 'Report misleading content' },
                  ].map((rule, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-bold mt-0.5 flex-shrink-0 ${
                        rule.icon === '✗' ? 'text-red-400' : rule.icon === '!' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {rule.icon}
                      </span>
                      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">{rule.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border/60 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 shadow-2xl">
            <div className="p-5 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Delete Post</h3>
                    <p className="text-[11px] text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-muted-foreground mb-3">
                Are you sure you want to delete &quot;{post.title}&quot;?
              </p>
              <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <p className="text-[12px] text-destructive">
                  All data associated with this post will be permanently removed.
                </p>
              </div>
            </div>
            <div className="p-5 pt-0 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-[13px]"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-9 text-[13px]"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
