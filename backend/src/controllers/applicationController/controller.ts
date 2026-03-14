import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { sendInterviewScheduledEmail, sendRejectionEmail, sendHiredEmail } from '../../services/emailService';
import { uploadToBunny, generateOfferLetterFilename } from '../../utils/bunnyStorage';
import { cacheInvalidate, cacheInvalidatePattern, CacheKeys } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../../errors/AppError';
import { UpdateApplicationStatusValidation, formatZodErrors } from '../../helper/validation';

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  JOB_NOT_FOUND: 'Job not found',
  JOB_NOT_ACCEPTING: 'This job is no longer accepting applications',
  DEADLINE_PASSED: 'Application deadline has passed',
  ALREADY_APPLIED: 'You have already applied to this job',
  APPLICATION_NOT_FOUND: 'Application not found',
  NOT_AUTHORIZED_VIEW: 'You are not authorized to view this application',
  NOT_JOB_OWNER: 'Only the person who posted this job can view its applications',
  NOT_JOB_OWNER_UPDATE: 'Only the person who posted this job can update application status',
  INVALID_STATUS_TRANSITION: (from: string, to: string) => `Cannot change status from ${from} to ${to}`,
  NOT_AUTHORIZED_WITHDRAW: 'You are not authorized to withdraw this application',
  FILE_REQUIRED: 'File data and filename are required',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
} as const;

export const applyToJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { jobId } = req.params;
  const { coverLetter, additionalInfo } = req.body;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new NotFoundError(ERRORS.JOB_NOT_FOUND);
  if (!job.isActive) throw new BadRequestError(ERRORS.JOB_NOT_ACCEPTING);
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    throw new BadRequestError(ERRORS.DEADLINE_PASSED);
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      jobId_applicantId: {
        jobId: jobId,
        applicantId: req.user.userId,
      },
    },
  });

  if (existingApplication) throw new BadRequestError(ERRORS.ALREADY_APPLIED);

  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
    select: { resume: true },
  });

  const application = await prisma.application.create({
    data: {
      jobId: jobId,
      applicantId: req.user.userId,
      resume: profile?.resume || null,
      coverLetter: coverLetter || null,
      additionalInfo: additionalInfo || null,
    },
    include: {
      job: {
        select: {
          title: true,
          company: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  // Automatically remove from saved jobs if it was saved
  try {
    await prisma.savedJob.deleteMany({
      where: {
        userId: req.user.userId,
        jobId: jobId,
      },
    });
  } catch (error) {
    // Ignore errors if job wasn't saved
    console.log('Job was not in saved list or already removed');
  }

  // Invalidate relevant caches
  await Promise.all([
    cacheInvalidate(CacheKeys.jobById(jobId)),
    cacheInvalidatePattern(`jobs:saved:${req.user.userId}:*`),
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
    cacheInvalidatePattern(`dashboard:${job.userId}`),
  ]);

  return res.status(201).json({
    success: true,
    data: application,
    message: 'Application submitted successfully',
  });
});

export const getMyApplications = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page = '1', limit = '20', status } = req.query as { [key: string]: string };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { applicantId: req.user.userId };
  if (status) {
    if (status === 'active') {
      where.status = { in: ['PENDING', 'INTERVIEW_SCHEDULED'] };
    } else if (status === 'HIRED' || status === 'REJECTED' || status === 'PENDING' || status === 'INTERVIEW_SCHEDULED') {
      where.status = status;
    }
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take,
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: {
                name: true,
                logo: true,
                location: true,
              },
            },
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const statusCounts = await prisma.application.groupBy({
    by: ['status'],
    where: { applicantId: req.user.userId },
    _count: true,
  });

  const stats = {
    total: await prisma.application.count({ where: { applicantId: req.user.userId } }),
    byStatus: statusCounts.reduce((acc: any, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {}),
  };

  return res.status(200).json({
    success: true,
    data: {
      applications,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getApplicationById = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          company: {
            select: {
              name: true,
              logo: true,
              location: true,
              website: true,
            },
          },
        },
      },
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          location: true,
          profilePhoto: true,
          profile: {
            include: {
              skills: true,
              experiences: { orderBy: { startDate: 'desc' } },
              education: { orderBy: { startDate: 'desc' } },
            },
          },
        },
      },
    },
  });

  if (!application) throw new NotFoundError(ERRORS.APPLICATION_NOT_FOUND);

  if (
    application.applicantId !== req.user.userId &&
    application.job.userId !== req.user.userId
  ) {
    throw new ForbiddenError(ERRORS.NOT_AUTHORIZED_VIEW);
  }

  return res.status(200).json({
    success: true,
    data: application,
  });
});

