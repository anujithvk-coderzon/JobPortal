'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { getInitials, timeAgo, getUserFriendlyErrorMessage } from '@/lib/utils';
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
  User,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  helpfulCount: number;
  createdAt: string;
}

interface CredibilityScore {
  level: string;
  score: number;
  nextLevel: string;
  nextLevelAt: number;
}

export default function UserPublicProfile() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const fetchPublicProfile = async (page = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMorePosts(true);
      }

      const response = await api.get(`/users/public-profile/${userId}`, {
        params: { page, limit: 10 },
      });

      if (page === 1) {
        setUserData(response.data.user);
        setPosts(response.data.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(response.data.posts || [])]);
      }

      const pagination = response.data.pagination || {};
      setCurrentPage(pagination.page || 1);
      setTotalPages(pagination.totalPages || 1);
      setTotalPosts(pagination.total || 0);
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching public profile:', error);
      const errorMessage = getUserFriendlyErrorMessage(
        error.response?.data?.error,
        error.response?.status
      );
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMorePosts(false);
    }
  };

  const loadMorePosts = useCallback(async () => {
    if (loadingMorePosts || !hasMore) return;
    await fetchPublicProfile(currentPage + 1);
  }, [loadingMorePosts, hasMore, currentPage, userId]);

  // Infinite scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom < 300 && hasMore && !loadingMorePosts && !loading) {
        loadMorePosts();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMorePosts, loading, loadMorePosts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h3 className="text-sm font-semibold mb-2">User not found</h3>
          <Button onClick={() => router.back()} variant="outline" size="sm" className="text-[13px]">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const profile = userData.profile || {};
  const experiences = profile.experiences || [];
  const education = profile.education || [];
  const skills = profile.skills || [];
  const credibilityScore: CredibilityScore = userData.credibilityScore;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 h-full max-w-[1400px]">

            {/* Left Sidebar - Desktop */}
            <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
              <div className="mb-3">
                <Breadcrumb items={[{ label: 'Community', href: '/community' }, { label: 'Profile' }]} />
              </div>

              <Card className="flex-1 overflow-hidden flex flex-col rounded-lg border bg-card">
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4 p-5">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-2.5">
                        <AvatarImage src={userData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        <AvatarFallback className="text-xl">{getInitials(userData.name)}</AvatarFallback>
                      </Avatar>
                      <h2 className="text-sm font-semibold">{userData.name}</h2>
                      {profile.headline && (
                        <p className="text-[12px] text-muted-foreground mt-0.5">{profile.headline}</p>
                      )}
                      <div className="mt-2">
                        <CredibilityBadge credibilityScore={credibilityScore} size="md" showProgress={true} />
                      </div>

                      {(credibilityScore.score > 0 || totalPosts > 0) && (
                        <div className="flex items-center justify-center gap-4 mt-2.5 text-[12px] text-muted-foreground">
                          {credibilityScore.score > 0 && (
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span className="font-medium text-foreground">{credibilityScore.score}</span>
                              <span>helpful</span>
                            </div>
                          )}
                          {totalPosts > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="font-medium text-foreground">{totalPosts}</span>
                              <span>posts</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    {(userData.email || userData.phone || userData.location) && (
                      <div className="pt-3 border-t space-y-2.5">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          Contact
                        </h3>
                        {userData.email && (
                          <div className="text-[12px]">
                            <p className="text-muted-foreground">Email</p>
                            <p className="break-all">{userData.email}</p>
                          </div>
                        )}
                        {userData.phone && (
                          <div className="text-[12px]">
                            <p className="text-muted-foreground">Phone</p>
                            <p>{userData.phone}</p>
                          </div>
                        )}
                        {userData.location && (
                          <div className="text-[12px]">
                            <p className="text-muted-foreground">Location</p>
                            <p>{userData.location}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <div className="pt-3 border-t">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1.5">
                          <User className="h-3.5 w-3.5" />
                          About
                        </h3>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="pt-3 border-t">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                          <Award className="h-3.5 w-3.5" />
                          Skills ({skills.length})
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill: any) => (
                            <Badge key={skill.id} variant="secondary" className="text-[11px]">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {experiences.length > 0 && (
                      <div className="pt-3 border-t">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                          <Briefcase className="h-3.5 w-3.5" />
                          Experience ({experiences.length})
                        </h3>
                        <div className="space-y-2">
                          {experiences.map((exp: any) => (
                            <div key={exp.id} className="text-[12px]">
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-muted-foreground">{exp.company}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                      <div className="pt-3 border-t">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                          <GraduationCap className="h-3.5 w-3.5" />
                          Education ({education.length})
                        </h3>
                        <div className="space-y-2">
                          {education.map((edu: any) => (
                            <div key={edu.id} className="text-[12px]">
                              <p className="font-medium">{edu.degree}</p>
                              <p className="text-muted-foreground">{edu.institution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Posts */}
            <div className="flex flex-col h-full overflow-hidden">

              {/* Mobile: Compact Header */}
              <div className="lg:hidden flex-shrink-0 pb-3">
                <Breadcrumb items={[{ label: 'Community', href: '/community' }, { label: 'Profile' }]} />

                <Card className="rounded-lg border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14 flex-shrink-0">
                        <AvatarImage src={userData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold truncate">{userData.name}</h1>
                        {profile.headline && (
                          <p className="text-[12px] text-muted-foreground line-clamp-2">{profile.headline}</p>
                        )}
                        <div className="mt-1.5">
                          <CredibilityBadge credibilityScore={credibilityScore} size="sm" />
                        </div>
                        {(credibilityScore.score > 0 || totalPosts > 0) && (
                          <div className="flex items-center gap-4 mt-2 text-[12px]">
                            {credibilityScore.score > 0 && (
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-primary" />
                                <span className="font-medium">{credibilityScore.score}</span>
                              </div>
                            )}
                            {totalPosts > 0 && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-primary" />
                                <span className="font-medium">{totalPosts} posts</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Posts Header */}
              <div className="flex-shrink-0 pb-3">
                <div className="hidden lg:block">
                  <h2 className="text-lg font-semibold">Community Posts</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} by {userData.name}
                  </p>
                </div>
                <div className="lg:hidden">
                  <h2 className="text-sm font-semibold">Community Posts ({totalPosts})</h2>
                </div>
              </div>

              {/* Scrollable Posts */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-4">
                {posts.length === 0 ? (
                  <Card className="rounded-lg border bg-card">
                    <CardContent className="text-center py-10">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/8 mx-auto mb-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-[13px] text-muted-foreground">No posts yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-2">
                      {posts.map((post) => (
                        <Card
                          key={post.id}
                          className="rounded-lg border bg-card cursor-pointer hover:border-primary/30 transition-colors"
                          onClick={() => router.push(`/community/${post.id}`)}
                        >
                          <CardContent className="p-4">
                            <h3 className="text-[13px] font-medium mb-1.5 line-clamp-2 leading-snug">
                              {post.title}
                            </h3>
                            <p className="text-[12px] text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                              {post.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {timeAgo(post.createdAt)}
                              </span>
                              {post.companyName && (
                                <Badge variant="secondary" className="text-[11px]">
                                  <Building2 className="h-3 w-3 mr-0.5" />
                                  {post.companyName}
                                </Badge>
                              )}
                              {post.helpfulCount > 0 && (
                                <Badge variant="default" className="text-[11px]">
                                  <ThumbsUp className="h-3 w-3 mr-0.5" />
                                  {post.helpfulCount}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {loadingMorePosts && (
                      <div className="text-center py-4 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-[11px] text-muted-foreground mt-1">Loading more...</p>
                      </div>
                    )}

                    {!hasMore && posts.length > 0 && !loadingMorePosts && (
                      <div className="text-center py-4 mt-2 border-t">
                        <p className="text-[11px] text-muted-foreground">All {totalPosts} posts loaded</p>
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
