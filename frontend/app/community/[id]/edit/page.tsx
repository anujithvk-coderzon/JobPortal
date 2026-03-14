'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

import {
  Loader2,
  Image as ImageIcon,
  Video,
  X,
  Save,
  FileText,
  Building2,
  MapPin,
  Newspaper,
  Link2,
  ImagePlus,
  ChevronDown,
  CheckCircle2,
  Lightbulb,
  Info,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAuthStore } from '@/store/authStore';

// Collapsible section component
const Section = ({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
  badge,
}: {
  icon: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border border-border/60 bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {badge && (
              <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">{badge}</Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <CardContent className="px-5 pb-5 pt-0 border-t border-border/40">
          <div className="pt-4">{children}</div>
        </CardContent>
      )}
    </Card>
  );
};

const EditPostPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [postTitle, setPostTitle] = useState('');
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
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);
  const [removePoster, setRemovePoster] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please log in to access this page.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
      return;
    }

    fetchPost();
  }, [isAuthenticated, isHydrated, params.id]);

  const fetchPost = async () => {
    try {
      const response = await jobNewsAPI.getJobNewsById(params.id as string);
      const post = response.data.data;

      if (user && post.user.id !== user.id) {
        toast({
          title: 'Unauthorized',
          description: 'You are not authorized to edit this post.',
          variant: 'destructive',
        });
        router.push(`/community/${params.id}`);
        return;
      }

      setPostTitle(post.title || '');
      setFormData({
        title: post.title || '',
        description: post.description || '',
        companyName: post.companyName || '',
        location: post.location || '',
        source: post.source || '',
        externalLink: post.externalLink || '',
      });

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

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file (JPG, PNG, etc.)', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Poster image must be less than 10MB', variant: 'destructive' });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      if (width < 200) {
        toast({ title: 'Image Too Small', description: 'Image width must be at least 200px.', variant: 'destructive' });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const supportedRatios = [
        { ratio: 1.91, name: 'Landscape (1.91:1)', example: '1200x628px' },
        { ratio: 1, name: 'Square (1:1)', example: '1200x1200px' },
        { ratio: 0.8, name: 'Portrait (4:5)', example: '1080x1350px' },
      ];
      const tolerance = 0.1;

      const matchedRatio = supportedRatios.find(
        (r) => Math.abs(aspectRatio - r.ratio) <= tolerance
      );

      if (!matchedRatio) {
        toast({
          title: 'Invalid Aspect Ratio',
          description: `Your image is ${width}x${height}px (${aspectRatio.toFixed(2)}:1). Supported: Landscape (1.91:1), Square (1:1), or Portrait (4:5).`,
          variant: 'destructive',
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      URL.revokeObjectURL(objectUrl);
      setPosterFile(file);
      setRemovePoster(false);

      setVideoFile(null);
      setVideoPreview(null);
      setVideoAspectRatio(null);
      setCurrentVideo(null);
      setRemoveVideo(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({ title: 'Error', description: 'Failed to load image. Please try another file.', variant: 'destructive' });
    };

    img.src = objectUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({ title: 'Error', description: 'Please select a video file (MP4, MOV, etc.)', variant: 'destructive' });
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Video must be less than 200MB', variant: 'destructive' });
      return;
    }

    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const aspectRatio = width / height;

      const supportedRatios = [
        { ratio: 16 / 9, name: 'Landscape (16:9)', example: '1920x1080px' },
        { ratio: 1, name: 'Square (1:1)', example: '1080x1080px' },
        { ratio: 4 / 5, name: 'Portrait (4:5)', example: '1080x1350px' },
        { ratio: 9 / 16, name: 'Vertical (9:16)', example: '1080x1920px' },
      ];
      const tolerance = 0.1;

      const matchedRatio = supportedRatios.find(
        (r) => Math.abs(aspectRatio - r.ratio) <= tolerance
      );

      if (!matchedRatio) {
        toast({
          title: 'Invalid Aspect Ratio',
          description: `Your video is ${width}x${height}px (${aspectRatio.toFixed(2)}:1). Supported: 16:9, 1:1, 4:5, or 9:16.`,
          variant: 'destructive',
        });
        URL.revokeObjectURL(objectUrl);
        return;
      }

      URL.revokeObjectURL(objectUrl);
      setVideoFile(file);
      setRemoveVideo(false);

      setPosterFile(null);
      setPosterPreview(null);
      setCurrentPoster(null);
      setRemovePoster(true);

      const ratioKey = matchedRatio.ratio === 16/9 ? '16:9' :
                       matchedRatio.ratio === 1 ? '1:1' :
                       matchedRatio.ratio === 4/5 ? '4:5' : '9:16';
      setVideoAspectRatio(ratioKey);

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({ title: 'Error', description: 'Failed to load video. Please try another file.', variant: 'destructive' });
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
    setVideoAspectRatio(null);
    setRemoveVideo(true);
  };

  const handleCancelNewPoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
  };

  const handleCancelNewVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoAspectRatio(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setUploadingMedia(true);

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (formData.companyName.trim()) payload.companyName = formData.companyName.trim();
      if (formData.location.trim()) payload.location = formData.location.trim();
      if (formData.source.trim()) payload.source = formData.source.trim();
      if (formData.externalLink.trim()) payload.externalLink = formData.externalLink.trim();

      if (removePoster) {
        payload.removePoster = true;
      }

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

      if (removeVideo) {
        payload.removeVideo = true;
      }

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
        if (videoAspectRatio) {
          payload.videoAspectRatio = videoAspectRatio;
        }
      }

      await jobNewsAPI.updateJobNews(params.id as string, payload);

      toast({
        title: 'Success!',
        description: 'Your post has been updated successfully.',
        variant: 'success',
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const hasPosterContent = posterPreview || currentPoster;
  const hasVideoContent = videoPreview || currentVideo;
  const posterDisabled = !!currentVideo || !!videoFile || !!videoPreview;
  const videoDisabled = !!currentPoster || !!posterFile || !!posterPreview;

  const completionItems = [
    { label: 'Post title', done: !!formData.title.trim() },
    { label: 'Description', done: !!formData.description.trim() },
    { label: 'Company name', done: !!formData.companyName.trim() },
    { label: 'Location', done: !!formData.location.trim() },
    { label: 'Source', done: !!formData.source.trim() },
    { label: 'Media', done: !!(hasPosterContent || hasVideoContent) },
  ];
  const completionCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completionCount / completionItems.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Community', href: '/community' }, { label: postTitle || 'Post', href: `/community/${params.id}` }, { label: 'Edit' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold">Edit Community Post</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Update your post details and media
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/community/${params.id}`)}
              className="text-[13px] h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                const form = document.getElementById('edit-post-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  {uploadingMedia ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* ── Main Form ── */}
          <form id="edit-post-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Post Content */}
            <Section
              icon={FileText}
              title="Post Content"
              subtitle="Title and description of your post"
              badge="Required"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="title" className="text-[13px] font-medium">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">{formData.title.length}/100</span>
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
                    className="h-10 text-[13px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="description" className="text-[13px] font-medium">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">{formData.description.length}/2000</span>
                  </div>
                  <Textarea
                    id="description"
                    name="description"
                    maxLength={2000}
                    placeholder="Provide detailed information about the opportunity or topic..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    rows={8}
                    className="resize-none text-[13px] leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">Be clear and comprehensive for maximum engagement.</p>
                </div>
              </div>
            </Section>

            {/* Additional Details */}
            <Section
              icon={Building2}
              title="Additional Details"
              subtitle="Company, location, source, and link"
              badge="Optional"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-[13px] font-medium mb-1.5 block">
                      Company Name <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      placeholder="E.g., Google"
                      value={formData.companyName}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 text-[13px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-[13px] font-medium mb-1.5 block">
                      Location <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                    </Label>
                    <LocationAutocomplete
                      id="location"
                      value={formData.location}
                      onChange={(value) => setFormData({ ...formData, location: value })}
                      placeholder="City, State, or Remote"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source" className="text-[13px] font-medium mb-1.5 block">
                      Source <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                    </Label>
                    <Input
                      id="source"
                      name="source"
                      type="text"
                      placeholder="E.g., LinkedIn, Company Page"
                      value={formData.source}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 text-[13px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="externalLink" className="text-[13px] font-medium mb-1.5 block">
                      External Link <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                    </Label>
                    <Input
                      id="externalLink"
                      name="externalLink"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.externalLink}
                      onChange={handleChange}
                      disabled={loading}
                      className="h-10 text-[13px]"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Media */}
            <Section
              icon={ImagePlus}
              title="Media"
              subtitle="Upload a poster image or video (only one)"
              badge="Optional"
            >
              <div className="space-y-4">
                {/* Poster */}
                <div>
                  <Label className="text-[13px] font-medium mb-1.5 block">
                    Poster Image <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                  </Label>
                  {hasPosterContent ? (
                    <div className="relative border border-border/60 rounded-lg p-3 bg-muted/30 mx-auto" style={{ maxWidth: '550px' }}>
                      <img
                        src={posterPreview || currentPoster || ''}
                        alt="Poster preview"
                        className="w-full h-auto object-contain rounded"
                        style={{ maxHeight: '300px' }}
                      />
                      <div className="absolute top-4 right-4 flex gap-1.5">
                        {posterPreview && (
                          <Button type="button" variant="secondary" size="sm" className="h-7 text-[11px]" onClick={handleCancelNewPoster} disabled={loading}>
                            Undo
                          </Button>
                        )}
                        <Button type="button" variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={handleRemovePoster} disabled={loading}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {posterPreview && (
                        <p className="text-[11px] text-emerald-600 mt-1.5">New poster will be uploaded on save</p>
                      )}
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                      posterDisabled ? 'border-muted bg-muted/30 cursor-not-allowed opacity-50' : 'hover:border-primary/30 cursor-pointer'
                    }`}>
                      <input type="file" id="poster" accept="image/*" onChange={handlePosterUpload} disabled={loading || posterDisabled} className="hidden" />
                      <label htmlFor="poster" className={posterDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
                        <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${posterDisabled ? 'bg-muted' : 'bg-indigo-500/8'}`}>
                          <ImageIcon className={`h-5 w-5 ${posterDisabled ? 'text-muted-foreground' : 'text-indigo-600'}`} />
                        </div>
                        {posterDisabled ? (
                          <p className="text-[12px] text-muted-foreground">Remove video to upload image</p>
                        ) : (
                          <>
                            <p className="text-[13px] font-medium mb-0.5">Upload Poster Image</p>
                            <p className="text-[11px] text-muted-foreground">JPG, PNG or GIF (max 10MB) -- 1.91:1, 1:1, or 4:5</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <Label className="text-[13px] font-medium mb-1.5 block">
                    Video <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                  </Label>
                  {hasVideoContent ? (
                    <div className="relative border border-border/60 rounded-lg p-3 bg-black mx-auto" style={{ maxWidth: '550px' }}>
                      {videoPreview ? (
                        <video src={videoPreview} controls className="w-full rounded" style={{ maxHeight: '300px' }} />
                      ) : currentVideo ? (
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                          <iframe
                            src={currentVideo}
                            className="absolute top-0 left-0 w-full h-full rounded"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      <div className="absolute top-4 right-4 flex gap-1.5">
                        {videoPreview && (
                          <Button type="button" variant="secondary" size="sm" className="h-7 text-[11px]" onClick={handleCancelNewVideo} disabled={loading}>
                            Undo
                          </Button>
                        )}
                        <Button type="button" variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={handleRemoveVideo} disabled={loading}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {videoPreview && (
                        <p className="text-[11px] text-emerald-600 mt-1.5">New video will be uploaded on save</p>
                      )}
                    </div>
                  ) : (
                    <div className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                      videoDisabled ? 'border-muted bg-muted/30 cursor-not-allowed opacity-50' : 'hover:border-primary/30 cursor-pointer'
                    }`}>
                      <input type="file" id="video" accept="video/*" onChange={handleVideoUpload} disabled={loading || videoDisabled} className="hidden" />
                      <label htmlFor="video" className={videoDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
                        <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${videoDisabled ? 'bg-muted' : 'bg-violet-500/8'}`}>
                          <Video className={`h-5 w-5 ${videoDisabled ? 'text-muted-foreground' : 'text-violet-600'}`} />
                        </div>
                        {videoDisabled ? (
                          <p className="text-[12px] text-muted-foreground">Remove image to upload video</p>
                        ) : (
                          <>
                            <p className="text-[13px] font-medium mb-0.5">Upload Video</p>
                            <p className="text-[11px] text-muted-foreground">MP4, MOV or WebM (max 200MB) -- 16:9, 1:1, 4:5, or 9:16</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Bottom save bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <p className="text-[12px] text-muted-foreground">
                All changes are saved when you click Save Changes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/community/${params.id}`)}
                  disabled={loading}
                  className="text-[13px] h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {uploadingMedia ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block space-y-4">
            {/* Completion Tracker */}
            <Card className="border border-border/60 sticky top-20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold">Completion</h3>
                  <span className={`text-[12px] font-bold ${completionPct === 100 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completionPct === 100 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {completionItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 dark:border-slate-700 flex-shrink-0" />
                      )}
                      <span className={`text-[12px] ${item.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="border border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="text-[13px] font-semibold">Editing Tips</h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Use a clear, specific title that describes the opportunity',
                    'Include key details like role, company, and how to apply',
                    'Add an image or video to boost engagement in the feed',
                    'Include a source link so others can verify the information',
                    'Keep your description updated as details change',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[11px] font-bold text-muted-foreground/40 mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostPage;
