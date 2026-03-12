'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  Edit,
  Plus,
  Briefcase,
  Clock,
  Trash2,
  ArrowLeft,
  Linkedin,
  Twitter,
  Facebook,
  Eye,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { api, jobAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

interface Company {
  id: string;
  name: string;
  location: string;
  pinCode: string;
  contactEmail: string;
  contactPhone: string;
  logo: string | null;
  website: string | null;
  industry: string | null;
  about: string | null;
  companySize: string | null;
  foundedYear: number | null;
  linkedIn: string | null;
  twitter: string | null;
  facebook: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  employmentType: string;
  locationType: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  showSalary?: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: {
    applications: number;
    pendingApplications: number;
  };
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCompanyDetails();
    fetchCompanyJobs();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.success) {
        setCompany(response.data.company);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const fetchCompanyJobs = async (page: number = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await api.get(`/jobs/company/${companyId}`, {
        params: {
          page,
          limit: pagination.limit,
        },
      });

      if (response.success) {
        const newJobs = response.data.jobs || [];
        const paginationData = response.data.pagination || {};

        if (page === 1) {
          setJobs(newJobs);
        } else {
          setJobs((prev) => [...prev, ...newJobs]);
        }

        setPagination({
          page: paginationData.page || page,
          limit: paginationData.limit || pagination.limit,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = pagination.page + 1;
    fetchCompanyJobs(nextPage);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) return;
    setDeletingJobId(jobId);
    try {
      await jobAPI.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast({ title: 'Job Deleted', description: 'The job has been deleted successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete job',
        variant: 'destructive',
      });
    } finally {
      setDeletingJobId(null);
    }
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null, period?: string | null) => {
    if (!min && !max) return null;
    const raw = period || 'LPA';
    const fmt = raw === 'YEARLY' ? 'LPA' : raw === 'YEARLY_CTC' ? 'CTC' : raw;

    if (fmt === 'LPA') {
      return min ? `₹${min} LPA` : null;
    }
    if (fmt === 'CTC') {
      return min ? `₹${min}L CTC` : null;
    }

    const curr = currency || 'INR';
    const locale = curr === 'INR' ? 'en-IN' : 'en-US';
    const symbol = curr === 'INR' ? '₹' : '$';
    if (min && max) {
      return `${symbol}${min.toLocaleString(locale)} - ${symbol}${max.toLocaleString(locale)} /mo`;
    }
    if (min) return `${symbol}${min.toLocaleString(locale)}+ /mo`;
    if (max) return `Up to ${symbol}${max.toLocaleString(locale)} /mo`;
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.isActive).length;
  const totalApplications = jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);

  if (isLoading && !company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="p-3 rounded-lg bg-primary/8 w-fit mx-auto mb-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-[13px] text-muted-foreground mb-3">Company not found</p>
          <Button onClick={() => router.push('/dashboard')} size="sm">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: company?.name || 'Company' }]} />

        {/* Company Header */}
        <Card className="rounded-lg border bg-card mb-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                {company.logo ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border">
                    <Image src={company.logo} alt={company.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-primary/8 flex items-center justify-center border">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-lg font-semibold mb-1">{company.name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {company.industry && (
                        <Badge variant="default" className="text-[10px]">{company.industry}</Badge>
                      )}
                      <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{company.location}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/company/${company.id}/edit`)}
                    className="flex-shrink-0"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {company.companySize && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      <Users className="h-3 w-3" />
                      <span>{company.companySize}</span>
                    </div>
                  )}
                  {company.foundedYear && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      <Calendar className="h-3 w-3" />
                      <span>Est. {company.foundedYear}</span>
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary bg-primary/8 hover:bg-primary/15 px-2 py-0.5 rounded transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      <span>Website</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="rounded-lg border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/8 rounded-lg">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalJobs}</div>
                  <p className="text-[11px] text-muted-foreground">Total Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/8 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{activeJobs}</div>
                  <p className="text-[11px] text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-primary/8 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalApplications}</div>
                  <p className="text-[11px] text-muted-foreground">Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Sidebar */}
          <div className="space-y-3">
            {/* About */}
            {company.about && (
              <Card className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    About
                  </h3>
                </div>
                <CardContent className="p-4 pt-3">
                  <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {company.about}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card className="rounded-lg border bg-card">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Contact
                </h3>
              </div>
              <CardContent className="p-3 space-y-1">
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted transition-colors group"
                >
                  <div className="p-1.5 bg-primary/8 rounded group-hover:bg-primary/15 transition-colors">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[13px] text-muted-foreground group-hover:text-foreground truncate">
                    {company.contactEmail}
                  </span>
                </a>

                <a
                  href={`tel:${company.contactPhone}`}
                  className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted transition-colors group"
                >
                  <div className="p-1.5 bg-primary/8 rounded group-hover:bg-primary/15 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-[13px] text-muted-foreground group-hover:text-foreground">
                    {company.contactPhone}
                  </span>
                </a>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="p-1.5 bg-primary/8 rounded group-hover:bg-primary/15 transition-colors">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-[13px] text-muted-foreground group-hover:text-foreground truncate flex-1">
                      {company.website}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            {(company.linkedIn || company.twitter || company.facebook) && (
              <Card className="rounded-lg border bg-card">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-semibold">Social</h3>
                </div>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    {company.linkedIn && (
                      <a
                        href={company.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg border hover:bg-primary/8 hover:text-primary hover:border-primary/20 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {company.twitter && (
                      <a
                        href={company.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg border hover:bg-primary/8 hover:text-primary hover:border-primary/20 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {company.facebook && (
                      <a
                        href={company.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg border hover:bg-primary/8 hover:text-primary hover:border-primary/20 transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main - Jobs */}
          <div className="space-y-3">
            {/* Jobs Header */}
            <Card className="rounded-lg border bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold mb-0.5">Job Openings</h2>
                    <p className="text-[12px] text-muted-foreground">
                      {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/jobs/post?companyId=${company.id}`)}
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Post New Job
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : jobs.length === 0 ? (
              <Card className="rounded-lg border bg-card">
                <CardContent className="py-16 text-center">
                  <div className="p-3 rounded-lg bg-primary/8 w-fit mx-auto mb-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">No jobs posted yet</h3>
                  <p className="text-[13px] text-muted-foreground mb-4 max-w-sm mx-auto">
                    Start hiring top talent by posting your first job opening
                  </p>
                  <Button
                    onClick={() => router.push(`/jobs/post?companyId=${company.id}`)}
                    size="sm"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="rounded-lg border bg-card group hover:border-primary/20 transition-colors cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold group-hover:text-primary transition-colors mb-1.5 truncate">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={job.isActive ? 'success' : 'secondary'}
                              className="text-[10px]"
                            >
                              {job.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {job.employmentType}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {job.locationType}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                        {job.location && (
                          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                        {job.showSalary !== false && formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod) && (
                          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(job.createdAt)}</span>
                        </div>
                      </div>

                      {job._count !== undefined && (
                        <div className={`flex items-center gap-1.5 p-2 rounded-md mb-2 text-[12px] ${
                          job._count.pendingApplications > 0
                            ? 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800'
                            : 'bg-muted'
                        }`}>
                          <Users className={`h-3.5 w-3.5 ${
                            job._count.pendingApplications > 0 ? 'text-orange-600' : 'text-muted-foreground'
                          }`} />
                          <span className={`font-medium ${
                            job._count.pendingApplications > 0 ? 'text-orange-900 dark:text-orange-100' : 'text-foreground'
                          }`}>
                            {job._count.pendingApplications > 0 ? (
                              <>
                                {job._count.pendingApplications} pending{' '}
                                {job._count.pendingApplications === 1 ? 'application' : 'applications'}
                              </>
                            ) : (
                              <>
                                {job._count.applications} total{' '}
                                {job._count.applications === 1 ? 'application' : 'applications'}
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={job._count?.pendingApplications && job._count.pendingApplications > 0 ? 'default' : 'outline'}
                          onClick={() => router.push(`/jobs/${job.id}/applications`)}
                          className={`flex-1 min-w-0 text-[11px] ${
                            job._count?.pendingApplications && job._count.pendingApplications > 0
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : ''
                          }`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="truncate">
                            {job._count?.pendingApplications && job._count.pendingApplications > 0
                              ? `${job._count.pendingApplications} Pending`
                              : 'Applications'}
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/jobs/${job.id}/edit`)}
                          className="text-[11px] px-2.5"
                        >
                          <Edit className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deletingJobId === job.id}
                          className="text-[11px] px-2.5"
                        >
                          {deletingJobId === job.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="min-w-[160px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Jobs
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Showing {jobs.length} of {pagination.total} jobs
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
