'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { JobMatchScore } from '@/components/jobs/JobMatchScore';
import { applicationAPI, jobAPI } from '@/lib/api';
import { getInitials, timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Application {
  id: string;
  status: string;
  coverLetter: string;
  resume: string;
  additionalInfo?: string;
  appliedAt: string;
  interviewDate?: string;
  interviewLink?: string;
  interviewNotes?: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    profilePhoto?: string;
    profile?: {
      bio?: string;
      resume?: string;
      skills: Array<{ id: string; name: string; level?: string }>;
      experiences: Array<{
        id: string;
        title: string;
        company: string;
        location?: string;
        startDate: string;
        endDate?: string;
        current: boolean;
        description?: string;
      }>;
      education: Array<{
        id: string;
        institution: string;
        degree: string;
        fieldOfStudy: string;
        startDate: string;
        endDate?: string;
        current: boolean;
        grade?: string;
      }>;
    };
  };
}

interface Job {
  id: string;
  title: string;
  company?: { name: string };
  companyName?: string;
}

const JobApplicationsPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Interview dialog state
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [interviewData, setInterviewData] = useState({
    applicationId: '',
    interviewDate: '',
    interviewTime: '',
    interviewLink: '',
    interviewLocation: '',
    interviewType: 'video' as 'video' | 'phone' | 'in-person',
    interviewNotes: '',
    contactPerson: '',
    contactEmail: '',
    emailContent: '',
  });

  // Rejection dialog state
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionData, setRejectionData] = useState({
    applicationId: '',
    emailContent: '',
  });

  // Hired dialog state
  const [showHiredDialog, setShowHiredDialog] = useState(false);
  const [hiredData, setHiredData] = useState({
    applicationId: '',
    emailContent: '',
    offerLetter: null as File | null,
  });

  const jobId = params.id as string;

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
    fetchJobAndApplications();
  }, [isAuthenticated, isHydrated, jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch job details
      const jobResponse = await jobAPI.getJobById(jobId);
      setJob(jobResponse.data.data);

      // Fetch applications - this will fail with 403 if not the job owner
      const appsResponse = await applicationAPI.getJobApplications(jobId, {});

      // Backend returns { data: { applications: [], stats: {}, pagination: {} } }
      const applications = appsResponse.data.data?.applications || [];

      setApplications(applications);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to load applications';
      const statusCode = error.response?.status;

      if (statusCode === 404) {
        setError('Job not found');
      } else if (statusCode === 403) {
        setError('Access denied. Only the person who posted this job can view its applications.');
      } else if (statusCode === 401) {
        setError('Please log in to view applications.');
      } else {
        setError(errorMessage);
      }

      toast({
        title: 'Error',
        description: statusCode === 401 ? 'Please log in to view applications.' : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    const candidateName = application.applicant.name;
    const jobTitle = job?.title || 'Position';
    const companyName = job?.company?.name || job?.companyName || 'Company';

    // If scheduling interview, show detailed dialog
    if (newStatus === 'INTERVIEW_SCHEDULED') {
      const defaultEmailContent = `Dear ${candidateName},

Great news! ${companyName} would like to schedule an interview with you for the position of ${jobTitle}.

We were impressed by your application and believe you would be a great fit for our team. During the interview, we'll discuss your experience, the role requirements, and answer any questions you may have.

Please review the interview details below and let us know if you have any questions.

We look forward to speaking with you!

Best regards,
${companyName} Hiring Team`;

      setInterviewData({
        applicationId,
        interviewDate: '',
        interviewTime: '',
        interviewLink: '',
        interviewLocation: '',
        interviewType: 'video',
        interviewNotes: '',
        contactPerson: '',
        contactEmail: '',
        emailContent: defaultEmailContent,
      });
      setShowInterviewDialog(true);
      return;
    }

    // Show rejection dialog
    if (newStatus === 'REJECTED') {
      const defaultEmailContent = `Dear ${candidateName},

Thank you for your interest in the ${jobTitle} position at ${companyName} and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs for this particular role.

We appreciate your interest in ${companyName} and wish you the very best in your job search and future endeavors.

Best regards,
${companyName} Hiring Team`;

      setRejectionData({
        applicationId,
        emailContent: defaultEmailContent,
      });
      setShowRejectionDialog(true);
      return;
    }

    // Show hired dialog
    if (newStatus === 'HIRED') {
      const defaultEmailContent = `Dear ${candidateName},

We are thrilled to inform you that you have been selected for the position of ${jobTitle} at ${companyName}!

We were impressed by your skills, experience, and enthusiasm throughout the interview process, and we believe you will be a valuable addition to our team.

You will receive a formal offer letter with all details within the next 1-2 weeks.

Welcome to the team! We look forward to working with you.

Warm regards,
${companyName} Team`;

      setHiredData({
        applicationId,
        emailContent: defaultEmailContent,
        offerLetter: null,
      });
      setShowHiredDialog(true);
      return;
    }

    // For other status changes, update directly
    try {
      await applicationAPI.updateApplicationStatus(applicationId, { status: newStatus });

      // Update local state
      setApplications(applications.map(app =>
        app.id === applicationId ? {
          ...app,
          status: newStatus,
          interviewDate: undefined,
          interviewLink: undefined,
          interviewNotes: undefined,
        } : app
      ));

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({
          ...selectedApplication,
          status: newStatus,
          interviewDate: undefined,
          interviewLink: undefined,
          interviewNotes: undefined,
        });
      }

      toast({
        title: 'Success',
        description: 'Application status updated',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleScheduleInterview = async () => {
    try {
      // Validate required fields
      if (!interviewData.interviewDate || !interviewData.interviewTime) {
        toast({
          title: 'Error',
          description: 'Interview date and time are required',
          variant: 'destructive',
        });
        return;
      }

      if (!interviewData.emailContent.trim()) {
        toast({
          title: 'Error',
          description: 'Email content cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      // Combine date and time into ISO string
      const interviewDateTime = new Date(`${interviewData.interviewDate}T${interviewData.interviewTime}`).toISOString();

      await applicationAPI.updateApplicationStatus(interviewData.applicationId, {
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: interviewDateTime,
        interviewTime: interviewData.interviewTime,
        interviewLink: interviewData.interviewLink || undefined,
        interviewLocation: interviewData.interviewLocation || undefined,
        interviewType: interviewData.interviewType,
        interviewNotes: interviewData.interviewNotes || undefined,
        contactPerson: interviewData.contactPerson || undefined,
        contactEmail: interviewData.contactEmail || undefined,
        customEmailContent: interviewData.emailContent,
      });

      // Update local state
      setApplications(applications.map(app =>
        app.id === interviewData.applicationId ? {
          ...app,
          status: 'INTERVIEW_SCHEDULED',
          interviewDate: interviewDateTime,
          interviewLink: interviewData.interviewLink,
          interviewNotes: interviewData.interviewNotes,
        } : app
      ));

      if (selectedApplication?.id === interviewData.applicationId) {
        setSelectedApplication({
          ...selectedApplication,
          status: 'INTERVIEW_SCHEDULED',
          interviewDate: interviewDateTime,
          interviewLink: interviewData.interviewLink,
          interviewNotes: interviewData.interviewNotes,
        });
      }

      toast({
        title: 'Success',
        description: 'Interview scheduled successfully',
        variant: 'success',
      });

      setShowInterviewDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to schedule interview',
        variant: 'destructive',
      });
    }
  };

  const handleSendRejection = async () => {
    try {
      if (!rejectionData.emailContent.trim()) {
        toast({
          title: 'Error',
          description: 'Email content cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      await applicationAPI.updateApplicationStatus(rejectionData.applicationId, {
        status: 'REJECTED',
        customEmailContent: rejectionData.emailContent,
      });

      // Update local state
      setApplications(applications.map(app =>
        app.id === rejectionData.applicationId ? {
          ...app,
          status: 'REJECTED',
        } : app
      ));

      if (selectedApplication?.id === rejectionData.applicationId) {
        setSelectedApplication({
          ...selectedApplication,
          status: 'REJECTED',
        });
      }

      toast({
        title: 'Rejection Sent',
        description: 'Rejection email sent to candidate',
      });

      setShowRejectionDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send rejection',
        variant: 'destructive',
      });
    }
  };

  const handleSendHiredNotification = async () => {
    try {
      if (!hiredData.emailContent.trim()) {
        toast({
          title: 'Error',
          description: 'Email content cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      await applicationAPI.updateApplicationStatus(hiredData.applicationId, {
        status: 'HIRED',
        customEmailContent: hiredData.emailContent,
      });

      // Update local state
      setApplications(applications.map(app =>
        app.id === hiredData.applicationId ? {
          ...app,
          status: 'HIRED',
        } : app
      ));

      if (selectedApplication?.id === hiredData.applicationId) {
        setSelectedApplication({
          ...selectedApplication,
          status: 'HIRED',
        });
      }

      toast({
        title: 'Offer Sent!',
        description: 'Congratulations email sent to candidate',
      });

      setShowHiredDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send offer',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'HIRED':
        return 'success' as const;
      case 'REJECTED':
        return 'destructive' as const;
      case 'INTERVIEW_SCHEDULED':
        return 'warning' as const;
      case 'PENDING':
      default:
        return 'secondary' as const;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIRED':
        return <CheckCircle className="h-3 w-3" />;
      case 'REJECTED':
        return <XCircle className="h-3 w-3" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="h-3 w-3" />;
      case 'PENDING':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'INTERVIEW_SCHEDULED':
        return 'Interview Scheduled';
      case 'REJECTED':
        return 'Rejected';
      case 'HIRED':
        return 'Hired';
      default:
        return status;
    }
  };

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { value: 'PENDING', label: 'Pending' },
          { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HIRED', label: 'Hired' },
        ];
      case 'INTERVIEW_SCHEDULED':
        return [
          { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HIRED', label: 'Hired' },
        ];
      case 'REJECTED':
      case 'HIRED':
        return [
          { value: currentStatus, label: getStatusLabel(currentStatus) },
        ];
      default:
        return [
          { value: 'PENDING', label: 'Pending' },
          { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HIRED', label: 'Hired' },
        ];
    }
  };

  const filteredApplications = Array.isArray(applications)
    ? applications.filter(app => app.status === statusFilter)
    : [];

  // Loading state
  if (!isHydrated || !isAuthenticated || !user || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications' }]} />
          <div className="rounded-lg border border-destructive/50 bg-card p-6">
            <div className="flex items-start gap-3">
              {error.includes('Access denied') ? (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-destructive mb-1">
                  {error.includes('Access denied') ? 'Access Denied' : 'Error'}
                </h2>
                <p className="text-[13px] text-muted-foreground mb-4">
                  {error.includes('Access denied')
                    ? 'You can only view applications for jobs that you have posted. This job was posted by another user.'
                    : error}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => router.push('/dashboard')} className="text-[12px]">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push('/jobs')} className="text-[12px]">
                    Browse Jobs
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications' }]} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold">Applications</h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {job?.title} at {job?.company?.name || job?.companyName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filteredApplications.length} {statusFilter.toLowerCase().replace('_', ' ')} application{filteredApplications.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-[13px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="INTERVIEW_SCHEDULED">Interview Scheduled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 mb-3">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No {statusFilter.toLowerCase().replace('_', ' ')} applications</h3>
            <p className="text-[12px] text-muted-foreground">
              No applications with this status found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Applications List */}
            <div className={`space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto lg:max-h-[calc(100vh-250px)] lg:pr-2 ${selectedApplication ? 'hidden lg:block' : ''}`}>
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedApplication?.id === application.id ? 'bg-accent/60 border-primary/30' : 'bg-card'
                  }`}
                  onClick={() => setSelectedApplication(application)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage
                          src={application.applicant.profilePhoto || undefined}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <AvatarFallback className="text-[11px]">{getInitials(application.applicant.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold truncate">{application.applicant.name}</h3>
                        <p className="text-[12px] text-muted-foreground truncate">
                          {application.applicant.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <JobMatchScore jobId={jobId} applicantId={application.applicant.id} variant="badge" />
                      <Badge variant={getStatusBadgeVariant(application.status)} className="text-[10px] h-5 flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        <span className="hidden sm:inline">{getStatusLabel(application.status)}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-2 pl-12">
                    {application.applicant.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{application.applicant.location}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Applied {timeAgo(application.appliedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Application Detail Panel */}
            <div className={`${selectedApplication ? 'block' : 'hidden lg:block'} lg:sticky lg:top-8 lg:self-start`}>
              {selectedApplication ? (
                <div className="rounded-lg border bg-card">
                  <div className="p-4 sm:p-5 border-b">
                    {/* Mobile Back */}
                    <button
                      className="lg:hidden inline-flex items-center text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-3"
                      onClick={() => setSelectedApplication(null)}
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back to List
                    </button>

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarImage
                            src={selectedApplication.applicant.profilePhoto || undefined}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <AvatarFallback className="text-[11px]">
                            {getInitials(selectedApplication.applicant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{selectedApplication.applicant.name}</h3>
                          <p className="text-[12px] text-muted-foreground truncate">{selectedApplication.applicant.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Status Management */}
                    <div>
                      <Label className="text-[11px] text-muted-foreground mb-1.5 block">Application Status</Label>
                      <Select
                        value={selectedApplication.status}
                        onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                        disabled={selectedApplication.status === 'REJECTED' || selectedApplication.status === 'HIRED'}
                      >
                        <SelectTrigger className={`h-8 text-[13px] ${selectedApplication.status === 'REJECTED' || selectedApplication.status === 'HIRED' ? 'cursor-not-allowed opacity-60' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableStatuses(selectedApplication.status).map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(selectedApplication.status === 'REJECTED' || selectedApplication.status === 'HIRED') && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          This is a final status and cannot be changed.
                        </p>
                      )}
                    </div>

                    {/* Interview Details */}
                    {selectedApplication.status === 'INTERVIEW_SCHEDULED' && selectedApplication.interviewDate && (
                      <div className="rounded-md border p-3 bg-primary/8 space-y-2">
                        <div className="flex items-center gap-1.5 text-[13px] font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Interview Scheduled
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-[11px] text-muted-foreground">Date & Time</p>
                            <p className="text-[13px] font-medium">
                              {new Date(selectedApplication.interviewDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          {selectedApplication.interviewLink && (
                            <div>
                              <p className="text-[11px] text-muted-foreground">Meeting Link</p>
                              <a
                                href={selectedApplication.interviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[13px] text-primary hover:underline break-all"
                              >
                                {selectedApplication.interviewLink}
                              </a>
                            </div>
                          )}
                          {selectedApplication.interviewNotes && (
                            <div>
                              <p className="text-[11px] text-muted-foreground">Notes</p>
                              <p className="text-[13px] whitespace-pre-wrap">{selectedApplication.interviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Tabs defaultValue="contact" className="w-full overflow-hidden">
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-8">
                        <TabsTrigger value="contact" className="text-[11px]">Contact</TabsTrigger>
                        <TabsTrigger value="resume" className="text-[11px]">Resume</TabsTrigger>
                        <TabsTrigger value="profile" className="text-[11px]">Profile</TabsTrigger>
                        <TabsTrigger value="cover" className="text-[11px]">Cover</TabsTrigger>
                      </TabsList>

                      <TabsContent value="contact" className="space-y-3 mt-3">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Email</p>
                          <p className="flex items-center gap-1.5 text-[13px]">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {selectedApplication.applicant.email}
                          </p>
                        </div>
                        {selectedApplication.applicant.phone && (
                          <div>
                            <p className="text-[11px] text-muted-foreground">Phone</p>
                            <p className="flex items-center gap-1.5 text-[13px]">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {selectedApplication.applicant.phone}
                            </p>
                          </div>
                        )}
                        {selectedApplication.applicant.location && (
                          <div>
                            <p className="text-[11px] text-muted-foreground">Location</p>
                            <p className="flex items-center gap-1.5 text-[13px]">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {selectedApplication.applicant.location}
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="resume" className="mt-3">
                        {(selectedApplication.resume || selectedApplication.applicant.profile?.resume) ? (
                          <div className="rounded-md border p-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/8 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-[13px] font-medium mb-2">Resume</p>
                            <Button asChild variant="outline" size="sm" className="w-full text-[12px]">
                              <a
                                href={selectedApplication.resume || selectedApplication.applicant.profile?.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-3 w-3 mr-1.5" />
                                View Resume
                              </a>
                            </Button>
                            <p className="text-[11px] text-muted-foreground mt-2 text-center">
                              {selectedApplication.resume
                                ? 'Resume submitted with application'
                                : 'Resume from profile'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground text-center py-8">
                            No resume uploaded
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="profile" className="space-y-3 mt-3">
                        {selectedApplication.applicant.profile?.bio && (
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">Bio</p>
                            <p className="text-[13px]">{selectedApplication.applicant.profile.bio}</p>
                          </div>
                        )}

                        {selectedApplication.applicant.profile?.skills &&
                          selectedApplication.applicant.profile.skills.length > 0 && (
                            <div>
                              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                Skills
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedApplication.applicant.profile.skills.map((skill) => (
                                  <Badge key={skill.id} variant="secondary" className="text-[10px] h-5 font-normal">
                                    {skill.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedApplication.applicant.profile?.experiences &&
                          selectedApplication.applicant.profile.experiences.length > 0 && (
                            <div>
                              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                Experience
                              </p>
                              <div className="space-y-2">
                                {selectedApplication.applicant.profile.experiences.map((exp) => (
                                  <div key={exp.id}>
                                    <p className="text-[13px] font-medium">{exp.title}</p>
                                    <p className="text-[12px] text-muted-foreground">{exp.company}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedApplication.applicant.profile?.education &&
                          selectedApplication.applicant.profile.education.length > 0 && (
                            <div>
                              <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                Education
                              </p>
                              <div className="space-y-2">
                                {selectedApplication.applicant.profile.education.map((edu) => (
                                  <div key={edu.id}>
                                    <p className="text-[13px] font-medium">{edu.degree}</p>
                                    <p className="text-[12px] text-muted-foreground">{edu.institution}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </TabsContent>

                      <TabsContent value="cover" className="mt-3 space-y-3">
                        <div>
                          <p className="text-[11px] text-muted-foreground mb-1.5">Cover Letter</p>
                          {selectedApplication.coverLetter ? (
                            <div className="rounded-md border p-3 bg-accent/30">
                              <p className="whitespace-pre-wrap text-[13px]">
                                {selectedApplication.coverLetter}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[13px] text-muted-foreground text-center py-8 rounded-md border">
                              No cover letter provided
                            </p>
                          )}
                        </div>

                        {selectedApplication.additionalInfo && (
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1.5">Additional Information</p>
                            <div className="rounded-md border p-3 bg-accent/30">
                              <p className="whitespace-pre-wrap text-[13px]">
                                {selectedApplication.additionalInfo}
                              </p>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-[11px] text-muted-foreground mb-1">Application Date</p>
                          <p className="text-[13px] flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(selectedApplication.appliedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-12 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/8 mb-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    Select an application to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview Scheduling Dialog */}
        <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Schedule Interview</DialogTitle>
              <DialogDescription className="text-[12px]">
                Configure interview details and customize the email that will be sent to the candidate.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="details" className="text-[12px]">Interview Details</TabsTrigger>
                <TabsTrigger value="email" className="text-[12px]">Email Content</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-3 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="interview-date" className="text-[13px] font-medium mb-1 block">Interview Date *</Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={interviewData.interviewDate}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview-time" className="text-[13px] font-medium mb-1 block">Interview Time *</Label>
                    <Input
                      id="interview-time"
                      type="time"
                      value={interviewData.interviewTime}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewTime: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="interview-type" className="text-[13px] font-medium mb-1 block">Interview Type *</Label>
                  <Select
                    value={interviewData.interviewType}
                    onValueChange={(value: any) => setInterviewData({ ...interviewData, interviewType: value })}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Interview</SelectItem>
                      <SelectItem value="phone">Phone Interview</SelectItem>
                      <SelectItem value="in-person">In-Person Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {interviewData.interviewType === 'video' && (
                  <div>
                    <Label htmlFor="interview-link" className="text-[13px] font-medium mb-1 block">Meeting Link *</Label>
                    <Input
                      id="interview-link"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={interviewData.interviewLink}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewLink: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>
                )}

                {interviewData.interviewType === 'in-person' && (
                  <div>
                    <Label htmlFor="interview-location" className="text-[13px] font-medium mb-1 block">Location *</Label>
                    <Input
                      id="interview-location"
                      placeholder="123 Main St, City, State"
                      value={interviewData.interviewLocation}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewLocation: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="contact-person" className="text-[13px] font-medium mb-1 block">Contact Person</Label>
                    <Input
                      id="contact-person"
                      placeholder="John Doe"
                      value={interviewData.contactPerson}
                      onChange={(e) => setInterviewData({ ...interviewData, contactPerson: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact-email" className="text-[13px] font-medium mb-1 block">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@company.com"
                      value={interviewData.contactEmail}
                      onChange={(e) => setInterviewData({ ...interviewData, contactEmail: e.target.value })}
                      className="h-9 text-[13px]"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="interview-notes" className="text-[13px] font-medium mb-1 block">Additional Notes</Label>
                  <Textarea
                    id="interview-notes"
                    placeholder="e.g., Please prepare a portfolio presentation..."
                    value={interviewData.interviewNotes}
                    onChange={(e) => setInterviewData({ ...interviewData, interviewNotes: e.target.value })}
                    rows={3}
                    className="text-[13px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-3 mt-4">
                <div>
                  <Label htmlFor="email-content" className="text-[13px] font-medium mb-1 block">Email Content *</Label>
                  <Textarea
                    id="email-content"
                    value={interviewData.emailContent}
                    onChange={(e) => setInterviewData({ ...interviewData, emailContent: e.target.value })}
                    rows={15}
                    className="font-mono text-[12px]"
                    placeholder="Customize the email content..."
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    This message will be included in the interview invitation email. Interview details will be added automatically.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowInterviewDialog(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button size="sm" onClick={handleScheduleInterview} className="text-[13px]">
                Schedule & Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Reject Application</DialogTitle>
              <DialogDescription className="text-[12px]">
                Customize the rejection email that will be sent to the candidate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div>
                <Label htmlFor="rejection-email" className="text-[13px] font-medium mb-1 block">Email Content *</Label>
                <Textarea
                  id="rejection-email"
                  value={rejectionData.emailContent}
                  onChange={(e) => setRejectionData({ ...rejectionData, emailContent: e.target.value })}
                  rows={14}
                  className="font-mono text-[12px]"
                  placeholder="Customize the rejection email..."
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  This message will be sent to the candidate. Be professional and respectful.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowRejectionDialog(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleSendRejection} className="text-[13px]">
                Send Rejection Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hired Dialog */}
        <Dialog open={showHiredDialog} onOpenChange={setShowHiredDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Mark as Hired</DialogTitle>
              <DialogDescription className="text-[12px]">
                Send a congratulations email to the candidate. The formal offer letter with all details will follow within 1-2 weeks.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              <div>
                <Label htmlFor="hired-email" className="text-[13px] font-medium mb-1 block">Email Content *</Label>
                <Textarea
                  id="hired-email"
                  value={hiredData.emailContent}
                  onChange={(e) => setHiredData({ ...hiredData, emailContent: e.target.value })}
                  rows={14}
                  className="font-mono text-[12px]"
                  placeholder="Customize the congratulations email..."
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  This message will be sent to the candidate immediately. You can send the formal offer letter with position details, salary, and start date separately within 1-2 weeks.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowHiredDialog(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendHiredNotification} className="text-[13px]">
                {hiredData.offerLetter ? 'Send with Offer Letter' : 'Send Congratulations Email'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JobApplicationsPage;
