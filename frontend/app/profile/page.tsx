'use client';

import { useEffect, useState, Suspense } from 'react';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/lib/utils';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { Breadcrumb } from '@/components/Breadcrumb';
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
  MapPin,
  Phone,
  Mail,
  ChevronDown,
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
  const initialTab = searchParams?.get('tab') || 'basic';

  // Section expand states — all open by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    experience: true,
    education: true,
    skills: true,
  });

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navigateToSection = (tab: string) => {
    setExpandedSections(prev => ({ ...prev, [tab]: true }));
    setTimeout(() => {
      document.getElementById(`section-${tab}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
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
        setExperience(userData.profile.experiences || []);
        setSkills(userData.profile.skills || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveBasicInfo = async () => {
    setLoading(true);
    try {
      await userAPI.updateBasicInfo({ name, phone, location });
      await api.put('/users/profile-info', { bio });
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
          const response = await userAPI.uploadResume({ file: base64File, mimeType: file.type, fileName: file.name });
          const data = response.data;
          setProfileData((prev: any) => ({ ...prev, resume: data.data.resume }));
          resolve(data);
        } catch (error) { reject(error); }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
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
      toast({ title: 'Success', description: `Education ${editingItem ? 'updated' : 'added'}`, variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save education', variant: 'destructive' });
    }
  };

  const deleteEducation = async (id: string) => {
    try {
      await userAPI.deleteEducation(id);
      await fetchUserProfile();
      triggerProfileUpdate();
      setDeleteEducationId(null);
      toast({ title: 'Success', description: 'Education deleted', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' });
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
      toast({ title: 'Success', description: `Experience ${editingItem ? 'updated' : 'added'}`, variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save experience', variant: 'destructive' });
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      await userAPI.deleteExperience(id);
      await fetchUserProfile();
      triggerProfileUpdate();
      setDeleteExperienceId(null);
      toast({ title: 'Success', description: 'Experience deleted', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const addSkill = async (skillName: string, level?: string) => {
    try {
      await userAPI.addSkill({ name: skillName, level });
      await fetchUserProfile();
      triggerProfileUpdate();
      setShowSkillForm(false);
      toast({ title: 'Success', description: 'Skill added', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to add skill', variant: 'destructive' });
    }
  };

  const deleteSkill = async (id: string) => {
    await userAPI.deleteSkill(id);
    await fetchUserProfile();
    triggerProfileUpdate();
    toast({ title: 'Success', description: 'Skill deleted', variant: 'success' });
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Error', description: 'Image must be under 5MB', variant: 'destructive' }); return; }
    try {
      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const response = await userAPI.uploadProfilePhoto({ image: base64Image, mimeType: file.type });
        if (response.data.data) updateUser(response.data.data);
        triggerProfileUpdate();
        toast({ title: 'Success', description: 'Photo uploaded', variant: 'success' });
      };
      reader.onerror = () => { throw new Error('Failed to read file'); };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      setUploadingPhoto(true);
      const response = await userAPI.deleteProfilePhoto();
      if (response.data.data) updateUser(response.data.data);
      setDeletePhotoDialogOpen(false);
      toast({ title: 'Success', description: 'Photo removed', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) { toast({ title: 'Error', description: 'Please select a PDF or Word document', variant: 'destructive' }); event.target.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Error', description: 'File must be under 10MB', variant: 'destructive' }); event.target.value = ''; return; }
    setPendingResumeFile(file);
    toast({ title: 'File Selected', description: `${file.name} — save changes to upload` });
  };

  const handleDeleteResume = async () => {
    try {
      setUploadingResume(true);
      await userAPI.deleteResume();
      setProfileData((prev: any) => ({ ...prev, resume: null }));
      setDeleteResumeDialogOpen(false);
      toast({ title: 'Success', description: 'Resume removed', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete resume', variant: 'destructive' });
    } finally {
      setUploadingResume(false);
    }
  };

  if (!isHydrated || !isAuthenticated || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const SectionHeader = ({ id, title, icon: Icon, count, children }: { id: string; title: string; icon: any; count?: number; children?: React.ReactNode }) => (
    <div id={`section-${id}`} className="flex items-center justify-between">
      <button onClick={() => toggleSection(id)} className="flex items-center gap-2.5 group">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {count !== undefined && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count}</Badge>}
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expandedSections[id] ? 'rotate-180' : ''}`} />
      </button>
      {children}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      <Breadcrumb items={[
        { label: 'My Page', href: '/my-page' },
        { label: 'Edit Profile' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left — Main Content */}
        <div className="space-y-4">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="relative group flex-shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={user.profilePhoto || undefined} referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input type="file" id="profile-photo-input" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                    <label htmlFor="profile-photo-input" className="cursor-pointer">
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                    </label>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold tracking-tight truncate">{user.name}</h1>
                  <p className="text-[13px] text-muted-foreground truncate">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                    {user.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>
                    )}
                    {user.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <label htmlFor="profile-photo-input">
                      <Button variant="outline" size="sm" asChild disabled={uploadingPhoto}>
                        <span className="cursor-pointer text-[12px] h-7">
                          <Upload className="h-3 w-3 mr-1" />
                          {user.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                        </span>
                      </Button>
                    </label>
                    {user.profilePhoto && (
                      <Button variant="outline" size="sm" onClick={() => setDeletePhotoDialogOpen(true)} disabled={uploadingPhoto} className="text-[12px] h-7 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information Section */}
          <Card>
            <div className="p-4 sm:p-5">
              <SectionHeader id="basic" title="Basic Information" icon={User} />
              {expandedSections.basic && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-[12px] font-medium">Full Name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-[13px] mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-[12px] font-medium">Email</Label>
                      <Input id="email" value={user.email} disabled className="h-9 text-[13px] mt-1 bg-muted/50" />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-[12px] font-medium">Phone</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-[13px] mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-[12px] font-medium">Location</Label>
                      <LocationAutocomplete id="location" value={location} onChange={setLocation} placeholder="City, Country" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio" className="text-[12px] font-medium">Bio</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} className="text-[13px] mt-1" />
                  </div>

                  {/* Resume */}
                  <div className="border-t border-border/60 pt-4">
                    <Label className="text-[12px] font-medium mb-2 block">Resume / CV</Label>
                    {pendingResumeFile ? (
                      <div className="flex items-center gap-3 p-3 border-2 border-amber-500 rounded-md bg-amber-50 dark:bg-amber-950/30">
                        <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{pendingResumeFile.name}</p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">Save changes to upload</p>
                        </div>
                        <button onClick={() => { setPendingResumeFile(null); const input = document.getElementById('resume-upload') as HTMLInputElement; if (input) input.value = ''; }} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : profileData?.resume ? (
                      <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium">Resume uploaded</p>
                          <p className="text-[11px] text-muted-foreground">Click view to open</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button variant="outline" size="sm" asChild className="h-7 text-[12px]">
                            <a href={profileData.resume} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteResumeDialogOpen(true)} disabled={uploadingResume}>
                            {uploadingResume ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-md p-4 text-center">
                        <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" disabled={uploadingResume} />
                        <FileText className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground" />
                        <p className="text-[13px] font-medium mb-0.5">Upload your resume</p>
                        <p className="text-[11px] text-muted-foreground mb-2">PDF or Word, max 10MB</p>
                        <Button variant="outline" size="sm" className="text-[12px] h-7" onClick={() => document.getElementById('resume-upload')?.click()} disabled={uploadingResume}>
                          {uploadingResume ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Uploading...</> : <><Upload className="h-3 w-3 mr-1" /> Choose File</>}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button onClick={saveBasicInfo} disabled={loading} size="sm" className="text-[13px]">
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Experience Section */}
          <Card>
            <div className="p-4 sm:p-5">
              <SectionHeader id="experience" title="Work Experience" icon={Briefcase} count={experience.length}>
                <Button size="sm" className="text-[12px] h-7" onClick={() => { setShowExperienceForm(true); setEditingItem(null); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </SectionHeader>
              {expandedSections.experience && (
                <div className="mt-4">
                  {experience.length === 0 ? (
                    <p className="text-center py-6 text-[13px] text-muted-foreground">No experience added yet</p>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                      {experience.map((exp) => (
                        <div key={exp.id} className="rounded-md border p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-medium">{exp.title}</h4>
                              <p className="text-[12px] text-muted-foreground">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} –{' '}
                                {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                              </p>
                              {exp.description && <p className="text-[12px] mt-1.5 text-muted-foreground leading-relaxed line-clamp-3">{exp.description}</p>}
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingItem(exp); setShowExperienceForm(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteExperienceId(exp.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Education Section */}
          <Card>
            <div className="p-4 sm:p-5">
              <SectionHeader id="education" title="Education" icon={GraduationCap} count={education.length}>
                <Button size="sm" className="text-[12px] h-7" onClick={() => { setShowEducationForm(true); setEditingItem(null); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </SectionHeader>
              {expandedSections.education && (
                <div className="mt-4">
                  {education.length === 0 ? (
                    <p className="text-center py-6 text-[13px] text-muted-foreground">No education added yet</p>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                      {education.map((edu) => (
                        <div key={edu.id} className="rounded-md border p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-medium">{edu.degree} in {edu.fieldOfStudy}</h4>
                              <p className="text-[12px] text-muted-foreground">{edu.institution}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} –{' '}
                                {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                              </p>
                              {edu.grade && <p className="text-[12px] mt-0.5 text-muted-foreground">Grade: {edu.grade}</p>}
                              {edu.description && <p className="text-[12px] mt-1.5 text-muted-foreground leading-relaxed line-clamp-3">{edu.description}</p>}
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingItem(edu); setShowEducationForm(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteEducationId(edu.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Skills Section */}
          <Card>
            <div className="p-4 sm:p-5">
              <SectionHeader id="skills" title="Skills" icon={Award} count={skills.length}>
                <Button size="sm" className="text-[12px] h-7" onClick={() => setShowSkillForm(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </SectionHeader>
              {expandedSections.skills && (
                <div className="mt-4">
                  {skills.length === 0 ? (
                    <p className="text-center py-6 text-[13px] text-muted-foreground">No skills added yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-[12px] px-2.5 py-1 gap-1">
                          {skill.name}
                          <button onClick={() => deleteSkill(skill.id)} className="ml-0.5 hover:text-destructive transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Mobile Profile Completion */}
          <div className="lg:hidden">
            <ProfileCompletion
              user={user}
              profile={{ ...profileData, skills, experiences: experience, education }}
              onNavigate={navigateToSection}
            />
          </div>
        </div>

        {/* Right Sidebar — Profile Completion */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <ProfileCompletion
              user={user}
              profile={{ ...profileData, skills, experiences: experience, education }}
              onNavigate={navigateToSection}
            />
          </div>
        </div>
      </div>

      {/* Education Form Modal */}
      {showEducationForm && (
        <EducationForm
          initialData={editingItem}
          onSave={addEducation}
          onCancel={() => { setShowEducationForm(false); setEditingItem(null); }}
        />
      )}

      {/* Experience Form Modal */}
      {showExperienceForm && (
        <ExperienceForm
          initialData={editingItem}
          onSave={addExperience}
          onCancel={() => { setShowExperienceForm(false); setEditingItem(null); }}
        />
      )}

      {/* Skill Form Modal */}
      {showSkillForm && (
        <SkillForm
          onSave={addSkill}
          onCancel={() => setShowSkillForm(false)}
        />
      )}

      {/* Delete Dialogs */}
      <AlertDialog open={!!deleteEducationId} onOpenChange={(open) => !open && setDeleteEducationId(null)}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Delete Education</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-[13px]" onClick={() => deleteEducationId && deleteEducation(deleteEducationId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteExperienceId} onOpenChange={(open) => !open && setDeleteExperienceId(null)}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Delete Experience</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-[13px]" onClick={() => deleteExperienceId && deleteExperience(deleteExperienceId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletePhotoDialogOpen} onOpenChange={setDeletePhotoDialogOpen}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Remove Profile Photo</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-[13px]" onClick={handleDeleteProfilePhoto}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteResumeDialogOpen} onOpenChange={setDeleteResumeDialogOpen}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Remove Resume</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="text-[13px]" onClick={handleDeleteResume}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  React.useEffect(() => {
    if (formData.degree && formData.degree !== 'Other') {
      const fields = getFieldsOfStudy(formData.degree);
      setAvailableFields(fields);
      if (formData.fieldOfStudy && !fields.includes(formData.fieldOfStudy)) {
        setFormData(prev => ({ ...prev, fieldOfStudy: '' }));
      }
    }
  }, [formData.degree]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      degree: formData.degree === 'Other' ? customDegree : formData.degree,
      fieldOfStudy: formData.fieldOfStudy === 'Other Field' || formData.fieldOfStudy === 'Please specify your field' ? customField : formData.fieldOfStudy,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{initialData ? 'Edit' : 'Add'} Education</h3>
          <button onClick={onCancel} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <CardContent className="px-4 sm:px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-[12px]">Institution *</Label>
                <Input value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} placeholder="e.g., Harvard University" required className="h-9 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[12px]">Degree *</Label>
                <Select value={formData.degree} onValueChange={(value) => setFormData({ ...formData, degree: value })} required>
                  <SelectTrigger className="h-9 text-[13px] mt-1"><SelectValue placeholder="Select degree" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {DEGREE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.degree === 'Other' && (
                  <Input value={customDegree} onChange={(e) => setCustomDegree(e.target.value)} placeholder="Enter your degree" className="mt-1.5 h-9 text-[13px]" required />
                )}
              </div>
              <div>
                <Label className="text-[12px]">Field of Study *</Label>
                <Select value={formData.fieldOfStudy} onValueChange={(value) => setFormData({ ...formData, fieldOfStudy: value })} required disabled={!formData.degree}>
                  <SelectTrigger className="h-9 text-[13px] mt-1"><SelectValue placeholder={formData.degree ? "Select field" : "Select degree first"} /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableFields.map((field) => (
                      <SelectItem key={field} value={field}>{field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Input value={customField} onChange={(e) => setCustomField(e.target.value)} placeholder="Enter field of study" className="mt-1.5 h-9 text-[13px]" required />
                )}
              </div>
              <div>
                <Label className="text-[12px]">Grade (Optional)</Label>
                <Input value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} placeholder="8.5 CGPA, 85%" className="h-9 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[12px]">Start Date *</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="h-9 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[12px]">End Date</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} disabled={formData.current} className="h-9 text-[13px] mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="current-edu" checked={formData.current} onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: '' })} className="rounded" />
              <Label htmlFor="current-edu" className="text-[12px]">Currently studying here</Label>
            </div>
            <div>
              <Label className="text-[12px]">Description (Optional)</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Achievements, coursework, projects..." rows={3} className="text-[13px] mt-1" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" className="text-[13px]" onClick={onCancel}>Cancel</Button>
              <Button type="submit" size="sm" className="text-[13px]">Save</Button>
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

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{initialData ? 'Edit' : 'Add'} Experience</h3>
          <button onClick={onCancel} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <CardContent className="px-4 sm:px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px]">Job Title *</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Software Engineer" required className="h-9 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[12px]">Company *</Label>
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Google, Microsoft" required className="h-9 text-[13px] mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[12px]">Location (Optional)</Label>
                <LocationAutocomplete value={formData.location} onChange={(value) => setFormData({ ...formData, location: value })} placeholder="San Francisco, CA or Remote" />
              </div>
              <div>
                <Label className="text-[12px]">Start Date *</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="h-9 text-[13px] mt-1" />
              </div>
              <div>
                <Label className="text-[12px]">End Date</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} disabled={formData.current} className="h-9 text-[13px] mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="current-job" checked={formData.current} onChange={(e) => setFormData({ ...formData, current: e.target.checked, endDate: '' })} className="rounded" />
              <Label htmlFor="current-job" className="text-[12px]">Currently working here</Label>
            </div>
            <div>
              <Label className="text-[12px]">Description (Optional)</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Your responsibilities and achievements..." rows={4} className="text-[13px] mt-1" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" className="text-[13px]" onClick={onCancel}>Cancel</Button>
              <Button type="submit" size="sm" className="text-[13px]">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Skill Form Component
function SkillForm({ onSave, onCancel }: any) {
  const [skillName, setSkillName] = useState('');

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(skillName); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-md">
        <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Add Skill</h3>
          <button onClick={onCancel} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <CardContent className="px-4 sm:px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-[12px]">Skill Name *</Label>
              <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="JavaScript, Python, Project Management" required className="h-9 text-[13px] mt-1" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" className="text-[13px]" onClick={onCancel}>Cancel</Button>
              <Button type="submit" size="sm" className="text-[13px]">Add Skill</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
