'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">User not found</h3>
              <Button onClick={() => router.back()} variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
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
      <Navbar />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 lg:px-6 h-full py-3 sm:py-4 lg:py-6">
          {/* Desktop: Two Column Layout | Mobile: Single Column */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-full">

            {/* Left Sidebar - Desktop Only User Info */}
            <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  <CardContent className="space-y-4 p-6">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-24 w-24 mb-3">
                        <AvatarImage src={userData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        <AvatarFallback className="text-2xl">{getInitials(userData.name)}</AvatarFallback>
                      </Avatar>
                      <h2 className="text-xl font-bold">{userData.name}</h2>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground mt-1">{profile.headline}</p>
                      )}
                      <div className="mt-3">
                        <CredibilityBadge credibilityScore={credibilityScore} size="md" showProgress={true} />
                      </div>

                      {/* Compact Stats */}
                      {(credibilityScore.score > 0 || totalPosts > 0) && (
                        <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
                          {credibilityScore.score > 0 && (
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span className="font-semibold text-foreground">{credibilityScore.score}</span>
                              <span>helpful</span>
                            </div>
                          )}
                          {totalPosts > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span className="font-semibold text-foreground">{totalPosts}</span>
                              <span>posts</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contact Info - If Public */}
                    {(userData.email || userData.phone || userData.location) && (
                      <div className="pt-4 border-t space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Contact Information
                        </h3>
                        {userData.email && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Email</p>
                            <p className="break-all">{userData.email}</p>
                          </div>
                        )}
                        {userData.phone && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Phone</p>
                            <p>{userData.phone}</p>
                          </div>
                        )}
                        {userData.location && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Location</p>
                            <p>{userData.location}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                          <User className="h-4 w-4" />
                          About
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4" />
                          Skills ({skills.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill: any) => (
                            <Badge key={skill.id} variant="secondary" className="text-xs">
                              {skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {experiences.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <Briefcase className="h-4 w-4" />
                          Experience ({experiences.length})
                        </h3>
                        <div className="space-y-3">
                          {experiences.map((exp: any) => (
                            <div key={exp.id} className="text-sm">
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-muted-foreground">{exp.company}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                          <GraduationCap className="h-4 w-4" />
                          Education ({education.length})
                        </h3>
                        <div className="space-y-3">
                          {education.map((edu: any) => (
                            <div key={edu.id} className="text-sm">
                              <p className="font-medium">{edu.degree}</p>
                              <p className="text-muted-foreground">{edu.institution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Right Column - Posts Section */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">

              {/* Mobile: Compact Header */}
              <div className="lg:hidden flex-shrink-0 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="mb-3"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={userData.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                        <AvatarFallback>{getInitials(userData.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold truncate">{userData.name}</h1>
                        {profile.headline && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{profile.headline}</p>
                        )}
                        <div className="mt-2">
                          <CredibilityBadge credibilityScore={credibilityScore} size="sm" />
                        </div>
                        {(credibilityScore.score > 0 || totalPosts > 0) && (
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            {credibilityScore.score > 0 && (
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                                <span className="font-semibold">{credibilityScore.score}</span>
                              </div>
                            )}
                            {totalPosts > 0 && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                                <span className="font-semibold">{totalPosts} posts</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Desktop: Header */}
              <div className="hidden lg:block flex-shrink-0 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Community Posts</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} by {userData.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: Section Title */}
              <div className="lg:hidden flex-shrink-0 pb-3">
                <h2 className="text-lg font-bold">Community Posts ({totalPosts})</h2>
              </div>

              {/* Scrollable Posts Section */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin pb-4">
                {posts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No posts yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-3">
                      {posts.map((post) => (
                        <Card
                          key={post.id}
                          className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 active:scale-[0.99]"
                          onClick={() => router.push(`/community/${post.id}`)}
                        >
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2 text-sm lg:text-base leading-snug">
                              {post.title}
                            </h3>
                            <p className="text-xs lg:text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                              {post.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{timeAgo(post.createdAt)}</span>
                              </div>
                              {post.companyName && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  {post.companyName}
                                </Badge>
                              )}
                              {post.helpfulCount > 0 && (
                                <Badge className="text-[10px] h-5 bg-blue-600">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  {post.helpfulCount}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
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
