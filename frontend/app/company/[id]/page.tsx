'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Users,
  Calendar,
  Edit,
  Plus,
  Briefcase,
  Clock,
  DollarSign,
  ArrowLeft,
  Linkedin,
  Twitter,
  Facebook,
  TrendingUp,
  Eye,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  location: string;
  pinCode: string;
  contactEmail: string;
  contactPhone: string;
  logo: string | null;
  website: string | null;
  industry: string | null;
  about: string | null;
  companySize: string | null;
  foundedYear: number | null;
  linkedIn: string | null;
  twitter: string | null;
  facebook: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
  employmentType: string;
  locationType: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    applications: number;
    pendingApplications: number;
  };
}

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCompanyDetails();
    fetchCompanyJobs();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.success) {
        setCompany(response.data.company);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const fetchCompanyJobs = async (page: number = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await api.get(`/jobs/company/${companyId}`, {
        params: {
          page,
          limit: pagination.limit,
        },
      });

      if (response.success) {
        const newJobs = response.data.jobs || [];
        const paginationData = response.data.pagination || {};

        if (page === 1) {
          setJobs(newJobs);
        } else {
          setJobs((prev) => [...prev, ...newJobs]);
        }

        setPagination({
          page: paginationData.page || page,
          limit: paginationData.limit || pagination.limit,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = pagination.page + 1;
    fetchCompanyJobs(nextPage);
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return 'Not specified';
    const curr = currency || 'USD';
    if (min && max) {
      return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `${curr} ${min.toLocaleString()}+`;
    if (max) return `Up to ${curr} ${max.toLocaleString()}`;
    return 'Not specified';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Calculate stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(j => j.isActive).length;
  const totalApplications = jobs.reduce((sum, job) => sum + (job._count?.applications || 0), 0);

  if (isLoading && !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-blue-600 mx-auto mb-3 md:mb-4 animate-spin" />
            <p className="text-sm md:text-base text-gray-600">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center px-4">
            <Building2 className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
            <p className="text-sm md:text-base text-gray-600 mb-4">Company not found</p>
            <Button onClick={() => router.push('/dashboard')} size="sm" className="h-9 md:h-10">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto py-3 md:py-6 lg:py-8 px-2 md:px-4 lg:px-6 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2 md:mb-3 lg:mb-4 h-8 md:h-9 px-2 md:px-4"
          size="sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          <span className="text-xs md:text-sm">Back</span>
        </Button>

        {/* Company Header Card */}
        <Card className="mb-3 md:mb-4 lg:mb-6 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
          <CardContent className="p-3 md:p-4 lg:p-6 relative">
            {/* Edit Button - Top Right */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/company/${company.id}/edit`)}
              className="absolute top-2 right-2 md:top-3 md:right-3 h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs"
            >
              <Edit className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
              <span className="font-medium">Edit</span>
            </Button>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              {/* Company Logo */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                {company.logo ? (
                  <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2 shadow-md">
                    <Image
                      src={company.logo}
                      alt={company.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 shadow-md">
                    <Building2 className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-white" />
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">
                  {company.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 md:gap-2 mb-2 md:mb-3">
                  {company.industry && (
                    <Badge className="text-[9px] md:text-[10px] px-1.5 md:px-2 h-4 md:h-5 bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium">
                      {company.industry}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 bg-gray-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                    <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 text-gray-500" />
                    <span className="font-medium">{company.location}</span>
                  </div>
                </div>

                {/* Quick Info - Grid Layout on Mobile */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 md:gap-2 lg:gap-3">
                  {company.companySize && (
                    <div className="flex items-center gap-1 text-[10px] md:text-[11px] lg:text-xs text-gray-600 bg-gray-50 px-1.5 md:px-2 py-1 md:py-1.5 rounded-md">
                      <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="font-medium truncate">{company.companySize}</span>
                    </div>
                  )}
                  {company.foundedYear && (
                    <div className="flex items-center gap-1 text-[10px] md:text-[11px] lg:text-xs text-gray-600 bg-gray-50 px-1.5 md:px-2 py-1 md:py-1.5 rounded-md">
                      <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500 flex-shrink-0" />
                      <span className="font-medium truncate">Est. {company.foundedYear}</span>
                    </div>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] md:text-[11px] lg:text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 md:px-2 py-1 md:py-1.5 rounded-md transition-colors font-medium col-span-2 sm:col-span-1 justify-center sm:justify-start"
                    >
                      <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                      <span className="truncate">Visit Website</span>
                      <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-3 md:mb-4 lg:mb-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardContent className="p-2.5 md:p-3 lg:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="p-1.5 md:p-2 bg-green-50 rounded-lg">
                  <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-green-600" />
                </div>
              </div>
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{totalJobs}</div>
              <p className="text-[10px] md:text-xs text-gray-600">Total Jobs</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-2.5 md:p-3 lg:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="p-1.5 md:p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-blue-600" />
                </div>
              </div>
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{activeJobs}</div>
              <p className="text-[10px] md:text-xs text-gray-600">Active Jobs</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
            <CardContent className="p-2.5 md:p-3 lg:p-4">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <div className="p-1.5 md:p-2 bg-purple-50 rounded-lg">
                  <Users className="h-3.5 w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 text-purple-600" />
                </div>
              </div>
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{totalApplications}</div>
              <p className="text-[10px] md:text-xs text-gray-600">Total Applications</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {/* Left Side - Company Details */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            {/* About Card */}
            {company.about && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                  <CardTitle className="text-sm md:text-base lg:text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                    About Company
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {company.about}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Contact Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                <CardTitle className="text-sm md:text-base lg:text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6 space-y-2 md:space-y-3">
                <a
                  href={`mailto:${company.contactEmail}`}
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Mail className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-600 group-hover:text-blue-600 truncate">
                    {company.contactEmail}
                  </span>
                </a>

                <a
                  href={`tel:${company.contactPhone}`}
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-600 group-hover:text-blue-600" />
                  </div>
                  <span className="text-xs md:text-sm text-gray-600 group-hover:text-blue-600">
                    {company.contactPhone}
                  </span>
                </a>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <span className="text-xs md:text-sm text-gray-600 group-hover:text-blue-600 truncate flex-1">
                      {company.website}
                    </span>
                    <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400 group-hover:text-blue-600" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Social Media Card */}
            {(company.linkedIn || company.twitter || company.facebook) && (
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2 md:pb-3 pt-3 md:pt-4 px-3 md:px-4 lg:px-6">
                  <CardTitle className="text-sm md:text-base lg:text-lg">Social Media</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 md:pb-4 px-3 md:px-4 lg:px-6">
                  <div className="flex gap-2 md:gap-3">
                    {company.linkedIn && (
                      <a
                        href={company.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2 md:p-3 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                      >
                        <Linkedin className="h-4 w-4 md:h-5 md:w-5" />
                      </a>
                    )}
                    {company.twitter && (
                      <a
                        href={company.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2 md:p-3 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                      >
                        <Twitter className="h-4 w-4 md:h-5 md:w-5" />
                      </a>
                    )}
                    {company.facebook && (
                      <a
                        href={company.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2 md:p-3 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center justify-center"
                      >
                        <Facebook className="h-4 w-4 md:h-5 md:w-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side - Jobs */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {/* Jobs Header */}
            <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-3 md:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-1">
                      Job Openings
                    </h2>
                    <p className="text-xs md:text-sm text-gray-600">
                      {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/jobs/post?companyId=${company.id}`)}
                    className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Post New Job
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            {isLoading ? (
              <div className="text-center py-8 md:py-12">
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-blue-600 mx-auto mb-3 md:mb-4 animate-spin" />
                <p className="text-xs md:text-sm text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="shadow-md">
                <CardContent className="text-center py-8 md:py-12 lg:py-16 px-3 md:px-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 rounded-full bg-green-50 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 md:h-10 md:w-10 text-green-300" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">No jobs posted yet</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 max-w-md mx-auto">
                    Start hiring top talent by posting your first job opening
                  </p>
                  <Button
                    onClick={() => router.push(`/jobs/post?companyId=${company.id}`)}
                    className="h-9 md:h-10 text-xs md:text-sm"
                  >
                    <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 md:space-y-3 lg:space-y-4">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-green-500"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-3 md:p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1.5 md:mb-2 truncate">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <Badge
                              variant={job.isActive ? 'default' : 'secondary'}
                              className="text-[9px] md:text-xs px-1.5 md:px-2 h-4 md:h-5"
                            >
                              {job.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] md:text-xs px-1.5 md:px-2 h-4 md:h-5">
                              {job.employmentType}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] md:text-xs px-1.5 md:px-2 h-4 md:h-5">
                              {job.locationType}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                        {job.location && (
                          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                            <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                          <DollarSign className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600">
                          <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{formatDate(job.createdAt)}</span>
                        </div>
                      </div>

                      {job._count !== undefined && (
                        <div className={`flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 rounded-lg mb-3 md:mb-4 ${
                          job._count.pendingApplications > 0
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-purple-50'
                        }`}>
                          <Users className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 ${
                            job._count.pendingApplications > 0 ? 'text-orange-600' : 'text-purple-600'
                          }`} />
                          <span className={`text-xs md:text-sm font-medium ${
                            job._count.pendingApplications > 0 ? 'text-orange-900' : 'text-purple-900'
                          }`}>
                            {job._count.pendingApplications > 0 ? (
                              <>
                                {job._count.pendingApplications} pending{' '}
                                {job._count.pendingApplications === 1 ? 'application' : 'applications'}
                              </>
                            ) : (
                              <>
                                {job._count.applications} total{' '}
                                {job._count.applications === 1 ? 'application' : 'applications'}
                              </>
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-1.5 md:gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant={job._count?.pendingApplications && job._count.pendingApplications > 0 ? 'default' : 'outline'}
                          onClick={() => router.push(`/jobs/${job.id}/applications`)}
                          className={`flex-1 min-w-0 h-8 md:h-9 text-[10px] md:text-xs ${
                            job._count?.pendingApplications && job._count.pendingApplications > 0
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : ''
                          }`}
                        >
                          <Eye className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" />
                          <span className="truncate">
                            {job._count?.pendingApplications && job._count.pendingApplications > 0
                              ? `${job._count.pendingApplications} Pending`
                              : 'View Applications'}
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/jobs/${job.id}/edit`)}
                          className="h-8 md:h-9 px-2 md:px-3 text-[10px] md:text-xs"
                        >
                          <Edit className="h-3 w-3 md:h-3.5 md:w-3.5 md:mr-1.5" />
                          <span className="hidden md:inline">Edit</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More Button */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center mt-4 md:mt-6">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm px-6 md:px-8"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Jobs
                          <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1.5 md:ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Showing {jobs.length} of {pagination.total} jobs
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
