import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, SearchParams } from '../types';

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const {
      title,
      description,
      responsibilities,
      requiredQualifications,
      preferredQualifications,
      requiredSkills,
      employmentType,
      experienceLevel,
      locationType,
      location,
      salaryMin,
      salaryMax,
      salaryCurrency,
      numberOfOpenings,
      applicationDeadline,
      companyId,
    } = req.body;

    // Validate company ID
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required',
      });
    }

    // Verify company exists and belongs to the user
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    if (company.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to post jobs for this company',
      });
    }

    const job = await prisma.job.create({
      data: {
        companyId,
        userId: req.user.userId,
        title,
        description,
        responsibilities: responsibilities ? JSON.stringify(responsibilities) : null,
        requiredQualifications: requiredQualifications
          ? JSON.stringify(requiredQualifications)
          : null,
        preferredQualifications: preferredQualifications
          ? JSON.stringify(preferredQualifications)
          : null,
        requiredSkills: requiredSkills ? JSON.stringify(requiredSkills) : null,
        employmentType,
        experienceLevel,
        locationType,
        location,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        salaryCurrency: salaryCurrency || 'USD',
        numberOfOpenings: numberOfOpenings ? parseInt(numberOfOpenings) : 1,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully',
    });
  } catch (error: any) {
    console.error('Create job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create job',
    });
  }
};

export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      employmentType,
      experienceLevel,
      locationType,
      salaryMin,
      salaryMax,
      sortBy = 'recent',
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter conditions
    const where: any = {
      isActive: true,
      // Filter out expired jobs (no deadline OR deadline in future)
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gte: new Date() } },
      ],
    };

    // Hide user's own posts from the feed
    if (req.user) {
      where.userId = {
        not: req.user.userId,
      };
    }

    // Search in title, description, and company name
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Employment type filter
    if (employmentType) {
      where.employmentType = employmentType;
    }

    // Experience level filter
    if (experienceLevel) {
      where.experienceLevel = experienceLevel;
    }

    // Location type filter
    if (locationType) {
      where.locationType = locationType;
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      where.AND = where.AND || [];
      if (salaryMin) {
        where.AND.push({ salaryMax: { gte: parseInt(salaryMin) } });
      }
      if (salaryMax) {
        where.AND.push({ salaryMin: { lte: parseInt(salaryMax) } });
      }
    }

    // Sort options
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'salary') {
      orderBy = { salaryMax: 'desc' };
    }

    // Execute query
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
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
      }),
      prisma.job.count({ where }),
    ]);

    // Parse JSON fields
    const jobsWithParsedData = jobs.map(job => ({
      ...job,
      responsibilities: job.responsibilities ? JSON.parse(job.responsibilities) : null,
      requiredQualifications: job.requiredQualifications
        ? JSON.parse(job.requiredQualifications)
        : null,
      preferredQualifications: job.preferredQualifications
        ? JSON.parse(job.preferredQualifications)
        : null,
      requiredSkills: job.requiredSkills ? JSON.parse(job.requiredSkills) : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithParsedData,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all jobs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
};

export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            industry: true,
            companySize: true,
            website: true,
            about: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if user has applied (if authenticated)
    let hasApplied = false;
    let isSaved = false;
    if (req.user) {
      const application = await prisma.application.findUnique({
        where: {
          jobId_applicantId: {
            jobId: jobId,
            applicantId: req.user.userId,
          },
        },
      });
      hasApplied = !!application;

      const savedJob = await prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId: req.user.userId,
            jobId: jobId,
          },
        },
      });
      isSaved = !!savedJob;
    }

    // Parse JSON fields
    const jobWithParsedData = {
      ...job,
      responsibilities: job.responsibilities ? JSON.parse(job.responsibilities) : null,
      requiredQualifications: job.requiredQualifications
        ? JSON.parse(job.requiredQualifications)
        : null,
      preferredQualifications: job.preferredQualifications
        ? JSON.parse(job.preferredQualifications)
        : null,
      requiredSkills: job.requiredSkills ? JSON.parse(job.requiredSkills) : null,
      hasApplied,
      isSaved,
    };

    return res.status(200).json({
      success: true,
      data: jobWithParsedData,
    });
  } catch (error: any) {
    console.error('Get job by id error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job details',
    });
  }
};

export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;

    // Check if job belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (existingJob.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this job',
      });
    }

    const {
      title,
      description,
      responsibilities,
      requiredQualifications,
      preferredQualifications,
      requiredSkills,
      employmentType,
      experienceLevel,
      locationType,
      location,
      salaryMin,
      salaryMax,
      salaryCurrency,
      numberOfOpenings,
      applicationDeadline,
      isActive,
    } = req.body;

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        title,
        description,
        responsibilities: responsibilities ? JSON.stringify(responsibilities) : undefined,
        requiredQualifications: requiredQualifications
          ? JSON.stringify(requiredQualifications)
          : undefined,
        preferredQualifications: preferredQualifications
          ? JSON.stringify(preferredQualifications)
          : undefined,
        requiredSkills: requiredSkills ? JSON.stringify(requiredSkills) : undefined,
        employmentType,
        experienceLevel,
        locationType,
        location,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        salaryCurrency,
        numberOfOpenings: numberOfOpenings ? parseInt(numberOfOpenings) : undefined,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
        isActive,
      },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
            location: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error: any) {
    console.error('Update job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update job',
    });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;

    // Check if job belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (existingJob.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this job',
      });
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job',
    });
  }
};

export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { page = 1, limit = 20, search } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause with search
    const where: any = { userId: req.user.userId };

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
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
      }),
      prisma.job.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get my jobs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch your jobs',
    });
  }
};

export const getCompanyJobs = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [jobs, total, company] = await Promise.all([
      prisma.job.findMany({
        where: {
          companyId: companyId,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              name: true,
              logo: true,
              location: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      prisma.job.count({
        where: {
          companyId: companyId,
        },
      }),
      prisma.company.findUnique({
        where: { id: companyId },
      }),
    ]);

    // Get pending applications count for each job
    const jobsWithPendingCount = await Promise.all(
      jobs.map(async (job) => {
        const pendingCount = await prisma.application.count({
          where: {
            jobId: job.id,
            status: 'PENDING',
          },
        });

        return {
          ...job,
          _count: {
            ...job._count,
            pendingApplications: pendingCount,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        company,
        jobs: jobsWithPendingCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get company jobs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company jobs',
    });
  }
};

export const saveJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if already saved
    const existingSave = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId: jobId,
        },
      },
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        error: 'Job already saved',
      });
    }

    await prisma.savedJob.create({
      data: {
        userId: req.user.userId,
        jobId: jobId,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Job saved successfully',
    });
  } catch (error: any) {
    console.error('Save job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save job',
    });
  }
};

export const unsaveJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;

    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId: req.user.userId,
          jobId: jobId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Job unsaved successfully',
    });
  } catch (error: any) {
    console.error('Unsave job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unsave job',
    });
  }
};

export const getSavedJobs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { page = 1, limit = 20 } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [savedJobs, total] = await Promise.all([
      prisma.savedJob.findMany({
        where: { userId: req.user.userId },
        skip,
        take,
        orderBy: { savedAt: 'desc' },
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
              _count: {
                select: {
                  applications: true,
                },
              },
            },
          },
        },
      }),
      prisma.savedJob.count({ where: { userId: req.user.userId } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        savedJobs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get saved jobs error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch saved jobs',
    });
  }
};
