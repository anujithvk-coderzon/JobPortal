'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { api, jobAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Switch } from '@/components/ui/switch';
import { CurrencySelect } from '@/components/CurrencySelect';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  CURRENCY_OPTIONS,
} from '@/lib/constants';
import { Loader2, Plus, X, Briefcase, DollarSign, Building2, Sparkles, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Company {
  id: string;
  name: string;
  logo: string | null;
  location: string;
  contactEmail: string;
  contactPhone: string;
}

function PostJobPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

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

    fetchCompanies();
  }, [isAuthenticated, isHydrated, user, router]);

  useEffect(() => {
    // Set company from URL parameter
    const companyIdFromUrl = searchParams.get('companyId');
    if (companyIdFromUrl && companies.length > 0) {
      const companyExists = companies.find(c => c.id === companyIdFromUrl);
      if (companyExists) {
        setSelectedCompanyId(companyIdFromUrl);
      }
    }
  }, [searchParams, companies]);

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const response = await api.get('/companies');
      if (response.success) {
        setCompanies(response.data.companies);

        // If no companies, redirect to create company page
        if (response.data.companies.length === 0) {
          toast({
            title: 'No Companies Found',
            description: 'Please create a company profile before posting jobs',
          });
          router.push('/company/create');
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setCompaniesLoading(false);
    }
  };

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
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
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
        companyId: selectedCompanyId,
      };

      const response = await jobAPI.createJob(jobData);

      toast({
        title: 'Success',
        description: 'Job posted successfully!',
        variant: 'success',
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

  // Prevent rendering for unauthenticated users
  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Orange Theme */}
        <div className="mb-6 sm:mb-8">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 sm:p-8 text-white shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Briefcase className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Post Official Job</h1>
              </div>
            </div>
            <p className="text-orange-50 text-sm sm:text-base mb-4">
              Post a verified job opportunity on behalf of your company
            </p>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <p className="text-sm text-orange-50">
                💡 <strong>Looking to share job tips or leads?</strong> Use{' '}
                <button
                  type="button"
                  onClick={() => router.push('/community/create')}
                  className="underline font-semibold hover:text-white transition-colors"
                >
                  Share to Community
                </button>{' '}
                instead for informal job-related content.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          {companiesLoading ? (
            <Card className="border-orange-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              </CardContent>
            </Card>
          ) : searchParams.get('companyId') && selectedCompanyId ? (
            /* Compact view when coming from company page */
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {companies.find(c => c.id === selectedCompanyId)?.logo ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-orange-200 shadow-sm">
                        <Image
                          src={companies.find(c => c.id === selectedCompanyId)!.logo!}
                          alt={companies.find(c => c.id === selectedCompanyId)!.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-orange-700" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Posting as</p>
                    <h3 className="text-base font-bold text-orange-900">{companies.find(c => c.id === selectedCompanyId)?.name}</h3>
                  </div>
                </div>
                {companies.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanyId('')}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Change Company
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Full selection view when accessing directly */
            <Card className="border-orange-100 shadow-sm">
              <CardHeader className="bg-orange-50/50 border-b border-orange-100">
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Building2 className="h-5 w-5 text-orange-600" />
                  Select Company
                </CardTitle>
                <CardDescription className="text-orange-700">Choose the company posting this job</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label htmlFor="company">Company <span className="text-red-500">*</span></Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger id="company" className="border-orange-200 focus:ring-orange-500">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            {company.logo ? (
                              <div className="relative w-5 h-5 rounded overflow-hidden">
                                <Image
                                  src={company.logo}
                                  alt={company.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <Building2 className="h-4 w-4 text-orange-600" />
                            )}
                            <span>{company.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedCompanyId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Don't have a company yet?{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/company/create')}
                        className="text-orange-600 hover:text-orange-700 font-medium underline"
                      >
                        Create one now
                      </button>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Briefcase className="h-5 w-5 text-orange-600" />
                Job Details
              </CardTitle>
              <CardDescription className="text-orange-700">Essential details about the position</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
                  <span className={`text-xs font-medium transition-colors ${
                    formData.title.length > 100 ? 'text-red-500' :
                    formData.title.length > 85 ? 'text-orange-500' :
                    'text-muted-foreground'
                  }`}>
                    {formData.title.length}/100
                  </span>
                </div>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  maxLength={100}
                  required
                  className={formData.title.length > 100 ? 'border-red-500 focus:ring-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  A clear, specific job title helps attract the right candidates
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="description">Job Description <span className="text-red-500">*</span></Label>
                  <span className={`text-xs font-medium transition-colors ${
                    formData.description.length > 5000 ? 'text-red-500' :
                    formData.description.length > 4500 ? 'text-orange-500' :
                    'text-muted-foreground'
                  }`}>
                    {formData.description.length}/5000
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  rows={8}
                  maxLength={5000}
                  required
                  className={`resize-none ${formData.description.length > 5000 ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Include key details about the role, team, culture, and growth opportunities
                </p>
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
                  <Label htmlFor="numberOfOpenings">Number of Openings <span className="text-red-500">*</span></Label>
                  <Input
                    id="numberOfOpenings"
                    type="number"
                    min="1"
                    value={formData.numberOfOpenings}
                    onChange={(e) => handleInputChange('numberOfOpenings', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    How many positions are you hiring for?
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Optional - Set when applications should close
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <DollarSign className="h-5 w-5 text-orange-600" />
                Compensation
              </CardTitle>
              <CardDescription className="text-orange-700">Salary range for this position (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50/50 border border-orange-100 rounded-lg p-3.5 mb-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-800 leading-relaxed">
                    <strong className="font-semibold">Transparency tip:</strong> Including salary ranges can increase application rates by up to 30%. It helps attract serious candidates and saves time for both parties.
                  </p>
                </div>
              </div>
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
              <p className="text-xs text-muted-foreground">
                Leave blank if you prefer not to disclose salary information
              </p>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-xs font-semibold text-orange-600 uppercase tracking-wider">
                Position Details
              </span>
            </div>
          </div>

          {/* Responsibilities */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-orange-900">Responsibilities</CardTitle>
              <CardDescription className="text-orange-700">Day-to-day tasks and key responsibilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                List the primary responsibilities this role will handle. Be specific and use action verbs.
              </p>
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={responsibility}
                      onChange={(e) =>
                        handleArrayChange(responsibilities, setResponsibilities, index, e.target.value)
                      }
                      placeholder={index === 0 ? "e.g., Design and implement scalable backend services" : "e.g., Collaborate with cross-functional teams"}
                      maxLength={200}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(responsibilities, setResponsibilities, index)}
                    disabled={responsibilities.length === 1}
                    className="flex-shrink-0"
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
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Responsibility
              </Button>
            </CardContent>
          </Card>

          {/* Required Qualifications */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-orange-900">Required Qualifications</CardTitle>
              <CardDescription className="text-orange-700">Essential qualifications candidates must have</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Include education, certifications, years of experience, or specific achievements required.
              </p>
              {requiredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={qualification}
                      onChange={(e) =>
                        handleArrayChange(requiredQualifications, setRequiredQualifications, index, e.target.value)
                      }
                      placeholder={index === 0 ? "e.g., Bachelor's degree in Computer Science or related field" : "e.g., 5+ years of professional software development"}
                      maxLength={200}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredQualifications, setRequiredQualifications, index)}
                    disabled={requiredQualifications.length === 1}
                    className="flex-shrink-0"
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
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </CardContent>
          </Card>

          {/* Preferred Qualifications */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-orange-900">Preferred Qualifications</CardTitle>
              <CardDescription className="text-orange-700">Bonus qualifications that would make a candidate stand out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                Optional qualifications that would be beneficial but aren't deal-breakers.
              </p>
              {preferredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={qualification}
                      onChange={(e) =>
                        handleArrayChange(preferredQualifications, setPreferredQualifications, index, e.target.value)
                      }
                      placeholder={index === 0 ? "e.g., Experience with cloud platforms (AWS, Azure, GCP)" : "e.g., Open source contributions or published technical writing"}
                      maxLength={200}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(preferredQualifications, setPreferredQualifications, index)}
                    disabled={preferredQualifications.length === 1}
                    className="flex-shrink-0"
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
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="text-orange-900">Required Skills</CardTitle>
              <CardDescription className="text-orange-700">Technical and soft skills candidates need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                List specific technologies, frameworks, tools, and soft skills needed for success in this role.
              </p>
              {requiredSkills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={skill}
                      onChange={(e) =>
                        handleArrayChange(requiredSkills, setRequiredSkills, index, e.target.value)
                      }
                      placeholder={index === 0 ? "e.g., JavaScript, TypeScript, React" : index === 1 ? "e.g., RESTful APIs, GraphQL" : "e.g., Strong communication and teamwork"}
                      maxLength={150}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredSkills, setRequiredSkills, index)}
                    disabled={requiredSkills.length === 1}
                    className="flex-shrink-0"
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
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </CardContent>
          </Card>

          {/* Motivational Submit Section */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-5 sm:p-6 border border-orange-200 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-orange-700 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-orange-900 mb-1.5">Ready to find your next team member?</h4>
                <p className="text-sm text-orange-800 leading-relaxed mb-3">
                  Your job posting will be visible to all candidates on the platform. Make sure all information is accurate and complete to attract the best talent for your team.
                </p>
                <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm border border-orange-200/50">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-700 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-900 leading-relaxed">
                      <strong className="font-semibold">Pro tip:</strong> Jobs with complete information (including salary ranges and detailed descriptions) receive 2-3x more qualified applications. Take a moment to review everything before posting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Job...
                </>
              ) : (
                <>
                  <Briefcase className="mr-2 h-4 w-4" />
                  Post Official Job
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PostJobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <PostJobPageContent />
    </Suspense>
  );
}
