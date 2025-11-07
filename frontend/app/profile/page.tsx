'use client';

import { useEffect, useState, Suspense } from 'react';
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
} from 'lucide-react';

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
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'basic');

  // Basic Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // Education, Experience, Skills
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Modal states
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data;

        useAuthStore.getState().updateUser(userData);

        setName(userData.name || '');
        setPhone(userData.phone || '');
        setLocation(userData.location || '');
        setBio(userData.profile?.bio || '');

        if (userData.profile) {
          setEducation(userData.profile.education || []);
          setExperience(userData.profile.experiences || []); // Backend returns 'experiences' not 'experience'
          setSkills(userData.profile.skills || []);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const saveBasicInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Update basic info
      await fetch('http://localhost:5001/api/users/basic-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, location }),
      });

      // Update bio (profile)
      await fetch('http://localhost:5001/api/users/profile-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio }),
      });

      await fetchUserProfile();
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addEducation = async (data: Partial<Education>) => {
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

      await fetchUserProfile();
      setShowEducationForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Education ${editingItem ? 'updated' : 'added'} successfully` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save education',
        variant: 'destructive'
      });
    }
  };

  const deleteEducation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this education entry?')) return;

    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5001/api/users/education/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchUserProfile();
    toast({ title: 'Success', description: 'Education deleted successfully' });
  };

  const addExperience = async (data: Partial<Experience>) => {
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

      await fetchUserProfile();
      setShowExperienceForm(false);
      setEditingItem(null);
      toast({ title: 'Success', description: `Experience ${editingItem ? 'updated' : 'added'} successfully` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save experience',
        variant: 'destructive'
      });
    }
  };

  const deleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience entry?')) return;

    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5001/api/users/experience/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchUserProfile();
    toast({ title: 'Success', description: 'Experience deleted successfully' });
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

      await fetchUserProfile();
      setShowSkillForm(false);
      toast({ title: 'Success', description: 'Skill added successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add skill',
        variant: 'destructive'
      });
    }
  };

  const deleteSkill = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5001/api/users/skills/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetchUserProfile();
    toast({ title: 'Success', description: 'Skill deleted successfully' });
  };

  if (!isHydrated || !user) {
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

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profilePhoto ? `http://localhost:5001${user.profilePhoto}` : undefined} />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="experience">
              <Briefcase className="h-4 w-4 mr-2" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="skills">
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Work Experience</CardTitle>
                      <CardDescription>Add your professional experience</CardDescription>
                    </div>
                    <Button onClick={() => { setShowExperienceForm(true); setEditingItem(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experience.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No experience added yet</p>
                  ) : (
                    experience.map((exp) => (
                      <div key={exp.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{exp.title}</h3>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            {exp.location && <p className="text-sm text-muted-foreground">{exp.location}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(exp.startDate).toLocaleDateString()} -{' '}
                              {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : ''}
                            </p>
                            {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                          </div>
                          <div className="flex gap-2">
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
                            <Button variant="ghost" size="icon" onClick={() => deleteExperience(exp.id)}>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </div>
                    <Button onClick={() => { setShowEducationForm(true); setEditingItem(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {education.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No education added yet</p>
                  ) : (
                    education.map((edu) => (
                      <div key={edu.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h3>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(edu.startDate).toLocaleDateString()} -{' '}
                              {edu.current ? 'Present' : edu.endDate ? new Date(edu.endDate).toLocaleDateString() : ''}
                            </p>
                            {edu.grade && <p className="text-sm mt-1">Grade: {edu.grade}</p>}
                            {edu.description && <p className="text-sm mt-2">{edu.description}</p>}
                          </div>
                          <div className="flex gap-2">
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
                            <Button variant="ghost" size="icon" onClick={() => deleteEducation(edu.id)}>
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
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Skills</CardTitle>
                      <CardDescription>Add your technical and soft skills</CardDescription>
                    </div>
                    <Button onClick={() => setShowSkillForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="flex items-center justify-center min-h-screen">Loading...</div></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
