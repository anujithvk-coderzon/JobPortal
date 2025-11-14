'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Upload, X, ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import Image from 'next/image';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ base64: string; mimeType: string } | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);

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
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/companies/${companyId}`);
      if (response.success) {
        const company = response.data.company;
        setFormData({
          name: company.name || '',
          location: company.location || '',
          pinCode: company.pinCode || '',
          contactEmail: company.contactEmail || '',
          contactPhone: company.contactPhone || '',
          website: company.website || '',
          industry: company.industry || '',
          about: company.about || '',
          companySize: company.companySize || '',
          foundedYear: company.foundedYear ? company.foundedYear.toString() : '',
          linkedIn: company.linkedIn || '',
          twitter: company.twitter || '',
          facebook: company.facebook || '',
        });
        if (company.logo) {
          setExistingLogo(company.logo);
          setLogoPreview(company.logo);
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setErrors({ submit: 'Failed to load company details' });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleRemoveLogo = async () => {
    if (existingLogo) {
      // Delete from server
      try {
        await api.delete(`/companies/${companyId}/logo`);
        setExistingLogo(null);
      } catch (error) {
        console.error('Error deleting logo:', error);
      }
    }
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

    setIsSaving(true);

    try {
      // Update company data
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

      const response = await api.put(`/companies/${companyId}`, companyData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update company');
      }

      // Upload new logo if provided
      if (logoFile) {
        const logoResponse = await api.post(`/companies/${companyId}/logo`, {
          file: logoFile.base64,
          mimeType: logoFile.mimeType,
        });

        if (!logoResponse.success) {
          console.error('Failed to upload logo:', logoResponse.error);
        }
      }

      // Redirect back to company detail page
      router.push(`/company/${companyId}`);
    } catch (error: any) {
      console.error('Error updating company:', error);
      setErrors({ submit: error.message || 'Failed to update company. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(`/company/${companyId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Company
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Edit Company Profile</CardTitle>
                <CardDescription>
                  Update your company information
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo (Optional)</Label>
                {!logoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload company logo
                      </span>
                      <span className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {errors.logo && (
                  <p className="text-sm text-red-500">{errors.logo}</p>
                )}
              </div>

              {/* Required Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter company name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <LocationAutocomplete
                    id="location"
                    value={formData.location}
                    onChange={(value) => handleInputChange('location', value)}
                    placeholder="City, State, Country"
                    className={errors.location ? 'border-red-500' : ''}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pinCode">
                    PIN Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pinCode"
                    value={formData.pinCode}
                    onChange={(e) => handleInputChange('pinCode', e.target.value)}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    className={errors.pinCode ? 'border-red-500' : ''}
                  />
                  {errors.pinCode && (
                    <p className="text-sm text-red-500">{errors.pinCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="contact@company.com"
                    className={errors.contactEmail ? 'border-red-500' : ''}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">{errors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    Contact Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={errors.contactPhone ? 'border-red-500' : ''}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500">{errors.contactPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://company.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => handleInputChange('companySize', value)}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={errors.foundedYear ? 'border-red-500' : ''}
                  />
                  {errors.foundedYear && (
                    <p className="text-sm text-red-500">{errors.foundedYear}</p>
                  )}
                </div>
              </div>

              {/* About */}
              <div className="space-y-2">
                <Label htmlFor="about">About Company</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="Tell us about your company..."
                  rows={4}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <Label>Social Media Links (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedIn" className="text-sm text-gray-600">
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedIn"
                      value={formData.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-sm text-gray-600">
                      Twitter URL
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook" className="text-sm text-gray-600">
                      Facebook URL
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/company/${companyId}`)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
