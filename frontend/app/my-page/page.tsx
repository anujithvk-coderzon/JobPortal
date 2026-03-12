'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { getInitials, timeAgo } from '@/lib/utils';
import { CredibilityBadge } from '@/components/CredibilityBadge';
import {
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Loader2,
  Building2,
  Clock,
  ThumbsUp,
  Eye,
  EyeOff,
  User,
  Search,
  X,
  Settings,
  TrendingUp,
  Play,
  ImageIcon,
  Plus,
  Shield,
  Edit,
  MessageSquarePlus,
} from 'lucide-react';

interface PrivacySettings {
  email: boolean;
  phone: boolean;
  location: boolean;
  bio: boolean;
  education: boolean;
  experience: boolean;
  skills: boolean;
}

interface CredibilityScore {
  level: string;
  score: number;
  nextLevel: string;
  nextLevelAt: number;
}

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  helpfulCount: number;
  createdAt: string;
  poster?: string;
  video?: string;
}

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [showPrivacyMobile, setShowPrivacyMobile] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [credibilityScore, setCredibilityScore] = useState<CredibilityScore>({
    level: 'Newbie', score: 0, nextLevel: 'Contributor', nextLevelAt: 10,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    email: false, phone: false, location: true, bio: true, education: true, experience: true, skills: true,
  });

  const calculateCredibilityScore = (helpfulCount: number): CredibilityScore => {
    if (helpfulCount >= 100) return { level: 'Authority', score: helpfulCount, nextLevel: 'Authority', nextLevelAt: 100 };
    if (helpfulCount >= 50) return { level: 'Expert', score: helpfulCount, nextLevel: 'Authority', nextLevelAt: 100 };
    if (helpfulCount >= 25) return { level: 'Trusted', score: helpfulCount, nextLevel: 'Expert', nextLevelAt: 50 };
    if (helpfulCount >= 10) return { level: 'Contributor', score: helpfulCount, nextLevel: 'Trusted', nextLevelAt: 25 };
    return { level: 'Newbie', score: helpfulCount, nextLevel: 'Contributor', nextLevelAt: 10 };
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchProfile();
    fetchPosts();
    fetchCompanies();
  }, [isAuthenticated, isHydrated, router]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.success) setCompanies(response.data.companies || []);
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfileData(response.data);
      if (response.data.profile?.privacySettings) {
        setPrivacySettings(response.data.profile.privacySettings);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = useCallback(async (page = 1, search = '') => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      const response = await api.get('/job-news/user/my-news', { params });
      const newPosts = response.data?.data?.jobNews || response.data?.jobNews || [];
      const pagination = response.data?.data?.pagination || response.data?.pagination || {};

      if (page === 1) {
        setPosts(newPosts);
        setCredibilityScore(calculateCredibilityScore(newPosts.reduce((s: number, p: Post) => s + (p.helpfulCount || 0), 0)));
      } else {
        const all = [...posts, ...newPosts];
        setPosts(all);
        setCredibilityScore(calculateCredibilityScore(all.reduce((s: number, p: Post) => s + (p.helpfulCount || 0), 0)));
      }
      setCurrentPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);
      setTotalPosts(pagination.total || 0);
      setHasMore(pagination.page < pagination.totalPages);
    } catch {
      if (page === 1) { setPosts([]); setTotalPosts(0); }
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  }, [posts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchDebounce) clearTimeout(searchDebounce);
    const timeout = setTimeout(() => { setLoadingPosts(true); setCurrentPage(1); fetchPosts(1, query); }, 500);
    setSearchDebounce(timeout);
  };

  const clearSearch = () => { setSearchQuery(''); setLoadingPosts(true); setCurrentPage(1); fetchPosts(1, ''); };

  const loadMorePosts = useCallback(async () => {
    if (loadingMorePosts || !hasMore) return;
    setLoadingMorePosts(true);
    await fetchPosts(currentPage + 1, searchQuery);
  }, [loadingMorePosts, hasMore, currentPage, searchQuery, fetchPosts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && hasMore && !loadingMorePosts && !loadingPosts) loadMorePosts();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingMorePosts, loadingPosts, loadMorePosts]);

  const handlePrivacyToggle = async (field: keyof PrivacySettings) => {
    let newSettings = { ...privacySettings, [field]: !privacySettings[field] };
    if (field === 'email') {
      newSettings = { ...newSettings, phone: !privacySettings[field], location: !privacySettings[field] };
    }
    setPrivacySettings(newSettings);
    setSavingPrivacy(true);
    try {
      await api.put('/users/privacy-settings', newSettings);
      toast({ title: 'Saved', description: 'Privacy settings updated' });
    } catch {
      setPrivacySettings(privacySettings);
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (!isHydrated || !isAuthenticated || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!profileData) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-[13px] text-muted-foreground">Profile not found</p></div>;
  }

  const profile = profileData.profile || {};
  const experiences = profile.experiences || [];
  const education = profile.education || [];
  const skills = profile.skills || [];

  const ToggleRow = ({ icon: Icon, label, field, count }: { icon: any; label: string; field: keyof PrivacySettings; count?: number }) => (
    <div className="flex items-center justify-between py-2.5 px-1">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <span className="text-[13px] font-medium block truncate">{label}</span>
          {count !== undefined && <span className="text-[11px] text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className={`text-[11px] font-medium ${privacySettings[field] ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {privacySettings[field] ? 'Visible' : 'Hidden'}
        </span>
        <Switch checked={privacySettings[field]} onCheckedChange={() => handlePrivacyToggle(field)} disabled={savingPrivacy} />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-border">
            <AvatarImage src={profileData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
            <AvatarFallback className="text-sm font-semibold">{getInitials(profileData.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">{profileData.name}</h1>
            <p className="text-[13px] text-muted-foreground truncate">{profile.headline || profileData.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="text-[12px] h-8" onClick={() => router.push('/profile')}>
            <Edit className="h-3 w-3 mr-1.5" />
            Edit Profile
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 lg:hidden" onClick={() => setShowPrivacyMobile(!showPrivacyMobile)}>
            <Shield className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile Privacy Panel */}
      {showPrivacyMobile && (
        <Card className="mb-4 lg:hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Privacy Controls</h2>
              </div>
              <button onClick={() => setShowPrivacyMobile(false)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Choose which sections of your profile are visible to other users and recruiters.</p>
            <div className="divide-y divide-border/60">
              <ToggleRow icon={Mail} label="Contact Info" field="email" />
              {profile.bio && <ToggleRow icon={User} label="About" field="bio" />}
              {skills.length > 0 && <ToggleRow icon={Award} label="Skills" field="skills" count={skills.length} />}
              {experiences.length > 0 && <ToggleRow icon={Briefcase} label="Experience" field="experience" count={experiences.length} />}
              {education.length > 0 && <ToggleRow icon={GraduationCap} label="Education" field="education" count={education.length} />}
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left — Posts */}
        <div>
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xl font-semibold">{totalPosts}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xl font-semibold">{credibilityScore.score}</p>
              <p className="text-[11px] text-muted-foreground">Helpful Marks</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-1.5">
                <CredibilityBadge credibilityScore={credibilityScore} size="sm" showProgress={false} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Reputation</p>
            </div>
          </div>

          {/* Search + Create */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 pr-8 h-9 text-[13px]"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 text-[13px]">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Create Post</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/community/create')}>
                  <MessageSquarePlus className="mr-2 h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-[13px] font-medium">Community Post</p>
                    <p className="text-[11px] text-muted-foreground">Share job tips, news & alerts</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Post Official Job</DropdownMenuLabel>
                {companies.length === 0 ? (
                  <>
                    <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Create your company first</p>
                    <DropdownMenuItem onClick={() => router.push('/company/create')}>
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="text-[13px]">Create Company</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {companies.map((c) => (
                      <DropdownMenuItem key={c.id} onClick={() => router.push(`/jobs/post?companyId=${c.id}`)}>
                        <Briefcase className="mr-2 h-4 w-4 text-emerald-600" />
                        <span className="text-[13px]">{c.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/company/create')}>
                      <Plus className="mr-2 h-4 w-4" />
                      <span className="text-[13px]">Add Company</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {searchQuery && (
            <p className="text-[11px] text-muted-foreground mb-3">
              {loadingPosts ? 'Searching...' : `${totalPosts} result${totalPosts !== 1 ? 's' : ''} for "${searchQuery}"`}
            </p>
          )}

          {/* Posts List */}
          <div ref={scrollRef} className="space-y-2">
            {loadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border bg-card text-center py-12">
                <div className="h-10 w-10 mx-auto mb-3 rounded-lg bg-muted flex items-center justify-center">
                  <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium mb-1">{searchQuery ? 'No matching posts' : 'No posts yet'}</p>
                <p className="text-[12px] text-muted-foreground mb-4">{searchQuery ? 'Try a different search' : 'Share job leads and tips with the community'}</p>
                {!searchQuery && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Post
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      <DropdownMenuItem onClick={() => router.push('/community/create')}>
                        <MessageSquarePlus className="mr-2 h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[13px] font-medium">Community Post</p>
                          <p className="text-[11px] text-muted-foreground">Share job tips, news & alerts</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Post Official Job</DropdownMenuLabel>
                      {companies.length === 0 ? (
                        <>
                          <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Create your company first</p>
                          <DropdownMenuItem onClick={() => router.push('/company/create')}>
                            <Building2 className="mr-2 h-4 w-4" />
                            <span className="text-[13px]">Create Company</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        companies.map((c) => (
                          <DropdownMenuItem key={c.id} onClick={() => router.push(`/jobs/post?companyId=${c.id}`)}>
                            <Briefcase className="mr-2 h-4 w-4 text-emerald-600" />
                            <span className="text-[13px]">{c.name}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/community/${post.id}`)}
                    className="rounded-lg border bg-card hover:border-primary/20 transition-colors cursor-pointer overflow-hidden"
                  >
                    <div className="flex">
                      {(post.poster || post.video) && (
                        <div className="relative flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24 bg-muted">
                          {post.poster ? (
                            <img src={post.poster} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                          )}
                          {post.video && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="bg-white/90 rounded-full p-1"><Play className="h-3 w-3 text-black fill-black" /></div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3 sm:p-4 flex-1 min-w-0">
                        <h3 className="text-[13px] font-medium mb-1 line-clamp-2 leading-snug">{post.title}</h3>
                        <p className="text-[12px] text-muted-foreground mb-2 line-clamp-2 leading-relaxed">{post.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeAgo(post.createdAt)}
                          </span>
                          {post.companyName && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              <Building2 className="h-2.5 w-2.5 mr-0.5" />
                              <span className="truncate max-w-[80px]">{post.companyName}</span>
                            </Badge>
                          )}
                          {post.helpfulCount > 0 && (
                            <Badge variant="default" className="text-[10px] h-5 px-1.5">
                              <ThumbsUp className="h-2.5 w-2.5 mr-0.5" />
                              {post.helpfulCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {loadingMorePosts && (
                  <div className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                  </div>
                )}

                {!hasMore && posts.length > 0 && !loadingMorePosts && (
                  <p className="text-center text-[11px] text-muted-foreground py-4 border-t border-border/60">
                    All {totalPosts} posts loaded
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar — Privacy + Reputation */}
        <div className="hidden lg:block space-y-4">
          {/* Privacy Controls */}
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Privacy Controls</h2>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Choose which sections are visible to other users and recruiters.
              </p>
              <div className="divide-y divide-border/60">
                <ToggleRow icon={Mail} label="Contact Info" field="email" />
                {profile.bio && <ToggleRow icon={User} label="About" field="bio" />}
                {skills.length > 0 && <ToggleRow icon={Award} label="Skills" field="skills" count={skills.length} />}
                {experiences.length > 0 && <ToggleRow icon={Briefcase} label="Experience" field="experience" count={experiences.length} />}
                {education.length > 0 && <ToggleRow icon={GraduationCap} label="Education" field="education" count={education.length} />}
              </div>
            </div>
          </Card>

          {/* Reputation */}
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Reputation</h2>
              </div>

              <div className="flex items-center justify-between mb-3">
                <CredibilityBadge credibilityScore={credibilityScore} size="sm" showProgress={false} />
                <div className="text-right">
                  <p className="text-lg font-semibold">{credibilityScore.score}</p>
                  <p className="text-[11px] text-muted-foreground">helpful marks</p>
                </div>
              </div>

              {credibilityScore.level !== 'Authority' && (
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Next: {credibilityScore.nextLevel}</span>
                    <span className="font-medium">{credibilityScore.score}/{credibilityScore.nextLevelAt}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary rounded-full h-1.5 transition-all"
                      style={{ width: `${Math.min((credibilityScore.score / credibilityScore.nextLevelAt) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Links */}
          <Card>
            <div className="p-4 space-y-1">
              <button
                onClick={() => router.push('/profile')}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit Profile
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                    Create New Post
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => router.push('/community/create')}>
                    <MessageSquarePlus className="mr-2 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-[13px] font-medium">Community Post</p>
                      <p className="text-[11px] text-muted-foreground">Share job tips, news & alerts</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Post Official Job</DropdownMenuLabel>
                  {companies.length === 0 ? (
                    <>
                      <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Create your company first</p>
                      <DropdownMenuItem onClick={() => router.push('/company/create')}>
                        <Building2 className="mr-2 h-4 w-4" />
                        <span className="text-[13px]">Create Company</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    companies.map((c) => (
                      <DropdownMenuItem key={c.id} onClick={() => router.push(`/jobs/post?companyId=${c.id}`)}>
                        <Briefcase className="mr-2 h-4 w-4 text-emerald-600" />
                        <span className="text-[13px]">{c.name}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
