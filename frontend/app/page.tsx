'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompanySelector } from '@/components/CompanySelector';
import { JobMatchScore } from '@/components/JobMatchScore';
import {
  Briefcase,
  MapPin,
  Building2,
  Clock,
  ArrowRight,
  Users,
  ThumbsUp,
  Loader2,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  Star,
  FileText,
  Target,
  Sparkles,
  BarChart3,
  Lock,
} from 'lucide-react';
import { jobNewsAPI, jobAPI } from '@/lib/api';
import { EmploymentType, ExperienceLevel, LocationType } from '@/lib/types';
import { timeAgo, getInitials, formatSalary } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  poster?: string;
  video?: string;
  createdAt: string;
  helpfulCount?: number;
  user: { id: string; name: string; profilePhoto?: string };
}

interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  locationType: LocationType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  showSalary?: boolean;
  createdAt: string;
  company?: { id: string; name: string; logo?: string };
  companyName?: string;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  useEffect(() => {
    fetchRecentPosts();
    fetchRecentJobs();
  }, []);

  const fetchRecentPosts = async () => {
    try {
      const response = await jobNewsAPI.getAllJobNews({ page: 1, limit: 6 });
      setRecentPosts(response.data.data.jobNews || []);
    } catch {} finally { setLoadingPosts(false); }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await jobAPI.getAllJobs({ page: 1, limit: 6 });
      setRecentJobs(response.data.data.jobs || []);
    } catch {} finally { setLoadingJobs(false); }
  };

  // ═══════════════════════════════════════════
  // Authenticated — Welcome Home with sidebar
  // ═══════════════════════════════════════════
  if (isAuthenticated) {
    const firstName = user?.name?.split(' ')[0] || 'there';
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Hero Banner */}
        <div className="relative rounded-xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          <div className="relative px-6 sm:px-8 py-8 sm:py-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-slate-400 text-[13px] font-medium mb-1">Welcome back, {firstName}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-2">
                  Find your next <span className="text-indigo-300">opportunity</span>
                </h1>
                <p className="text-slate-400 text-[14px] max-w-md">
                  Search thousands of jobs, track applications, and grow with the community.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] h-9 px-4" onClick={() => router.push('/jobs')}>
                  <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Browse Jobs
                </Button>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent text-[13px] h-9 px-4" onClick={() => router.push('/applications')}>
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> My Applications
                </Button>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent text-[13px] h-9 px-4" onClick={() => router.push('/community')}>
                  <Users className="h-3.5 w-3.5 mr-1.5" /> Community
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Recent Job Openings</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Latest opportunities from top companies</p>
            </div>
            {recentJobs.length > 0 && (
              <Button variant="outline" size="sm" className="text-[13px] text-muted-foreground h-8" asChild>
                <Link href="/jobs">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
          </div>
          {loadingJobs ? <LoadingState /> : recentJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {recentJobs.map((job) => {
                const companyName = job.company?.name || job.companyName || 'Company';
                const companyInitial = companyName.charAt(0).toUpperCase();
                return (
                  <Card
                    key={job.id}
                    className="group border border-border/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-200 cursor-pointer bg-card"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-0">
                      {/* Card header with company info */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start gap-3.5 mb-4">
                          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border/40 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                            {job.company?.logo ? (
                              <img src={job.company.logo} alt={companyName} className="h-7 w-7 rounded-md object-contain" />
                            ) : (
                              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{companyInitial}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug text-foreground group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{companyName}</p>
                          </div>
                        </div>

                        {/* Info row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground mb-3.5">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="line-clamp-1">{job.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3 flex-shrink-0" />
                            {job.employmentType.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3 flex-shrink-0" />
                            {job.locationType}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 rounded-md px-2 py-0.5">
                            {job.experienceLevel.replace('_', ' ')}
                          </Badge>
                          <div onClick={(e) => e.stopPropagation()}>
                            <JobMatchScore jobId={job.id} variant="badge" />
                          </div>
                        </div>
                      </div>

                      {/* Card footer */}
                      <div className="px-5 py-3 border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                        {job.salaryMin && job.showSalary !== false ? (
                          <p className="text-[13px] font-semibold text-foreground">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                          </p>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/60">Salary not disclosed</span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(job.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-border/60"><CardContent className="py-14 text-center">
              <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-[13px] font-medium mb-1">No job openings yet</p>
              <p className="text-[12px] text-muted-foreground">Check back soon for new opportunities.</p>
            </CardContent></Card>
          )}
        </div>

        {/* Community */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Community Highlights</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Job tips, news, and insights from professionals</p>
            </div>
            {recentPosts.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground" asChild>
                <Link href="/community">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
          </div>
          {loadingPosts ? <LoadingState /> : recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {recentPosts.map((post) => (
                <Card key={post.id} className="hover:border-primary/30 transition-all cursor-pointer" onClick={() => router.push(`/community/${post.id}`)}>
                  <CardContent className="p-4 space-y-2.5">
                    <h3 className="text-[13px] font-semibold line-clamp-2 leading-snug">{post.title}</h3>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Avatar className="h-5 w-5"><AvatarImage src={post.user.profilePhoto || undefined} /><AvatarFallback className="text-[9px]">{getInitials(post.user.name)}</AvatarFallback></Avatar>
                      <span className="line-clamp-1">{post.user.name}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(post.createdAt)}</span>
                      {(post.helpfulCount ?? 0) > 0 && <span className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="h-3 w-3" />{post.helpfulCount}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="py-10 text-center">
              <Users className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[13px] font-medium mb-1">No posts yet</p>
              <p className="text-[12px] text-muted-foreground">Join the community to share and discover insights.</p>
            </CardContent></Card>
          )}
        </div>

        <CompanySelector isOpen={showCompanySelector} onClose={() => setShowCompanySelector(false)} />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Non-authenticated — Enterprise Landing Page
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5 text-white dark:text-slate-900" />
            </div>
            <span className="font-bold text-[17px] tracking-tight">JobConnect</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex" asChild>
              <Link href="/jobs">Jobs</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex" asChild>
              <Link href="/community">Community</Link>
            </Button>
            <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
            <Button variant="ghost" size="sm" className="text-[13px]" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button size="sm" className="text-[13px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-slate-200/40 dark:from-slate-800/30 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 lg:pt-36 pb-20 sm:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/60 bg-card text-[12px] font-medium text-muted-foreground mb-8">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Trusted by thousands of professionals
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              <span className="block text-foreground">Your career journey</span>
              <span className="block text-foreground">starts with</span>
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
                  JobConnect
                </span>
                <div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 rounded-full opacity-80" />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12">
              Discover verified job openings, get AI-powered match scores, and join a professional community — all on one enterprise-grade platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <Button size="lg" className="h-12 px-8 text-[15px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg shadow-slate-900/10 dark:shadow-white/10" asChild>
                <Link href="/auth/register">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-[15px] font-medium border-border" asChild>
                <Link href="/jobs">
                  Browse Open Positions
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { icon: TrendingUp, label: 'Updated daily', sublabel: 'Fresh listings' },
                { icon: Shield, label: 'Verified companies', sublabel: 'Trusted employers' },
                { icon: Globe, label: 'Remote & on-site', sublabel: 'Global reach' },
                { icon: Target, label: 'AI match scores', sublabel: 'Smart matching' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/40 bg-card/50">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <item.icon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">How it works</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">Get hired in three simple steps</h2>
            <p className="text-[15px] text-muted-foreground max-w-lg mx-auto">From profile creation to landing your dream role — streamlined and efficient.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[
              { step: '01', icon: Star, title: 'Build Your Profile', desc: 'Create your professional profile, upload your resume, and define your career preferences in minutes.' },
              { step: '02', icon: Sparkles, title: 'Discover & Apply', desc: 'Browse curated listings with intelligent filters, review AI match scores, and apply with a single click.' },
              { step: '03', icon: BarChart3, title: 'Track & Grow', desc: 'Monitor every application, receive interview notifications, and engage with the professional community.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center mb-5 shadow-lg">
                  <item.icon className="h-6 w-6 text-white dark:text-slate-900" />
                </div>
                <span className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase mb-2.5 block">Step {item.step}</span>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-border/60" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-14">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Platform</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">Everything you need, one platform</h2>
            <p className="text-[15px] text-muted-foreground max-w-lg mx-auto">Built for job seekers, employers, and the professional community.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 max-w-5xl mx-auto">
            {[
              { icon: Briefcase, title: 'Smart Job Search', desc: 'Filter by role, location, salary, and experience level. Find exactly what you are looking for.' },
              { icon: Building2, title: 'Verified Companies', desc: 'Every listing from a verified employer. Transparent company profiles and genuine opportunities.' },
              { icon: Users, title: 'Professional Community', desc: 'Career tips, salary insights, and job leads shared by real professionals every day.' },
              { icon: Target, title: 'AI Match Scores', desc: 'See how well you fit each role based on your profile, skills, and work experience.' },
              { icon: FileText, title: 'Application Tracking', desc: 'Track every application, interview schedule, and follow-up from your personal dashboard.' },
              { icon: Lock, title: 'Privacy & Control', desc: 'Full control over what employers see. Toggle visibility for every section of your profile.' },
            ].map((feature, i) => (
              <Card key={i} className="border border-border/60 hover:border-border hover:shadow-md transition-all group bg-card">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                    <feature.icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Jobs ── */}
      <section className="border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live listings
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Latest Job Openings</h2>
              <p className="text-[14px] text-muted-foreground">Fresh opportunities added every day</p>
            </div>
            {recentJobs.length > 0 && (
              <Button variant="outline" size="sm" className="text-[13px] hidden sm:flex" asChild>
                <Link href="/jobs">View all jobs <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
              </Button>
            )}
          </div>

          {loadingJobs ? <LoadingState /> : recentJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentJobs.map((job) => {
                  const cName = job.company?.name || job.companyName || 'Company';
                  const cInitial = cName.charAt(0).toUpperCase();
                  return (
                    <Card
                      key={job.id}
                      className="group border border-border/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-200 cursor-pointer bg-card"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5 pb-4">
                          <div className="flex items-start gap-3.5 mb-4">
                            <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border/40 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                              {job.company?.logo ? (
                                <img src={job.company.logo} alt={cName} className="h-7 w-7 rounded-md object-contain" />
                              ) : (
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{cInitial}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug text-foreground group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {job.title}
                              </h3>
                              <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">{cName}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground mb-3.5">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="line-clamp-1">{job.location}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3 flex-shrink-0" />
                              {job.employmentType.replace('_', ' ')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3 flex-shrink-0" />
                              {job.locationType}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 rounded-md px-2 py-0.5">
                              {job.experienceLevel.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>

                        <div className="px-5 py-3 border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
                          {job.salaryMin ? (
                            <p className="text-[13px] font-semibold text-foreground">
                              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                            </p>
                          ) : (
                            <span className="text-[12px] text-muted-foreground/60">Salary not disclosed</span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeAgo(job.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="text-center mt-8 sm:hidden">
                <Button variant="outline" size="sm" className="text-[13px]" asChild>
                  <Link href="/jobs">View all jobs <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-dashed border-border/60"><CardContent className="py-14 text-center">
              <div className="h-12 w-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Briefcase className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium mb-1">No jobs posted yet</p>
              <p className="text-[13px] text-muted-foreground">Check back soon for new opportunities.</p>
            </CardContent></Card>
          )}
        </div>
      </section>

      {/* ── Community ── */}
      <section className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Community</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">From the Community</h2>
              <p className="text-[14px] text-muted-foreground">Job tips, career advice, and insights from professionals</p>
            </div>
            {recentPosts.length > 0 && (
              <Button variant="outline" size="sm" className="text-[13px] hidden sm:flex" asChild>
                <Link href="/community">View all <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
              </Button>
            )}
          </div>

          {loadingPosts ? <LoadingState /> : recentPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPosts.map((post) => (
                  <Card key={post.id} className="border-border/60 hover:border-border hover:shadow-md transition-all cursor-pointer bg-card" onClick={() => router.push(`/community/${post.id}`)}>
                    <CardContent className="p-5 space-y-2.5">
                      <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug">{post.title}</h3>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Avatar className="h-5 w-5"><AvatarImage src={post.user.profilePhoto || undefined} /><AvatarFallback className="text-[9px]">{getInitials(post.user.name)}</AvatarFallback></Avatar>
                        <span className="line-clamp-1">{post.user.name}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(post.createdAt)}</span>
                        {(post.helpfulCount ?? 0) > 0 && <span className="flex items-center gap-1 text-emerald-600"><ThumbsUp className="h-3 w-3" />{post.helpfulCount}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8 sm:hidden">
                <Button variant="outline" size="sm" className="text-[13px]" asChild>
                  <Link href="/community">View all posts <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-dashed"><CardContent className="py-14 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium mb-1">No posts yet</p>
              <p className="text-[13px] text-muted-foreground">Join the community to share and discover insights.</p>
            </CardContent></Card>
          )}
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-t border-border/40 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Active job seekers' },
              { value: '500+', label: 'Verified companies' },
              { value: '2K+', label: 'Jobs posted monthly' },
              { value: '95%', label: 'Satisfaction rate' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-slate-900 dark:bg-slate-800" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

            <div className="relative px-6 sm:px-14 py-16 sm:py-20 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[12px] font-medium text-white/70 mb-6">
                <Zap className="h-3.5 w-3.5" /> Free forever. No credit card required.
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                Ready to advance your career?
              </h2>
              <p className="text-[15px] text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
                Join thousands of professionals who found their next opportunity through JobConnect. Create your account in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-12 px-8 text-[15px] font-semibold shadow-xl" asChild>
                  <Link href="/auth/register">
                    Get Started — It&apos;s Free
                    <ChevronRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="text-slate-300 hover:bg-white/10 h-12 px-8 text-[15px]" asChild>
                  <Link href="/auth/login">Already have an account?</Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 mt-10 text-[13px] text-slate-500">
                <div className="flex -space-x-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-7 w-7 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="ml-1">Joined by 10,000+ professionals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 text-white dark:text-slate-900" />
              </div>
              <span className="text-[14px] font-bold tracking-tight">JobConnect</span>
            </div>
            <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span>&copy; {new Date().getFullYear()} JobConnect</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
