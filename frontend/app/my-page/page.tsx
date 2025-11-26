'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Settings,
  TrendingUp,
  Play,
  ImageIcon,
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
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [credibilityScore, setCredibilityScore] = useState<CredibilityScore>({
    level: 'Newbie',
    score: 0,
    nextLevel: 'Contributor',
    nextLevelAt: 10,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    email: false,
    phone: false,
    location: true,
    bio: true,
    education: true,
    experience: true,
    skills: true,
  });

  // Calculate credibility score from posts
  const calculateCredibilityScore = (helpfulCount: number): CredibilityScore => {
    let level = 'Newbie';
    let nextLevel = 'Contributor';
    let nextLevelAt = 10;

    if (helpfulCount >= 100) {
      level = 'Authority';
      nextLevel = 'Authority';
      nextLevelAt = 100;
    } else if (helpfulCount >= 50) {
      level = 'Expert';
      nextLevel = 'Authority';
      nextLevelAt = 100;
    } else if (helpfulCount >= 25) {
      level = 'Trusted';
      nextLevel = 'Expert';
      nextLevelAt = 50;
    } else if (helpfulCount >= 10) {
      level = 'Contributor';
      nextLevel = 'Trusted';
      nextLevelAt = 25;
    }

    return { level, score: helpfulCount, nextLevel, nextLevelAt };
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
    fetchPosts();
  }, [isAuthenticated, isHydrated, router]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data;
      setProfileData(userData);
      if (userData.profile?.privacySettings) {
        setPrivacySettings(userData.profile.privacySettings);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
        // Calculate total helpful marks from all posts
        const totalHelpfulMarks = newPosts.reduce((sum: number, post: Post) => sum + (post.helpfulCount || 0), 0);
        setCredibilityScore(calculateCredibilityScore(totalHelpfulMarks));
      } else {
        const updatedPosts = [...posts, ...newPosts];
        setPosts(updatedPosts);
        // Recalculate when loading more
        const totalHelpfulMarks = updatedPosts.reduce((sum: number, post: Post) => sum + (post.helpfulCount || 0), 0);
        setCredibilityScore(calculateCredibilityScore(totalHelpfulMarks));
      }

      setCurrentPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);
      setTotalPosts(pagination.total || 0);
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (page === 1) { setPosts([]); setTotalPosts(0); }
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  }, [toast, posts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous debounce timeout
    if (searchDebounce) clearTimeout(searchDebounce);

    // Set new debounce timeout
    const timeout = setTimeout(() => {
      setLoadingPosts(true);
      setCurrentPage(1);
      fetchPosts(1, query);
    }, 500); // 500ms debounce

    setSearchDebounce(timeout);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLoadingPosts(true);
    setCurrentPage(1);
    fetchPosts(1, '');
  };

  const loadMorePosts = useCallback(async () => {
    if (loadingMorePosts || !hasMore) return;
    setLoadingMorePosts(true);
    await fetchPosts(currentPage + 1, searchQuery);
  }, [loadingMorePosts, hasMore, currentPage, searchQuery, fetchPosts]);

  // Infinite scroll implementation with optimized load balancing
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Trigger load when user is 300px from bottom for better UX
      // This gives enough time to fetch before user reaches the end
      if (distanceFromBottom < 300 && hasMore && !loadingMorePosts && !loadingPosts) {
        loadMorePosts();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMorePosts, loadingPosts, loadMorePosts]);

  const handlePrivacyToggle = async (field: keyof PrivacySettings) => {
    let newSettings = { ...privacySettings, [field]: !privacySettings[field] };

    // When toggling email (Contact Info), also toggle phone and location
    if (field === 'email') {
      newSettings = {
        ...newSettings,
        phone: !privacySettings[field],
        location: !privacySettings[field],
      };
    }

    setPrivacySettings(newSettings);
    setSavingPrivacy(true);
    try {
      await api.put('/users/privacy-settings', newSettings);
      toast({ title: 'Success', description: 'Privacy settings updated' });
    } catch (error) {
      console.error('Error updating privacy:', error);
      setPrivacySettings(privacySettings);
      toast({ title: 'Error', description: 'Failed to update privacy settings', variant: 'destructive' });
    } finally {
      setSavingPrivacy(false);
    }
  };

  if (!isHydrated || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profile = profileData.profile || {};
  const experiences = profile.experiences || [];
  const education = profile.education || [];
  const skills = profile.skills || [];

  // Privacy Panel Content Component (reused in both desktop sidebar and mobile modal)
  const PrivacyPanelContent = () => (
    <CardContent className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 max-h-[60vh] lg:max-h-none overflow-y-auto lg:overflow-visible scrollbar-thin">
      {/* Profile Preview */}
      <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
          <AvatarImage src={profileData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
          <AvatarFallback className="text-xs sm:text-sm">{getInitials(profileData.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold truncate">{profileData.name}</p>
          {profile.headline && <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>}
        </div>
      </div>

      {/* Credibility Stats */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Community Reputation</p>

        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <CredibilityBadge credibilityScore={credibilityScore} size="sm" showProgress={false} />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Helpful Marks</p>
              <p className="text-lg font-bold text-primary">{credibilityScore.score}</p>
            </div>
          </div>

          {credibilityScore.level !== 'Authority' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress to {credibilityScore.nextLevel}</span>
                <span className="font-semibold">{credibilityScore.score} / {credibilityScore.nextLevelAt}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary rounded-full h-1.5 transition-all"
                  style={{ width: `${Math.min((credibilityScore.score / credibilityScore.nextLevelAt) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>{credibilityScore.nextLevelAt - credibilityScore.score} more helpful marks needed</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-3 space-y-2 sm:space-y-2.5">
        <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Toggle Controls</p>

        {/* Contact Section */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-2.5 sm:p-3 bg-muted/20">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs sm:text-sm font-semibold truncate">Contact Info</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={privacySettings.email}
                  onCheckedChange={() => handlePrivacyToggle('email')}
                  disabled={savingPrivacy}
                  className="scale-90 sm:scale-100"
                />
              </div>
            </div>
            <Badge variant={privacySettings.email ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
              {privacySettings.email ? 'Public' : 'Private'}
            </Badge>
          </div>
          {expandedSection === 'contact' && (
            <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs bg-background border-t">
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <span className="font-medium text-muted-foreground">Email:</span>
                <span className="break-all">{profileData.email}</span>
              </div>
              {profileData.phone && (
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="font-medium text-muted-foreground">Phone:</span>
                  <span>{profileData.phone}</span>
                </div>
              )}
              {profileData.location && (
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="font-medium text-muted-foreground">Location:</span>
                  <span>{profileData.location}</span>
                </div>
              )}
            </div>
          )}
          <div
            onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
            className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
          >
            {expandedSection === 'contact' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expandedSection === 'contact' ? 'Hide' : 'Show'} Details
          </div>
        </div>

        {/* About Section */}
        {profile.bio && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2.5 sm:p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">About</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={privacySettings.bio}
                    onCheckedChange={() => handlePrivacyToggle('bio')}
                    disabled={savingPrivacy}
                    className="scale-90 sm:scale-100"
                  />
                </div>
              </div>
              <Badge variant={privacySettings.bio ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                {privacySettings.bio ? 'Public' : 'Private'}
              </Badge>
            </div>
            {expandedSection === 'about' && (
              <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 text-[10px] sm:text-xs bg-background border-t">
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}
            <div
              onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
            >
              {expandedSection === 'about' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expandedSection === 'about' ? 'Hide' : 'Show'} Details
            </div>
          </div>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2.5 sm:p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">Skills</p>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{skills.length}</Badge>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={privacySettings.skills}
                    onCheckedChange={() => handlePrivacyToggle('skills')}
                    disabled={savingPrivacy}
                    className="scale-90 sm:scale-100"
                  />
                </div>
              </div>
              <Badge variant={privacySettings.skills ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                {privacySettings.skills ? 'Public' : 'Private'}
              </Badge>
            </div>
            {expandedSection === 'skills' && (
              <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 bg-background border-t">
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-auto">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div
              onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
            >
              {expandedSection === 'skills' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expandedSection === 'skills' ? 'Hide' : 'Show'} Details
            </div>
          </div>
        )}

        {/* Experience Section */}
        {experiences.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2.5 sm:p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">Experience</p>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{experiences.length}</Badge>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={privacySettings.experience}
                    onCheckedChange={() => handlePrivacyToggle('experience')}
                    disabled={savingPrivacy}
                    className="scale-90 sm:scale-100"
                  />
                </div>
              </div>
              <Badge variant={privacySettings.experience ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                {privacySettings.experience ? 'Public' : 'Private'}
              </Badge>
            </div>
            {expandedSection === 'experience' && (
              <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-2 sm:space-y-3 bg-background border-t">
                {experiences.map((exp: any) => (
                  <div key={exp.id} className="text-[10px] sm:text-xs">
                    <p className="font-medium text-xs sm:text-sm">{exp.title}</p>
                    <p className="text-muted-foreground">{exp.company}</p>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
            >
              {expandedSection === 'experience' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expandedSection === 'experience' ? 'Hide' : 'Show'} Details
            </div>
          </div>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-2.5 sm:p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold truncate">Education</p>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{education.length}</Badge>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={privacySettings.education}
                    onCheckedChange={() => handlePrivacyToggle('education')}
                    disabled={savingPrivacy}
                    className="scale-90 sm:scale-100"
                  />
                </div>
              </div>
              <Badge variant={privacySettings.education ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                {privacySettings.education ? 'Public' : 'Private'}
              </Badge>
            </div>
            {expandedSection === 'education' && (
              <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-2 sm:space-y-3 bg-background border-t">
                {education.map((edu: any) => (
                  <div key={edu.id} className="text-[10px] sm:text-xs">
                    <p className="font-medium text-xs sm:text-sm">{edu.degree}</p>
                    <p className="text-muted-foreground">{edu.institution}</p>
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
            >
              {expandedSection === 'education' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {expandedSection === 'education' ? 'Hide' : 'Show'} Details
            </div>
          </div>
        )}
      </div>
    </CardContent>
  );

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-full py-3 sm:py-4 lg:py-6">
          {/* Desktop: Two Column Layout | Mobile: Single Column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">

            {/* Left Sidebar - Desktop Only Privacy Panel */}
            <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
              <div className="flex-shrink-0 mb-3">
                <h1 className="text-lg font-bold">My Profile & Privacy</h1>
                <p className="text-muted-foreground text-xs">Control your visibility</p>
              </div>

              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Privacy Controls
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Control what others can see</p>
                </CardHeader>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <PrivacyPanelContent />
                </div>
              </Card>
            </div>

            {/* Right Column - Posts Section */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">

              {/* Desktop: Header */}
              <div className="hidden lg:block flex-shrink-0 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                      <span>My Community Posts</span>
                      <Badge variant="secondary" className="text-xs">{totalPosts}</Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">View and manage your published posts</p>
                  </div>
                  <Button onClick={() => router.push('/community/create')} size="sm">
                    Create Post
                  </Button>
                </div>
              </div>

              {/* Mobile: Header with Privacy Button */}
              <div className="lg:hidden flex-shrink-0 pb-3 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap">
                      <span className="truncate">My Community Posts</span>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">{totalPosts}</Badge>
                    </h1>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">View and manage your published posts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => router.push('/community/create')} size="sm" className="text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-none">
                      Create Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
                      className="text-xs sm:text-sm h-8 sm:h-9 whitespace-nowrap"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="ml-1.5 sm:ml-2">Privacy Settings</span>
                    </Button>
                  </div>
                </div>

                {/* Privacy Panel - Collapsible (Mobile Only) */}
                {showPrivacyPanel && (
              <Card className="border shadow-lg">
                <CardHeader className="pb-3 px-3 pt-3 sm:px-4 sm:pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Privacy Controls
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivacyPanel(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Control what others can see</p>
                </CardHeader>
                <CardContent className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
                  {/* Profile Preview */}
                  <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage src={profileData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                      <AvatarFallback className="text-xs sm:text-sm">{getInitials(profileData.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate">{profileData.name}</p>
                      {profile.headline && <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{profile.headline}</p>}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2 sm:space-y-2.5">
                    <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Toggle Controls</p>

                    {/* Contact Section */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-2.5 sm:p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-xs sm:text-sm font-semibold truncate">Contact Info</p>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                              checked={privacySettings.email}
                              onCheckedChange={() => handlePrivacyToggle('email')}
                              disabled={savingPrivacy}
                              className="scale-90 sm:scale-100"
                            />
                          </div>
                        </div>
                        <Badge variant={privacySettings.email ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                          {privacySettings.email ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      {expandedSection === 'contact' && (
                        <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs bg-background border-t">
                          <div className="flex flex-col gap-0.5 sm:gap-1">
                            <span className="font-medium text-muted-foreground">Email:</span>
                            <span className="break-all">{profileData.email}</span>
                          </div>
                          {profileData.phone && (
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <span className="font-medium text-muted-foreground">Phone:</span>
                              <span>{profileData.phone}</span>
                            </div>
                          )}
                          {profileData.location && (
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <span className="font-medium text-muted-foreground">Location:</span>
                              <span>{profileData.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t cursor-pointer"
                      >
                        {expandedSection === 'contact' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {expandedSection === 'contact' ? 'Hide' : 'Show'} Details
                      </div>
                    </div>

                    {/* About Section */}
                    {profile.bio && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-2.5 sm:p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs sm:text-sm font-semibold truncate">About</p>
                            </div>
                            <Switch
                              checked={privacySettings.bio}
                              onCheckedChange={() => handlePrivacyToggle('bio')}
                              disabled={savingPrivacy}
                              className="scale-90 sm:scale-100"
                            />
                          </div>
                          <Badge variant={privacySettings.bio ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                            {privacySettings.bio ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        {expandedSection === 'about' && (
                          <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 text-[10px] sm:text-xs bg-background">
                            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t"
                        >
                          {expandedSection === 'about' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {expandedSection === 'about' ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                    )}

                    {/* Skills Section */}
                    {skills.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-2.5 sm:p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs sm:text-sm font-semibold truncate">Skills</p>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{skills.length}</Badge>
                            </div>
                            <Switch
                              checked={privacySettings.skills}
                              onCheckedChange={() => handlePrivacyToggle('skills')}
                              disabled={savingPrivacy}
                              className="scale-90 sm:scale-100"
                            />
                          </div>
                          <Badge variant={privacySettings.skills ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                            {privacySettings.skills ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        {expandedSection === 'skills' && (
                          <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 bg-background">
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map((skill: any) => (
                                <Badge key={skill.id} variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-auto">
                                  {skill.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'skills' ? null : 'skills')}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t"
                        >
                          {expandedSection === 'skills' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {expandedSection === 'skills' ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                    )}

                    {/* Experience Section */}
                    {experiences.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-2.5 sm:p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs sm:text-sm font-semibold truncate">Experience</p>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{experiences.length}</Badge>
                            </div>
                            <Switch
                              checked={privacySettings.experience}
                              onCheckedChange={() => handlePrivacyToggle('experience')}
                              disabled={savingPrivacy}
                              className="scale-90 sm:scale-100"
                            />
                          </div>
                          <Badge variant={privacySettings.experience ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                            {privacySettings.experience ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        {expandedSection === 'experience' && (
                          <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-2 sm:space-y-3 bg-background">
                            {experiences.map((exp: any) => (
                              <div key={exp.id} className="text-[10px] sm:text-xs">
                                <p className="font-medium text-xs sm:text-sm">{exp.title}</p>
                                <p className="text-muted-foreground">{exp.company}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t"
                        >
                          {expandedSection === 'experience' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {expandedSection === 'experience' ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                    )}

                    {/* Education Section */}
                    {education.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-2.5 sm:p-3 bg-muted/20">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs sm:text-sm font-semibold truncate">Education</p>
                              <Badge variant="outline" className="text-[10px] h-4 px-1">{education.length}</Badge>
                            </div>
                            <Switch
                              checked={privacySettings.education}
                              onCheckedChange={() => handlePrivacyToggle('education')}
                              disabled={savingPrivacy}
                              className="scale-90 sm:scale-100"
                            />
                          </div>
                          <Badge variant={privacySettings.education ? 'default' : 'secondary'} className="text-[10px] sm:text-xs h-5 sm:h-auto">
                            {privacySettings.education ? 'Public' : 'Private'}
                          </Badge>
                        </div>
                        {expandedSection === 'education' && (
                          <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-2 space-y-2 sm:space-y-3 bg-background">
                            {education.map((edu: any) => (
                              <div key={edu.id} className="text-[10px] sm:text-xs">
                                <p className="font-medium text-xs sm:text-sm">{edu.degree}</p>
                                <p className="text-muted-foreground">{edu.institution}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
                          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-t"
                        >
                          {expandedSection === 'education' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {expandedSection === 'education' ? 'Hide' : 'Show'} Details
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                )}
              </div>

              {/* Search Bar - Common for both Desktop and Mobile */}
              <div className="flex-shrink-0 pb-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search your posts..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 sm:pl-9 pr-8 sm:pr-9 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {loadingPosts ? 'Searching...' : `Found ${totalPosts} result${totalPosts !== 1 ? 's' : ''}`}
                  </div>
                )}
              </div>

              {/* Scrollable Posts Section */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin pb-4">
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-sm text-muted-foreground mb-4">No posts yet</p>
                      <Button onClick={() => router.push('/community/create')} size="sm">Create First Post</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-2.5 sm:space-y-3">
                      {posts.map((post) => (
                        <Card
                          key={post.id}
                          className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 active:scale-[0.99] overflow-hidden"
                          onClick={() => router.push(`/community/${post.id}`)}
                        >
                          <div className="flex">
                            {/* Media Thumbnail */}
                            {(post.poster || post.video) && (
                              <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-muted">
                                {post.poster ? (
                                  <img
                                    src={post.poster}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                {post.video && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="bg-white/90 rounded-full p-1.5">
                                      <Play className="h-4 w-4 text-black fill-black" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <CardContent className={`p-3 sm:p-4 flex-1 min-w-0 ${(post.poster || post.video) ? '' : ''}`}>
                              <h3 className="font-semibold mb-1.5 sm:mb-2 line-clamp-2 text-xs sm:text-sm lg:text-base leading-snug">{post.title}</h3>
                              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 leading-relaxed">{post.description}</p>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="whitespace-nowrap">{timeAgo(post.createdAt)}</span>
                                </div>
                                {post.companyName && (
                                  <Badge variant="secondary" className="text-[10px] h-5">
                                    <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                    <span className="truncate max-w-[100px] sm:max-w-none">{post.companyName}</span>
                                  </Badge>
                                )}
                                {post.helpfulCount > 0 && (
                                  <Badge className="text-[10px] h-5 bg-blue-600">
                                    <ThumbsUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                    {post.helpfulCount}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Loading More Indicator */}
                    {loadingMorePosts && (
                      <div className="text-center py-6 mt-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <p className="text-xs text-muted-foreground mt-2">Loading more posts...</p>
                      </div>
                    )}

                    {/* End of List */}
                    {!hasMore && posts.length > 0 && !loadingMorePosts && (
                      <div className="text-center py-6 mt-4 border-t">
                        <p className="text-sm text-muted-foreground">You've reached the end</p>
                        <p className="text-xs text-muted-foreground mt-1">All {totalPosts} posts loaded</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
