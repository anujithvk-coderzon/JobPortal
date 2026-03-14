'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useSWRConfig } from 'swr';
import {
  Briefcase,
  FileText,
  Clock,
  Building2,
  MapPin,
  Loader2,
  ExternalLink,
  Bookmark,
  Trash2,
  Users,
  Calendar,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { applicationAPI, jobAPI } from '@/lib/api';
import { getApplicationStatusLabel, getEmploymentTypeLabel, getLocationTypeLabel } from '@/lib/constants';
import { ApplicationStatus, EmploymentType, LocationType } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { useMyApplications } from '@/hooks/use-applications';
import { useSavedJobs } from '@/hooks/use-jobs';
import { useAuthStore } from '@/store/authStore';

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

const ApplicationsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  const [activeTab, setActiveTab] = useState('applications');
  const [statusFilter, setStatusFilter] = useState<'active' | 'HIRED' | 'REJECTED'>('active');

  // SWR hooks for applications and saved jobs
  const { data: applicationsData, isLoading: loadingApplications } = useMyApplications({
    page: 1,
    limit: 10,
    status: statusFilter,
  });
  const { data: savedJobsData, isLoading: loadingSavedJobs } = useSavedJobs({
    page: 1,
    limit: 10,
  });

  const applications: Application[] = applicationsData?.applications || [];
  const applicationsPagination = applicationsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };
  const savedJobs: SavedJob[] = savedJobsData?.savedJobs || [];
  const savedPagination = savedJobsData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Extra items loaded via infinite scroll
  const [extraApplications, setExtraApplications] = useState<Application[]>([]);
  const [loadingMoreApplications, setLoadingMoreApplications] = useState(false);
  const [appsPage, setAppsPage] = useState(1);

  const [extraSavedJobs, setExtraSavedJobs] = useState<SavedJob[]>([]);
  const [loadingMoreSaved, setLoadingMoreSaved] = useState(false);
  const [savedPage, setSavedPage] = useState(1);

  // Reset extra items when SWR data changes
  useEffect(() => {
    setExtraApplications([]);
    setAppsPage(1);
  }, [applicationsData]);

  useEffect(() => {
    setExtraSavedJobs([]);
    setSavedPage(1);
  }, [savedJobsData]);

  const allApplications = [...applications, ...extraApplications];
  const allSavedJobs = [...savedJobs, ...extraSavedJobs];

  // Initial load effect - only for auth redirect and tab param
  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to access this page.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    // Check for URL parameter to set initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'saved') {
      setActiveTab('saved');
    }
  }, [isAuthenticated, isHydrated, router]);

  const currentAppsPage = appsPage || applicationsPagination.page || 1;
  const currentSavedPage = savedPage || savedPagination.page || 1;

  const loadingAppsRef = useRef(false);
  const appsObserver = useRef<IntersectionObserver | null>(null);

  const lastAppRef = useCallback(
    (node: HTMLElement | null) => {
      if (appsObserver.current) appsObserver.current.disconnect();
      if (!node || loadingMoreApplications || currentAppsPage >= applicationsPagination.totalPages) return;

      appsObserver.current = new IntersectionObserver(
        async (entries) => {
          if (!entries[0].isIntersecting || loadingAppsRef.current) return;
          loadingAppsRef.current = true;
          setLoadingMoreApplications(true);
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const nextPage = currentAppsPage + 1;
            const response = await applicationAPI.getMyApplications({
              page: nextPage, limit: applicationsPagination.limit || 10, status: statusFilter,
            });
            if (response.data.success) {
              const newApps = response.data.data.applications || [];
              setExtraApplications((prev) => {
                const existingIds = new Set([...applications, ...prev].map((a) => a.id));
                const unique = newApps.filter((a: any) => !existingIds.has(a.id));
                return [...prev, ...unique];
              });
              setAppsPage(nextPage);
            }
          } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load more applications.', variant: 'destructive' });
          }
          setLoadingMoreApplications(false);
          loadingAppsRef.current = false;
        },
        { threshold: 0.1 }
      );
      appsObserver.current.observe(node);
    },
    [loadingMoreApplications, currentAppsPage, applicationsPagination, statusFilter, applications]
  );

  const loadingSavedRef = useRef(false);
  const savedObserver = useRef<IntersectionObserver | null>(null);

  const lastSavedRef = useCallback(
    (node: HTMLElement | null) => {
      if (savedObserver.current) savedObserver.current.disconnect();
      if (!node || loadingMoreSaved || currentSavedPage >= savedPagination.totalPages) return;

      savedObserver.current = new IntersectionObserver(
        async (entries) => {
          if (!entries[0].isIntersecting || loadingSavedRef.current) return;
          loadingSavedRef.current = true;
          setLoadingMoreSaved(true);
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const nextPage = currentSavedPage + 1;
            const response = await jobAPI.getSavedJobs({
              page: nextPage, limit: savedPagination.limit || 10,
            });
            if (response.data.success) {
              const newSaved = response.data.data.savedJobs || [];
              setExtraSavedJobs((prev) => {
                const existingIds = new Set([...savedJobs, ...prev].map((s) => s.id));
                const unique = newSaved.filter((s: any) => !existingIds.has(s.id));
                return [...prev, ...unique];
              });
              setSavedPage(nextPage);
            }
          } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to load more saved jobs.', variant: 'destructive' });
          }
          setLoadingMoreSaved(false);
          loadingSavedRef.current = false;
        },
        { threshold: 0.1 }
      );
      savedObserver.current.observe(node);
    },
    [loadingMoreSaved, currentSavedPage, savedPagination, savedJobs]
  );

  const handleUnsaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await jobAPI.unsaveJob(jobId);
      // Invalidate saved jobs cache
      globalMutate((key: unknown) => typeof key === 'string' && key.startsWith('/jobs/saved'), undefined, { revalidate: true });
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

  // SWR hooks for status counts
  const { data: activeCountData } = useMyApplications({ page: 1, limit: 1, status: 'active' });
  const { data: hiredCountData } = useMyApplications({ page: 1, limit: 1, status: 'HIRED' });
  const { data: rejectedCountData } = useMyApplications({ page: 1, limit: 1, status: 'REJECTED' });

  const statusCounts = {
    active: activeCountData?.pagination?.total || 0,
    hired: hiredCountData?.pagination?.total || 0,
    rejected: rejectedCountData?.pagination?.total || 0,
  };

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user || (loadingApplications && loadingSavedJobs && allApplications.length === 0 && allSavedJobs.length === 0)) {
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
            ) : allApplications.length === 0 ? (
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
                  {allApplications.map((application, index) => (
                    <Card
                      key={application.id}
                      ref={index === allApplications.length - 1 ? lastAppRef : null}
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

                {loadingMoreApplications && (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Loading</span>
                  </div>
                )}

                {currentAppsPage >= applicationsPagination.totalPages && allApplications.length > 0 && !loadingMoreApplications && (
                  <p className="text-center text-[11px] text-muted-foreground py-4 border-t border-border/60 mt-4">
                    All {applicationsPagination.total} applications loaded
                  </p>
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
            ) : allSavedJobs.length === 0 ? (
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
                  {allSavedJobs.map((savedJob, index) => (
                    <Card
                      key={savedJob.id}
                      ref={index === allSavedJobs.length - 1 ? lastSavedRef : null}
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

                {loadingMoreSaved && (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Loading</span>
                  </div>
                )}

                {currentSavedPage >= savedPagination.totalPages && allSavedJobs.length > 0 && !loadingMoreSaved && (
                  <p className="text-center text-[11px] text-muted-foreground py-4 border-t border-border/60 mt-4">
                    All {savedPagination.total} saved jobs loaded
                  </p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationsPage;
