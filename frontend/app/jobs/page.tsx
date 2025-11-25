'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Search Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Find Your Next Opportunity</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Browse {pagination.total} available job opportunities
          </p>
        </div>

        {/* Professional Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-background rounded-lg shadow-lg border">
              <div className="flex-1 flex items-center gap-2 sm:gap-3 px-2 sm:px-4">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm sm:text-base"
                />
              </div>
              <Button type="submit" size="default" className="px-4 sm:px-6 md:px-8 text-sm sm:text-base h-9 sm:h-10">
                <span className="hidden sm:inline">Search</span>
                <Search className="h-4 w-4 sm:hidden" />
              </Button>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge
              variant={filters.locationType === 'REMOTE' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
              onClick={() => {
                const newValue = filters.locationType === 'REMOTE' ? 'ALL' : 'REMOTE';
                const newFilters = { ...filters, locationType: newValue };
                setFilters(newFilters);
                setPagination({ ...pagination, page: 1 });
                fetchJobs(newFilters, 1);
              }}
            >
              <MapPin className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Remote Only</span>
              <span className="sm:hidden">Remote</span>
            </Badge>
            <Badge
              variant={filters.employmentType === 'FULL_TIME' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
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
              className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
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
              className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
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
                className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
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
              className="ml-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
              <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 pt-4 md:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-medium mb-2 block">Employment Type</label>
                    <Select
                      value={filters.employmentType}
                      onValueChange={(value) => handleFilterChange('employmentType', value)}
                    >
                      <SelectTrigger>
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
                    <label className="text-xs md:text-sm font-medium mb-2 block">Experience Level</label>
                    <Select
                      value={filters.experienceLevel}
                      onValueChange={(value) => handleFilterChange('experienceLevel', value)}
                    >
                      <SelectTrigger>
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
                    <label className="text-xs md:text-sm font-medium mb-2 block">Location Type</label>
                    <Select
                      value={filters.locationType}
                      onValueChange={(value) => handleFilterChange('locationType', value)}
                    >
                      <SelectTrigger>
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
                    <label className="text-xs md:text-sm font-medium mb-2 block">Sort By</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
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

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button onClick={applyFilters} disabled={isFiltering} className="flex-1 sm:flex-none">
                    {isFiltering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={clearFilters} disabled={isFiltering} className="flex-1 sm:flex-none">
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Job Listings */}
        {loading ? (
          <JobCardSkeletonList count={5} />
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 py-20 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find more opportunities
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3 md:space-y-4">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6 space-y-3">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold mb-2 leading-snug">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="font-medium truncate">{job.company?.name || job.companyName || 'Company'}</span>
                        </span>
                        {job.location && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3 items-center">
                        <Badge variant="secondary" className="text-xs">{getEmploymentTypeLabel(job.employmentType)}</Badge>
                        <Badge variant="secondary" className="text-xs">{getExperienceLevelLabel(job.experienceLevel)}</Badge>
                        <Badge variant="secondary" className="text-xs">{getLocationTypeLabel(job.locationType)}</Badge>
                        {job.salaryMin && job.salaryMax && (
                          <Badge variant="outline" className="text-xs">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                          </Badge>
                        )}
                        {isAuthenticated && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <JobMatchScore jobId={job.id} variant="badge" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{timeAgo(job.createdAt)}</span>
                        </span>
                        {job._count && (
                          <span>{job._count?.applications || 0} applicants</span>
                        )}
                      </div>
                      <Button size="sm" className="w-full sm:w-auto" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/jobs/${job.id}`);
                      }}>
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 md:mt-8">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Showing {jobs.length} of {pagination.total} jobs
                </p>
                <Button
                  onClick={loadMoreJobs}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Jobs</span>
                      <ChevronRight className="h-4 w-4 ml-2" />
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
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="flex items-center justify-center min-h-screen">Loading...</div></div>}>
      <JobsPageContent />
    </Suspense>
  );
}
