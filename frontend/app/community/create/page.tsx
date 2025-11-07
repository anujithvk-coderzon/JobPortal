'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Loader2, Newspaper, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    location: '',
    source: '',
    externalLink: '',
  });

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, isHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Filter out empty optional fields to avoid validation errors
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      // Only include optional fields if they have values
      if (formData.companyName.trim()) payload.companyName = formData.companyName.trim();
      if (formData.location.trim()) payload.location = formData.location.trim();
      if (formData.source.trim()) payload.source = formData.source.trim();
      if (formData.externalLink.trim()) payload.externalLink = formData.externalLink.trim();

      const response = await jobNewsAPI.createJobNews(payload);

      toast({
        title: 'Success!',
        description: 'Your post has been created successfully.',
      });

      router.push(`/community/${response.data.data.id}`);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/community"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Community Post</h1>
          <p className="text-muted-foreground">
            Share job leads, career tips, articles, or industry insights with the community
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Post Details
            </CardTitle>
            <CardDescription>
              Share valuable content with the community. Required fields are marked with an asterisk (*)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="E.g., Software Engineer Opening at TechCorp, 5 Tips for Job Interviews"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide detailed information about the opportunity, tip, or insight you're sharing..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be clear and comprehensive. Include relevant details that would help others.
                </p>
              </div>

              {/* Company Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="E.g., Google, Microsoft, Startup XYZ"
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  If your post is about a specific company
                </p>
              </div>

              {/* Location (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <LocationAutocomplete
                  id="location"
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  placeholder="City, State, or Remote"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Where is this opportunity or information relevant?
                </p>
              </div>

              {/* Source (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="source">Source (Optional)</Label>
                <Input
                  id="source"
                  name="source"
                  type="text"
                  placeholder="E.g., LinkedIn, Company Website, Friend Referral"
                  value={formData.source}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Where did you find this information?
                </p>
              </div>

              {/* External Link (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="externalLink">External Link (Optional)</Label>
                <Input
                  id="externalLink"
                  name="externalLink"
                  type="url"
                  placeholder="https://example.com/job-posting"
                  value={formData.externalLink}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Link to the original post, article, or job listing
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Newspaper className="mr-2 h-4 w-4" />
                      Publish Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
