'use client';

import { useEffect, useState, Suspense } from 'react';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/lib/utils';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DEGREE_OPTIONS, getFieldsOfStudy } from '@/lib/degrees';
import {
  User,
  Loader2,
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Camera,
  Upload,
  FileText,
} from 'lucide-react';
import { api, userAPI } from '@/lib/api';

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  description?: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface Skill {
  id: string;
  name: string;
  level?: string;
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isHydrated, updateUser, triggerProfileUpdate } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'basic');

  // Basic Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [profileData, setProfileData] = useState<any>(null);

  // Education, Experience, Skills
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Modal states
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Delete dialog states
  const [deleteEducationId, setDeleteEducationId] = useState<string | null>(null);
  const [deleteExperienceId, setDeleteExperienceId] = useState<string | null>(null);
  const [deletePhotoDialogOpen, setDeletePhotoDialogOpen] = useState(false);
  const [deleteResumeDialogOpen, setDeleteResumeDialogOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchUserProfile();
  }, [isAuthenticated, isHydrated, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const data = response.data;
      const userData = data.data;

      useAuthStore.getState().updateUser(userData);

      setName(userData.name || '');
      setPhone(userData.phone || '');
      setLocation(userData.location || '');
      setBio(userData.profile?.bio || '');
      setProfileData(userData.profile);

      if (userData.profile) {
        setEducation(userData.profile.education || []);
        setExperience(userData.profile.experiences || []); // Backend returns 'experiences' not 'experience'
        setSkills(userData.profile.skills || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveBasicInfo = async () => {
    setLoading(true);
    try {
      // Update basic info
      await userAPI.updateBasicInfo({ name, phone, location });

      // Update bio (profile)
      await api.put('/users/profile-info', { bio });

      // Upload pending resume file if exists
      if (pendingResumeFile) {
        await uploadResumeFile(pendingResumeFile);
        setPendingResumeFile(null);
      }

      await fetchUserProfile();
      triggerProfileUpdate();
      toast({ title: 'Success', description: 'Profile updated successfully', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadResumeFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64File = reader.result as string;

          const response = await userAPI.uploadResume({
            file: base64File,
            mimeType: file.type,
            fileName: file.name,
          });

          const data = response.data;

          // Update only the profileData resume field
          setProfileData((prev: any) => ({
            ...prev,
            resume: data.data.resume
          }));

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  const addEducation = async (data: Partial<Education>) => {
    try {
      const url = editingItem?.id ? `/users/education/${editingItem.id}` : '/users/education';
      const method = editingItem?.id ? 'put' : 'post';
      await api[method](url, data);

      await fetchUserProfile();
      triggerProfileUpdate();
      setShowEducationForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Education ${editingItem ? 'updated' : 'added'} successfully`, variant: 'success' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save education',
        variant: 'destructive'
      });
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      await userAPI.deleteEducation(id);

      await fetchUserProfile();
      triggerProfileUpdate();
      setDeleteEducationId(null);
      toast({ title: 'Success', description: 'Education deleted successfully', variant: 'success' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete education',
        variant: 'destructive'
      });
    }
  };

  const addExperience = async (data: Partial<Experience>) => {
    try {
      const url = editingItem?.id ? `/users/experience/${editingItem.id}` : '/users/experience';
      const method = editingItem?.id ? 'put' : 'post';
      await api[method](url, data);

      await fetchUserProfile();
      triggerProfileUpdate();
      setShowExperienceForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Experience ${editingItem ? 'updated' : 'added'} successfully`, variant: 'success' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save experience',
        variant: 'destructive'
      });
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      await userAPI.deleteExperience(id);

      await fetchUserProfile();
      triggerProfileUpdate();
      setDeleteExperienceId(null);
      toast({ title: 'Success', description: 'Experience deleted successfully', variant: 'success' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete experience',
        variant: 'destructive'
      });
    }
  };

  const addSkill = async (name: string, level?: string) => {
    try {
      await userAPI.addSkill({ name, level });

      await fetchUserProfile();
      triggerProfileUpdate();
      setShowSkillForm(false);
      toast({ title: 'Success', description: 'Skill added successfully', variant: 'success' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add skill',
        variant: 'destructive'
      });
    }
  };

  const deleteSkill = async (id: string) => {
    await userAPI.deleteSkill(id);

    await fetchUserProfile();
    triggerProfileUpdate();
    toast({ title: 'Success', description: 'Skill deleted successfully', variant: 'success' });
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingPhoto(true);

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;

        const response = await userAPI.uploadProfilePhoto({
          image: base64Image,
          mimeType: file.type,
        });

        const data = response.data;

        // Update user in auth store
        if (data.data) {
          updateUser(data.data);
        }

        triggerProfileUpdate();
        toast({
          title: 'Success',
          description: 'Profile photo uploaded successfully',
          variant: 'success',
        });
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const response = await userAPI.deleteProfilePhoto();

      const data = response.data;

      // Update user in auth store
      if (data.data) {
        updateUser(data.data);
      }

      setDeletePhotoDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Profile photo removed successfully',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Please select a PDF or Word document',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // Store file for upload when Save Changes is clicked
    setPendingResumeFile(file);
    toast({
      title: 'File Selected',
      description: `${file.name} will be uploaded when you save changes`,
    });
  };

  const handleDeleteResume = async () => {
    try {
      setUploadingResume(true);
      await userAPI.deleteResume();

      // Update only the profileData resume field without refetching everything
      setProfileData((prev: any) => ({
        ...prev,
        resume: null
      }));

      setDeleteResumeDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Resume removed successfully',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resume',
        variant: 'destructive',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Profile Header */}
            <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage
                    src={user.profilePhoto || undefined}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                  <AvatarFallback className="text-xl sm:text-2xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <input
                    type="file"
                    id="profile-photo-input"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <label htmlFor="profile-photo-input" className="cursor-pointer">
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </label>
                </div>
              </div>
              <div className="flex-1 w-full">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1 break-words">{user.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words">{user.email}</p>
                <div className="flex flex-wrap gap-2">
                  <label htmlFor="profile-photo-input">
                    <Button variant="outline" size="sm" asChild disabled={uploadingPhoto}>
                      <span className="cursor-pointer text-xs sm:text-sm">
                        {uploadingPhoto ? (
                          <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">{user.profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                        <span className="sm:hidden">{user.profilePhoto ? 'Change' : 'Upload'}</span>
                      </span>
                    </Button>
                  </label>
                  {user.profilePhoto && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePhotoDialogOpen(true)}
                      disabled={uploadingPhoto}
                      className="text-xs sm:text-sm"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 p-1">
            <TabsTrigger value="basic" className="text-sm">
              <User className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="experience" className="text-sm">
              <Briefcase className="h-4 w-4 mr-2" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="text-sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-sm">
              <Award className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <LocationAutocomplete
                      id="location"
                      value={location}
                      onChange={setLocation}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                {/* Resume Upload Section */}
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-3 block">Resume/CV</Label>
                  {pendingResumeFile ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-2 border-orange-500 rounded-lg bg-orange-50 dark:bg-orange-950">
                      <FileText className="h-8 w-8 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-orange-900 dark:text-orange-100 break-words">
                          {pendingResumeFile.name}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          Ready to upload - Click "Save Changes" to upload
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingResumeFile(null);
                          const input = document.getElementById('resume-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="flex-shrink-0 self-end sm:self-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : profileData?.resume ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border rounded-lg bg-accent/20">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Resume uploaded</p>
                        <p className="text-xs text-muted-foreground">
                          Click view to open or delete to remove
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          disabled={uploadingResume}
                        >
                          <a href={profileData.resume} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteResumeDialogOpen(true)}
                          disabled={uploadingResume}
                        >
                          {uploadingResume ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                        disabled={uploadingResume}
                      />
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium mb-1">Upload your resume</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        PDF or Word document, max 10MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('resume-upload')?.click()}
                        disabled={uploadingResume}
                      >
                        {uploadingResume ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <Button onClick={saveBasicInfo} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <CardTitle>Work Experience</CardTitle>
                      <CardDescription>Add your professional experience</CardDescription>
                    </div>
                    <Button onClick={() => { setShowExperienceForm(true); setEditingItem(null); }} className="sm:flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Experience</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {experience.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No experience added yet</p>
                  ) : (
                    experience.map((exp) => (
                      <div key={exp.id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base sm:text-lg">{exp.title}</h3>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            {exp.location && <p className="text-sm text-muted-foreground">{exp.location}</p>}
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {new Date(exp.startDate).toLocaleDateString()} -{' '}
                              {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                            </p>
                            {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingItem(exp);
                                setShowExperienceForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteExperienceId(exp.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Experience Form Modal */}
              {showExperienceForm && (
                <ExperienceForm
                  initialData={editingItem}
                  onSave={addExperience}
                  onCancel={() => {
                    setShowExperienceForm(false);
                    setEditingItem(null);
                  }}
                />
              )}
            </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </div>
                    <Button onClick={() => { setShowEducationForm(true); setEditingItem(null); }} className="sm:flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Education</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {education.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No education added yet</p>
                  ) : (
                    education.map((edu) => (
                      <div key={edu.id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base sm:text-lg">{edu.degree} in {edu.fieldOfStudy}</h3>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {new Date(edu.startDate).toLocaleDateString()} -{' '}
                              {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString() : ''}
                            </p>
                            {edu.grade && <p className="text-sm mt-1">Grade: {edu.grade}</p>}
                            {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingItem(edu);
                                setShowEducationForm(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteEducationId(edu.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Education Form Modal */}
              {showEducationForm && (
                <EducationForm
                  initialData={editingItem}
                  onSave={addEducation}
                  onCancel={() => {
                    setShowEducationForm(false);
                    setEditingItem(null);
                  }}
                />
              )}
            </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div>
                      <CardTitle>Skills</CardTitle>
                      <CardDescription>Add your technical and soft skills</CardDescription>
                    </div>
                    <Button onClick={() => setShowSkillForm(true)} className="sm:flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Skill</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {skills.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No skills added yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-sm px-3 py-1">
                          {skill.name}
                          {skill.level && ` (${skill.level})`}
                          <button onClick={() => deleteSkill(skill.id)} className="ml-2">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skill Form Modal */}
              {showSkillForm && (
                <SkillForm
                  onSave={addSkill}
                  onCancel={() => setShowSkillForm(false)}
                />
              )}
            </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Profile Completion */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8">
              <ProfileCompletion
                user={user}
                profile={{
                  ...profileData,
                  skills,
                  experiences: experience,
                  education,
                }}
                onNavigate={setActiveTab}
              />
            </div>
          </div>
        </div>

        {/* Delete Education Dialog */}
        <AlertDialog open={!!deleteEducationId} onOpenChange={(open) => !open && setDeleteEducationId(null)}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Education</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to delete this education entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteEducationId && deleteEducation(deleteEducationId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Experience Dialog */}
        <AlertDialog open={!!deleteExperienceId} onOpenChange={(open) => !open && setDeleteExperienceId(null)}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Experience</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to delete this experience entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteExperienceId && deleteExperience(deleteExperienceId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Profile Photo Dialog */}
        <AlertDialog open={deletePhotoDialogOpen} onOpenChange={setDeletePhotoDialogOpen}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Remove Profile Photo</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to remove your profile photo? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProfilePhoto}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Resume Dialog */}
        <AlertDialog open={deleteResumeDialogOpen} onOpenChange={setDeleteResumeDialogOpen}>
          <AlertDialogContent className="max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Remove Resume</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to remove your resume? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteResume}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Education Form Component
function EducationForm({ initialData, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    institution: initialData?.institution || '',
    degree: initialData?.degree || '',
    fieldOfStudy: initialData?.fieldOfStudy || '',
    startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
    current: initialData?.current || false,
    grade: initialData?.grade || '',
    description: initialData?.description || '',
  });

  const [customDegree, setCustomDegree] = useState('');
  const [customField, setCustomField] = useState('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Update available fields when degree changes
  React.useEffect(() => {
    if (formData.degree && formData.degree !== 'Other') {
      const fields = getFieldsOfStudy(formData.degree);
      setAvailableFields(fields);

      // Reset field of study if it's not in the new list
      if (formData.fieldOfStudy && !fields.includes(formData.fieldOfStudy)) {
        setFormData(prev => ({ ...prev, fieldOfStudy: '' }));
      }
    }
  }, [formData.degree]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use custom values if "Other" is selected
    const finalData = {
      ...formData,
      degree: formData.degree === 'Other' ? customDegree : formData.degree,
      fieldOfStudy: formData.fieldOfStudy === 'Other Field' || formData.fieldOfStudy === 'Please specify your field'
        ? customField
        : formData.fieldOfStudy,
    };

    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{initialData ? 'Edit' : 'Add'} Education</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="md:col-span-2">
                <Label>Institution *</Label>
                <Input
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g., Harvard University, MIT, Stanford College"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">School, college, or university name</p>
              </div>
              <div>
                <Label>Degree *</Label>
                <Select
                  value={formData.degree}
                  onValueChange={(value) => setFormData({ ...formData, degree: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEGREE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Select your degree type</p>
                {formData.degree === 'Other' && (
                  <Input
                    value={customDegree}
                    onChange={(e) => setCustomDegree(e.target.value)}
                    placeholder="Enter your degree"
                    className="mt-2"
                    required
                  />
                )}
              </div>
              <div>
                <Label>Field of Study *</Label>
                <Select
                  value={formData.fieldOfStudy}
                  onValueChange={(value) => setFormData({ ...formData, fieldOfStudy: value })}
                  required
                  disabled={!formData.degree}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.degree ? "Select field of study" : "Select degree first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Your major or specialization</p>
                {(formData.fieldOfStudy === 'Other Field' ||
                  formData.fieldOfStudy === 'Other Engineering' ||
                  formData.fieldOfStudy === 'Other Computer Field' ||
                  formData.fieldOfStudy === 'Other Science' ||
                  formData.fieldOfStudy === 'Other Commerce' ||
                  formData.fieldOfStudy === 'Other Management' ||
                  formData.fieldOfStudy === 'Other Arts/Humanities' ||
                  formData.fieldOfStudy === 'Other Law' ||
                  formData.fieldOfStudy === 'Other Medical' ||
                  formData.fieldOfStudy === 'Other Pharmacy' ||
                  formData.fieldOfStudy === 'Other Architecture' ||
                  formData.fieldOfStudy === 'Other Diploma' ||
                  formData.fieldOfStudy === 'Other Research' ||
                  formData.fieldOfStudy === 'Please specify your field') && (
                  <Input
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    placeholder="Enter your field of study"
                    className="mt-2"
                    required
                  />
                )}
              </div>
              <div>
                <Label>Grade (Optional)</Label>
                <Input
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="8.5 CGPA, 85%, First Class"
                />
                <p className="text-xs text-muted-foreground mt-1">GPA, percentage, or class</p>
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">When you started studying</p>
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={formData.current}
                />
                <p className="text-xs text-muted-foreground mt-1">When you graduated or will graduate</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="current-edu"
                checked={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: '' })}
              />
              <Label htmlFor="current-edu">Currently studying here (Check if ongoing)</Label>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about your education, achievements, relevant coursework, projects, etc."
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">Any notable achievements, projects, or activities</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Experience Form Component
function ExperienceForm({ initialData, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    company: initialData?.company || '',
    location: initialData?.location || '',
    startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
    current: initialData?.current || false,
    description: initialData?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{initialData ? 'Edit' : 'Add'} Experience</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label>Job Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Software Engineer, Project Manager"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Your role or position</p>
              </div>
              <div>
                <Label>Company *</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Google, Microsoft, ABC Company"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Company or organization name</p>
              </div>
              <div className="md:col-span-2">
                <Label>Location (Optional)</Label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  placeholder="San Francisco, CA or Remote"
                />
                <p className="text-xs text-muted-foreground mt-1">City, state/country or Remote</p>
              </div>
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">When you started this job</p>
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={formData.current}
                />
                <p className="text-xs text-muted-foreground mt-1">When you left or will leave</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="current-job"
                checked={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: '' })}
              />
              <Label htmlFor="current-job">Currently working here (Check if this is your current job)</Label>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your responsibilities, achievements, and key projects. Example: Led development of mobile app, managed team of 5 engineers, improved system performance by 40%"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">Your responsibilities, achievements, and key projects</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Skill Form Component
function SkillForm({ onSave, onCancel }: any) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name, level);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Add Skill</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <Label>Skill Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="JavaScript, Python, Project Management"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Technical skills, tools, or soft skills you possess</p>
            </div>
            <div>
              <Label>Proficiency Level (Optional)</Label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="">Select level (optional)</option>
                <option value="Beginner">Beginner - Just started learning</option>
                <option value="Intermediate">Intermediate - Can work independently</option>
                <option value="Advanced">Advanced - High expertise</option>
                <option value="Expert">Expert - Master level</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">How proficient are you with this skill?</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Add Skill</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="flex items-center justify-center min-h-screen">Loading...</div></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
