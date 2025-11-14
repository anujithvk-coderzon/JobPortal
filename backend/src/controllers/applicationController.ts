import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { sendInterviewScheduledEmail, sendRejectionEmail, sendHiredEmail } from '../services/emailService';
import { uploadToBunny, generateOfferLetterFilename } from '../utils/bunnyStorage';

export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;
    const { coverLetter, additionalInfo } = req.body;

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This job is no longer accepting applications',
      });
    }

    // Check application deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        error: 'Application deadline has passed',
      });
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_applicantId: {
          jobId: jobId,
          applicantId: req.user.userId,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this job',
      });
    }

    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      select: { resume: true },
    });

    // Create application
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

    return res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Apply to job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit application',
    });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { page = 1, limit = 20, status } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { applicantId: req.user.userId };
    if (status) {
      // Handle "active" filter - includes PENDING and INTERVIEW_SCHEDULED
      if (status === 'active') {
        where.status = { in: ['PENDING', 'INTERVIEW_SCHEDULED'] };
      } else if (status === 'HIRED' || status === 'REJECTED' || status === 'PENDING' || status === 'INTERVIEW_SCHEDULED') {
        where.status = status;
      }
      // If status is 'all' or invalid, don't add status filter
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

    // Get status counts
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
  } catch (error: any) {
    console.error('Get my applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
    });
  }
};

export const getApplicationById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    // Check authorization
    if (
      application.applicantId !== req.user.userId &&
      application.job.userId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this application',
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    console.error('Get application error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch application details',
    });
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;
    const { page = 1, limit = 20, status } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verify job ownership
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the person who posted this job can view its applications',
      });
    }

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

    // Get status counts for this job
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
  } catch (error: any) {
    console.error('Get job applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job applications',
    });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { applicationId } = req.params;
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

    // Get application with job details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    // Verify job ownership
    if (application.job.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the person who posted this job can update application status',
      });
    }

    // Validate status workflow
    const currentStatus = application.status;
    const allowedTransitions: Record<string, string[]> = {
      'PENDING': ['PENDING', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'],
      'INTERVIEW_SCHEDULED': ['INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'],
      'REJECTED': ['REJECTED'], // Final state
      'HIRED': ['HIRED'], // Final state
    };

    const allowedNextStatuses = allowedTransitions[currentStatus] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Prepare update data
    const updateData: any = { status };

    // If status is INTERVIEW_SCHEDULED, include interview details
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
      // Clear interview details if status is changed to something else
      updateData.interviewDate = null;
      updateData.interviewLink = null;
      updateData.interviewNotes = null;
    }

    // Update application status
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

    // Send appropriate email based on status (non-blocking)
    if (status === 'INTERVIEW_SCHEDULED') {
      // Send interview scheduled email
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
      // Send rejection email
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
      // Send hired email
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
  } catch (error: any) {
    console.error('Update application status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update application status',
    });
  }
};

export const withdrawApplication = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { applicationId } = req.params;

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    // Verify ownership
    if (application.applicantId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to withdraw this application',
      });
    }

    // Delete application
    await prisma.application.delete({
      where: { id: applicationId },
    });

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error: any) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to withdraw application',
    });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Return all stats for all users - users can be both job seekers and employers
    const [
      myApplicationsCount,
      applicationsByStatus,
      savedJobsCount,
      profile,
      myJobsCount,
      activeJobsCount,
      applicationsToMyJobs,
    ] = await Promise.all([
      // Job Seeker Stats
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
      // Employer Stats
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

    // Get pending applications count
    const pendingApplicationsCount = await prisma.application.count({
      where: {
        job: {
          userId: req.user.userId,
        },
        status: 'PENDING',
      },
    });

    // Get recent pending applications received
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
      // Job Seeker Stats
      myApplicationsCount,
      applicationsByStatus: applicationsByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      savedJobsCount,
      profileCompletion: profile?.completionScore || 0,
      recentApplications,
      // Employer Stats
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
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

/**
 * Upload offer letter to Bunny CDN
 */
export const uploadOfferLetter = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { file, fileName, mimeType } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'File data and filename are required'
      });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file, 'base64');

    // Validate file size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10MB limit',
      });
    }

    // Generate unique filename with timestamp
    const uniqueFilename = generateOfferLetterFilename('offer', fileName);

    // Upload to Bunny CDN
    const result = await uploadToBunny(buffer, uniqueFilename, mimeType || 'application/pdf');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to upload offer letter'
      });
    }

    return res.status(200).json({
      success: true,
      data: { offerLetterUrl: result.url },
      message: 'Offer letter uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload offer letter error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload offer letter'
    });
  }
};
