'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  Briefcase,
  Loader2,
  Building2,
  Users,
  ChevronRight,
  FileText,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Newspaper,
  MapPin,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';
import { CompanySelector } from '@/components/CompanySelector';

interface DashboardStats {
  // Job Seeker Stats
  myApplicationsCount?: number;
  applicationsByStatus?: Record<string, number>;
  savedJobsCount?: number;
  profileCompletion?: number;
  recentApplications?: any[];
  // Employer Stats
  myJobsCount?: number;
  activeJobsCount?: number;
  applicationsToMyJobs?: number;
  pendingApplicationsCount?: number;
  recentApplicationsReceived?: any[];
  recentJobs?: any[];
}

interface Company {
  id: string;
  name: string;
  logo: string | null;
  _count?: {
    jobs: number;
  };
}

interface CommunityPost {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  createdAt: string;
  helpfulCount?: number;
}

// Helper function to determine job status
const getJobStatus = (job: any) => {
  if (!job.isActive) return { label: 'Inactive', variant: 'secondary' as const, color: 'text-muted-foreground' };

  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    if (deadline < today) {
      return { label: 'Expired', variant: 'destructive' as const, color: 'text-red-500' };
    }
  }

  return { label: 'Active', variant: 'default' as const, color: 'text-green-500' };
};

