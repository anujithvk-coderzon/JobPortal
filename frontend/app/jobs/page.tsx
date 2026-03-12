'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobCardSkeletonList } from '@/components/JobCardSkeleton';
import { JobMatchScore } from '@/components/JobMatchScore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { jobAPI } from '@/lib/api';
import { Job } from '@/lib/types';
import { formatSalary, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  JOB_SORT_OPTIONS,
  getEmploymentTypeLabel,
  getExperienceLevelLabel,
  getLocationTypeLabel,
} from '@/lib/constants';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Filter,
  Loader2,
  ChevronRight,
  XCircle,
  TrendingUp,
  Share2,
} from 'lucide-react';

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();

  const [jobs, setJobs] = useState<Job[]>([]);
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
    employmentType: searchParams.get('employmentType') || 'ALL',
    experienceLevel: searchParams.get('experienceLevel') || 'ALL',
    locationType: searchParams.get('locationType') || 'ALL',
    sortBy: 'recent',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Fetch jobs on initial load
  useEffect(() => {
    fetchJobs();
  }, []); // Only run once on mount

  // Debounced search effect
  useEffect(() => {
    if (filters.search === searchParams.get('search') || '') {
      return; // Skip if search hasn't changed from URL params
    }

    const debounceTimer = setTimeout(() => {
      setJobs([]); // Clear existing jobs when search changes
      if (pagination.page === 1) {
        fetchJobs();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [filters.search]);

  const fetchJobs = async (customFilters?: any, customPage?: number) => {
    setLoading(true);
    try {
      const currentFilters = customFilters || filters;
      const currentPage = customPage !== undefined ? customPage : pagination.page;
      const params: any = {
        page: currentPage,
        limit: pagination.limit,
        sortBy: currentFilters.sortBy,
      };

      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.location) params.location = currentFilters.location;
      if (currentFilters.employmentType && currentFilters.employmentType !== 'ALL') params.employmentType = currentFilters.employmentType;
      if (currentFilters.experienceLevel && currentFilters.experienceLevel !== 'ALL') params.experienceLevel = currentFilters.experienceLevel;
      if (currentFilters.locationType && currentFilters.locationType !== 'ALL') params.locationType = currentFilters.locationType;

      const response = await jobAPI.getAllJobs(params);
      setJobs(response.data.data.jobs);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load jobs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pagination.page === 1) {
      fetchJobs();
    } else {
      setPagination({ ...pagination, page: 1 });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    setJobs([]); // Clear existing jobs when applying new filters
    setPagination({ ...pagination, page: 1 });
    await fetchJobs();
    setIsFiltering(false);
  };

  const clearFilters = async () => {
    const clearedFilters = {
      search: '',
      location: '',
      employmentType: 'ALL',
      experienceLevel: 'ALL',
      locationType: 'ALL',
      sortBy: 'recent',
    };
    setFilters(clearedFilters);
    setJobs([]); // Clear existing jobs when clearing filters
    setPagination({ ...pagination, page: 1 });
    setIsFiltering(true);
    await fetchJobs(clearedFilters, 1);
    setIsFiltering(false);
  };

  const loadMoreJobs = async () => {
    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const params: any = {
        page: nextPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
      };

      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;
      if (filters.employmentType && filters.employmentType !== 'ALL') params.employmentType = filters.employmentType;
      if (filters.experienceLevel && filters.experienceLevel !== 'ALL') params.experienceLevel = filters.experienceLevel;
      if (filters.locationType && filters.locationType !== 'ALL') params.locationType = filters.locationType;

      const response = await jobAPI.getAllJobs(params);
      setJobs([...jobs, ...response.data.data.jobs]); // Append new jobs
      setPagination(response.data.data.pagination); // Update pagination with response data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load more jobs.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Jobs</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Browse {pagination.total} available opportunities
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, company, or keyword..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9 h-9 text-[13px]"
                />
              </div>
              <Button type="submit" size="sm" className="h-9 px-4">
                <Search className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-[13px]">Search</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Quick Filter Chips + More Filters Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <Badge
            variant={filters.locationType === 'REMOTE' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-accent/50 transition-colors text-[11px] h-6 px-2 rounded-md"
            onClick={() => {
              const newValue = filters.locationType === 'REMOTE' ? 'ALL' : 'REMOTE';
              const newFilters = { ...filters, locationType: newValue };
              setFilters(newFilters);
              setPagination({ ...pagination, page: 1 });
              fetchJobs(newFilters, 1);
            }}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Remote
          </Badge>
          <Badge
            variant={filters.employmentType === 'FULL_TIME' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-accent/50 transition-colors text-[11px] h-6 px-2 rounded-md"
            onClick={() => {
              const newValue = filters.employmentType === 'FULL_TIME' ? 'ALL' : 'FULL_TIME';
              const newFilters = { ...filters, employmentType: newValue };
              setFilters(newFilters);
              setPagination({ ...pagination, page: 1 });
              fetchJobs(newFilters, 1);
            }}
          >
            <Briefcase className="h-3 w-3 mr-1" />
            Full-time
          </Badge>
          <Badge
            variant={filters.experienceLevel === 'ENTRY' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-accent/50 transition-colors text-[11px] h-6 px-2 rounded-md"
            onClick={() => {
              const newValue = filters.experienceLevel === 'ENTRY' ? 'ALL' : 'ENTRY';
              const newFilters = { ...filters, experienceLevel: newValue };
              setFilters(newFilters);
              setPagination({ ...pagination, page: 1 });
              fetchJobs(newFilters, 1);
            }}
          >
            Entry Level
          </Badge>
          <Badge
            variant={filters.experienceLevel === 'SENIOR' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-accent/50 transition-colors text-[11px] h-6 px-2 rounded-md"
            onClick={() => {
              const newValue = filters.experienceLevel === 'SENIOR' ? 'ALL' : 'SENIOR';
              const newFilters = { ...filters, experienceLevel: newValue };
              setFilters(newFilters);
              setPagination({ ...pagination, page: 1 });
              fetchJobs(newFilters, 1);
            }}
          >
            Senior Level
          </Badge>
          {isAuthenticated && (
            <Badge
              variant={filters.sortBy === 'match' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent/50 transition-colors text-[11px] h-6 px-2 rounded-md"
              onClick={() => {
                const newValue = filters.sortBy === 'match' ? 'recent' : 'match';
                const newFilters = { ...filters, sortBy: newValue };
                setFilters(newFilters);
                setPagination({ ...pagination, page: 1 });
                fetchJobs(newFilters, 1);
              }}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Best Match
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-auto h-6 text-[11px] px-2"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="border bg-card rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Employment Type</label>
                <Select
                  value={filters.employmentType}
                  onValueChange={(value) => handleFilterChange('employmentType', value)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Any</SelectItem>
                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Experience Level</label>
                <Select
                  value={filters.experienceLevel}
                  onValueChange={(value) => handleFilterChange('experienceLevel', value)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Any</SelectItem>
                    {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Location Type</label>
                <Select
                  value={filters.locationType}
                  onValueChange={(value) => handleFilterChange('locationType', value)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Any</SelectItem>
                    {LOCATION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Sort By</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button size="sm" onClick={applyFilters} disabled={isFiltering} className="h-7 text-[12px]">
                {isFiltering && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                Apply Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters} disabled={isFiltering} className="h-7 text-[12px]">
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Job Listings */}
        {loading ? (
          <JobCardSkeletonList count={5} />
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 mb-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No jobs found</h3>
            <p className="text-[12px] text-muted-foreground mb-4">
              Try adjusting your search or filters to find more opportunities.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-[12px]">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-snug mb-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">{job.company?.name || job.companyName || 'Company'}</span>
                        </span>
                        {job.location && (
                          <>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span>{job.location}</span>
                            </span>
                          </>
                        )}
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{timeAgo(job.createdAt)}</span>
                        </span>
                        {job._count && (
                          <>
                            <span className="text-border">|</span>
                            <span>{job._count?.applications || 0} applicants</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <Badge variant="secondary" className="text-[11px] h-5 font-normal">{getEmploymentTypeLabel(job.employmentType)}</Badge>
                        <Badge variant="secondary" className="text-[11px] h-5 font-normal">{getExperienceLevelLabel(job.experienceLevel)}</Badge>
                        <Badge variant="secondary" className="text-[11px] h-5 font-normal">{getLocationTypeLabel(job.locationType)}</Badge>
                        {job.salaryMin && job.showSalary !== false && (
                          <Badge variant="outline" className="text-[11px] h-5 font-normal">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                          </Badge>
                        )}
                        {isAuthenticated && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <JobMatchScore jobId={job.id} variant="badge" />
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/jobs/${job.id}`);
                        }}
                      >
                        View
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[12px] text-muted-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          const shareText = `${job.title} at ${job.company?.name || job.companyName || 'Company'}\n\n${window.location.origin}/jobs/${job.id}`;
                          if (navigator.share) {
                            navigator.share({ text: shareText }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(shareText).then(() => {
                              toast({ title: 'Link copied', description: 'Job link copied to clipboard' });
                            }).catch(() => {});
                          }
                        }}
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {pagination.page < pagination.totalPages && (
              <div className="flex flex-col items-center gap-2 mt-6">
                <p className="text-[11px] text-muted-foreground">
                  Showing {jobs.length} of {pagination.total} jobs
                </p>
                <Button
                  onClick={loadMoreJobs}
                  disabled={loadingMore}
                  variant="outline"
                  size="sm"
                  className="text-[12px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <ChevronRight className="h-3 w-3 ml-1" />
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

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  );
}
