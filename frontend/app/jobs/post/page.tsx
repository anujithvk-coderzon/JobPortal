'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { api, jobAPI } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  SALARY_FORMAT_OPTIONS,
} from '@/lib/constants';
import {
  Loader2,
  Plus,
  X,
  Briefcase,
  Building2,
  DollarSign,
  ListChecks,
  GraduationCap,
  Star,
  Wrench,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
  Eye,
  EyeOff,
  CalendarIcon,
} from 'lucide-react';
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

// Collapsible section component
function Section({
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
}) {
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
}

// Array field component for responsibilities, qualifications, skills
function ArrayField({
  items,
  setItems,
  placeholder,
  addLabel,
}: {
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  addLabel: string;
}) {
  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, '']);

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-center group">
          <div className="flex items-center justify-center h-9 w-6 flex-shrink-0">
            <span className="text-[11px] font-medium text-muted-foreground/50">{index + 1}.</span>
          </div>
          <Input
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={placeholder}
            className="h-10 text-[13px] flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            disabled={items.length === 1}
            className="flex-shrink-0 h-8 w-8 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="h-8 text-[12px] ml-6 border-dashed"
      >
        <Plus className="h-3 w-3 mr-1.5" />
        {addLabel}
      </Button>
    </div>
  );
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
      toast({
        title: 'Sign in required',
        description: 'Please log in to access this page.',
        variant: 'warning',
      });
      setTimeout(() => router.push('/auth/login'), 1500);
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

  const completionItems = [
    { label: 'Company', done: !!selectedCompanyId },
    { label: 'Job title', done: !!formData.title },
    { label: 'Description', done: !!formData.description },
    { label: 'Employment details', done: !!formData.employmentType && !!formData.experienceLevel },
    { label: 'Location', done: !!formData.location },
  ];
  const completionCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completionCount / completionItems.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Post a Job' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
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
                const form = document.getElementById('post-job-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Form */}
          <form id="post-job-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Company Selection */}
            {companiesLoading ? (
              <Card className="border border-border/60 bg-card p-6 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </Card>
            ) : searchParams.get('companyId') && selectedCompanyId ? (
              <Card className="border border-border/60 bg-card p-4">
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
              </Card>
            ) : (
              <Card className="border border-border/60 bg-card p-4 sm:p-5">
                <h2 className="text-sm font-semibold mb-0.5">Select Company</h2>
                <p className="text-[12px] text-muted-foreground mb-3">Choose the company posting this job</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="company" className="text-[13px] font-medium mb-1.5 block">Company <span className="text-red-500">*</span></Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger id="company" className="h-10 text-[13px]">
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
              </Card>
            )}

            {/* Job Details */}
            <Section
              icon={Briefcase}
              title="Job Details"
              subtitle="Essential details about the position"
              badge="Required"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                    className={`h-10 text-[13px] ${formData.title.length > 100 ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    A clear, specific job title helps attract the right candidates
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
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
                    className={`resize-none text-[13px] leading-relaxed ${formData.description.length > 5000 ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Include key details about the role, team, culture, and growth opportunities
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentType" className="text-[13px] font-medium mb-1.5 block">Employment Type *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange('employmentType', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
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
                    <Label htmlFor="experienceLevel" className="text-[13px] font-medium mb-1.5 block">Experience Level *</Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) => handleInputChange('experienceLevel', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="locationType" className="text-[13px] font-medium mb-1.5 block">Location Type *</Label>
                    <Select
                      value={formData.locationType}
                      onValueChange={(value) => handleInputChange('locationType', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
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
                    <Label htmlFor="location" className="text-[13px] font-medium mb-1.5 block">Location<span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <LocationAutocomplete
                      id="location"
                      value={formData.location}
                      onChange={(value) => handleInputChange('location', value)}
                      placeholder="City, State, or Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numberOfOpenings" className="text-[13px] font-medium mb-1.5 block">Number of Openings <span className="text-red-500">*</span></Label>
                    <Input
                      id="numberOfOpenings"
                      type="number"
                      min="1"
                      value={formData.numberOfOpenings}
                      onChange={(e) => handleInputChange('numberOfOpenings', e.target.value)}
                      required
                      className="h-10 text-[13px]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      How many positions are you hiring for?
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="applicationDeadline" className="text-[13px] font-medium mb-1.5 block">Application Deadline<span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-10 justify-start text-left text-[13px] font-normal',
                            !formData.applicationDeadline && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formData.applicationDeadline
                            ? format(parseISO(formData.applicationDeadline), 'PPP')
                            : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.applicationDeadline ? parseISO(formData.applicationDeadline) : undefined}
                          onSelect={(date) => {
                            handleInputChange('applicationDeadline', date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                          disabled={(date) =>
                            date < addDays(startOfDay(new Date()), 1) || date > addDays(new Date(), 30)
                          }
                          defaultMonth={addDays(new Date(), 1)}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Optional — max 30 days from today
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Compensation */}
            <Section
              icon={DollarSign}
              title="Compensation"
              subtitle="Salary range and visibility settings"
              badge="Optional"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="salaryPeriod" className="text-[13px] font-medium mb-1.5 block">Salary Format</Label>
                  <Select
                    value={formData.salaryPeriod}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, salaryPeriod: value, salaryMin: '', salaryMax: '' }));
                    }}
                  >
                    <SelectTrigger id="salaryPeriod" className="h-10 text-[13px]">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salaryMin" className="text-[13px] font-medium mb-1.5 block">Minimum Salary (₹)</Label>
                      <Input
                        id="salaryMin"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.salaryMin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          handleInputChange('salaryMin', val);
                        }}
                        placeholder="e.g. 25000"
                        className="h-10 text-[13px] [appearance:textfield]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salaryMax" className="text-[13px] font-medium mb-1.5 block">Maximum Salary (₹)</Label>
                      <Input
                        id="salaryMax"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.salaryMax}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          handleInputChange('salaryMax', val);
                        }}
                        placeholder="e.g. 40000"
                        className="h-10 text-[13px] [appearance:textfield]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="salaryMin" className="text-[13px] font-medium mb-1.5 block">
                      {formData.salaryPeriod === 'LPA' ? 'Salary in LPA (₹)' : 'CTC in Lakhs (₹)'}
                    </Label>
                    <Input
                      id="salaryMin"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={formData.salaryMin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleInputChange('salaryMin', val);
                      }}
                      placeholder={formData.salaryPeriod === 'LPA' ? 'e.g. 6' : 'e.g. 8'}
                      className="h-10 text-[13px] [appearance:textfield]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formData.salaryPeriod === 'LPA'
                        ? 'Enter the annual salary in lakhs, e.g. 6 for 6 LPA'
                        : 'Enter the CTC in lakhs, e.g. 8 for 8L CTC'}
                    </p>
                  </div>
                )}

                {(formData.salaryMin || formData.salaryMax) && (
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center gap-3">
                      {formData.showSalary ? (
                        <Eye className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <Label htmlFor="showSalary" className="text-[13px] font-medium cursor-pointer">
                          {formData.showSalary ? 'Salary visible to candidates' : 'Salary hidden from candidates'}
                        </Label>
                        <p className="text-[11px] text-muted-foreground">Toggle to control salary visibility in the job post</p>
                      </div>
                    </div>
                    <Switch
                      id="showSalary"
                      checked={formData.showSalary}
                      onCheckedChange={(checked) => handleInputChange('showSalary', checked)}
                    />
                  </div>
                )}
              </div>
            </Section>

            {/* Responsibilities */}
            <Section
              icon={ListChecks}
              title="Responsibilities"
              subtitle="Key duties and expectations for this role"
              badge="Optional"
            >
              <ArrayField
                items={responsibilities}
                setItems={setResponsibilities}
                placeholder="e.g., Design and implement new features"
                addLabel="Add responsibility"
              />
            </Section>

            {/* Required Qualifications */}
            <Section
              icon={GraduationCap}
              title="Required Qualifications"
              subtitle="Must-have qualifications for candidates"
              badge="Optional"
            >
              <ArrayField
                items={requiredQualifications}
                setItems={setRequiredQualifications}
                placeholder="e.g., Bachelor's degree in Computer Science"
                addLabel="Add qualification"
              />
            </Section>

            {/* Preferred Qualifications */}
            <Section
              icon={Star}
              title="Preferred Qualifications"
              subtitle="Nice-to-have qualifications"
              defaultOpen={false}
              badge="Optional"
            >
              <ArrayField
                items={preferredQualifications}
                setItems={setPreferredQualifications}
                placeholder="e.g., Experience with cloud platforms"
                addLabel="Add qualification"
              />
            </Section>

            {/* Required Skills */}
            <Section
              icon={Wrench}
              title="Required Skills"
              subtitle="Technical and soft skills needed"
              badge="Optional"
            >
              <ArrayField
                items={requiredSkills}
                setItems={setRequiredSkills}
                placeholder="e.g., JavaScript, React, Node.js"
                addLabel="Add skill"
              />
            </Section>

            {/* Bottom save bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <p className="text-[12px] text-muted-foreground">
                All fields marked with * are required
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
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
            </div>
          </form>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            {/* Completion Tracker */}
            <Card className="border border-border/60 sticky top-20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold">Completion</h3>
                  <span className={`text-[12px] font-bold ${completionPct === 100 ? 'text-emerald-600' : completionPct >= 70 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {completionPct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completionPct === 100 ? 'bg-emerald-500' : completionPct >= 70 ? 'bg-amber-500' : 'bg-slate-400'
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
                  <h3 className="text-[13px] font-semibold">Posting Tips</h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Use a clear, specific job title to attract the right candidates',
                    'Include salary information to increase applications by up to 30%',
                    'List 4-6 key responsibilities for best engagement',
                    'Keep required skills focused on must-haves only',
                    'Set a deadline to create urgency for applicants',
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