function DashboardPageContent() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchDashboardData();
  }, [isAuthenticated, isHydrated, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchCompanies(),
        fetchCommunityPosts(),
        fetchProfile(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/applications/dashboard');
      if (response.success) {
        const statsData = response.data;
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({});
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.success) {
        // Handle different possible response structures
        const companiesData = response.data?.companies || response.data?.data?.companies || [];
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      const response = await api.get('/job-news/user/my-news', { params: { page: 1, limit: 3 } });
      if (response.success) {
        const postsData = response.data?.jobNews || response.data?.data?.jobNews || [];
        setCommunityPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching community posts:', error);
      setCommunityPosts([]);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data?.data?.profile || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIRED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalApplications = stats.myApplicationsCount || 0;
  const totalJobs = stats.myJobsCount || 0;
  const totalApplicationsReceived = stats.applicationsToMyJobs || 0;
  const pendingApplications = stats.pendingApplicationsCount || 0;
  const recentApplicationsReceived = stats.recentApplicationsReceived || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
            Welcome back, {user.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Here's an overview of your activity on the platform
          </p>
        </div>

        {/* Profile Completion */}
        {profileData && (
          <ProfileCompletionCard
            user={user}
            profile={profileData}
            className="mb-6 md:mb-8"
          />
        )}

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Job Seeker Stats */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 cursor-pointer" onClick={() => router.push('/applications')}>
            <CardHeader className="pb-1.5 md:pb-3 pt-3 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 pt-2 md:pb-4 md:pt-3">
              <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-0.5">{totalApplications}</div>
              <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-0.5">
                My Applications
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 leading-tight">
                Total jobs applied
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 cursor-pointer" onClick={() => router.push('/applications?tab=saved')}>
            <CardHeader className="pb-1.5 md:pb-3 pt-3 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="p-1.5 md:p-2 bg-purple-50 rounded-lg">
                  <Briefcase className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 pt-2 md:pb-4 md:pt-3">
              <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-0.5">{stats.savedJobsCount || 0}</div>
              <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-0.5">
                Saved Jobs
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 leading-tight">
                Jobs saved for later
              </p>
            </CardContent>
          </Card>

          {/* Employer Stats */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 cursor-pointer" onClick={() => setShowCompanySelector(true)}>
            <CardHeader className="pb-1.5 md:pb-3 pt-3 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="p-1.5 md:p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-green-600" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 pt-2 md:pb-4 md:pt-3">
              <div className="text-xl md:text-2xl lg:text-3xl font-bold mb-0.5">{totalJobs}</div>
              <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-0.5">
                Jobs Posted
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 leading-tight">
                {stats.activeJobsCount || 0} currently active
              </p>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 overflow-hidden cursor-pointer group relative ${pendingApplications > 0 ? 'ring-2 ring-orange-300 ring-offset-2' : ''}`} onClick={() => setShowCompanySelector(true)}>
            <CardHeader className="pb-1.5 md:pb-3 pt-3 md:pt-6">
              <div className="flex items-center justify-between">
                <div className={`p-1.5 md:p-2 bg-orange-50 rounded-lg relative ${pendingApplications > 0 ? 'animate-pulse' : ''}`}>
                  <Users className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-orange-600" />
                  {pendingApplications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardHeader>
            <CardContent className="pb-3 pt-2 md:pb-4 md:pt-3">
              {/* Pending Applications - Main Focus */}
              <div className="flex items-baseline gap-2 mb-0.5">
                <div className={`text-xl md:text-2xl lg:text-3xl font-bold ${pendingApplications > 0 ? 'text-orange-600' : ''}`}>
                  {pendingApplications}
                </div>
                {pendingApplications > 0 && (
                  <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 h-4 md:h-5 text-[9px] md:text-xs px-1.5">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-[11px] md:text-sm font-medium text-muted-foreground mb-0.5">
                {pendingApplications === 1 ? 'Pending Application' : 'Pending Applications'}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground/70 leading-tight">
                {totalApplicationsReceived} total from all posts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Pending Applications */}
        {pendingApplications > 0 && recentApplicationsReceived.length > 0 && (
          <Card className="mb-6 md:mb-8 border-l-4 border-l-orange-500">
            <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-orange-600 flex-shrink-0" />
                    <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">Pending Applications</CardTitle>
                    {recentApplicationsReceived.length > 1 && (
                      <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 text-[9px] md:text-xs px-1.5 py-0.5">
                        <span className="hidden sm:inline">{recentApplicationsReceived.length} Awaiting</span>
                        <span className="sm:hidden">{recentApplicationsReceived.length}</span>
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-[10px] md:text-xs lg:text-sm leading-tight">
                    Applications that need your attention
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-7 md:h-8 px-1.5 md:px-3"
                  onClick={() => setShowCompanySelector(true)}
                >
                  <span className="hidden md:inline text-xs">View All</span>
                  <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 md:ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
              <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
                {recentApplicationsReceived.slice(0, 5).map((application: any) => (
                  <div
                    key={application.id}
                    className="group flex items-center justify-between p-1.5 md:p-2.5 lg:p-3 border border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50 rounded-md md:rounded-lg transition-all cursor-pointer active:scale-[0.98]"
                    onClick={() => router.push(`/jobs/${application.job.id}/applications`)}
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 min-w-0 flex-1">
                      {/* Applicant Avatar */}
                      {application.applicant?.profilePhoto ? (
                        <img
                          src={application.applicant.profilePhoto}
                          alt={application.applicant.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 ${application.applicant?.profilePhoto ? 'hidden' : ''}`}>
                        <span className="text-white text-[10px] md:text-xs lg:text-base font-semibold">
                          {application.applicant?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>

                      {/* Application Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 md:gap-1.5 mb-0">
                          <h4 className="font-medium text-[11px] md:text-xs lg:text-sm text-foreground truncate">
                            {application.applicant?.name || 'Unknown Applicant'}
                          </h4>
                          <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 h-3.5 md:h-4 text-[8px] md:text-[9px] flex-shrink-0 px-1 md:px-1.5 py-0">
                            New
                          </Badge>
                        </div>
                        <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground truncate leading-tight mt-0.5">
                          <span className="hidden sm:inline">Applied for: </span>
                          <span className="font-medium">{application.job?.title}</span>
                        </p>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground mt-0.5 leading-none">
                          {timeAgo(application.appliedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground group-hover:text-orange-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-1 md:ml-1.5" />
                  </div>
                ))}
              </div>

              {recentApplicationsReceived.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={() => setShowCompanySelector(true)}
                >
                  View all {totalApplicationsReceived} applications
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          {/* My Companies */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">My Companies</CardTitle>
                  </div>
                  <CardDescription className="text-[10px] md:text-xs lg:text-sm leading-tight">Companies you manage</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-7 md:h-8 px-2 md:px-3"
                  onClick={() => router.push('/company/create')}
                >
                  <Plus className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1.5" />
                  <span className="hidden md:inline text-xs md:text-sm">New</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
              {companies.length > 0 ? (
                <div className="space-y-1 md:space-y-1.5 lg:space-y-2">
                  {companies.slice(0, 5).map((company) => (
                    <div
                      key={company.id}
                      className="group flex items-center justify-between p-1.5 md:p-2 lg:p-3 border rounded-md md:rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                      onClick={() => router.push(`/company/${company.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-9 h-9 md:w-10 md:h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm md:text-base text-foreground truncate">{company.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {company._count?.jobs || 0} job{company._count?.jobs !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  ))}
                  {companies.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => router.push('/companies')}
                    >
                      View all {companies.length} companies
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                    <Building2 className="h-8 w-8 md:h-10 md:w-10 text-blue-300" />
                  </div>
                  <p className="text-xs md:text-sm font-medium mb-1">No companies yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Create your first company profile</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/company/create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Jobs Posted */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">Recent Jobs Posted</CardTitle>
              </div>
              <CardDescription className="text-[10px] md:text-xs lg:text-sm">Your latest job postings</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
              {stats.recentJobs && stats.recentJobs.length > 0 ? (
                <>
                  <div className="space-y-1.5 md:space-y-2">
                    {stats.recentJobs.map((job: any) => (
                      <div
                        key={job.id}
                        className="group flex items-start justify-between p-2 md:p-3 border rounded-md md:rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs md:text-sm lg:text-base text-foreground truncate mb-0.5 md:mb-1">{job.title}</h4>
                          <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-1.5 md:mb-2">
                            {job.company?.name || 'Company'}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <div className="flex items-center gap-1">
                              <Users className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
                              <span className="text-[10px] md:text-xs text-muted-foreground">
                                {job._count?.applications || 0} applicants
                              </span>
                            </div>
                            <Badge
                              variant={getJobStatus(job).variant}
                              className="text-[9px] md:text-xs py-0 h-4 md:h-5"
                            >
                              {getJobStatus(job).label}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-1.5 md:ml-2" />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 md:mt-4 text-green-600 hover:text-green-700 hover:bg-green-50 h-8 md:h-9 text-xs md:text-sm"
                    onClick={() => setShowCompanySelector(true)}
                  >
                    View All Jobs
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                  </Button>
                </>

              ) : (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-green-300" />
                  </div>
                  <p className="text-xs md:text-sm font-medium mb-1">No jobs posted yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Start hiring by posting a job</p>
                  <Button
                    size="sm"
                    onClick={() => setShowCompanySelector(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Posts */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
              <div className="flex items-center gap-2 mb-1">
                <Newspaper className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">Community Posts</CardTitle>
              </div>
              <CardDescription className="text-[10px] md:text-xs lg:text-sm">Your shared posts</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
              {communityPosts.length > 0 ? (
                <>
                  <div className="space-y-1.5 md:space-y-2">
                    {communityPosts.map((post) => (
                      <div
                        key={post.id}
                        className="group flex items-start justify-between p-2 md:p-3 border rounded-md md:rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer"
                        onClick={() => router.push(`/community/${post.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs md:text-sm lg:text-base text-foreground line-clamp-1 mb-0.5 md:mb-1">{post.title}</h4>
                          <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 mb-1.5 md:mb-2">
                            {post.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
                            {post.companyName && (
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <Building2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
                                <span className="truncate max-w-[80px] md:max-w-[100px]">
                                  {post.companyName}
                                </span>
                              </div>
                            )}
                            {post.location && (
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
                                <span className="truncate max-w-[60px] md:max-w-[80px]">
                                  {post.location}
                                </span>
                              </div>
                            )}
                            {(post.helpfulCount || 0) > 0 && (
                              <div className="flex items-center gap-0.5 md:gap-1">
                                <ThumbsUp className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
                                <span>{post.helpfulCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-1.5 md:ml-2" />
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 md:mt-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 md:h-9 text-xs md:text-sm"
                    onClick={() => router.push('/community/my-posts')}
                  >
                    View All Posts
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1" />
                  </Button>
                </>

              ) : (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 rounded-full bg-purple-50 flex items-center justify-center">
                    <Newspaper className="h-8 w-8 md:h-10 md:w-10 text-purple-300" />
                  </div>
                  <p className="text-xs md:text-sm font-medium mb-1">No posts yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Share your knowledge with the community</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/community/create')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">Quick Actions</CardTitle>
            </div>
            <CardDescription className="text-[10px] md:text-xs lg:text-sm">Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 lg:gap-4">
              <Button
                variant="outline"
                className="group h-auto py-3 md:py-4 lg:py-5 justify-start hover:border-blue-300 hover:bg-blue-50 transition-all"
                onClick={() => router.push('/jobs')}
              >
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-600" />
                </div>
                <div className="text-left ml-2 md:ml-3 flex-1">
                  <div className="font-semibold text-xs md:text-sm lg:text-base text-foreground">Browse Jobs</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Find opportunities</div>
                </div>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </Button>

              <Button
                variant="outline"
                className="group h-auto py-3 md:py-4 lg:py-5 justify-start hover:border-green-300 hover:bg-green-50 transition-all"
                onClick={() => setShowCompanySelector(true)}
              >
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-green-600" />
                </div>
                <div className="text-left ml-2 md:ml-3 flex-1">
                  <div className="font-semibold text-xs md:text-sm lg:text-base text-foreground">Post a Job</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Hire talent</div>
                </div>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </Button>

              <Button
                variant="outline"
                className="group h-auto py-3 md:py-4 lg:py-5 justify-start hover:border-purple-300 hover:bg-purple-50 transition-all"
                onClick={() => router.push('/profile')}
              >
                <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Users className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-purple-600" />
                </div>
                <div className="text-left ml-2 md:ml-3 flex-1">
                  <div className="font-semibold text-xs md:text-sm lg:text-base text-foreground">Update Profile</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">Keep info current</div>
                </div>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Selector Dialog */}
      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
