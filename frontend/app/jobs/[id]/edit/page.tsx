'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { jobAPI } from '@/lib/api';
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
  Save,
  Briefcase,
  FileText,
  DollarSign,
  ListChecks,
  GraduationCap,
  Star,
  Wrench,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';

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
            className="h-9 text-[13px] flex-1"
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

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobTitle, setJobTitle] = useState('');

  const jobId = params.id as string;

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
    isActive: true,
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

    fetchJobData();
  }, [isAuthenticated, isHydrated, user, router, toast, jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getJobById(jobId);
      const job = response.data.data;

      if (job.userId !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'You can only edit your own job posts',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }

      setJobTitle(job.title || '');

      setFormData({
        title: job.title || '',
        description: job.description || '',
        employmentType: job.employmentType || 'FULL_TIME',
        experienceLevel: job.experienceLevel || 'MID',
        locationType: job.locationType || 'ONSITE',
        location: job.location || '',
        salaryMin: job.salaryMin?.toString() || '',
        salaryMax: job.salaryMax?.toString() || '',
        salaryCurrency: job.salaryCurrency || 'INR',
        salaryPeriod: job.salaryPeriod || 'LPA',
        showSalary: job.showSalary ?? true,
        numberOfOpenings: job.numberOfOpenings?.toString() || '1',
        applicationDeadline: job.applicationDeadline
          ? new Date(job.applicationDeadline).toISOString().split('T')[0]
          : '',
        isActive: job.isActive ?? true,
      });

      setResponsibilities(
        job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : ['']
      );
      setRequiredQualifications(
        job.requiredQualifications && job.requiredQualifications.length > 0
          ? job.requiredQualifications
          : ['']
      );
      setPreferredQualifications(
        job.preferredQualifications && job.preferredQualifications.length > 0
          ? job.preferredQualifications
          : ['']
      );
      setRequiredSkills(
        job.requiredSkills && job.requiredSkills.length > 0 ? job.requiredSkills : ['']
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
        isActive: formData.isActive,
      };

      await jobAPI.updateJob(jobId, jobData);

      toast({
        title: 'Success',
        description: 'Job updated successfully!',
        variant: 'success',
      });

      router.push(`/jobs/${jobId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update job',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[13px] text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filledResponsibilities = responsibilities.filter(r => r.trim()).length;
  const filledQualifications = requiredQualifications.filter(q => q.trim()).length;
  const filledSkills = requiredSkills.filter(s => s.trim()).length;
  const completionItems = [
    { label: 'Job title', done: !!formData.title },
    { label: 'Description', done: !!formData.description },
    { label: 'Employment details', done: !!formData.employmentType && !!formData.experienceLevel },
    { label: 'Location', done: !!formData.location },
    { label: 'Responsibilities', done: filledResponsibilities > 0 },
    { label: 'Required skills', done: filledSkills > 0 },
    { label: 'Qualifications', done: filledQualifications > 0 },
  ];
  const completionCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completionCount / completionItems.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: jobTitle || 'Job', href: `/jobs/${jobId}` }, { label: 'Edit' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold">Edit Job Posting</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Update the details of your job listing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(`/jobs/${jobId}`)}
              className="text-[13px] h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                const form = document.getElementById('edit-job-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
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
          <form id="edit-job-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Job Status Banner */}
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
              formData.isActive
                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${formData.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <div>
                  <p className="text-[13px] font-medium">
                    {formData.isActive ? 'Job is live and accepting applications' : 'Job is paused and hidden from candidates'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>

            {/* Basic Information */}
            <Section
              icon={Briefcase}
              title="Basic Information"
              subtitle="Job title, description, and core details"
              badge="Required"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-[13px] font-medium mb-1.5 block">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    required
                    className="h-10 text-[13px]"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-[13px] font-medium mb-1.5 block">Job Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                    rows={6}
                    required
                    className="resize-none text-[13px] leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {formData.description.length} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => handleInputChange('employmentType', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">Experience Level</Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) => handleInputChange('experienceLevel', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">Location Type</Label>
                    <Select
                      value={formData.locationType}
                      onValueChange={(value) => handleInputChange('locationType', value)}
                    >
                      <SelectTrigger className="h-10 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">Location<span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
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
                    <Label className="text-[13px] font-medium mb-1.5 block">Number of Openings</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.numberOfOpenings}
                      onChange={(e) => handleInputChange('numberOfOpenings', e.target.value)}
                      required
                      className="h-10 text-[13px]"
                    />
                  </div>

                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">Application Deadline<span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      value={formData.applicationDeadline}
                      onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                      className="h-10 text-[13px]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Optional — max 30 days from today</p>
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
                  <Label className="text-[13px] font-medium mb-1.5 block">Salary Format</Label>
                  <Select
                    value={formData.salaryPeriod}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, salaryPeriod: value, salaryMin: '', salaryMax: '' }));
                    }}
                  >
                    <SelectTrigger className="h-10 text-[13px]">
                      <SelectValue placeholder="Select salary format" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_FORMAT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.salaryPeriod === 'MONTHLY' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[13px] font-medium mb-1.5 block">Minimum Salary (&#8377;)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.salaryMin}
                        onChange={(e) => handleInputChange('salaryMin', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 25000"
                        className="h-10 text-[13px] [appearance:textfield]"
                      />
                    </div>
                    <div>
                      <Label className="text-[13px] font-medium mb-1.5 block">Maximum Salary (&#8377;)</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formData.salaryMax}
                        onChange={(e) => handleInputChange('salaryMax', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 40000"
                        className="h-10 text-[13px] [appearance:textfield]"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-[13px] font-medium mb-1.5 block">
                      {formData.salaryPeriod === 'LPA' ? 'Salary in LPA (₹)' : 'CTC in Lakhs (₹)'}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formData.salaryMin}
                      onChange={(e) => handleInputChange('salaryMin', e.target.value.replace(/[^0-9]/g, ''))}
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
                All changes are saved when you click Save Changes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/jobs/${jobId}`)}
                  disabled={saving}
                  className="text-[13px] h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
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
                  <h3 className="text-[13px] font-semibold">Editing Tips</h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Update the title to reflect current needs accurately',
                    'Refresh the description if team or project goals have changed',
                    'Review salary to stay competitive in the market',
                    'Pause the listing if you\'re no longer hiring',
                    'Keep skills list current to attract the right candidates',
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
