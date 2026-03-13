'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CompanySelector } from '@/components/CompanySelector';
import { JobMatchScore } from '@/components/JobMatchScore';
import { Logo, LogoSmall } from '@/components/Logo';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  Users,
  ThumbsUp,
  Loader2,
  Shield,
  Globe,
  ChevronRight,
  FileText,
  Target,
  Sparkles,
  Bell,
  Lock,
} from 'lucide-react';
import { useJobNews } from '@/hooks/use-job-news';
import { useJobs } from '@/hooks/use-jobs';
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
  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const { data: postsData, isLoading: loadingPosts } = useJobNews({ page: 1, limit: 6 });
  const { data: jobsData, isLoading: loadingJobs } = useJobs({ page: 1, limit: 6, sortBy: isAuthenticated ? 'match' : 'recent' });

  const recentPosts: Post[] = postsData?.jobNews || [];
  const recentJobs: Job[] = jobsData?.jobs || [];

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

        {/* Community */}
        <div className="mb-8">
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

        {/* Recent Jobs */}
        <div>
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

        <CompanySelector isOpen={showCompanySelector} onClose={() => setShowCompanySelector(false)} />
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Non-authenticated — Compact Landing Page
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-[16px] tracking-tight">job<span className="text-indigo-500">aye</span></span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex h-8" asChild>
              <Link href="/jobs">Jobs</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hidden sm:flex h-8" asChild>
              <Link href="/community">Community</Link>
            </Button>
            <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
            <Button variant="ghost" size="sm" className="text-[13px] h-8" asChild>
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button size="sm" className="text-[13px] h-8 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero — Two Column ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.06),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-14">
            {/* Left — Headline & CTA */}
            <div className="flex-1 max-w-xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.1] mb-4">
                Find jobs, share insights,{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                  grow your career
                </span>
              </h1>
              <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed mb-6">
                Browse verified job openings, get AI match scores, and join a community of professionals sharing real career insights.
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button size="sm" className="h-9 px-5 text-[13px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" asChild>
                  <Link href="/auth/register">
                    Create Free Account
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="h-9 px-5 text-[13px]" asChild>
                  <Link href="/jobs">Browse Jobs</Link>
                </Button>
              </div>
            </div>

            {/* Right — Feature cards */}
            <div className="grid grid-cols-2 gap-2.5 lg:w-[380px] flex-shrink-0">
              {[
                { icon: Target, title: 'AI Match Scores', desc: 'See how well you fit each role' },
                { icon: Lock, title: 'Privacy Control', desc: 'Choose what employers see' },
                { icon: Users, title: 'Community', desc: 'Tips & leads from professionals' },
                { icon: Globe, title: 'Remote & On-site', desc: 'Jobs from anywhere' },
                { icon: Sparkles, title: 'Smart Search', desc: 'Filter by skills, salary & more' },
                { icon: Bell, title: 'Track Applications', desc: 'Status updates in real time' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-border/50 bg-card/80">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold leading-tight">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works — Compact Strip ── */}
      <section className="bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-5 text-center">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { num: '1', title: 'Create your profile', desc: 'Add your skills, experience, and preferences to get personalized job matches.' },
              { num: '2', title: 'Discover & apply', desc: 'Browse jobs with smart filters, see AI match scores, and apply in one click.' },
              { num: '3', title: 'Track & grow', desc: 'Monitor applications, get interview updates, and learn from the community.' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[12px] font-bold">{step.num}</span>
                <div>
                  <p className="text-[13px] font-semibold leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Posts ── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Community Insights</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">Career tips and job leads from professionals</p>
            </div>
            {recentPosts.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground h-8" asChild>
                <Link href="/community">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
          </div>

          {loadingPosts ? <LoadingState /> : recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentPosts.slice(0, 3).map((post) => (
                <Card key={post.id} className="border-border/60 hover:border-border hover:shadow-sm transition-all cursor-pointer bg-card" onClick={() => router.push(`/community/${post.id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-[13px] font-semibold line-clamp-2 leading-snug">{post.title}</h3>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">{post.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4"><AvatarImage src={post.user.profilePhoto || undefined} /><AvatarFallback className="text-[8px]">{getInitials(post.user.name)}</AvatarFallback></Avatar>
                        <span className="line-clamp-1">{post.user.name}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>{timeAgo(post.createdAt)}</span>
                      </div>
                      {(post.helpfulCount ?? 0) > 0 && <span className="flex items-center gap-0.5 text-emerald-600"><ThumbsUp className="h-2.5 w-2.5" />{post.helpfulCount}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed"><CardContent className="py-8 text-center">
              <Users className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[13px] font-medium mb-0.5">No posts yet</p>
              <p className="text-[12px] text-muted-foreground">Join to share and discover career insights.</p>
            </CardContent></Card>
          )}
        </div>
      </section>

      {/* ── Recent Jobs ── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">Latest Jobs</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">Fresh opportunities added every day</p>
            </div>
            {recentJobs.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground h-8" asChild>
                <Link href="/jobs">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
          </div>

          {loadingJobs ? <LoadingState /> : recentJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentJobs.slice(0, 6).map((job) => {
                const cName = job.company?.name || job.companyName || 'Company';
                const cInitial = cName.charAt(0).toUpperCase();
                return (
                  <Card
                    key={job.id}
                    className="group border border-border/60 hover:border-border hover:shadow-sm transition-all cursor-pointer bg-card"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-border/40 flex items-center justify-center flex-shrink-0">
                          {job.company?.logo ? (
                            <img src={job.company.logo} alt={cName} className="h-5 w-5 rounded object-contain" />
                          ) : (
                            <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{cInitial}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold line-clamp-1 leading-snug">{job.title}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{cName}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground mb-2.5">
                        {job.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="line-clamp-1">{job.location}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
                          {job.employmentType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 rounded px-1.5 py-0">
                            {job.experienceLevel.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 rounded px-1.5 py-0">
                            {job.locationType}
                          </Badge>
                        </div>
                        {job.salaryMin ? (
                          <p className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryPeriod)}
                          </p>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-border/60"><CardContent className="py-8 text-center">
              <Briefcase className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-[13px] font-medium mb-0.5">No jobs posted yet</p>
              <p className="text-[12px] text-muted-foreground">Check back soon for new opportunities.</p>
            </CardContent></Card>
          )}
        </div>
      </section>

      {/* ── Why jobaye ── */}
      <section className="bg-slate-50/50 dark:bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Why professionals choose jobaye</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Target, value: 'AI Matching', desc: 'Get a compatibility score for every job based on your profile and skills' },
              { icon: Users, value: 'Active Community', desc: 'Real professionals sharing salary insights, interview tips, and job leads daily' },
              { icon: FileText, value: 'One-Click Apply', desc: 'Apply to multiple jobs instantly with your saved profile and resume' },
              { icon: Bell, value: 'Real-Time Updates', desc: 'Get notified the moment your application status changes' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/80 text-center">
                <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
                <p className="text-[13px] font-semibold mb-1">{item.value}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — Slim ── */}
      <section className="bg-slate-900 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Ready to get started?
            </h2>
            <div className="flex items-center gap-2.5">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 h-9 px-5 text-[13px] font-semibold" asChild>
                <Link href="/auth/register">
                  Create Account
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/10 h-9 text-[13px]" asChild>
                <Link href="/auth/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <LogoSmall size={22} />
              <span className="text-[13px] font-bold tracking-tight">job<span className="text-indigo-500">aye</span></span>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <span>&copy; {new Date().getFullYear()} jobaye</span>
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
