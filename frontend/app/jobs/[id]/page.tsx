'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { jobAPI } from '@/lib/api';
import { Job } from '@/lib/types';
import { formatSalary, timeAgo } from '@/lib/utils';
import { format } from 'date-fns';
import {
  getEmploymentTypeLabel,
  getExperienceLevelLabel,
  getLocationTypeLabel,
} from '@/lib/constants';
import {
  MapPin,
  Briefcase,
  Building2,
  Clock,
  Users,
  Calendar,
  BookmarkPlus,
  Bookmark,
  Loader2,
  ArrowLeft,
  Trash2,
  Share2,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const jobId = params.id as string;

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobById(jobId);
      setJob(response.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to save jobs.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    try {
      setSaving(true);
      if (job?.isSaved) {
        await jobAPI.unsaveJob(jobId);
        setJob({ ...job, isSaved: false });
        toast({
          title: 'Success',
          description: 'Job removed from saved jobs',
          variant: 'success',
        });
      } else {
        await jobAPI.saveJob(jobId);
        setJob({ ...job!, isSaved: true });
        toast({
          title: 'Success',
          description: 'Job saved successfully',
          variant: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save job',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await jobAPI.deleteJob(jobId);
      toast({
        title: 'Job Deleted',
        description: 'The job has been deleted successfully.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete job',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to apply for jobs.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    // Navigate to application page
    router.push(`/applications/apply/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 text-center pt-20">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 mb-3">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold mb-1">Job Not Found</h1>
          <p className="text-[12px] text-muted-foreground mb-4">
            The job you are looking for does not exist or has been removed.
          </p>
          <Button size="sm" onClick={() => router.push('/jobs')}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: job.title }]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Job Header */}
            <div className="rounded-lg border bg-card p-4 sm:p-6">
              <h1 className="text-lg font-semibold mb-2">{job.title}</h1>
              <div className="flex items-center gap-1.5 text-[13px] mb-3">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{job.company?.name || job.companyName || 'Company'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground mb-4">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {getLocationTypeLabel(job.locationType)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(job.createdAt)}
                </span>
                {job._count && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {job._count?.applications || 0} applicants
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="text-[11px] h-5 font-normal">{getEmploymentTypeLabel(job.employmentType)}</Badge>
                <Badge variant="secondary" className="text-[11px] h-5 font-normal">{getExperienceLevelLabel(job.experienceLevel)}</Badge>
                {job.salaryMin && job.showSalary !== false && (
                  <Badge variant="outline" className="text-[11px] h-5 font-normal">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                  </Badge>
                )}
                {job.numberOfOpenings > 1 && (
                  <Badge variant="outline" className="text-[11px] h-5 font-normal">
                    {job.numberOfOpenings} openings
                  </Badge>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="rounded-lg border bg-card p-4 sm:p-6">
              <h2 className="text-sm font-semibold mb-3">Job Description</h2>
              <div className="prose prose-sm max-w-none overflow-x-hidden break-words text-[13px]" dangerouslySetInnerHTML={{ __html: job.description }} />
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h2 className="text-sm font-semibold mb-3">Responsibilities</h2>
                <ul className="list-disc list-inside space-y-1.5 text-[13px]">
                  {job.responsibilities.map((resp: string, index: number) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Qualifications */}
            {job.requiredQualifications && job.requiredQualifications.length > 0 && (
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h2 className="text-sm font-semibold mb-3">Required Qualifications</h2>
                <ul className="list-disc list-inside space-y-1.5 text-[13px]">
                  {job.requiredQualifications.map((qual: string, index: number) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preferred Qualifications */}
            {job.preferredQualifications && job.preferredQualifications.length > 0 && (
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h2 className="text-sm font-semibold mb-3">Preferred Qualifications</h2>
                <ul className="list-disc list-inside space-y-1.5 text-[13px]">
                  {job.preferredQualifications.map((qual: string, index: number) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="rounded-lg border bg-card p-4 sm:p-6">
                <h2 className="text-sm font-semibold mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-[11px] h-5 font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions Card */}
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold mb-3">Actions</h2>
              <div className="space-y-2">
                {user && user.id === job.userId ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/jobs/${job.id}/edit`)}
                      className="w-full justify-center text-[13px]"
                    >
                      Edit Job
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteJob}
                      disabled={deleteLoading}
                      className="w-full justify-center text-[13px]"
                    >
                      {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                      Delete Job
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleApply}
                      size="sm"
                      disabled={job.hasApplied || Boolean(job.applicationDeadline && new Date(job.applicationDeadline) < new Date())}
                      className="w-full justify-center text-[13px]"
                    >
                      {job.hasApplied
                        ? 'Already Applied'
                        : (job.applicationDeadline && new Date(job.applicationDeadline) < new Date())
                        ? 'Application Closed'
                        : 'Apply Now'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveJob}
                      disabled={saving}
                      className="w-full justify-center text-[13px]"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : job.isSaved ? (
                        <>
                          <Bookmark className="mr-1.5 h-3.5 w-3.5 fill-current" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                          Save Job
                        </>
                      )}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-[13px]"
                  onClick={() => {
                    const shareText = `${job.title} at ${job.company?.name || job.companyName || 'Company'}\n\n${window.location.href}`;
                    if (navigator.share) {
                      navigator.share({ text: shareText }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText).then(() => {
                        toast({ title: 'Link copied', description: 'Job link copied to clipboard' });
                      }).catch(() => {});
                    }
                  }}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Share
                </Button>
              </div>
            </div>

            {/* Job Info Card */}
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold mb-3">Details</h2>
              <div className="space-y-3">
                {job.applicationDeadline && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Deadline</p>
                      <p className="text-[13px] font-medium">
                        {format(new Date(job.applicationDeadline), 'PPP')}
                      </p>
                      {new Date(new Date(job.applicationDeadline).toDateString()) < new Date(new Date().toDateString()) && (
                        <Badge variant="destructive" className="text-[10px] h-4 mt-1">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {job.company?.industry && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Industry</p>
                      <p className="text-[13px] font-medium">{job.company?.industry}</p>
                    </div>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Location</p>
                      <p className="text-[13px] font-medium">{job.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Work Type</p>
                    <p className="text-[13px] font-medium">{getLocationTypeLabel(job.locationType)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Posted</p>
                    <p className="text-[13px] font-medium">{timeAgo(job.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Apply (mobile) */}
            {user && user.id !== job.userId && (
              <div className="lg:hidden">
                <Button
                  onClick={handleApply}
                  size="sm"
                  disabled={job.hasApplied || Boolean(job.applicationDeadline && new Date(job.applicationDeadline) < new Date())}
                  className="w-full text-[13px]"
                >
                  {job.hasApplied
                    ? 'Already Applied'
                    : (job.applicationDeadline && new Date(job.applicationDeadline) < new Date())
                    ? 'Application Closed'
                    : 'Apply for this Position'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
