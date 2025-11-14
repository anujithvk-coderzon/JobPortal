'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'SHORTLISTED':
      case 'INTERVIEW_SCHEDULED':
        return 'default';
      default:
        return 'secondary';
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

  if (!isHydrated || (loadingApplications && loadingSavedJobs)) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Applications & Saved Jobs</h1>
          <p className="text-muted-foreground">
            Track your job applications and manage saved jobs
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="applications">
              <FileText className="h-4 w-4 mr-2" />
              Applications ({applicationsPagination.total})
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Jobs ({savedPagination.total})
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            {/* Status Filter Buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Active ({statusCounts.active})
              </Button>
              <Button
                variant={statusFilter === 'HIRED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('HIRED')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Hired ({statusCounts.hired})
              </Button>
              <Button
                variant={statusFilter === 'REJECTED' ? 'outline' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('REJECTED')}
                className={`flex items-center gap-2 ${statusFilter === 'REJECTED' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
              >
                <XCircle className="h-4 w-4" />
                Rejected ({statusCounts.rejected})
              </Button>
            </div>

            {loadingApplications ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 py-20 text-center">
                  {statusFilter === 'active' ? (
                    <>
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No active applications</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any pending or scheduled interviews right now.
                      </p>
                      <Button asChild>
                        <a href="/jobs">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Browse Jobs
                        </a>
                      </Button>
                    </>
                  ) : statusFilter === 'HIRED' ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No job offers yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't been hired for any positions yet. Keep applying and stay positive!
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setStatusFilter('active')}>
                          <Clock className="mr-2 h-4 w-4" />
                          View Active Applications
                        </Button>
                        <Button asChild>
                          <a href="/jobs">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Browse Jobs
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No rejections</h3>
                      <p className="text-muted-foreground mb-4">
                        Great news! You don't have any rejected applications.
                      </p>
                      <Button variant="outline" onClick={() => setStatusFilter('active')}>
                        <Clock className="mr-2 h-4 w-4" />
                        View Active Applications
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/jobs/${application.job.id}`)}
                    >
                      <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">
                              {application.job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {application.job.company?.name || application.job.companyName || 'Company'}
                              </span>
                              {application.job.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {application.job.location}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusVariant(application.status)}>
                                {getApplicationStatusLabel(application.status)}
                              </Badge>
                            </div>

                            {/* Interview Details */}
                            {application.status === 'INTERVIEW_SCHEDULED' && application.interviewDate && (
                              <div className="mt-3 p-3 border rounded-lg bg-primary/5 space-y-2">
                                <div className="flex items-center gap-2 font-medium text-sm">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span>Interview Scheduled</span>
                                </div>
                                <div className="text-sm space-y-1">
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
                                    <p className="text-muted-foreground text-xs mt-2">
                                      <strong>Notes:</strong> {application.interviewNotes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/jobs/${application.job.id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Job
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {applicationsPagination.page < applicationsPagination.totalPages && (
                  <div className="flex flex-col items-center justify-center gap-4 mt-8">
                    <p className="text-sm text-muted-foreground">
                      Showing {applications.length} of {applicationsPagination.total} {statusFilter === 'active' ? 'active' : statusFilter.toLowerCase()} applications
                    </p>
                    <Button
                      onClick={loadMoreApplications}
                      disabled={loadingMoreApplications}
                      variant="outline"
                      size="lg"
                      className="w-full md:w-auto"
                    >
                      {loadingMoreApplications ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading more...
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
            )}
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            {loadingSavedJobs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : savedJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 py-20 text-center">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Save jobs you're interested in to review them later
                  </p>
                  <Button asChild>
                    <a href="/jobs">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Browse Jobs
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {savedJobs.map((savedJob) => (
                    <Card
                      key={savedJob.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/jobs/${savedJob.job.id}`)}
                    >
                      <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-xl font-semibold">
                                {savedJob.job.title}
                              </h3>
                              {isJobExpired(savedJob.job) ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : (
                                <Badge variant={savedJob.job.isActive ? 'default' : 'secondary'}>
                                  {savedJob.job.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {savedJob.job.company?.name || savedJob.job.companyName || 'Company'}
                              </span>
                              {savedJob.job.location && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {savedJob.job.location}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>{getEmploymentTypeLabel(savedJob.job.employmentType)}</span>
                              <span>•</span>
                              <span>{getLocationTypeLabel(savedJob.job.locationType)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/jobs/${savedJob.job.id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleUnsaveJob(savedJob.job.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                {savedPagination.page < savedPagination.totalPages && (
                  <div className="flex flex-col items-center justify-center gap-4 mt-8">
                    <p className="text-sm text-muted-foreground">
                      Showing {savedJobs.length} of {savedPagination.total} saved jobs
                    </p>
                    <Button
                      onClick={loadMoreSavedJobs}
                      disabled={loadingMoreSaved}
                      variant="outline"
                      size="lg"
                      className="w-full md:w-auto"
                    >
                      {loadingMoreSaved ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading more...
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
