'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import {
  Building2,
  Upload,
  X,
  Loader2,
  Save,
  Info,
  Link2,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useToast } from '@/components/ui/use-toast';
import { LocationAutocomplete } from '@/components/common/LocationAutocomplete';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// Collapsible section component
const Section = ({
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
}) => {
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
};

const CreateCompanyPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ base64: string; mimeType: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    pinCode: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    industry: '',
    about: '',
    companySize: '',
    foundedYear: '',
    linkedIn: '',
    twitter: '',
    facebook: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
  }, [isAuthenticated, isHydrated, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, logo: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, logo: 'Image must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      setLogoPreview(base64);
      setLogoFile({
        base64: base64Data,
        mimeType: file.type,
      });
      setErrors(prev => ({ ...prev, logo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'PIN code must be 6 digits';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    if (formData.foundedYear && (parseInt(formData.foundedYear) < 1800 || parseInt(formData.foundedYear) > new Date().getFullYear())) {
      newErrors.foundedYear = 'Please enter a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const companyData = {
        name: formData.name,
        location: formData.location,
        pinCode: formData.pinCode,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        website: formData.website || undefined,
        industry: formData.industry || undefined,
        about: formData.about || undefined,
        companySize: formData.companySize || undefined,
        foundedYear: formData.foundedYear || undefined,
        linkedIn: formData.linkedIn || undefined,
        twitter: formData.twitter || undefined,
        facebook: formData.facebook || undefined,
      };

      const response = await api.post('/companies', companyData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create company');
      }

      const companyId = response.data.company.id;

      if (logoFile) {
        const logoResponse = await api.post(`/companies/${companyId}/logo`, {
          file: logoFile.base64,
          mimeType: logoFile.mimeType,
        });

        if (!logoResponse.success) {
          console.error('Failed to upload logo:', logoResponse.error);
        }
      }

      router.push(`/company/${companyId}`);
    } catch (error: any) {
      console.error('Error creating company:', error);
      setErrors({ submit: error.message || 'Failed to create company. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const completionItems = [
    { label: 'Company name', done: !!formData.name.trim() },
    { label: 'Location', done: !!formData.location.trim() },
    { label: 'PIN Code', done: !!formData.pinCode.trim() },
    { label: 'Contact Email', done: !!formData.contactEmail.trim() },
    { label: 'Contact Phone', done: !!formData.contactPhone.trim() },
    { label: 'Logo', done: !!logoFile },
  ];
  const completionCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completionCount / completionItems.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'New Company' }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold">Create Company Profile</h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Add your company information to start posting jobs
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
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                const form = document.getElementById('create-company-form') as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  Create Company
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Form */}
          <form id="create-company-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Company Logo */}
            <Section
              icon={Upload}
              title="Company Logo"
              subtitle="Upload your company brand image"
              badge="Optional"
            >
              {!logoPreview ? (
                <div className="rounded-lg border-2 border-dashed p-6 text-center hover:border-primary/30 transition-colors">
                  <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-2 bg-primary/8 rounded-lg">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="text-[13px] text-muted-foreground">Click to upload company logo</span>
                    <span className="text-[11px] text-muted-foreground">PNG, JPG up to 5MB</span>
                  </label>
                </div>
              ) : (
                <div className="relative w-28 h-28 border rounded-lg overflow-hidden">
                  <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {errors.logo && <p className="text-[12px] text-destructive mt-1.5">{errors.logo}</p>}
            </Section>

            {/* Basic Information */}
            <Section
              icon={Building2}
              title="Basic Information"
              subtitle="Company name, location, and contact details"
              badge="Required"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-[13px] font-medium mb-1.5 block">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter company name" className={`h-10 text-[13px] ${errors.name ? 'border-destructive' : ''}`} />
                  {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="location" className="text-[13px] font-medium mb-1.5 block">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <LocationAutocomplete id="location" value={formData.location} onChange={(value) => handleInputChange('location', value)} placeholder="City, State, Country" className={`h-10 ${errors.location ? 'border-destructive' : ''}`} />
                  {errors.location && <p className="text-[11px] text-destructive mt-1">{errors.location}</p>}
                </div>

                <div>
                  <Label htmlFor="pinCode" className="text-[13px] font-medium mb-1.5 block">
                    PIN Code <span className="text-destructive">*</span>
                  </Label>
                  <Input id="pinCode" value={formData.pinCode} onChange={(e) => handleInputChange('pinCode', e.target.value)} placeholder="6-digit PIN code" maxLength={6} className={`h-10 text-[13px] ${errors.pinCode ? 'border-destructive' : ''}`} />
                  {errors.pinCode && <p className="text-[11px] text-destructive mt-1">{errors.pinCode}</p>}
                </div>

                <div>
                  <Label htmlFor="contactEmail" className="text-[13px] font-medium mb-1.5 block">
                    Contact Email <span className="text-destructive">*</span>
                  </Label>
                  <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => handleInputChange('contactEmail', e.target.value)} placeholder="contact@company.com" className={`h-10 text-[13px] ${errors.contactEmail ? 'border-destructive' : ''}`} />
                  {errors.contactEmail && <p className="text-[11px] text-destructive mt-1">{errors.contactEmail}</p>}
                </div>

                <div>
                  <Label htmlFor="contactPhone" className="text-[13px] font-medium mb-1.5 block">
                    Contact Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => handleInputChange('contactPhone', e.target.value)} placeholder="+1 234 567 8900" className={`h-10 text-[13px] ${errors.contactPhone ? 'border-destructive' : ''}`} />
                  {errors.contactPhone && <p className="text-[11px] text-destructive mt-1">{errors.contactPhone}</p>}
                </div>

                <div>
                  <Label htmlFor="website" className="text-[13px] font-medium mb-1.5 block">Website <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://company.com" className={`h-10 text-[13px] ${errors.website ? 'border-destructive' : ''}`} />
                  {errors.website && <p className="text-[11px] text-destructive mt-1">{errors.website}</p>}
                </div>
              </div>
            </Section>

            {/* Company Details */}
            <Section
              icon={Info}
              title="Company Details"
              subtitle="Industry, size, and company description"
              badge="Optional"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry" className="text-[13px] font-medium mb-1.5 block">Industry <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                      <SelectTrigger className="h-10 text-[13px]">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Software Development">Software Development</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Banking">Banking</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="E-Learning">E-Learning</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
                        <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                        <SelectItem value="Real Estate">Real Estate</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                        <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                        <SelectItem value="Hospitality">Hospitality</SelectItem>
                        <SelectItem value="Travel & Tourism">Travel & Tourism</SelectItem>
                        <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                        <SelectItem value="Pharmaceutical">Pharmaceutical</SelectItem>
                        <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                        <SelectItem value="Energy & Utilities">Energy & Utilities</SelectItem>
                        <SelectItem value="Legal Services">Legal Services</SelectItem>
                        <SelectItem value="Accounting">Accounting</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Fashion & Apparel">Fashion & Apparel</SelectItem>
                        <SelectItem value="Sports & Fitness">Sports & Fitness</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Aerospace & Defense">Aerospace & Defense</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="companySize" className="text-[13px] font-medium mb-1.5 block">Company Size <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                      <SelectTrigger className="h-10 text-[13px]">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1001-5000">1001-5000 employees</SelectItem>
                        <SelectItem value="5000+">5000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="foundedYear" className="text-[13px] font-medium mb-1.5 block">Founded Year <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                    <Input id="foundedYear" type="number" value={formData.foundedYear} onChange={(e) => handleInputChange('foundedYear', e.target.value)} placeholder="e.g., 2020" min="1800" max={new Date().getFullYear()} className={`h-10 text-[13px] ${errors.foundedYear ? 'border-destructive' : ''}`} />
                    {errors.foundedYear && <p className="text-[11px] text-destructive mt-1">{errors.foundedYear}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="about" className="text-[13px] font-medium mb-1.5 block">About Company <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Textarea id="about" value={formData.about} onChange={(e) => handleInputChange('about', e.target.value)} placeholder="Tell us about your company..." rows={4} className="text-[13px] resize-none leading-relaxed" />
                </div>
              </div>
            </Section>

            {/* Social Media */}
            <Section
              icon={Link2}
              title="Social Media"
              subtitle="Add your company social media profiles"
              badge="Optional"
              defaultOpen={false}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedIn" className="text-[13px] font-medium mb-1.5 block">LinkedIn URL <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Input id="linkedIn" value={formData.linkedIn} onChange={(e) => handleInputChange('linkedIn', e.target.value)} placeholder="https://linkedin.com/company/..." className="h-10 text-[13px]" />
                </div>
                <div>
                  <Label htmlFor="twitter" className="text-[13px] font-medium mb-1.5 block">Twitter URL <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Input id="twitter" value={formData.twitter} onChange={(e) => handleInputChange('twitter', e.target.value)} placeholder="https://twitter.com/..." className="h-10 text-[13px]" />
                </div>
                <div>
                  <Label htmlFor="facebook" className="text-[13px] font-medium mb-1.5 block">Facebook URL <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                  <Input id="facebook" value={formData.facebook} onChange={(e) => handleInputChange('facebook', e.target.value)} placeholder="https://facebook.com/..." className="h-10 text-[13px]" />
                </div>
              </div>
            </Section>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                <p className="text-[12px] text-destructive">{errors.submit}</p>
              </div>
            )}

            {/* Bottom save bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <p className="text-[12px] text-muted-foreground">
                All changes are saved when you click Create Company
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="text-[13px] h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="text-[13px] h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Create Company
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
                  <h3 className="text-[13px] font-semibold">Tips</h3>
                </div>
                <div className="space-y-3">
                  {[
                    'Use your official company name for brand consistency',
                    'Add a high-quality logo to build trust with candidates',
                    'Include a detailed "About" section to attract top talent',
                    'Social media links help candidates research your company',
                    'Keep contact information up to date for timely communication',
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
};

export default CreateCompanyPage;