export const getJobApplications = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { jobId } = req.params;
  const { page = '1', limit = '20', status } = req.query as { [key: string]: string };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new NotFoundError(ERRORS.JOB_NOT_FOUND);
  if (job.userId !== req.user.userId) throw new ForbiddenError(ERRORS.NOT_JOB_OWNER);

  const where: any = { jobId: jobId };
  if (status) {
    where.status = status;
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take,
      orderBy: { appliedAt: 'desc' },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            location: true,
            profilePhoto: true,
            profile: {
              select: {
                headline: true,
                bio: true,
                resume: true,
                skills: {
                  select: {
                    id: true,
                    name: true,
                    level: true,
                  },
                },
                experiences: {
                  select: {
                    id: true,
                    title: true,
                    company: true,
                    location: true,
                    startDate: true,
                    endDate: true,
                    current: true,
                    description: true,
                  },
                  orderBy: { startDate: 'desc' },
                },
                education: {
                  select: {
                    id: true,
                    institution: true,
                    degree: true,
                    fieldOfStudy: true,
                    startDate: true,
                    endDate: true,
                    current: true,
                    grade: true,
                    description: true,
                  },
                  orderBy: { startDate: 'desc' },
                },
              },
            },
          },
        },
      },
    }),
    prisma.application.count({ where }),
  ]);

  const statusCounts = await prisma.application.groupBy({
    by: ['status'],
    where: { jobId: jobId },
    _count: true,
  });

  const stats = {
    total: await prisma.application.count({ where: { jobId: jobId } }),
    byStatus: statusCounts.reduce((acc: any, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {}),
  };

  return res.status(200).json({
    success: true,
    data: {
      applications,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const updateApplicationStatus = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { applicationId } = req.params;

  const validated = UpdateApplicationStatusValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const {
    status,
    interviewDate,
    interviewTime,
    interviewLink,
    interviewLocation,
    interviewType,
    interviewNotes,
    contactPerson,
    contactEmail,
    rejectionFeedback,
    customEmailContent,
  } = req.body;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
    },
  });

  if (!application) throw new NotFoundError(ERRORS.APPLICATION_NOT_FOUND);
  if (application.job.userId !== req.user.userId) {
    throw new ForbiddenError(ERRORS.NOT_JOB_OWNER_UPDATE);
  }

  const currentStatus = application.status;
  const allowedTransitions: Record<string, string[]> = {
    'PENDING': ['PENDING', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'],
    'INTERVIEW_SCHEDULED': ['INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'],
    'REJECTED': ['REJECTED'],
    'HIRED': ['HIRED'],
  };

  const allowedNextStatuses = allowedTransitions[currentStatus] || [];
  if (!allowedNextStatuses.includes(status)) {
    throw new BadRequestError(ERRORS.INVALID_STATUS_TRANSITION(currentStatus, status));
  }

  const updateData: any = { status };

  if (status === 'INTERVIEW_SCHEDULED') {
    if (interviewDate) {
      updateData.interviewDate = new Date(interviewDate);
    }
    if (interviewLink) {
      updateData.interviewLink = interviewLink;
    }
    if (interviewNotes !== undefined) {
      updateData.interviewNotes = interviewNotes;
    }
  } else {
    updateData.interviewDate = null;
    updateData.interviewLink = null;
    updateData.interviewNotes = null;
  }

  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: updateData,
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      job: {
        select: {
          title: true,
          company: {
            select: {
              name: true,
              contactEmail: true,
            },
          },
        },
      },
    },
  });

  await Promise.all([
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
    cacheInvalidatePattern(`dashboard:${application.applicantId}`),
  ]);

  if (status === 'INTERVIEW_SCHEDULED') {
    sendInterviewScheduledEmail({
      email: updatedApplication.applicant.email,
      candidateName: updatedApplication.applicant.name,
      jobTitle: updatedApplication.job.title,
      companyName: updatedApplication.job.company?.name || 'Company',
      interviewDate: new Date(interviewDate),
      interviewTime: interviewTime || 'TBD',
      interviewLocation: interviewLocation || undefined,
      interviewLink: interviewLink || undefined,
      interviewType: interviewType || 'video',
      additionalNotes: interviewNotes || undefined,
      contactPerson: contactPerson || undefined,
      contactEmail: contactEmail || updatedApplication.job.company?.contactEmail || undefined,
      customEmailContent: customEmailContent || undefined,
    }).catch((error) => {
      console.error('Failed to send interview scheduled email:', error);
    });
  } else if (status === 'REJECTED') {
    sendRejectionEmail({
      email: updatedApplication.applicant.email,
      candidateName: updatedApplication.applicant.name,
      jobTitle: updatedApplication.job.title,
      companyName: updatedApplication.job.company?.name || 'Company',
      contactEmail: updatedApplication.job.company?.contactEmail || undefined,
      feedback: rejectionFeedback || undefined,
      encouragement: true,
      customEmailContent: customEmailContent || undefined,
    }).catch((error) => {
      console.error('Failed to send rejection email:', error);
    });
  } else if (status === 'HIRED') {
    sendHiredEmail({
      email: updatedApplication.applicant.email,
      candidateName: updatedApplication.applicant.name,
      jobTitle: updatedApplication.job.title,
      companyName: updatedApplication.job.company?.name || 'Company',
      contactEmail: updatedApplication.job.company?.contactEmail || undefined,
      customEmailContent: customEmailContent || undefined,
    }).catch((error) => {
      console.error('Failed to send hired email:', error);
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedApplication,
    message: 'Application status updated successfully',
  });
});

