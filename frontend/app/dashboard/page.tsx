'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
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
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Newspaper,
  ThumbsUp,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';
import { CompanySelector } from '@/components/CompanySelector';

interface DashboardStats {
  myApplicationsCount?: number;
  applicationsByStatus?: Record<string, number>;
  savedJobsCount?: number;
  profileCompletion?: number;
  recentApplications?: any[];
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
  _count?: { jobs: number };
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

const getJobStatus = (job: any) => {
  if (!job.isActive) return { label: 'Inactive', variant: 'secondary' as const };
  if (job.applicationDeadline) {
    const deadline = new Date(job.applicationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < today) return { label: 'Expired', variant: 'destructive' as const };
  }
  return { label: 'Active', variant: 'success' as const };
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
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchDashboardData();
  }, [isAuthenticated, isHydrated, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDashboardStats(), fetchCompanies(), fetchCommunityPosts(), fetchProfile()]);
    } catch {} finally { setLoading(false); }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/applications/dashboard');
      if (response.success) setStats(response.data);
    } catch { setStats({}); }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.success) setCompanies(response.data?.companies || response.data?.data?.companies || []);
    } catch { setCompanies([]); }
  };

  const fetchCommunityPosts = async () => {
    try {
      const response = await api.get('/job-news/user/my-news', { params: { page: 1, limit: 3 } });
      if (response.success) setCommunityPosts(response.data?.jobNews || response.data?.data?.jobNews || []);
    } catch { setCommunityPosts([]); }
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
    } catch { setProfileData(null); }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HIRED': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'INTERVIEW_SCHEDULED': return <Calendar className="h-3.5 w-3.5 text-primary" />;
      default: return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

  const timeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  if (!isHydrated || !isAuthenticated || !user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalApplications = stats.myApplicationsCount || 0;
  const totalJobs = stats.myJobsCount || 0;
  const totalAppReceived = stats.applicationsToMyJobs || 0;
  const pendingApps = stats.pendingApplicationsCount || 0;
  const recentAppsReceived = stats.recentApplicationsReceived || [];

  const statCards = [
    {
      label: 'Applications',
      value: totalApplications,
      icon: FileText,
      color: 'text-primary bg-primary/8',
      onClick: () => router.push('/applications'),
    },
    {
      label: 'Saved Jobs',
      value: stats.savedJobsCount || 0,
      icon: Briefcase,
      color: 'text-violet-600 bg-violet-500/8',
      onClick: () => router.push('/applications?tab=saved'),
    },
    {
      label: 'Jobs Posted',
      value: totalJobs,
      sub: `${stats.activeJobsCount || 0} active`,
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-500/8',
      onClick: () => setShowCompanySelector(true),
    },
    {
      label: 'Pending Review',
      value: pendingApps,
      sub: `${totalAppReceived} total`,
      icon: Users,
      color: 'text-amber-600 bg-amber-500/8',
      highlight: pendingApps > 0,
      onClick: () => setShowCompanySelector(true),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Welcome back, {user.name?.split(' ')[0]}
        </h2>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening across your workspace
        </p>
      </div>

      {/* Profile Completion */}
      {profileData && <ProfileCompletionCard user={user} profile={profileData} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className={`group text-left rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40 ${
              stat.highlight ? 'border-amber-300/60' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              {stat.highlight && pendingApps > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{stat.label}</p>
            {stat.sub && (
              <p className="text-[11px] text-muted-foreground/70">{stat.sub}</p>
            )}
          </button>
        ))}
      </div>

      {/* Pending Applications Alert */}
      {pendingApps > 0 && recentAppsReceived.length > 0 && (
        <Card className="border-l-2 border-l-amber-500">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-semibold">Pending Applications</h3>
                <Badge variant="warning" className="text-[10px]">{recentAppsReceived.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-amber-600" onClick={() => setShowCompanySelector(true)}>
                View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {recentAppsReceived.slice(0, 5).map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => router.push(`/jobs/${app.job.id}/applications`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-accent/50 transition-colors text-left"
                >
                  {app.applicant?.profilePhoto ? (
                    <img
                      src={app.applicant.profilePhoto}
                      alt={app.applicant.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary text-xs font-semibold">
                      {app.applicant?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{app.applicant?.name || 'Unknown'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{app.job?.title} · {timeAgo(app.appliedAt)}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Companies */}
        <Card>
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[13px] font-semibold">Companies</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push('/company/create')}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {companies.length > 0 ? (
              <div className="space-y-1">
                {companies.slice(0, 5).map((company) => (
                  <button
                    key={company.id}
                    onClick={() => router.push(`/company/${company.id}`)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                  >
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-7 h-7 rounded-md object-cover flex-shrink-0 border" />
                    ) : (
                      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{company.name}</p>
                      <p className="text-[11px] text-muted-foreground">{company._count?.jobs || 0} jobs</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-9 w-9 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium mb-1">No companies</p>
                <p className="text-[12px] text-muted-foreground mb-3">Create your first company profile</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/company/create')}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold">Recent Jobs</h3>
            </div>
            {stats.recentJobs && stats.recentJobs.length > 0 ? (
              <div className="space-y-1">
                {stats.recentJobs.map((job: any) => {
                  const status = getJobStatus(job);
                  return (
                    <button
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="w-full p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{job.title}</p>
                          <p className="text-[11px] text-muted-foreground">{job.company?.name || 'Company'}</p>
                        </div>
                        <Badge variant={status.variant} className="text-[10px] flex-shrink-0">{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[11px] text-muted-foreground">{job._count?.applications || 0} applicants</span>
                      </div>
                    </button>
                  );
                })}
                <Button variant="ghost" size="sm" className="w-full mt-1 h-7 text-[12px]" onClick={() => setShowCompanySelector(true)}>
                  View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-9 w-9 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium mb-1">No jobs posted</p>
                <p className="text-[12px] text-muted-foreground mb-3">Start hiring by posting a job</p>
                <Button size="sm" variant="outline" onClick={() => setShowCompanySelector(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Post Job
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Community */}
        <Card>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold">Community</h3>
            </div>
            {communityPosts.length > 0 ? (
              <div className="space-y-1">
                {communityPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => router.push(`/community/${post.id}`)}
                    className="w-full p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
                  >
                    <p className="text-[13px] font-medium line-clamp-1">{post.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{post.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      {post.companyName && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3" /> {post.companyName}
                        </span>
                      )}
                      {(post.helpfulCount || 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {post.helpfulCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-1 h-7 text-[12px]" onClick={() => router.push('/community/my-posts')}>
                  View All <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-9 w-9 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                  <Newspaper className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium mb-1">No posts yet</p>
                <p className="text-[12px] text-muted-foreground mb-3">Share with the community</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/community/create')}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Post
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Browse Jobs', desc: 'Find opportunities', icon: Briefcase, color: 'text-primary bg-primary/8', href: '/jobs' },
          { label: 'Post a Job', desc: 'Hire talent', icon: Plus, color: 'text-emerald-600 bg-emerald-500/8', action: () => setShowCompanySelector(true) },
          { label: 'Edit Profile', desc: 'Keep info current', icon: Users, color: 'text-violet-600 bg-violet-500/8', href: '/profile' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action || (() => router.push(item.href!))}
            className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-left"
          >
            <div className={`h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <CompanySelector isOpen={showCompanySelector} onClose={() => setShowCompanySelector(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}
