'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { jobNewsAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Loader2,
  Image as ImageIcon,
  Video,
  X,
  Send,
  Link2,
  Building2,
  MapPin,
  Newspaper,
  Info,
} from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    location: '',
    source: '',
    externalLink: '',
  });

  // Media
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
  }, [isAuthenticated, isHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        { ratio: 1.91, name: 'Landscape (1.91:1)' },
        { ratio: 1, name: 'Square (1:1)' },
        { ratio: 0.8, name: 'Portrait (4:5)' },
      ];

      const matchedRatio = supportedRatios.find((r) => Math.abs(aspectRatio - r.ratio) <= 0.1);
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
      setVideoFile(null);
      setVideoPreview(null);
      setVideoAspectRatio(null);

      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({ title: 'Error', description: 'Failed to load image.', variant: 'destructive' });
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
        { ratio: 16 / 9, name: '16:9' },
        { ratio: 1, name: '1:1' },
        { ratio: 4 / 5, name: '4:5' },
        { ratio: 9 / 16, name: '9:16' },
      ];

      const matchedRatio = supportedRatios.find((r) => Math.abs(aspectRatio - r.ratio) <= 0.1);
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
      setPosterFile(null);
      setPosterPreview(null);
      setVideoAspectRatio(matchedRatio.name);

      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result as string);
      reader.readAsDataURL(file);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast({ title: 'Error', description: 'Failed to load video.', variant: 'destructive' });
    };
    video.src = objectUrl;
  };

  const handleRemovePoster = () => { setPosterFile(null); setPosterPreview(null); };
  const handleRemoveVideo = () => { setVideoFile(null); setVideoPreview(null); setVideoAspectRatio(null); };

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

      if (posterFile) {
        const posterBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(posterFile);
        });
        payload.poster = posterBase64;
        payload.posterMimeType = posterFile.type;
      }

      if (videoFile) {
        const videoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(videoFile);
        });
        payload.video = videoBase64;
        payload.videoMimeType = videoFile.type;
        if (videoAspectRatio) payload.videoAspectRatio = videoAspectRatio;
      }

      const response = await jobNewsAPI.createJobNews(payload);

      toast({
        title: 'Post submitted!',
        description: response.data.message || 'Your post will be live shortly after review.',
        variant: 'success',
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

  if (!isHydrated || !isAuthenticated || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const hasMedia = !!posterPreview || !!videoPreview;
  const hasOptionalData = formData.companyName || formData.location || formData.source || formData.externalLink;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px]">
      <Breadcrumb items={[
        { label: 'Community', href: '/community' },
        { label: 'Create Post' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left — Form */}
        <div>
          <div className="mb-5">
            <h1 className="text-lg font-semibold tracking-tight">Create Community Post</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Share job leads, career tips, or industry news with the community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title & Description */}
            <Card>
              <div className="p-4 sm:p-5">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="title" className="text-[12px] font-medium">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">{formData.title.length}/100</span>
                    </div>
                    <Input
                      id="title"
                      name="title"
                      maxLength={100}
                      placeholder="e.g., Software Engineer Opening at TechCorp"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-9 text-[13px]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="description" className="text-[12px] font-medium">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">{formData.description.length}/2000</span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      maxLength={2000}
                      placeholder="Share the details — what should people know? Include key information, requirements, or tips."
                      value={formData.description}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      rows={6}
                      className="resize-none text-[13px]"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Media — Image or Video */}
            <Card>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Media</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Add an image or video (optional, only one)</p>
                  </div>
                  {hasMedia && (
                    <Button type="button" variant="ghost" size="sm" className="text-[12px] h-7 text-destructive hover:text-destructive" onClick={() => { handleRemovePoster(); handleRemoveVideo(); }}>
                      Remove
                    </Button>
                  )}
                </div>

                {posterPreview ? (
                  <div className="relative rounded-md overflow-hidden border">
                    <img src={posterPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                    <button type="button" onClick={handleRemovePoster} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : videoPreview ? (
                  <div className="relative rounded-md overflow-hidden border bg-black">
                    <video src={videoPreview} controls className="w-full max-h-[240px]" />
                    <button type="button" onClick={handleRemoveVideo} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Image Upload */}
                    <div>
                      <input type="file" id="poster" accept="image/*" onChange={handlePosterUpload} disabled={loading} className="hidden" />
                      <label htmlFor="poster" className="block cursor-pointer border-2 border-dashed rounded-md p-4 text-center hover:border-primary/30 transition-colors">
                        <div className="h-9 w-9 mx-auto rounded-md bg-blue-500/8 flex items-center justify-center mb-2">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-[13px] font-medium mb-0.5">Image</p>
                        <p className="text-[11px] text-muted-foreground">JPG, PNG · max 10MB</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">1.91:1, 1:1, or 4:5</p>
                      </label>
                    </div>

                    {/* Video Upload */}
                    <div>
                      <input type="file" id="video" accept="video/*" onChange={handleVideoUpload} disabled={loading} className="hidden" />
                      <label htmlFor="video" className="block cursor-pointer border-2 border-dashed rounded-md p-4 text-center hover:border-primary/30 transition-colors">
                        <div className="h-9 w-9 mx-auto rounded-md bg-violet-500/8 flex items-center justify-center mb-2">
                          <Video className="h-4 w-4 text-violet-600" />
                        </div>
                        <p className="text-[13px] font-medium mb-0.5">Video</p>
                        <p className="text-[11px] text-muted-foreground">MP4, MOV · max 200MB</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">16:9, 1:1, 4:5, or 9:16</p>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Optional Details — Collapsible */}
            <Card>
              <button
                type="button"
                onClick={() => setShowOptional(!showOptional)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-sm font-semibold">Additional Details</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Company, location, source & link (optional)
                    {hasOptionalData && ' — filled'}
                  </p>
                </div>
                <span className="text-[12px] text-primary font-medium">{showOptional ? 'Hide' : 'Show'}</span>
              </button>
              {showOptional && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="companyName" className="text-[12px] font-medium flex items-center gap-1.5 mb-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" /> Company <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="e.g., Google"
                        value={formData.companyName}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-[12px] font-medium flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" /> Location <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <LocationAutocomplete
                        id="location"
                        value={formData.location}
                        onChange={(value) => setFormData({ ...formData, location: value })}
                        placeholder="City, State, or Remote"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="source" className="text-[12px] font-medium flex items-center gap-1.5 mb-1">
                        <Newspaper className="h-3 w-3 text-muted-foreground" /> Source <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="source"
                        name="source"
                        placeholder="e.g., LinkedIn, Company Page"
                        value={formData.source}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="externalLink" className="text-[12px] font-medium flex items-center gap-1.5 mb-1">
                        <Link2 className="h-3 w-3 text-muted-foreground" /> External Link <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                      </Label>
                      <Input
                        id="externalLink"
                        name="externalLink"
                        type="url"
                        placeholder="https://example.com/job"
                        value={formData.externalLink}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-9 text-[13px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Submit */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-[13px]"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-[13px]"
                disabled={loading || !formData.title.trim() || !formData.description.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {uploadingMedia ? 'Uploading...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Publish Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right Sidebar — Tips */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Posting Tips</h3>
                </div>
                <div className="space-y-3 text-[12px] text-muted-foreground leading-relaxed">
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0">1</span>
                    <p>Use a clear, specific title that describes the opportunity or topic</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0">2</span>
                    <p>Include key details: role, company, requirements, and how to apply</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0">3</span>
                    <p>Add an image or video to make your post stand out in the feed</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center flex-shrink-0">4</span>
                    <p>Include a source link so others can verify the information</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-2">What can you share?</h3>
                <div className="space-y-2 text-[12px] text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <p>Job openings & referral opportunities</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <p>Career tips & interview advice</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                    <p>Industry news & salary insights</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <p>Hiring alerts & walk-in drives</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
