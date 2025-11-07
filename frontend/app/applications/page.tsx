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
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface Application {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
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

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchApplications();
    fetchSavedJobs();
  }, [isAuthenticated, isHydrated, router]);

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const response = await applicationAPI.getMyApplications({
        page: applicationsPagination.page,
        limit: applicationsPagination.limit,
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
    } finally {
      setLoadingApplications(false);
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
            {loadingApplications ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start applying to jobs to see them here
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
                  {applications.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/jobs/${application.job.id}`)}
                    >
                      <CardHeader>
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
                      Showing {applications.length} of {applicationsPagination.total} applications
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
                <CardContent className="py-20 text-center">
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
                      <CardHeader>
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
