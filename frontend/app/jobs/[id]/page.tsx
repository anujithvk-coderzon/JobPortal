'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { jobAPI } from '@/lib/api';
import { Job } from '@/lib/types';
import { formatSalary, timeAgo } from '@/lib/utils';
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
  DollarSign,
  Users,
  Calendar,
  BookmarkPlus,
  Bookmark,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

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
        title: 'Login Required',
        description: 'Please login to save jobs',
        variant: 'destructive',
      });
      router.push('/auth/login');
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
        });
      } else {
        await jobAPI.saveJob(jobId);
        setJob({ ...job!, isSaved: true });
        toast({
          title: 'Success',
          description: 'Job saved successfully',
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

  const handleApply = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to apply for jobs',
        variant: 'destructive',
      });
      router.push('/auth/login');
      return;
    }

    // Navigate to application page
    router.push(`/applications/apply/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/jobs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                <div className="flex items-center gap-2 text-lg mb-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{job.company?.name || job.companyName || 'Company'}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{getLocationTypeLabel(job.locationType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                  {job._count && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{job._count?.applications || 0} applicants</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{getEmploymentTypeLabel(job.employmentType)}</Badge>
                  <Badge variant="secondary">{getExperienceLevelLabel(job.experienceLevel)}</Badge>
                  {job.salaryMin && job.salaryMax && (
                    <Badge variant="outline">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </Badge>
                  )}
                  {job.numberOfOpenings > 1 && (
                    <Badge variant="outline">
                      {job.numberOfOpenings} openings
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:w-auto w-full">
                {user && user.id === job.userId ? (
                  // Show edit button for job author
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/jobs/${job.id}/edit`)}
                    className="w-full md:w-auto"
                  >
                    Edit Job
                  </Button>
                ) : (
                  // Show apply/save buttons for everyone else
                  <>
                    <Button
                      onClick={handleApply}
                      size="lg"
                      disabled={job.hasApplied || Boolean(job.applicationDeadline && new Date(job.applicationDeadline) < new Date())}
                      className="w-full md:w-auto"
                    >
                      {job.hasApplied
                        ? 'Already Applied'
                        : (job.applicationDeadline && new Date(job.applicationDeadline) < new Date())
                        ? 'Application Closed'
                        : 'Apply Now'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveJob}
                      disabled={saving}
                      className="w-full md:w-auto"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : job.isSaved ? (
                        <>
                          <Bookmark className="mr-2 h-4 w-4 fill-current" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="mr-2 h-4 w-4" />
                          Save Job
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
          </CardContent>
        </Card>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {job.responsibilities.map((resp: string, index: number) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Required Qualifications */}
        {job.requiredQualifications && job.requiredQualifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Required Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {job.requiredQualifications.map((qual: string, index: number) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Preferred Qualifications */}
        {job.preferredQualifications && job.preferredQualifications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Preferred Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {job.preferredQualifications.map((qual: string, index: number) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Required Skills */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.applicationDeadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Application Deadline:{' '}
                  <span className="font-semibold">
                    {new Date(job.applicationDeadline).toLocaleDateString()}
                  </span>
                  {new Date(job.applicationDeadline) < new Date() && (
                    <Badge variant="destructive" className="ml-2">
                      Expired
                    </Badge>
                  )}
                </span>
              </div>
            )}
            {job.company?.industry && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Industry: <span className="font-semibold">{job.company?.industry}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Button (Bottom) - Only show if not the job author */}
        {user && user.id !== job.userId && (
          <div className="flex justify-center">
            <Button
              onClick={handleApply}
              size="lg"
              disabled={job.hasApplied || Boolean(job.applicationDeadline && new Date(job.applicationDeadline) < new Date())}
              className="w-full md:w-auto"
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
  );
}
