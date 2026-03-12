'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { applicationAPI, jobAPI } from '@/lib/api';
import { getApplicationStatusLabel, getEmploymentTypeLabel, getLocationTypeLabel } from '@/lib/constants';
import { ApplicationStatus, EmploymentType, LocationType } from '@/lib/types';
import {
  Briefcase,
  FileText,
  Clock,
  Building2,
  MapPin,
  Loader2,
  ChevronRight,
  ExternalLink,
  Bookmark,
  Trash2,
  Users,
  Calendar,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Application {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  interviewDate?: string;
  interviewLink?: string;
  interviewNotes?: string;
  job: {
    id: string;
    title: string;
    location?: string;
    company?: {
      name: string;
      logo?: string;
    };
    companyName?: string;
  };
}

interface SavedJob {
  id: string;
  savedAt: string;
  job: {
    id: string;
    title: string;
    location?: string;
    employmentType: EmploymentType;
    locationType: LocationType;
    isActive: boolean;
    createdAt: string;
    applicationDeadline?: string;
    company?: {
      name: string;
      logo?: string;
    };
    companyName?: string;
    _count?: {
      applications: number;
    };
  };
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('applications');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'active' | 'HIRED' | 'REJECTED'>('active');

  // Applications State
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [loadingMoreApplications, setLoadingMoreApplications] = useState(false);
  const [applicationsPagination, setApplicationsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false);
  const [savedPagination, setSavedPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Initial load effect
  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isInitialLoad) {
      // Check for URL parameter to set initial tab
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'saved') {
        setActiveTab('saved');
      }

      // Initial fetch with loading state
      setLoadingApplications(true);
      fetchApplications(true).finally(() => setLoadingApplications(false));
      fetchSavedJobs();
      setIsInitialLoad(false);
    }
  }, [isAuthenticated, isHydrated, router, isInitialLoad]);

  // Fetch applications when status filter changes (no loading state to avoid flicker)
  useEffect(() => {
    if (!isHydrated || !isAuthenticated || isInitialLoad) return;

    fetchApplications(true);
  }, [statusFilter]);

  const fetchApplications = async (resetPage = false) => {
    try {
      const response = await applicationAPI.getMyApplications({
        page: resetPage ? 1 : applicationsPagination.page,
        limit: applicationsPagination.limit,
        status: statusFilter,
      });

      if (response.data.success) {
        setApplications(response.data.data.applications || []);
        setApplicationsPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 404) {
        console.error('Error fetching applications:', error);
      }
      setApplications([]);
    }
  };

  const fetchSavedJobs = async () => {
    setLoadingSavedJobs(true);
    try {
      const response = await jobAPI.getSavedJobs({
        page: savedPagination.page,
        limit: savedPagination.limit,
      });

      if (response.data.success) {
        setSavedJobs(response.data.data.savedJobs || []);
        setSavedPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 404) {
        console.error('Error fetching saved jobs:', error);
      }
      setSavedJobs([]);
    } finally {
      setLoadingSavedJobs(false);
    }
  };

  const loadMoreApplications = async () => {
    setLoadingMoreApplications(true);
    try {
      const nextPage = applicationsPagination.page + 1;
      const response = await applicationAPI.getMyApplications({
        page: nextPage,
        limit: applicationsPagination.limit,
        status: statusFilter,
      });

      if (response.data.success) {
        const newApplications = response.data.data.applications || [];
        setApplications([...applications, ...newApplications]);
        setApplicationsPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Error loading more applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more applications.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMoreApplications(false);
    }
  };

  const loadMoreSavedJobs = async () => {
    setLoadingMoreSaved(true);
    try {
      const nextPage = savedPagination.page + 1;
      const response = await jobAPI.getSavedJobs({
        page: nextPage,
        limit: savedPagination.limit,
      });

      if (response.data.success) {
        const newSavedJobs = response.data.data.savedJobs || [];
        setSavedJobs([...savedJobs, ...newSavedJobs]);
        setSavedPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Error loading more saved jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more saved jobs.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMoreSaved(false);
    }
  };

  const handleUnsaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await jobAPI.unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(sj => sj.job.id !== jobId));
      setSavedPagination({
        ...savedPagination,
        total: savedPagination.total - 1,
      });
      toast({
        title: 'Success',
        description: 'Job removed from saved list',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to unsave job',
        variant: 'destructive',
      });
    }
  };

  const getStatusVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'HIRED':
        return 'success' as const;
      case 'REJECTED':
        return 'destructive' as const;
      case 'SHORTLISTED':
      case 'INTERVIEW_SCHEDULED':
        return 'warning' as const;
      default:
        return 'secondary' as const;
    }
  };

  const isJobExpired = (job: SavedJob['job']) => {
    if (!job.applicationDeadline) return false;
    return new Date(job.applicationDeadline) < new Date();
  };

  // Get counts from backend stats (will be fetched separately)
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    hired: 0,
    rejected: 0,
  });

  // Fetch all counts for filter buttons
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isAuthenticated || isInitialLoad) return;

      try {
        // Fetch counts for all statuses in parallel
        const [activeRes, hiredRes, rejectedRes] = await Promise.all([
          applicationAPI.getMyApplications({ page: 1, limit: 1, status: 'active' }),
          applicationAPI.getMyApplications({ page: 1, limit: 1, status: 'HIRED' }),
          applicationAPI.getMyApplications({ page: 1, limit: 1, status: 'REJECTED' }),
        ]);

        setStatusCounts({
          active: activeRes.data.data.pagination.total || 0,
          hired: hiredRes.data.data.pagination.total || 0,
          rejected: rejectedRes.data.data.pagination.total || 0,
        });
      } catch (error) {
        console.error('Error fetching status counts:', error);
      }
    };

    fetchCounts();
  }, [isAuthenticated, isInitialLoad, statusFilter]); // Refetch when filter changes

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user || (loadingApplications && loadingSavedJobs)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold">Applications & Saved Jobs</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Track your job applications and manage saved jobs
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2 mb-5">
            <TabsTrigger value="applications" className="text-[13px]">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Applications ({applicationsPagination.total})
            </TabsTrigger>
            <TabsTrigger value="saved" className="text-[13px]">
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Saved ({savedPagination.total})
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            {/* Status Filter */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className="text-[13px] h-8"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Active ({statusCounts.active})
              </Button>
              <Button
                variant={statusFilter === 'HIRED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('HIRED')}
                className="text-[13px] h-8"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Hired ({statusCounts.hired})
              </Button>
              <Button
                variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REJECTED')}
                className={`text-[13px] h-8 ${statusFilter === 'REJECTED' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Rejected ({statusCounts.rejected})
              </Button>
            </div>

            {loadingApplications ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : applications.length === 0 ? (
              <Card className="rounded-lg border bg-card">
                <CardContent className="py-12 text-center">
                  {statusFilter === 'active' ? (
                    <>
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/8 mx-auto mb-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">No active applications</h3>
                      <p className="text-[12px] text-muted-foreground mb-4">
                        You don't have any pending or scheduled interviews right now.
                      </p>
                      <Button size="sm" asChild>
                        <a href="/jobs">
                          <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                          Browse Jobs
                        </a>
                      </Button>
                    </>
                  ) : statusFilter === 'HIRED' ? (
                    <>
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/8 mx-auto mb-3">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">No job offers yet</h3>
                      <p className="text-[12px] text-muted-foreground mb-4">
                        You haven't been hired for any positions yet. Keep applying!
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => setStatusFilter('active')}>
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          View Active
                        </Button>
                        <Button size="sm" asChild>
                          <a href="/jobs">
                            <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                            Browse Jobs
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/8 mx-auto mb-3">
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">No rejections</h3>
                      <p className="text-[12px] text-muted-foreground mb-4">
                        You don't have any rejected applications.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setStatusFilter('active')}>
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        View Active
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {applications.map((application) => (
                    <Card
                      key={application.id}
                      className="rounded-lg border bg-card cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => router.push(`/jobs/${application.job.id}`)}
                    >
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] font-medium mb-1.5 truncate">
                              {application.job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {application.job.company?.name || application.job.companyName || 'Company'}
                              </span>
                              {application.job.location && (
                                <>
                                  <span className="text-muted-foreground/40">|</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {application.job.location}
                                  </span>
                                </>
                              )}
                            </div>
                            <Badge variant={getStatusVariant(application.status)} className="text-[11px]">
                              {getApplicationStatusLabel(application.status)}
                            </Badge>

                            {/* Interview Details */}
                            {application.status === 'INTERVIEW_SCHEDULED' && application.interviewDate && (
                              <div className="mt-3 p-3 rounded-lg border bg-primary/5 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[13px] font-medium">
                                  <Calendar className="h-3.5 w-3.5 text-primary" />
                                  Interview Scheduled
                                </div>
                                <div className="text-[12px] space-y-1">
                                  <p className="font-medium">
                                    {new Date(application.interviewDate).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {application.interviewLink && (
                                    <a
                                      href={application.interviewLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                      <LinkIcon className="h-3 w-3" />
                                      Join Meeting
                                    </a>
                                  )}
                                  {application.interviewNotes && (
                                    <p className="text-muted-foreground text-[11px] mt-1">
                                      <span className="font-medium">Notes:</span> {application.interviewNotes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 flex-shrink-0">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[12px] h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/jobs/${application.job.id}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Job
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {applicationsPagination.page < applicationsPagination.totalPages && (
                  <div className="flex flex-col items-center gap-2 mt-6">
                    <p className="text-[11px] text-muted-foreground">
                      Showing {applications.length} of {applicationsPagination.total} {statusFilter === 'active' ? 'active' : statusFilter.toLowerCase()} applications
                    </p>
                    <Button
                      onClick={loadMoreApplications}
                      disabled={loadingMoreApplications}
                      variant="outline"
                      size="sm"
                      className="text-[13px]"
                    >
                      {loadingMoreApplications ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            {loadingSavedJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : savedJobs.length === 0 ? (
              <Card className="rounded-lg border bg-card">
                <CardContent className="py-12 text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/8 mx-auto mb-3">
                    <Bookmark className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">No saved jobs yet</h3>
                  <p className="text-[12px] text-muted-foreground mb-4">
                    Save jobs you're interested in to review them later
                  </p>
                  <Button size="sm" asChild>
                    <a href="/jobs">
                      <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                      Browse Jobs
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {savedJobs.map((savedJob) => (
                    <Card
                      key={savedJob.id}
                      className="rounded-lg border bg-card cursor-pointer hover:border-primary/30 transition-colors"
                      onClick={() => router.push(`/jobs/${savedJob.job.id}`)}
                    >
                      <div className="p-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <h3 className="text-[13px] font-medium truncate">
                                {savedJob.job.title}
                              </h3>
                              {isJobExpired(savedJob.job) ? (
                                <Badge variant="destructive" className="text-[11px]">Expired</Badge>
                              ) : (
                                <Badge variant={savedJob.job.isActive ? 'success' : 'secondary'} className="text-[11px]">
                                  {savedJob.job.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate max-w-[120px] sm:max-w-none">{savedJob.job.company?.name || savedJob.job.companyName || 'Company'}</span>
                              </span>
                              {savedJob.job.location && (
                                <>
                                  <span className="text-muted-foreground/40 hidden sm:inline">|</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[100px] sm:max-w-none">{savedJob.job.location}</span>
                                  </span>
                                </>
                              )}
                              <span className="text-muted-foreground/40 hidden sm:inline">|</span>
                              <span className="hidden sm:inline">{getEmploymentTypeLabel(savedJob.job.employmentType)}</span>
                              <span className="text-muted-foreground/40 hidden sm:inline">|</span>
                              <span className="hidden sm:inline">{getLocationTypeLabel(savedJob.job.locationType)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {savedJob.job._count?.applications || 0} applicants
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Saved {timeAgo(savedJob.savedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[12px] h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/jobs/${savedJob.job.id}`);
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => handleUnsaveJob(savedJob.job.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {savedPagination.page < savedPagination.totalPages && (
                  <div className="flex flex-col items-center gap-2 mt-6">
                    <p className="text-[11px] text-muted-foreground">
                      Showing {savedJobs.length} of {savedPagination.total} saved jobs
                    </p>
                    <Button
                      onClick={loadMoreSavedJobs}
                      disabled={loadingMoreSaved}
                      variant="outline"
                      size="sm"
                      className="text-[13px]"
                    >
                      {loadingMoreSaved ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
