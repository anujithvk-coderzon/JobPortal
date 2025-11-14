'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { CompanySelector } from '@/components/CompanySelector';
import { Search, Briefcase, MapPin, Building2, Clock, ArrowRight, User, ExternalLink, ThumbsUp, Image as ImageIcon, Video } from 'lucide-react';
import { jobNewsAPI, jobAPI } from '@/lib/api';
import { EmploymentType, ExperienceLevel, LocationType } from '@/lib/types';
import { timeAgo, getInitials } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  description: string;
  companyName?: string;
  location?: string;
  source?: string;
  externalLink?: string;
  poster?: string;
  video?: string;
  createdAt: string;
  helpfulCount?: number;
  user: {
    id: string;
    name: string;
    profilePhoto?: string;
  };
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
  createdAt: string;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
  companyName?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
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
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const response = await jobAPI.getAllJobs({ page: 1, limit: 6 });
      setRecentJobs(response.data.data.jobs || []);
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Find Your <span className="text-primary">Dream Job</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Discover opportunities that match your skills and ambitions
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3 p-3 bg-background rounded-lg shadow-xl border">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-md md:bg-transparent md:px-0 md:py-0">
                  <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-md md:bg-transparent md:px-0 md:py-0">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="City, state, or remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto md:px-8">
                  Search Jobs
                </Button>
              </div>
            </form>

            {/* Quick Action Buttons - Mobile Only */}
            <div className="lg:hidden flex flex-wrap justify-center gap-3 mt-6 max-w-xl mx-auto">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-w-[160px]"
                onClick={() => router.push('/jobs')}
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Explore Jobs
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-w-[160px]"
                onClick={() => router.push('/community')}
              >
                <User className="h-5 w-5 mr-2" />
                Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Job Openings Section */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Recent Job Openings</h2>
            <p className="text-sm md:text-base text-muted-foreground">Latest opportunities from top companies</p>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentJobs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardHeader className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base md:text-lg mb-2 line-clamp-2 leading-snug">{job.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {job.company?.name || job.companyName}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.location && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {job.employmentType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {job.locationType}
                        </Badge>
                      </div>
                      {(job.salaryMin || job.salaryMax) && (
                        <p className="text-sm font-semibold text-primary">
                          {job.salaryCurrency || 'USD'} {job.salaryMin?.toLocaleString()}
                          {job.salaryMax && ` - ${job.salaryMax.toLocaleString()}`}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Posted {timeAgo(job.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
                  <Link href="/jobs" className="flex items-center justify-center">
                    <span>View All Jobs</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No job openings yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to post a job opportunity and connect with talented professionals!</p>
                <Button onClick={() => setShowCompanySelector(true)}>
                  Post a Job
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Recent Community Posts Section */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Community Highlights</h2>
            <p className="text-sm md:text-base text-muted-foreground">Latest posts, tips, and discussions from the community</p>
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary/50"
                    onClick={() => router.push(`/community/${post.id}`)}
                  >
                    <CardHeader className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base md:text-lg mb-2 line-clamp-2 leading-snug">{post.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={post.user.profilePhoto || undefined} alt={post.user.name} />
                            <AvatarFallback className="text-[10px]">{getInitials(post.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="line-clamp-1">{post.user.name}</span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                          {post.description}
                        </p>

                        {/* Media Indicator */}
                        {(post.poster || post.video) && (
                          <div className="mt-3 flex items-center gap-2">
                            {post.poster && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/50 rounded-md">
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Image attached</span>
                              </div>
                            )}
                            {post.video && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary/50 rounded-md">
                                <Video className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Video attached</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {(post.companyName || post.location || (post.helpfulCount ?? 0) > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {post.companyName && (
                            <Badge variant="secondary" className="text-xs">
                              <Building2 className="h-3 w-3 mr-1" />
                              {post.companyName}
                            </Badge>
                          )}
                          {post.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {post.location}
                            </Badge>
                          )}
                          {(post.helpfulCount ?? 0) > 0 && (
                            <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {post.helpfulCount} {post.helpfulCount === 1 ? 'person' : 'people'} found helpful
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(post.createdAt)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
                  <Link href="/community" className="flex items-center justify-center">
                    <span>View All Posts</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No community posts yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to share insights, tips, or job leads with the community!</p>
                <Button asChild>
                  <Link href="/community/create">Create First Post</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Find your next opportunity, share insights, and connect with professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/jobs">Find Jobs</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/community">Join Community</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Job Portal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A community-driven platform connecting talent with opportunity. Share insights, discover jobs, and grow your career.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/jobs" className="hover:text-foreground">Browse Jobs</Link></li>
                <li><Link href="/community" className="hover:text-foreground">Community</Link></li>
                <li><Link href="/applications" className="hover:text-foreground">My Applications</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Get Started</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/register" className="hover:text-foreground">Create Account</Link></li>
                <li><button onClick={() => setShowCompanySelector(true)} className="hover:text-foreground text-left">Post Official Job</button></li>
                <li><Link href="/community/create" className="hover:text-foreground">Create Post</Link></li>
                <li><Link href="/profile" className="hover:text-foreground">Profile Settings</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Job Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Company Selector Dialog */}
      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
      />
    </div>
  );
}
