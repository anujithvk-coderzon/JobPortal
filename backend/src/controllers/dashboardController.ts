import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userId = req.user.userId;

    // Get all dashboard stats for the user (they can be both job seeker and employer)

    // Job Application Stats
    const myApplicationsCount = await prisma.application.count({
      where: { applicantId: userId },
    });

    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: { applicantId: userId },
      _count: true,
    });

    const statusCounts: Record<string, number> = {};
    applicationsByStatus.forEach((item) => {
      statusCounts[item.status] = item._count;
    });

    const savedJobsCount = await prisma.savedJob.count({
      where: { userId },
    });

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { completionScore: true },
    });

    const recentApplications = await prisma.application.findMany({
      where: { applicantId: userId },
      take: 10,
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
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

    // Job Posting Stats
    const myJobsCount = await prisma.job.count({
      where: { userId },
    });

    const activeJobsCount = await prisma.job.count({
      where: {
        userId,
        isActive: true,
      },
    });

    const applicationsToMyJobs = await prisma.application.count({
      where: {
        job: {
          userId,
        },
      },
    });

    const pendingApplicationsCount = await prisma.application.count({
      where: {
        job: {
          userId,
        },
        status: 'PENDING',
      },
    });

    // Debug logging
    console.log('=== Dashboard Debug ===');
    console.log('User ID:', userId);
    console.log('Total applications to my jobs:', applicationsToMyJobs);
    console.log('Pending applications count:', pendingApplicationsCount);

    // Get detailed info about applications
    const allApplicationsToMyJobs = await prisma.application.findMany({
      where: {
        job: {
          userId,
        },
      },
      select: {
        id: true,
        status: true,
        job: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });
    console.log('All applications to my jobs:', JSON.stringify(allApplicationsToMyJobs, null, 2));

    const recentApplicationsReceived = await prisma.application.findMany({
      where: {
        job: {
          userId,
        },
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

    const recentJobs = await prisma.job.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        employmentType: true,
        locationType: true,
        isActive: true,
        createdAt: true,
        company: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        // Job seeker stats
        myApplicationsCount,
        applicationsByStatus: statusCounts,
        savedJobsCount,
        profileCompletion: profile?.completionScore || 0,
        recentApplications,
        // Employer stats
        myJobsCount,
        activeJobsCount,
        applicationsToMyJobs,
        pendingApplicationsCount,
        recentApplicationsReceived,
        recentJobs,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};
