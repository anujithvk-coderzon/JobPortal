export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE';

export type LocationType = 'ONSITE' | 'REMOTE' | 'HYBRID';

export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'REJECTED'
  | 'HIRED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  profilePhoto?: string;
  createdAt: string;
  profile?: Profile;
  company?: Company;
}

export interface Profile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  resume?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  completionScore: number;
  skills?: Skill[];
  experiences?: Experience[];
  education?: Education[];
}

export interface Skill {
  id: string;
  name: string;
  level?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
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

export interface Company {
  id: string;
  userId: string;
  name: string;
  logo?: string;
  website?: string;
  industry?: string;
  foundedYear?: number;
  description?: string;
  location?: string;
}

export interface Job {
  id: string;
  companyId?: string;
  userId: string;
  title: string;
  description: string;
  responsibilities?: string[];
  requiredQualifications?: string[];
  preferredQualifications?: string[];
  requiredSkills?: string[];
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  locationType: LocationType;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  numberOfOpenings: number;
  applicationDeadline?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Company profile (when using company profile)
  company?: {
    name: string;
    logo?: string;
    location?: string;
    industry?: string;
  };
  // Manual company info (when not using company profile)
  companyName?: string;
  companyWebsite?: string;
  _count?: {
    applications: number;
  };
  hasApplied?: boolean;
  isSaved?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  resume: string;
  coverLetter?: string;
  additionalInfo?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job?: Job;
  applicant?: User;
}

export interface DashboardStats {
  totalApplications?: number;
  applicationsByStatus?: Record<string, number>;
  savedJobsCount?: number;
  profileCompletion?: number;
  recentApplications?: Application[];
  totalJobs?: number;
  activeJobs?: number;
  recentJobs?: Job[];
}
