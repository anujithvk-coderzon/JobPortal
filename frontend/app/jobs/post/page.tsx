'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  SALARY_FORMAT_OPTIONS,
} from '@/lib/constants';
import { Loader2, Plus, X, Briefcase, Building2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
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
    salaryCurrency: 'INR',
    salaryPeriod: 'LPA',
    showSalary: true,
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

  const handleInputChange = (field: string, value: string | boolean) => {
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
        salaryPeriod: formData.salaryPeriod,
        showSalary: formData.showSalary,
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Post a Job' }]} />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Post a Job</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Post a verified job opportunity on behalf of your company.{' '}
            <button
              type="button"
              onClick={() => router.push('/community/create')}
              className="text-primary hover:underline font-medium"
            >
              Share to Community
            </button>{' '}
            instead for informal content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection */}
          {companiesLoading ? (
            <div className="rounded-lg border bg-card p-6 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : searchParams.get('companyId') && selectedCompanyId ? (
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {companies.find(c => c.id === selectedCompanyId)?.logo ? (
                      <div className="relative w-8 h-8 rounded-md overflow-hidden border">
                        <Image
                          src={companies.find(c => c.id === selectedCompanyId)!.logo!}
                          alt={companies.find(c => c.id === selectedCompanyId)!.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary/8 rounded-md flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Posting as</p>
                    <p className="text-[13px] font-semibold">{companies.find(c => c.id === selectedCompanyId)?.name}</p>
                  </div>
                </div>
                {companies.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompanyId('')}
                    className="h-7 text-[11px]"
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-card p-4 sm:p-5">
              <h2 className="text-sm font-semibold mb-0.5">Select Company</h2>
              <p className="text-[12px] text-muted-foreground mb-3">Choose the company posting this job</p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="company" className="text-[13px] font-medium mb-1 block">Company <span className="text-red-500">*</span></Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger id="company" className="h-9 text-[13px]">
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
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{company.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!selectedCompanyId && (
                  <p className="text-[11px] text-muted-foreground">
                    Don&apos;t have a company yet?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/company/create')}
                      className="text-primary hover:underline font-medium"
                    >
                      Create one now
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Job Details</h2>
            <p className="text-[12px] text-muted-foreground mb-4">Essential details about the position</p>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="title" className="text-[13px] font-medium">Job Title <span className="text-red-500">*</span></Label>
                  <span className={`text-[11px] text-muted-foreground transition-colors ${
                    formData.title.length > 100 ? 'text-red-500' :
                    formData.title.length > 85 ? 'text-orange-500' :
                    ''
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
                  className={`h-9 text-[13px] ${formData.title.length > 100 ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  A clear, specific job title helps attract the right candidates
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="description" className="text-[13px] font-medium">Job Description <span className="text-red-500">*</span></Label>
                  <span className={`text-[11px] text-muted-foreground transition-colors ${
                    formData.description.length > 5000 ? 'text-red-500' :
                    formData.description.length > 4500 ? 'text-orange-500' :
                    ''
                  }`}>
                    {formData.description.length}/5000
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  rows={6}
                  maxLength={5000}
                  required
                  className={`resize-none text-[13px] ${formData.description.length > 5000 ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Include key details about the role, team, culture, and growth opportunities
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="employmentType" className="text-[13px] font-medium mb-1 block">Employment Type *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => handleInputChange('employmentType', value)}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
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
                  <Label htmlFor="experienceLevel" className="text-[13px] font-medium mb-1 block">Experience Level *</Label>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(value) => handleInputChange('experienceLevel', value)}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="locationType" className="text-[13px] font-medium mb-1 block">Location Type *</Label>
                  <Select
                    value={formData.locationType}
                    onValueChange={(value) => handleInputChange('locationType', value)}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
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
                  <Label htmlFor="location" className="text-[13px] font-medium mb-1 block">Location <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <LocationAutocomplete
                    id="location"
                    value={formData.location}
                    onChange={(value) => handleInputChange('location', value)}
                    placeholder="City, State, or Country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="numberOfOpenings" className="text-[13px] font-medium mb-1 block">Number of Openings <span className="text-red-500">*</span></Label>
                  <Input
                    id="numberOfOpenings"
                    type="number"
                    min="1"
                    value={formData.numberOfOpenings}
                    onChange={(e) => handleInputChange('numberOfOpenings', e.target.value)}
                    required
                    className="h-9 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    How many positions are you hiring for?
                  </p>
                </div>

                <div>
                  <Label htmlFor="applicationDeadline" className="text-[13px] font-medium mb-1 block">Application Deadline <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                    className="h-9 text-[13px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Optional - Maximum 30 days from today
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Compensation <span className="text-muted-foreground font-normal text-[12px] ml-1">(Optional)</span></h2>
            <p className="text-[12px] text-muted-foreground mb-4">Salary range for this position (optional but recommended)</p>
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border p-3 bg-primary/8">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong className="font-semibold">Tip:</strong> Including salary information can increase application rates by up to 30%.
                </p>
              </div>

              <div>
                <Label htmlFor="salaryPeriod" className="text-[13px] font-medium mb-1 block">Salary Format</Label>
                <Select
                  value={formData.salaryPeriod}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, salaryPeriod: value, salaryMin: '', salaryMax: '' }));
                  }}
                >
                  <SelectTrigger id="salaryPeriod" className="h-9 text-[13px]">
                    <SelectValue placeholder="Select salary format" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALARY_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.salaryPeriod === 'MONTHLY' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="salaryMin" className="text-[13px] font-medium mb-1 block">Minimum Salary (&#8377;)</Label>
                    <Input
                      id="salaryMin"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange('salaryMin', val);
                      }}
                      placeholder="e.g. 25000"
                      className="h-9 text-[13px] [appearance:textfield]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salaryMax" className="text-[13px] font-medium mb-1 block">Maximum Salary (&#8377;)</Label>
                    <Input
                      id="salaryMax"
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMax}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange('salaryMax', val);
                      }}
                      placeholder="e.g. 40000"
                      className="h-9 text-[13px] [appearance:textfield]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="salaryMin" className="text-[13px] font-medium mb-1 block">
                    {formData.salaryPeriod === 'LPA' ? 'Salary in LPA (&#8377;)' : 'CTC in Lakhs (&#8377;)'}
                  </Label>
                  <Input
                    id="salaryMin"
                    type="text"
                    inputMode="numeric"
                    value={formData.salaryMin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange('salaryMin', val);
                    }}
                    placeholder={formData.salaryPeriod === 'LPA' ? 'e.g. 6' : 'e.g. 8'}
                    className="h-9 text-[13px] [appearance:textfield]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formData.salaryPeriod === 'LPA'
                      ? 'Enter the annual salary in lakhs, e.g. 6 for 6 LPA'
                      : 'Enter the CTC in lakhs, e.g. 8 for 8L CTC'}
                  </p>
                </div>
              )}

              {(formData.salaryMin || formData.salaryMax) && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="showSalary" className="text-[13px] font-medium">Show salary in job post</Label>
                    <p className="text-[11px] text-muted-foreground">When off, salary won&apos;t be visible to applicants</p>
                  </div>
                  <Switch
                    id="showSalary"
                    checked={formData.showSalary}
                    onCheckedChange={(checked) => handleInputChange('showSalary', checked)}
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Leave blank if you prefer not to disclose salary information
              </p>
            </div>
          </div>

          {/* Responsibilities */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Responsibilities <span className="text-muted-foreground font-normal text-[12px] ml-1">(Optional)</span></h2>
            <p className="text-[12px] text-muted-foreground mb-3">Day-to-day tasks and key responsibilities</p>
            <div className="space-y-2">
              {responsibilities.map((responsibility, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={responsibility}
                    onChange={(e) =>
                      handleArrayChange(responsibilities, setResponsibilities, index, e.target.value)
                    }
                    placeholder={index === 0 ? "e.g., Design and implement scalable backend services" : "e.g., Collaborate with cross-functional teams"}
                    maxLength={200}
                    className="h-9 text-[13px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(responsibilities, setResponsibilities, index)}
                    disabled={responsibilities.length === 1}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(responsibilities, setResponsibilities)}
                className="h-7 text-[11px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Responsibility
              </Button>
            </div>
          </div>

          {/* Required Qualifications */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Required Qualifications <span className="text-muted-foreground font-normal text-[12px] ml-1">(Optional)</span></h2>
            <p className="text-[12px] text-muted-foreground mb-3">Essential qualifications candidates must have</p>
            <div className="space-y-2">
              {requiredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={qualification}
                    onChange={(e) =>
                      handleArrayChange(requiredQualifications, setRequiredQualifications, index, e.target.value)
                    }
                    placeholder={index === 0 ? "e.g., Bachelor's degree in Computer Science or related field" : "e.g., 5+ years of professional software development"}
                    maxLength={200}
                    className="h-9 text-[13px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredQualifications, setRequiredQualifications, index)}
                    disabled={requiredQualifications.length === 1}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(requiredQualifications, setRequiredQualifications)}
                className="h-7 text-[11px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Qualification
              </Button>
            </div>
          </div>

          {/* Preferred Qualifications */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Preferred Qualifications <span className="text-muted-foreground font-normal text-[12px] ml-1">(Optional)</span></h2>
            <p className="text-[12px] text-muted-foreground mb-3">Bonus qualifications that would make a candidate stand out</p>
            <div className="space-y-2">
              {preferredQualifications.map((qualification, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={qualification}
                    onChange={(e) =>
                      handleArrayChange(preferredQualifications, setPreferredQualifications, index, e.target.value)
                    }
                    placeholder={index === 0 ? "e.g., Experience with cloud platforms (AWS, Azure, GCP)" : "e.g., Open source contributions or published technical writing"}
                    maxLength={200}
                    className="h-9 text-[13px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(preferredQualifications, setPreferredQualifications, index)}
                    disabled={preferredQualifications.length === 1}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(preferredQualifications, setPreferredQualifications)}
                className="h-7 text-[11px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Qualification
              </Button>
            </div>
          </div>

          {/* Required Skills */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold mb-0.5">Required Skills <span className="text-muted-foreground font-normal text-[12px] ml-1">(Optional)</span></h2>
            <p className="text-[12px] text-muted-foreground mb-3">Technical and soft skills candidates need</p>
            <div className="space-y-2">
              {requiredSkills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={skill}
                    onChange={(e) =>
                      handleArrayChange(requiredSkills, setRequiredSkills, index, e.target.value)
                    }
                    placeholder={index === 0 ? "e.g., JavaScript, TypeScript, React" : index === 1 ? "e.g., RESTful APIs, GraphQL" : "e.g., Strong communication and teamwork"}
                    maxLength={150}
                    className="h-9 text-[13px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem(requiredSkills, setRequiredSkills, index)}
                    disabled={requiredSkills.length === 1}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addArrayItem(requiredSkills, setRequiredSkills)}
                className="h-7 text-[11px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Skill
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              disabled={loading}
              className="text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-[13px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                  Post Job
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    }>
      <PostJobPageContent />
    </Suspense>
  );
}
