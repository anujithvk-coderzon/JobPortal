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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Job Seeker Dashboard Stats
    if (user.role === 'JOB_SEEKER') {
      // Get total applications
      const totalApplications = await prisma.application.count({
        where: { applicantId: userId },
      });

      // Get applications by status
      const applicationsByStatus = await prisma.application.groupBy({
        by: ['status'],
        where: { applicantId: userId },
        _count: true,
      });

      const statusCounts: Record<string, number> = {};
      applicationsByStatus.forEach((item) => {
        statusCounts[item.status] = item._count;
      });

      // Get saved jobs count
      const savedJobsCount = await prisma.savedJob.count({
        where: { userId },
      });

      // Get profile completion
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { completionScore: true },
      });

      // Get recent applications
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

      return res.status(200).json({
        totalApplications,
        applicationsByStatus: statusCounts,
        savedJobsCount,
        profileCompletion: profile?.completionScore || 0,
        recentApplications,
      });
    }

    // Employer Dashboard Stats
    if (user.role === 'EMPLOYER') {
      // Get company
      const company = await prisma.company.findUnique({
        where: { userId },
      });

      if (!company) {
        return res.status(200).json({
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          recentJobs: [],
        });
      }

      // Get total jobs
      const totalJobs = await prisma.job.count({
        where: { companyId: company.id },
      });

      // Get active jobs
      const activeJobs = await prisma.job.count({
        where: {
          companyId: company.id,
          isActive: true,
        },
      });

      // Get total applications across all jobs
      const totalApplications = await prisma.application.count({
        where: {
          job: {
            companyId: company.id,
          },
        },
      });

      // Get recent jobs (excluding views for cleaner dashboard)
      const recentJobs = await prisma.job.findMany({
        where: { companyId: company.id },
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
        totalJobs,
        activeJobs,
        totalApplications,
        recentJobs,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid user role',
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};
