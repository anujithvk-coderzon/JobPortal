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
import { Loader2, ArrowLeft, Upload, Image as ImageIcon, Video, X, MessageSquarePlus, Sparkles } from 'lucide-react';
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

  // Media upload states
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Poster image must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate aspect ratio (1.91:1 for professional LinkedIn-style posts)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      // LinkedIn standard: 1.91:1 (allows small tolerance of ±0.05)
      const targetRatio = 1.91;
      const tolerance = 0.05;

      if (Math.abs(aspectRatio - targetRatio) > tolerance) {
        toast({
          title: 'Invalid Aspect Ratio',
          description: `Poster must be 1.91:1 aspect ratio (e.g., 1200×628px). Your image is ${width}×${height}px (${aspectRatio.toFixed(2)}:1).`,
          variant: 'destructive',
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      URL.revokeObjectURL(objectUrl);
      setPosterFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: 'Error',
        description: 'Failed to load image. Please try another file.',
        variant: 'destructive',
      });
    };

    img.src = objectUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Error',
        description: 'Please select a video file (MP4, MOV, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (50MB max to account for base64 encoding)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Video must be less than 50MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate aspect ratio (9:16 vertical or 16:9 horizontal for professional content)
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;

      // Accepted ratios: 9:16 (0.5625) for vertical or 16:9 (1.7778) for horizontal
      const verticalRatio = 9 / 16; // 0.5625
      const horizontalRatio = 16 / 9; // 1.7778
      const tolerance = 0.05;

      const isVertical = Math.abs(aspectRatio - verticalRatio) <= tolerance;
      const isHorizontal = Math.abs(aspectRatio - horizontalRatio) <= tolerance;

      if (!isVertical && !isHorizontal) {
        toast({
          title: 'Invalid Aspect Ratio',
          description: `Video must be either 9:16 (vertical, e.g., 1080×1920px) or 16:9 (horizontal, e.g., 1920×1080px). Your video is ${width}×${height}px (${aspectRatio.toFixed(2)}:1).`,
          variant: 'destructive',
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      URL.revokeObjectURL(objectUrl);
      setVideoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({
        title: 'Error',
        description: 'Failed to load video. Please try another file.',
        variant: 'destructive',
      });
    };

    video.src = objectUrl;
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
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
    setUploadingMedia(true);

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

      // Convert poster to base64 if present
      if (posterFile) {
        const reader = new FileReader();
        const posterBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(posterFile);
        });
        payload.poster = posterBase64;
        payload.posterMimeType = posterFile.type;
      }

      // Convert video to base64 if present
      if (videoFile) {
        const reader = new FileReader();
        const videoBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(videoFile);
        });
        payload.video = videoBase64;
        payload.videoMimeType = videoFile.type;
      }

      const response = await jobNewsAPI.createJobNews(payload);

      toast({
        title: 'Success!',
        description: response.data.message || 'Your post has been submitted successfully. It will be visible after admin approval.',
      });

      router.push('/my-page');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingMedia(false);
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

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Blue Theme */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/community"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>

          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 sm:p-8 text-white shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <MessageSquarePlus className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Share to Community</h1>
              </div>
            </div>
            <p className="text-blue-50 text-sm sm:text-base">
              Share job leads, career tips, articles, or industry insights with the community
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Tips & Articles
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Job Leads
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                Discussions
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MessageSquarePlus className="h-5 w-5 text-blue-600" />
              Post Details
            </CardTitle>
            <CardDescription className="text-blue-700">
              Share valuable content with the community. Required fields are marked with an asterisk (*)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Essential Information */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                    Essential Information
                  </h3>

                  {/* Title with character counter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Post Title <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.title.length}/100
                      </span>
                    </div>
                    <Input
                      id="title"
                      name="title"
                      type="text"
                      maxLength={100}
                      placeholder="E.g., Software Engineer Opening at TechCorp"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-11 text-base border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    />
                    <p className="text-xs text-blue-600/70">
                      💡 Make it clear and engaging
                    </p>
                  </div>

                  {/* Description with character counter */}
                  <div className="space-y-2 mt-5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.description.length}/2000
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      maxLength={2000}
                      placeholder="Share the details... What should people know? Include key information, requirements, or tips."
                      value={formData.description}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      rows={10}
                      className="resize-none border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    />
                    <div className="flex items-start gap-2 text-xs text-blue-600/70">
                      <span className="mt-0.5">💡</span>
                      <p>Use clear paragraphs, bullet points work great for lists</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details (Collapsible) */}
              <div className="border-t border-blue-100 pt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="h-6 w-1 bg-blue-400 rounded-full"></div>
                  Additional Details <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-sm font-medium">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="E.g., Google, Microsoft"
                      value={formData.companyName}
                      onChange={handleChange}
                      disabled={loading}
                      className="border-blue-100 focus:border-blue-300"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location
                    </Label>
                    <LocationAutocomplete
                      id="location"
                      value={formData.location}
                      onChange={(value) => setFormData({ ...formData, location: value })}
                      placeholder="City, State, or Remote"
                      disabled={loading}
                    />
                  </div>

                  {/* Source */}
                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-sm font-medium">
                      Source
                    </Label>
                    <Input
                      id="source"
                      name="source"
                      type="text"
                      placeholder="E.g., LinkedIn, Company Career Page"
                      value={formData.source}
                      onChange={handleChange}
                      disabled={loading}
                      className="border-blue-100 focus:border-blue-300"
                    />
                  </div>

                  {/* External Link */}
                  <div className="space-y-2">
                    <Label htmlFor="externalLink" className="text-sm font-medium">
                      External Link
                    </Label>
                    <Input
                      id="externalLink"
                      name="externalLink"
                      type="url"
                      placeholder="https://example.com/job-posting"
                      value={formData.externalLink}
                      onChange={handleChange}
                      disabled={loading}
                      className="border-blue-100 focus:border-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* Media Uploads */}
              <div className="border-t border-blue-100 pt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <div className="h-6 w-1 bg-blue-300 rounded-full"></div>
                  Media <span className="text-xs font-normal text-muted-foreground">(Optional - Make your post stand out!)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Poster Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="poster" className="text-sm font-medium flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Poster Image
                    </Label>
                    {posterPreview ? (
                      <div className="relative rounded-lg overflow-hidden border-2 border-blue-200 bg-blue-50/50 p-3">
                        <img
                          src={posterPreview}
                          alt="Poster preview"
                          className="w-full h-48 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-5 right-5 h-8 w-8 p-0 rounded-full shadow-lg"
                          onClick={handleRemovePoster}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="mt-2 text-xs text-center text-blue-600">
                          Image uploaded successfully
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                        <input
                          type="file"
                          id="poster"
                          accept="image/*"
                          onChange={handlePosterUpload}
                          disabled={loading}
                          className="hidden"
                        />
                        <label htmlFor="poster" className="cursor-pointer block">
                          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                            <ImageIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm text-blue-900 mb-1">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            JPG, PNG or GIF (max 10MB)
                          </p>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-semibold text-blue-700 mb-1">📐 Required Aspect Ratio:</p>
                            <p className="text-xs text-blue-600 font-medium">1.91:1 (Landscape)</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Recommended: 1200×628px or 1920×1005px
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="video" className="text-sm font-medium flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </Label>
                    {videoPreview ? (
                      <div className="relative rounded-lg overflow-hidden border-2 border-blue-200 bg-black p-3">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-48 rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-5 right-5 h-8 w-8 p-0 rounded-full shadow-lg"
                          onClick={handleRemoveVideo}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="mt-2 text-xs text-center text-blue-600">
                          Video uploaded successfully
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
                        <input
                          type="file"
                          id="video"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          disabled={loading}
                          className="hidden"
                        />
                        <label htmlFor="video" className="cursor-pointer block">
                          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                            <Video className="h-6 w-6 text-blue-600" />
                          </div>
                          <p className="font-medium text-sm text-blue-900 mb-1">Click to upload video</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            MP4, MOV or WebM (max 50MB)
                          </p>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs font-semibold text-blue-700 mb-1">📐 Required Aspect Ratio:</p>
                            <p className="text-xs text-blue-600 font-medium">9:16 (Vertical) or 16:9 (Horizontal)</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Vertical: 1080×1920px • Horizontal: 1920×1080px
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="border-t border-blue-100 pt-6">
                <div className="bg-blue-50/50 rounded-lg p-5 mb-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Ready to share?</h4>
                      <p className="text-sm text-blue-700/80">
                        Your post will be visible to all community members and can help someone land their dream job!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                    disabled={loading || !formData.title.trim() || !formData.description.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {uploadingMedia ? 'Uploading Media...' : 'Publishing Post...'}
                      </>
                    ) : (
                      <>
                        <MessageSquarePlus className="mr-2 h-5 w-5" />
                        Share to Community
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
