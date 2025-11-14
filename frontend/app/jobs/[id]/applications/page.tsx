'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
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
import { applicationAPI, jobAPI } from '@/lib/api';
import { getInitials, timeAgo } from '@/lib/utils';
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

export default function JobApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isHydrated } = useAuthStore();
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
      router.push('/auth/login');
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
      } else {
        setError(errorMessage);
      }

      toast({
        title: 'Error',
        description: errorMessage,
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
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'INTERVIEW_SCHEDULED':
        return 'secondary';
      case 'PENDING':
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIRED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="h-4 w-4" />;
      case 'PENDING':
      default:
        return <Clock className="h-4 w-4" />;
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
        // From PENDING, can go to any other status
        return [
          { value: 'PENDING', label: 'Pending' },
          { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HIRED', label: 'Hired' },
        ];
      case 'INTERVIEW_SCHEDULED':
        // From INTERVIEW_SCHEDULED, can only go to REJECTED or HIRED
        return [
          { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'HIRED', label: 'Hired' },
        ];
      case 'REJECTED':
      case 'HIRED':
        // Final states - no changes allowed
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

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3">
                {error.includes('Access denied') ? (
                  <ShieldAlert className="h-8 w-8 text-destructive" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                )}
                <div>
                  <CardTitle className="text-destructive">
                    {error.includes('Access denied') ? 'Access Denied' : 'Error'}
                  </CardTitle>
                  <CardDescription>{error}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error.includes('Access denied')
                  ? 'You can only view applications for jobs that you have posted. This job was posted by another user.'
                  : 'The job you are looking for may have been deleted or does not exist.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard')}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push('/jobs')}>
                  Browse Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-3 sm:mb-4 -ml-2 sm:-ml-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Applications</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {job?.title} at {job?.company?.name || job?.companyName}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {filteredApplications.length} {statusFilter.toLowerCase().replace('_', ' ')} application{filteredApplications.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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

          {/* Mobile Quick Actions */}
          <div className="lg:hidden flex gap-2 mt-3 sm:mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/jobs')}
            >
              <Briefcase className="h-4 w-4 mr-1.5" />
              <span className="text-xs sm:text-sm">Explore Jobs</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/community')}
            >
              <User className="h-4 w-4 mr-1.5" />
              <span className="text-xs sm:text-sm">Community</span>
            </Button>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {statusFilter.toLowerCase().replace('_', ' ')} applications</h3>
              <p className="text-muted-foreground">
                No applications with status "{statusFilter.toLowerCase().replace('_', ' ')}" found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications List - Scrollable */}
            <div className={`space-y-3 sm:space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto lg:max-h-[calc(100vh-250px)] lg:pr-2 p-1 -m-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400 ${selectedApplication ? 'hidden lg:block' : ''}`}>
              {filteredApplications.map((application) => (
                <Card
                  key={application.id}
                  className={`cursor-pointer transition-all hover:shadow-md active:shadow-lg ${
                    selectedApplication?.id === application.id ? 'ring-2 ring-primary ring-offset-0' : ''
                  }`}
                  onClick={() => setSelectedApplication(application)}
                >
                  <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage
                            src={application.applicant.profilePhoto || undefined}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <AvatarFallback>{getInitials(application.applicant.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{application.applicant.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {application.applicant.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(application.status)} className="flex items-center gap-1 flex-shrink-0">
                        {getStatusIcon(application.status)}
                        <span className="hidden sm:inline">{getStatusLabel(application.status)}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:px-6 pt-0">
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Application Details - Sticky on desktop, full width on mobile */}
            <div className={`${selectedApplication ? 'block' : 'hidden lg:block'} lg:sticky lg:top-8 lg:self-start`}>
              {selectedApplication ? (
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    {/* Mobile Back Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden mb-4 -ml-2"
                      onClick={() => setSelectedApplication(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                          <AvatarImage
                            src={selectedApplication.applicant.profilePhoto || undefined}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                          <AvatarFallback className="text-base sm:text-lg">
                            {getInitials(selectedApplication.applicant.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-lg sm:text-xl truncate">{selectedApplication.applicant.name}</CardTitle>
                          <CardDescription className="truncate">{selectedApplication.applicant.email}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Status Management */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Application Status</Label>
                      <Select
                        value={selectedApplication.status}
                        onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                        disabled={selectedApplication.status === 'REJECTED' || selectedApplication.status === 'HIRED'}
                      >
                        <SelectTrigger className={selectedApplication.status === 'REJECTED' || selectedApplication.status === 'HIRED' ? 'cursor-not-allowed' : ''}>
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
                        <p className="text-xs text-muted-foreground mt-1">
                          This is a final status and cannot be changed.
                        </p>
                      )}
                    </div>

                    {/* Interview Details */}
                    {selectedApplication.status === 'INTERVIEW_SCHEDULED' && selectedApplication.interviewDate && (
                      <div className="border rounded-lg p-4 bg-primary/5 space-y-3">
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="h-4 w-4 text-primary" />
                          Interview Scheduled
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Date & Time</Label>
                            <p className="font-medium">
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
                              <Label className="text-xs text-muted-foreground">Meeting Link</Label>
                              <a
                                href={selectedApplication.interviewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all block"
                              >
                                {selectedApplication.interviewLink}
                              </a>
                            </div>
                          )}

                          {selectedApplication.interviewNotes && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Notes</Label>
                              <p className="whitespace-pre-wrap">{selectedApplication.interviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Tabs defaultValue="contact" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="resume">Resume</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="cover">Cover</TabsTrigger>
                      </TabsList>

                      <TabsContent value="contact" className="space-y-4 mt-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedApplication.applicant.email}
                          </p>
                        </div>
                        {selectedApplication.applicant.phone && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {selectedApplication.applicant.phone}
                            </p>
                          </div>
                        )}
                        {selectedApplication.applicant.location && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Location</Label>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {selectedApplication.applicant.location}
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="resume" className="mt-4">
                        {(selectedApplication.resume || selectedApplication.applicant.profile?.resume) ? (
                          <div className="border rounded-lg p-4">
                            <FileText className="h-12 w-12 text-primary mb-3" />
                            <p className="font-medium mb-2">Resume</p>
                            <Button asChild variant="outline" className="w-full">
                              <a
                                href={selectedApplication.resume || selectedApplication.applicant.profile?.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Resume
                              </a>
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              {selectedApplication.resume
                                ? 'Resume submitted with application'
                                : 'Resume from profile'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No resume uploaded
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="profile" className="space-y-4 mt-4">
                        {selectedApplication.applicant.profile?.bio && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Bio</Label>
                            <p className="text-sm">{selectedApplication.applicant.profile.bio}</p>
                          </div>
                        )}

                        {selectedApplication.applicant.profile?.skills &&
                          selectedApplication.applicant.profile.skills.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                Skills
                              </Label>
                              <div className="flex flex-wrap gap-2">
                                {selectedApplication.applicant.profile.skills.map((skill) => (
                                  <Badge key={skill.id} variant="secondary">
                                    {skill.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedApplication.applicant.profile?.experiences &&
                          selectedApplication.applicant.profile.experiences.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                Experience
                              </Label>
                              <div className="space-y-3">
                                {selectedApplication.applicant.profile.experiences.map((exp) => (
                                  <div key={exp.id} className="text-sm">
                                    <p className="font-medium">{exp.title}</p>
                                    <p className="text-muted-foreground">{exp.company}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedApplication.applicant.profile?.education &&
                          selectedApplication.applicant.profile.education.length > 0 && (
                            <div>
                              <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                Education
                              </Label>
                              <div className="space-y-3">
                                {selectedApplication.applicant.profile.education.map((edu) => (
                                  <div key={edu.id} className="text-sm">
                                    <p className="font-medium">{edu.degree}</p>
                                    <p className="text-muted-foreground">{edu.institution}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </TabsContent>

                      <TabsContent value="cover" className="mt-4 space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Cover Letter</Label>
                          {selectedApplication.coverLetter ? (
                            <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20">
                              <p className="whitespace-pre-wrap text-sm">
                                {selectedApplication.coverLetter}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                              No cover letter provided
                            </p>
                          )}
                        </div>

                        {selectedApplication.additionalInfo && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">Additional Information</Label>
                            <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20">
                              <p className="whitespace-pre-wrap text-sm">
                                {selectedApplication.additionalInfo}
                              </p>
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Application Date</Label>
                          <p className="text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
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
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select an application to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Interview Scheduling Dialog */}
        <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                Configure interview details and customize the email that will be sent to the candidate.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Interview Details</TabsTrigger>
                <TabsTrigger value="email">Email Content</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interview-date">Interview Date *</Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={interviewData.interviewDate}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interview-time">Interview Time *</Label>
                    <Input
                      id="interview-time"
                      type="time"
                      value={interviewData.interviewTime}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-type">Interview Type *</Label>
                  <Select
                    value={interviewData.interviewType}
                    onValueChange={(value: any) => setInterviewData({ ...interviewData, interviewType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">🎥 Video Interview</SelectItem>
                      <SelectItem value="phone">📞 Phone Interview</SelectItem>
                      <SelectItem value="in-person">📍 In-Person Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {interviewData.interviewType === 'video' && (
                  <div className="space-y-2">
                    <Label htmlFor="interview-link">Meeting Link *</Label>
                    <Input
                      id="interview-link"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={interviewData.interviewLink}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewLink: e.target.value })}
                    />
                  </div>
                )}

                {interviewData.interviewType === 'in-person' && (
                  <div className="space-y-2">
                    <Label htmlFor="interview-location">Location *</Label>
                    <Input
                      id="interview-location"
                      placeholder="123 Main St, City, State"
                      value={interviewData.interviewLocation}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewLocation: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-person">Contact Person</Label>
                    <Input
                      id="contact-person"
                      placeholder="John Doe"
                      value={interviewData.contactPerson}
                      onChange={(e) => setInterviewData({ ...interviewData, contactPerson: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@company.com"
                      value={interviewData.contactEmail}
                      onChange={(e) => setInterviewData({ ...interviewData, contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-notes">Additional Notes</Label>
                  <Textarea
                    id="interview-notes"
                    placeholder="e.g., Please prepare a portfolio presentation..."
                    value={interviewData.interviewNotes}
                    onChange={(e) => setInterviewData({ ...interviewData, interviewNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content *</Label>
                  <Textarea
                    id="email-content"
                    value={interviewData.emailContent}
                    onChange={(e) => setInterviewData({ ...interviewData, emailContent: e.target.value })}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="Customize the email content..."
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be included in the interview invitation email. Interview details will be added automatically.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInterviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleInterview}>
                Schedule & Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Customize the rejection email that will be sent to the candidate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-email">Email Content *</Label>
                <Textarea
                  id="rejection-email"
                  value={rejectionData.emailContent}
                  onChange={(e) => setRejectionData({ ...rejectionData, emailContent: e.target.value })}
                  rows={14}
                  className="font-mono text-sm"
                  placeholder="Customize the rejection email..."
                />
                <p className="text-xs text-muted-foreground">
                  This message will be sent to the candidate. Be professional and respectful.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSendRejection}>
                Send Rejection Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hired Dialog */}
        <Dialog open={showHiredDialog} onOpenChange={setShowHiredDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark as Hired</DialogTitle>
              <DialogDescription>
                Send a congratulations email to the candidate. The formal offer letter with all details will follow within 1-2 weeks.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="hired-email">Email Content *</Label>
                <Textarea
                  id="hired-email"
                  value={hiredData.emailContent}
                  onChange={(e) => setHiredData({ ...hiredData, emailContent: e.target.value })}
                  rows={14}
                  className="font-mono text-sm"
                  placeholder="Customize the congratulations email..."
                />
                <p className="text-xs text-muted-foreground">
                  This message will be sent to the candidate immediately. You can send the formal offer letter with position details, salary, and start date separately within 1-2 weeks.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHiredDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendHiredNotification}>
                {hiredData.offerLetter ? 'Send with Offer Letter' : 'Send Congratulations Email'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
