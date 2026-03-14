import { z } from 'zod'

// ── Auth Validations ──
export const RequestVerificationCodeValidation = z.object({
  email: z.email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().optional(),
  resend: z.boolean().optional(),
})

export const RegisterValidation = z.object({
  email: z.email('Please provide a valid email'),
  verificationCode: z.string().length(4, 'Verification code must be 4 digits'),
})

export const LoginValidation = z.object({
  email: z.email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const UpdatePasswordValidation = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
})

export const ForgotPasswordValidation = z.object({
  email: z.email('Please provide a valid email'),
  resend: z.boolean().optional(),
})

export const ResetPasswordValidation = z.object({
  email: z.email('Please provide a valid email'),
  code: z.string().length(4, 'Reset code must be 4 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
})

export const GoogleRegisterValidation = z.object({
  email: z.email('Please provide a valid email'),
  name: z.string().min(1, 'Name is required'),
  googleId: z.string().optional(),
  profilePhoto: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
})

export const GoogleLoginValidation = z.object({
  email: z.email('Please provide a valid email'),
  name: z.string().optional(),
  googleId: z.string().optional(),
  profilePhoto: z.string().optional(),
})

// ── User Validations ──
export const AddSkillValidation = z.object({
  name: z.string().min(1, 'Skill name is required'),
})

export const AddExperienceValidation = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  startDate: z.string().datetime({ message: 'Valid start date is required' }).or(z.string().min(1, 'Valid start date is required')),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().optional(),
})

export const AddEducationValidation = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  startDate: z.string().datetime({ message: 'Valid start date is required' }).or(z.string().min(1, 'Valid start date is required')),
  endDate: z.string().optional(),
  description: z.string().optional(),
  grade: z.string().optional(),
})

export const ProfilePhotoValidation = z.object({
  image: z.string().min(1, 'Image data is required'),
})

export const ResumeValidation = z.object({
  file: z.string().min(1, 'File data is required'),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
})

// ── Job Validations ──
export const CreateJobValidation = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Job description is required'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'], { message: 'Invalid employment type' }),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'], { message: 'Invalid experience level' }),
  locationType: z.enum(['ONSITE', 'REMOTE', 'HYBRID'], { message: 'Invalid location type' }),
  companyId: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.string().optional(),
  showSalary: z.boolean().optional(),
  applicationDeadline: z.string().optional(),
  responsibilities: z.any().optional(),
  qualifications: z.any().optional(),
  skills: z.any().optional(),
})

// ── Application Validations ──
export const UpdateApplicationStatusValidation = z.object({
  status: z.enum(['PENDING', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'], { message: 'Invalid status' }),
  interviewDate: z.string().optional(),
  interviewLink: z.string().optional(),
  interviewNotes: z.string().optional(),
})

// ── Job News Validations ──
export const JobNewsValidation = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  companyName: z.string().trim().optional(),
  location: z.string().trim().optional(),
  source: z.string().trim().optional(),
  externalLink: z.string().url('External link must be a valid URL').optional().or(z.literal('')),
  poster: z.string().optional(),
  video: z.string().optional(),
})

// ── Helper: format Zod errors to match current API response ──
export const formatZodErrors = (error: z.ZodError) => ({
  success: false as const,
  error: 'Validation failed',
  errors: error.issues.map(issue => ({
    field: issue.path[0],
    message: issue.message,
  })),
})