export const withdrawApplication = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) throw new NotFoundError(ERRORS.APPLICATION_NOT_FOUND);
  if (application.applicantId !== req.user.userId) {
    throw new ForbiddenError(ERRORS.NOT_AUTHORIZED_WITHDRAW);
  }

  await prisma.application.delete({
    where: { id: applicationId },
  });

  await Promise.all([
    cacheInvalidate(CacheKeys.jobById(application.jobId)),
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Application withdrawn successfully',
  });
});

export const getDashboardStats = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const [
    myApplicationsCount,
    applicationsByStatus,
    savedJobsCount,
    profile,
    myJobsCount,
    activeJobsCount,
    applicationsToMyJobs,
  ] = await Promise.all([
    prisma.application.count({ where: { applicantId: req.user.userId } }),
    prisma.application.groupBy({
      by: ['status'],
      where: { applicantId: req.user.userId },
      _count: true,
    }),
    prisma.savedJob.count({ where: { userId: req.user.userId } }),
    prisma.profile.findUnique({
      where: { userId: req.user.userId },
      select: { completionScore: true },
    }),
    prisma.job.count({ where: { userId: req.user.userId } }),
    prisma.job.count({ where: { userId: req.user.userId, isActive: true } }),
    prisma.application.count({
      where: {
        job: {
          userId: req.user.userId,
        },
      },
    }),
  ]);

  const recentApplications = await prisma.application.findMany({
    where: { applicantId: req.user.userId },
    take: 5,
    orderBy: { appliedAt: 'desc' },
    include: {
      job: {
        select: {
          title: true,
          company: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      },
    },
  });

  const recentJobs = await prisma.job.findMany({
    where: { userId: req.user.userId },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      company: {
        select: {
          name: true,
          logo: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  const pendingApplicationsCount = await prisma.application.count({
    where: {
      job: {
        userId: req.user.userId,
      },
      status: 'PENDING',
    },
  });

  const recentApplicationsReceived = await prisma.application.findMany({
    where: {
      job: {
        userId: req.user.userId,
      },
      status: 'PENDING',
    },
    take: 10,
    orderBy: { appliedAt: 'desc' },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const stats = {
    myApplicationsCount,
    applicationsByStatus: applicationsByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {}),
    savedJobsCount,
    profileCompletion: profile?.completionScore || 0,
    recentApplications,
    myJobsCount,
    activeJobsCount,
    applicationsToMyJobs,
    pendingApplicationsCount,
    recentApplicationsReceived,
    recentJobs,
  };

  return res.status(200).json({
    success: true,
    data: stats,
  });
});

export const uploadOfferLetter = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { file, fileName, mimeType } = req.body;

  if (!file || !fileName) throw new BadRequestError(ERRORS.FILE_REQUIRED);

  const buffer = Buffer.from(file, 'base64');

  if (buffer.length > 10 * 1024 * 1024) throw new BadRequestError(ERRORS.FILE_TOO_LARGE);

  const uniqueFilename = generateOfferLetterFilename('offer', fileName);

  const result = await uploadToBunny(buffer, uniqueFilename, mimeType || 'application/pdf');

  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: result.error || 'Failed to upload offer letter',
    });
  }

  return res.status(200).json({
    success: true,
    data: { offerLetterUrl: result.url },
    message: 'Offer letter uploaded successfully',
  });
});
