'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { jobAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Switch } from '@/components/ui/switch';
import { CurrencySelect } from '@/components/CurrencySelect';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
} from '@/lib/constants';
import { Loader2, Plus, X, Briefcase, DollarSign, Building2 } from 'lucide-react';

export default function PostJobPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [useCompanyProfile, setUseCompanyProfile] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    locationType: 'ONSITE',
    location: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    numberOfOpenings: '1',
    applicationDeadline: '',
    // Manual company info
    companyName: '',
    companyWebsite: '',
  });

  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requiredQualifications, setRequiredQualifications] = useState<string[]>(['']);
  const [preferredQualifications, setPreferredQualifications] = useState<string[]>(['']);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['']);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // If user has a company profile, default to using it
    if (user?.company) {
      setUseCompanyProfile(true);
    }
  }, [isAuthenticated, isHydrated, user, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayChange = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setArray(newArray);
  };

  const addArrayItem = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>) => {
    setArray([...array, '']);
  };

  const removeArrayItem = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    if (array.length > 1) {
      setArray(array.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!useCompanyProfile && !formData.companyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide company name or use your company profile',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        locationType: formData.locationType,
        location: formData.location || undefined,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        salaryCurrency: formData.salaryCurrency,
        numberOfOpenings: parseInt(formData.numberOfOpenings),
        applicationDeadline: formData.applicationDeadline || undefined,
        responsibilities: responsibilities.filter((r) => r.trim() !== ''),
        requiredQualifications: requiredQualifications.filter((q) => q.trim() !== ''),
        preferredQualifications: preferredQualifications.filter((q) => q.trim() !== ''),
        requiredSkills: requiredSkills.filter((s) => s.trim() !== ''),
        // Company information
        useCompanyProfile,
        companyName: !useCompanyProfile ? formData.companyName : undefined,
        companyWebsite: !useCompanyProfile ? formData.companyWebsite : undefined,
      };

      const response = await jobAPI.createJob(jobData);

      toast({
        title: 'Success',
        description: 'Job posted successfully!',
      });

      router.push(`/jobs/${response.data.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to post job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Post an Official Job</h1>
          <p className="text-muted-foreground">
            Post a verified job opportunity on behalf of a company. For informal job leads or tips, use{' '}
            <button
              type="button"
              onClick={() => router.push('/community/create')}
              className="text-primary hover:underline font-medium"
            >
              Create Post
            </button>{' '}
            instead.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => handleInputChange('employmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="experienceLevel">Experience Level *</Label>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(value) => handleInputChange('experienceLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationType">Location Type *</Label>
                  <Select
                    value={formData.locationType}
                    onValueChange={(value) => handleInputChange('locationType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <LocationAutocomplete
                    id="location"
                    value={formData.location}
                    onChange={(value) => handleInputChange('location', value)}
                    placeholder="City, State, or Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numberOfOpenings">Number of Openings *</Label>
                  <Input
                    id="numberOfOpenings"
                    type="number"
                    min="1"
                    value={formData.numberOfOpenings}
                    onChange={(e) => handleInputChange('numberOfOpenings', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="applicationDeadline">Application Deadline</Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be a future date
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Choose how you want to represent the company for this job posting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.company && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="useCompanyProfile"
                      checked={useCompanyProfile}
                      onCheckedChange={setUseCompanyProfile}
                    />
                    <div>
                      <Label htmlFor="useCompanyProfile" className="cursor-pointer font-medium">
                        Use my company profile
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Post this job using your company profile: {user.company?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!useCompanyProfile && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {user?.company
                      ? 'Or enter company details manually for this job posting'
                      : 'Enter company details for this job posting'}
                  </p>

                  <div>
                    <Label htmlFor="companyName">
                      Company Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="e.g., TechCorp Inc."
                      required={!useCompanyProfile}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyWebsite">Company Website (Optional)</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={formData.companyWebsite}
                      onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Compensation
              </CardTitle>
              <CardDescription>Salary range for this position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    min="0"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    min="0"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                    placeholder="80000"
                  />
                </div>

                <div>
                  <Label htmlFor="salaryCurrency">Currency</Label>
                  <CurrencySelect
                    value={formData.salaryCurrency}
                    onValueChange={(value) => handleInputChange('salaryCurrency', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
              <CardDescription>Key responsibilities for this role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={responsibility}
                    onChange={(e) =>
                      handleArrayChange(responsibilities, setResponsibilities, index, e.target.value)
                    }
                    placeholder="e.g., Design and implement new features"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(responsibilities, setResponsibilities, index)}
                    disabled={responsibilities.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(responsibilities, setResponsibilities)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Responsibility
              </Button>
            </CardContent>
          </Card>

          {/* Required Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Required Qualifications</CardTitle>
              <CardDescription>Must-have qualifications for candidates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={qualification}
                    onChange={(e) =>
                      handleArrayChange(requiredQualifications, setRequiredQualifications, index, e.target.value)
                    }
                    placeholder="e.g., Bachelor's degree in Computer Science"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredQualifications, setRequiredQualifications, index)}
                    disabled={requiredQualifications.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(requiredQualifications, setRequiredQualifications)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </CardContent>
          </Card>

          {/* Preferred Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Qualifications</CardTitle>
              <CardDescription>Nice-to-have qualifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {preferredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={qualification}
                    onChange={(e) =>
                      handleArrayChange(preferredQualifications, setPreferredQualifications, index, e.target.value)
                    }
                    placeholder="e.g., Experience with cloud platforms"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(preferredQualifications, setPreferredQualifications, index)}
                    disabled={preferredQualifications.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(preferredQualifications, setPreferredQualifications)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
              <CardDescription>Technical and soft skills required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredSkills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={skill}
                    onChange={(e) =>
                      handleArrayChange(requiredSkills, setRequiredSkills, index, e.target.value)
                    }
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredSkills, setRequiredSkills, index)}
                    disabled={requiredSkills.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(requiredSkills, setRequiredSkills)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Job...
                </>
              ) : (
                <>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Post Job
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
