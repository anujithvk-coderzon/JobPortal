'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { jobAPI, applicationAPI } from '@/lib/api';
import { Job } from '@/lib/types';
import { Loader2, ArrowLeft, Briefcase, Building2, MapPin, Send, Save, AlertCircle, CheckCircle, Plus, Pencil, Trash2, X } from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  experience: any[];
  education: any[];
  skills: any[];
}

export default function ApplyJobPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    experience: [],
    education: [],
    skills: [],
  });

  const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    experience: [],
    education: [],
    skills: [],
  });

  const [coverLetter, setCoverLetter] = useState('');
  const [profileChanged, setProfileChanged] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Modal states
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const jobId = params.id as string;

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchJobAndProfile();
  }, [isAuthenticated, isHydrated, router, jobId]);

  useEffect(() => {
    // Check if profile has changed
    const hasChanged =
      profileData.name !== originalProfileData.name ||
      profileData.phone !== originalProfileData.phone ||
      profileData.location !== originalProfileData.location ||
      profileData.bio !== originalProfileData.bio;

    setProfileChanged(hasChanged);
    if (hasChanged) {
      setProfileSaved(false);
    }
  }, [profileData, originalProfileData]);

  const fetchJobAndProfile = async () => {
    try {
      setLoading(true);

      // Fetch job details
      const jobResponse = await jobAPI.getJobById(jobId);
      setJob(jobResponse.data.data);

      if (jobResponse.data.data.hasApplied) {
        toast({
          title: 'Already Applied',
          description: 'You have already applied for this job',
        });
        router.push(`/jobs/${jobId}`);
        return;
      }

      // Fetch user profile
      const token = localStorage.getItem('token');
      const profileResponse = await fetch('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileDataResponse = await profileResponse.json();
        const userData = profileDataResponse.data;

        const profile = {
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          bio: userData.profile?.bio || '',
          experience: userData.profile?.experiences || [], // Backend returns 'experiences' not 'experience'
          education: userData.profile?.education || [],
          skills: userData.profile?.skills || [],
        };

        setProfileData(profile);
        setOriginalProfileData(profile);
        setProfileSaved(!hasEmptyRequiredFields(profile));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const hasEmptyRequiredFields = (profile: ProfileData) => {
    return !profile.name || !profile.phone || !profile.location || !profile.bio;
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');

      // Update basic info
      await fetch('http://localhost:5001/api/users/basic-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          location: profileData.location,
        }),
      });

      // Update bio
      await fetch('http://localhost:5001/api/users/profile-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: profileData.bio }),
      });

      setOriginalProfileData(profileData);
      setProfileSaved(true);
      setProfileChanged(false);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const addExperience = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `http://localhost:5001/api/users/experience/${editingItem.id}`
        : 'http://localhost:5001/api/users/experience';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save experience');
      }

      await fetchJobAndProfile();
      setShowExperienceForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Experience ${editingItem ? 'updated' : 'added'} successfully` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save experience',
        variant: 'destructive',
      });
    }
  };

  const deleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience entry?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/users/experience/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchJobAndProfile();
      toast({ title: 'Success', description: 'Experience deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete experience', variant: 'destructive' });
    }
  };

  const addEducation = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem
        ? `http://localhost:5001/api/users/education/${editingItem.id}`
        : 'http://localhost:5001/api/users/education';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save education');
      }

      await fetchJobAndProfile();
      setShowEducationForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Education ${editingItem ? 'updated' : 'added'} successfully` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save education',
        variant: 'destructive',
      });
    }
  };

  const deleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/users/education/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchJobAndProfile();
      toast({ title: 'Success', description: 'Education deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete education', variant: 'destructive' });
    }
  };

  const addSkill = async (name: string, level?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, level }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }

      await fetchJobAndProfile();
      setShowSkillForm(false);
      toast({ title: 'Success', description: 'Skill added successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add skill',
        variant: 'destructive',
      });
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/users/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchJobAndProfile();
      toast({ title: 'Success', description: 'Skill deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete skill', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if required profile fields are filled
    if (hasEmptyRequiredFields(profileData)) {
      toast({
        title: 'Incomplete Profile',
        description: 'Please fill in all required profile fields (Name, Phone, Location, Bio) and save before applying',
        variant: 'destructive',
      });
      return;
    }

    // Check if profile changes have been saved
    if (profileChanged) {
      toast({
        title: 'Unsaved Changes',
        description: 'Please save your profile changes before submitting your application',
        variant: 'destructive',
      });
      return;
    }

    if (!coverLetter.trim()) {
      toast({
        title: 'Missing Cover Letter',
        description: 'Please write a cover letter',
        variant: 'destructive',
      });
      return;
    }

    setApplying(true);
    try {
      await applicationAPI.applyToJob(jobId, { coverLetter });

      toast({
        title: 'Success',
        description: 'Your application has been submitted successfully!',
      });

      router.push('/applications');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const hasEmptyFields = hasEmptyRequiredFields(profileData);
  const canSubmit = !hasEmptyFields && !profileChanged && profileSaved && coverLetter.trim();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/jobs/${jobId}`)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job
        </Button>

        {/* Job Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {job.company?.name || job.companyName || 'Company'}
                  </span>
                  {job.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            </div>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Your Profile Information</CardTitle>
                  <CardDescription>
                    Required fields are marked with <span className="text-destructive">*</span>. All changes must be saved before submitting.
                  </CardDescription>
                </div>
                {profileChanged && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                {profileSaved && !profileChanged && !hasEmptyFields && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Profile Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profileData.email} disabled />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, Country"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">
                  Professional Bio <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Brief introduction about yourself and your professional background..."
                  rows={4}
                  required
                />
              </div>

              {/* Save Button */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Experience, education, and skills are optional but recommended to strengthen your application
                  </p>
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={!profileChanged || savingProfile}
                    variant={profileChanged ? 'default' : 'outline'}
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {profileChanged ? 'Save Profile' : 'Saved'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Work Experience</CardTitle>
                  <CardDescription>
                    {profileData.experience.length > 0
                      ? 'Your work experience will be included with your application'
                      : 'Add work experience to strengthen your application (Optional)'}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setShowExperienceForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profileData.experience.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No work experience added yet</p>
                  <p className="text-sm">Click "Add Experience" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.experience.map((exp: any) => (
                    <div key={exp.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{exp.title}</h4>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          {exp.location && <p className="text-sm text-muted-foreground">{exp.location}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(exp.startDate).toLocaleDateString()} - {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                          </p>
                          {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingItem(exp);
                              setShowExperienceForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExperience(exp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Education</CardTitle>
                  <CardDescription>
                    {profileData.education.length > 0
                      ? 'Your educational background will be included with your application'
                      : 'Add education to strengthen your application (Optional)'}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setShowEducationForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profileData.education.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No education added yet</p>
                  <p className="text-sm">Click "Add Education" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profileData.education.map((edu: any) => (
                    <div key={edu.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(edu.startDate).toLocaleDateString()} - {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString() : ''}
                          </p>
                          {edu.grade && <p className="text-sm mt-1">Grade: {edu.grade}</p>}
                          {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingItem(edu);
                              setShowEducationForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEducation(edu.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>
                    {profileData.skills.length > 0
                      ? 'Your skills will be included with your application'
                      : 'Add skills to strengthen your application (Optional)'}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSkillForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profileData.skills.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No skills added yet</p>
                  <p className="text-sm">Click "Add Skill" to get started</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary" className="text-sm px-3 py-1">
                      {skill.name}
                      {skill.level && ` (${skill.level})`}
                      <button
                        type="button"
                        onClick={() => deleteSkill(skill.id)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter <span className="text-destructive">*</span></CardTitle>
              <CardDescription>
                Tell the employer why you're interested in this position (Required)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Dear Hiring Manager,&#10;&#10;I am writing to express my interest in the [position] role at [company]...&#10;&#10;With my experience in [...], I am confident that I can contribute to your team by [...]."
                rows={12}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {coverLetter.length} characters
              </p>
            </CardContent>
          </Card>

          {/* Validation Messages */}
          {(hasEmptyFields || profileChanged || !coverLetter.trim()) && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-yellow-900">Before you can submit:</p>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      {hasEmptyFields && (
                        <li>Fill in all required profile fields (marked with *)</li>
                      )}
                      {profileChanged && (
                        <li>Save your profile changes using the "Save Profile" button</li>
                      )}
                      {!coverLetter.trim() && (
                        <li>Write a cover letter</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!canSubmit || applying}
              className="flex-1"
              size="lg"
            >
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/jobs/${jobId}`)}
              disabled={applying}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>

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

        {/* Skill Form Modal */}
        {showSkillForm && (
          <SkillForm
            onSave={addSkill}
            onCancel={() => setShowSkillForm(false)}
          />
        )}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{initialData ? 'Edit' : 'Add'} Education</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Institution *</Label>
                <Input
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="St. Thomas College of Engineering and Technology"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">School, college, or university name</p>
              </div>
              <div>
                <Label>Degree *</Label>
                <Input
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="B.Tech, M.Sc, Bachelor's, Master's"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Type of degree or certification</p>
              </div>
              <div>
                <Label>Field of Study *</Label>
                <Input
                  value={formData.fieldOfStudy}
                  onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                  placeholder="Computer Science and Engineering"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Your major or specialization</p>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{initialData ? 'Edit' : 'Add'} Experience</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
    setName('');
    setLevel('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
