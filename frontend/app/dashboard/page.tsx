'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { jobAPI, jobNewsAPI } from '@/lib/api';
import { getEmploymentTypeLabel, getLocationTypeLabel } from '@/lib/constants';
import { EmploymentType, LocationType } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import {
  Briefcase,
  Loader2,
  Building2,
  Users,
  ChevronRight,
  Sparkles,
  X,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  ThumbsUp,
  Newspaper,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Job {
  id: string;
  title: string;
  employmentType: EmploymentType;
  locationType: LocationType;
  location?: string;
  isActive: boolean;
  createdAt: string;
  applicationDeadline?: string;
  _count?: {
    applications: number;
  };
  company?: {
    name: string;
  };
  companyName?: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  createdAt: string;
  helpfulCount?: number;
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [showWelcome, setShowWelcome] = useState(searchParams.get('welcome') === 'true');
  const [loading, setLoading] = useState(true);

  // Helper function to check if job deadline has passed
  const isJobExpired = (job: Job) => {
    if (!job.applicationDeadline) return false;
    return new Date(job.applicationDeadline) < new Date();
  };

  // Job Posts State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsSearch, setJobsSearch] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingMoreJobs, setLoadingMoreJobs] = useState(false);

  // Community Posts State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsSearch, setPostsSearch] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchInitialData();
  }, [isAuthenticated, isHydrated, router]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(1, ''), fetchPosts(1, '')]);
    setLoading(false);
  };

  const fetchJobs = async (page: number, search: string) => {
    try {
      setLoadingJobs(true);
      const response = await jobAPI.getMyJobs({ page, limit: 5, search });

      if (page === 1) {
        setJobs(response.data.data.jobs);
      } else {
        setJobs(prev => [...prev, ...response.data.data.jobs]);
      }

      setJobsPage(page);
      setJobsTotal(response.data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your job posts',
        variant: 'destructive',
      });
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchPosts = async (page: number, search: string) => {
    try {
      setLoadingPosts(true);
      const response = await jobNewsAPI.getMyJobNews({ page, limit: 5, search });

      if (page === 1) {
        setPosts(response.data.data.jobNews);
      } else {
        setPosts(prev => [...prev, ...response.data.data.jobNews]);
      }

      setPostsPage(page);
      setPostsTotal(response.data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your community posts',
        variant: 'destructive',
      });
    } finally {
      setLoadingPosts(false);
    }
  };

  // Debounced search for jobs
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs(1, jobsSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [jobsSearch]);

  // Debounced search for posts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPosts(1, postsSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [postsSearch]);

  const loadMoreJobs = () => {
    setLoadingMoreJobs(true);
    fetchJobs(jobsPage + 1, jobsSearch).finally(() => setLoadingMoreJobs(false));
  };

  const loadMorePosts = () => {
    setLoadingMorePosts(true);
    fetchPosts(postsPage + 1, postsSearch).finally(() => setLoadingMorePosts(false));
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await jobAPI.deleteJob(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
      setJobsTotal(jobsTotal - 1);
      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await jobNewsAPI.deleteJobNews(postId);
      setPosts(posts.filter(p => p.id !== postId));
      setPostsTotal(postsTotal - 1);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasMoreJobs = jobs.length < jobsTotal;
  const hasMorePosts = posts.length < postsTotal;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Content</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage your job posts and community contributions
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild variant="outline">
              <Link href="/community/create">
                <Newspaper className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
            <Button asChild>
              <Link href="/jobs/post">
                <PlusCircle className="mr-2 h-4 w-4" />
                Post Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcome && (
          <Card className="mb-6 md:mb-8 border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-background">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Welcome to Job Portal! 🎉</CardTitle>
                    <CardDescription className="mt-1">
                      Start sharing job opportunities and insights with the community
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mt-1 -mr-2"
                  onClick={() => setShowWelcome(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button asChild variant="outline" className="justify-start h-auto py-3 px-4">
                  <Link href="/profile">
                    <div className="flex items-start gap-3 text-left">
                      <Users className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold text-sm">Update Your Profile</div>
                        <div className="text-xs text-muted-foreground">Keep your info current</div>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-auto py-3 px-4">
                  <Link href="/jobs">
                    <div className="flex items-start gap-3 text-left">
                      <Briefcase className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold text-sm">Browse Jobs</div>
                        <div className="text-xs text-muted-foreground">Find opportunities</div>
                      </div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-auto py-3 px-4">
                  <Link href="/community">
                    <div className="flex items-start gap-3 text-left">
                      <Users className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                      <div>
                        <div className="font-semibold text-sm">Join Community</div>
                        <div className="text-xs text-muted-foreground">Connect with others</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Job Posts */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  My Job Posts
                </CardTitle>
                <CardDescription>{jobsTotal} total job{jobsTotal !== 1 ? 's' : ''} posted</CardDescription>
              </div>
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={jobsSearch}
                  onChange={(e) => setJobsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingJobs && jobs.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col md:flex-row md:items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-semibold text-base truncate">{job.title}</h3>
                          {isJobExpired(job) ? (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant={job.isActive ? 'default' : 'secondary'} className="text-xs">
                              {job.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {job.company?.name || job.companyName || 'Company'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {getEmploymentTypeLabel(job.employmentType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getLocationTypeLabel(job.locationType)}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job._count?.applications || 0} applicant{job._count?.applications !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(job.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/jobs/${job.id}/edit`)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreJobs && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={loadMoreJobs}
                      disabled={loadingMoreJobs}
                      variant="outline"
                      size="sm"
                    >
                      {loadingMoreJobs ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-2">No job posts yet</p>
                <p className="text-sm mb-4">Start sharing job opportunities with the community</p>
                <Button asChild>
                  <Link href="/jobs/post">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post Your First Job
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Community Posts */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  My Community Posts
                </CardTitle>
                <CardDescription>{postsTotal} total post{postsTotal !== 1 ? 's' : ''} shared</CardDescription>
              </div>
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={postsSearch}
                  onChange={(e) => setPostsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPosts && posts.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-col md:flex-row md:items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {post.companyName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {post.companyName}
                            </span>
                          )}
                          {post.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {post.location}
                            </span>
                          )}
                          {(post.helpfulCount ?? 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {post.helpfulCount} helpful
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/community/${post.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/community/${post.id}/edit`)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMorePosts && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={loadMorePosts}
                      disabled={loadingMorePosts}
                      variant="outline"
                      size="sm"
                    >
                      {loadingMorePosts ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="mb-2">No community posts yet</p>
                <p className="text-sm mb-4">Share insights, tips, or job leads with the community</p>
                <Button asChild>
                  <Link href="/community/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Post
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="flex items-center justify-center min-h-screen">Loading...</div></div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
