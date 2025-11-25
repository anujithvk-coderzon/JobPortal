import { EmploymentType, ExperienceLevel, LocationType, ApplicationStatus } from './types';

// Employment Type Options
export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'FULL_TIME' as EmploymentType, label: 'Full-time' },
  { value: 'PART_TIME' as EmploymentType, label: 'Part-time' },
  { value: 'CONTRACT' as EmploymentType, label: 'Contract' },
  { value: 'INTERNSHIP' as EmploymentType, label: 'Internship' },
  { value: 'FREELANCE' as EmploymentType, label: 'Freelance' },
] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

// Experience Level Options
export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'ENTRY' as ExperienceLevel, label: 'Entry Level' },
  { value: 'MID' as ExperienceLevel, label: 'Mid Level' },
  { value: 'SENIOR' as ExperienceLevel, label: 'Senior Level' },
  { value: 'EXECUTIVE' as ExperienceLevel, label: 'Executive' },
] as const;

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry Level',
  MID: 'Mid Level',
  SENIOR: 'Senior Level',
  EXECUTIVE: 'Executive',
};

// Location Type Options
export const LOCATION_TYPE_OPTIONS = [
  { value: 'ONSITE' as LocationType, label: 'On-site' },
  { value: 'REMOTE' as LocationType, label: 'Remote' },
  { value: 'HYBRID' as LocationType, label: 'Hybrid' },
] as const;

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

// Application Status Options
export const APPLICATION_STATUS_OPTIONS = [
  { value: 'APPLIED' as ApplicationStatus, label: 'Applied' },
  { value: 'UNDER_REVIEW' as ApplicationStatus, label: 'Under Review' },
  { value: 'SHORTLISTED' as ApplicationStatus, label: 'Shortlisted' },
  { value: 'INTERVIEW_SCHEDULED' as ApplicationStatus, label: 'Interview Scheduled' },
  { value: 'REJECTED' as ApplicationStatus, label: 'Rejected' },
  { value: 'HIRED' as ApplicationStatus, label: 'Hired' },
] as const;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

// Currency Options
export const CURRENCY_OPTIONS = [
  { value: 'AED', label: 'AED (د.إ)', symbol: 'د.إ' },
  { value: 'AUD', label: 'AUD ($)', symbol: 'A$' },
  { value: 'BRL', label: 'BRL (R$)', symbol: 'R$' },
  { value: 'CAD', label: 'CAD ($)', symbol: 'C$' },
  { value: 'CHF', label: 'CHF (Fr)', symbol: 'Fr' },
  { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
  { value: 'DKK', label: 'DKK (kr)', symbol: 'kr' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'HKD', label: 'HKD ($)', symbol: 'HK$' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'KRW', label: 'KRW (₩)', symbol: '₩' },
  { value: 'MXN', label: 'MXN ($)', symbol: 'Mex$' },
  { value: 'MYR', label: 'MYR (RM)', symbol: 'RM' },
  { value: 'NOK', label: 'NOK (kr)', symbol: 'kr' },
  { value: 'NZD', label: 'NZD ($)', symbol: 'NZ$' },
  { value: 'PLN', label: 'PLN (zł)', symbol: 'zł' },
  { value: 'RUB', label: 'RUB (₽)', symbol: '₽' },
  { value: 'SAR', label: 'SAR (ر.س)', symbol: 'ر.س' },
  { value: 'SEK', label: 'SEK (kr)', symbol: 'kr' },
  { value: 'SGD', label: 'SGD ($)', symbol: 'S$' },
  { value: 'THB', label: 'THB (฿)', symbol: '฿' },
  { value: 'TRY', label: 'TRY (₺)', symbol: '₺' },
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'ZAR', label: 'ZAR (R)', symbol: 'R' },
] as const;

// Sort Options
export const JOB_SORT_OPTIONS = [
  { value: 'match', label: 'Best Match' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'salary', label: 'Highest Salary' },
] as const;

// Company Size Options
export const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
] as const;

// Helper Functions
export const getEmploymentTypeLabel = (type: EmploymentType): string => {
  return EMPLOYMENT_TYPE_LABELS[type] || type;
};

export const getExperienceLevelLabel = (level: ExperienceLevel): string => {
  return EXPERIENCE_LEVEL_LABELS[level] || level;
};

export const getLocationTypeLabel = (type: LocationType): string => {
  return LOCATION_TYPE_LABELS[type] || type;
};

export const getApplicationStatusLabel = (status: ApplicationStatus): string => {
  return APPLICATION_STATUS_LABELS[status] || status;
};

export const getCurrencySymbol = (currency: string): string => {
  const currencyOption = CURRENCY_OPTIONS.find(c => c.value === currency);
  return currencyOption?.symbol || '$';
};
