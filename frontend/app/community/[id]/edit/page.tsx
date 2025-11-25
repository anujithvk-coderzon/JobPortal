'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Loader2, Newspaper, ArrowLeft, Upload, Image as ImageIcon, Video, X } from 'lucide-react';
import Link from 'next/link';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    location: '',
    source: '',
    externalLink: '',
  });

  // Media states
  const [currentPoster, setCurrentPoster] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Fetch existing post data
    fetchPost();
  }, [isAuthenticated, isHydrated, params.id]);

  const fetchPost = async () => {
    try {
      const response = await jobNewsAPI.getJobNewsById(params.id as string);
      const post = response.data.data;

      // Check if user is the author
      if (user && post.user.id !== user.id) {
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized to edit this post.',
          variant: 'destructive',
        });
        router.push(`/community/${params.id}`);
        return;
      }

      // Pre-fill form with existing data
      setFormData({
        title: post.title || '',
        description: post.description || '',
        companyName: post.companyName || '',
        location: post.location || '',
        source: post.source || '',
        externalLink: post.externalLink || '',
      });

      // Set current media
      setCurrentPoster(post.poster || null);
      setCurrentVideo(post.video || null);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post. Please try again.',
        variant: 'destructive',
      });
      router.push('/community');
    } finally {
      setFetching(false);
    }
  };

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
      setRemovePoster(false);

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

    // Validate file size (50MB max)
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
      setRemoveVideo(false);

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
    setCurrentPoster(null);
    setRemovePoster(true);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCurrentVideo(null);
    setRemoveVideo(true);
  };

  const handleCancelNewPoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
  };

  const handleCancelNewVideo = () => {
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

      // Handle poster removal
      if (removePoster) {
        payload.removePoster = true;
      }

      // Handle new poster upload
      if (posterFile) {
        const reader = new FileReader();
        const posterBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(posterFile);
        });
        payload.poster = posterBase64;
        payload.posterMimeType = posterFile.type;
      }

      // Handle video removal
      if (removeVideo) {
        payload.removeVideo = true;
      }

      // Handle new video upload
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

      await jobNewsAPI.updateJobNews(params.id as string, payload);

      toast({
        title: 'Success!',
        description: 'Your post has been updated successfully.',
      });

      router.push(`/community/${params.id}`);
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  if (!isHydrated || fetching) {
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
            href={`/community/${params.id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Post
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Community Post</h1>
          <p className="text-muted-foreground">
            Update your post details
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
              Update your post information. Required fields are marked with an asterisk (*)
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

              {/* Poster Image Upload (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="poster">Poster Image (Optional)</Label>
                {posterPreview || currentPoster ? (
                  <div className="relative border-2 border-dashed rounded-lg p-4 bg-gray-50 dark:bg-gray-900 mx-auto" style={{ maxWidth: '550px' }}>
                    <img
                      src={posterPreview || currentPoster || ''}
                      alt="Poster preview"
                      className="w-full h-auto object-contain rounded-md"
                      style={{ maxHeight: '350px' }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {posterPreview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelNewPoster}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemovePoster}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {posterPreview && (
                      <p className="text-xs text-green-600 mt-2">New poster will be uploaded</p>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="poster"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      disabled={loading}
                      className="hidden"
                    />
                    <label htmlFor="poster" className="cursor-pointer">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium mb-1">Upload Poster Image</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        JPG, PNG or GIF (max 10MB)
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                        <p className="text-xs font-semibold text-primary mb-1">📐 Required Aspect Ratio:</p>
                        <p className="text-xs font-medium">1.91:1 (Landscape)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 1200×628px or 1920×1005px
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add a visual element to make your post stand out
                </p>
              </div>

              {/* Video Upload (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="video">Video (Optional)</Label>
                {videoPreview || currentVideo ? (
                  <div className="relative border-2 border-dashed rounded-lg p-4 bg-black mx-auto" style={{ maxWidth: '550px' }}>
                    {videoPreview ? (
                      <video
                        src={videoPreview}
                        controls
                        className="w-full rounded-md"
                        style={{ maxHeight: '350px' }}
                      />
                    ) : currentVideo ? (
                      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <iframe
                          src={currentVideo}
                          className="absolute top-0 left-0 w-full h-full rounded-md"
                          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : null}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {videoPreview && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelNewVideo}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveVideo}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {videoPreview && (
                      <p className="text-xs text-green-600 mt-2">New video will be uploaded</p>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="video"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={loading}
                      className="hidden"
                    />
                    <label htmlFor="video" className="cursor-pointer">
                      <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium mb-1">Upload Video</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        MP4, MOV or WebM (max 50MB)
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                        <p className="text-xs font-semibold text-primary mb-1">📐 Required Aspect Ratio:</p>
                        <p className="text-xs font-medium">9:16 (Vertical) or 16:9 (Horizontal)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vertical: 1080×1920px • Horizontal: 1920×1080px
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Share a video tutorial, demo, or announcement
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/community/${params.id}`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingMedia ? 'Uploading media...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Newspaper className="mr-2 h-4 w-4" />
                      Update Post
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
