import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest, SearchParams } from '../types';
import { calculateJobMatch, calculateJobMatches } from '../services/jobMatchingService';
import { parseSearchQuery } from '../utils/searchParser';

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
    let {
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

    // Parse search query for intelligent keyword extraction
    const parsedSearch = parseSearchQuery(search || '');

    // Apply extracted filters only if they weren't already set by the user
    if (parsedSearch.location && !location) {
      location = parsedSearch.location;
    }
    if (parsedSearch.locationType && !locationType) {
      locationType = parsedSearch.locationType;
    }
    if (parsedSearch.employmentType && !employmentType) {
      employmentType = parsedSearch.employmentType;
    }
    if (parsedSearch.experienceLevel && !experienceLevel) {
      experienceLevel = parsedSearch.experienceLevel;
    }
    if (parsedSearch.salaryMin && !salaryMin) {
      salaryMin = parsedSearch.salaryMin.toString();
    }
    if (parsedSearch.salaryMax && !salaryMax) {
      salaryMax = parsedSearch.salaryMax.toString();
    }

    // Use the cleaned query for actual text search
    if (search) {
      search = parsedSearch.cleanedQuery;
    }

    // Build filter conditions
    // Set time to start of today (00:00:00) for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      isActive: true,
      // Filter out expired jobs (no deadline OR deadline is today or in future)
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gte: today } },
      ],
    };

    // Full-text search with relevance ranking
    // If search is provided, we'll use PostgreSQL full-text search for better results
    let searchRankingSubquery = '';
    let searchJobIds: string[] = [];

    if (search && search.trim() !== '') {
      // Split search into individual words and create search query
      const searchTerms = search.trim().split(/\s+/).filter((term: string) => term.length > 0);
      const tsQuery = searchTerms.map((term: string) => `${term}:*`).join(' & ');

      // Use raw SQL for full-text search with weighted ranking
      // Title: A (weight 1.0), Skills: B (weight 0.4), Description: C (weight 0.2), Company: D (weight 0.1)
      const searchResults = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
        SELECT
          id,
          ts_rank_cd(
            setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE("requiredSkills", '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE("companyName", '')), 'D'),
            to_tsquery('english', ${tsQuery})
          ) as rank
        FROM "jobs"
        WHERE
          "isActive" = true
          AND (
            to_tsvector('english', COALESCE(title, '')) ||
            to_tsvector('english', COALESCE("requiredSkills", '')) ||
            to_tsvector('english', COALESCE(description, '')) ||
            to_tsvector('english', COALESCE("companyName", ''))
          ) @@ to_tsquery('english', ${tsQuery})
        ORDER BY rank DESC
      `;

      searchJobIds = searchResults.map(result => result.id);

      // If no results found with strict matching, try OR matching (any word matches)
      if (searchJobIds.length === 0 && searchTerms.length > 1) {
        const tsQueryOr = searchTerms.map((term: string) => `${term}:*`).join(' | ');
        const fallbackResults = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
          SELECT
            id,
            ts_rank_cd(
              setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE("requiredSkills", '')), 'B') ||
              setweight(to_tsvector('english', COALESCE(description, '')), 'C') ||
              setweight(to_tsvector('english', COALESCE("companyName", '')), 'D'),
              to_tsquery('english', ${tsQueryOr})
            ) as rank
          FROM "jobs"
          WHERE
            "isActive" = true
            AND (
              to_tsvector('english', COALESCE(title, '')) ||
              to_tsvector('english', COALESCE("requiredSkills", '')) ||
              to_tsvector('english', COALESCE(description, '')) ||
              to_tsvector('english', COALESCE("companyName", ''))
            ) @@ to_tsquery('english', ${tsQueryOr})
          ORDER BY rank DESC
        `;
        searchJobIds = fallbackResults.map(result => result.id);
      }

      // If still no results, fall back to simple pattern matching
      if (searchJobIds.length === 0) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { requiredSkills: { contains: search, mode: 'insensitive' } },
          ],
        });
      } else {
        // Filter by matching job IDs
        where.id = { in: searchJobIds };
      }
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

    // If search results exist, preserve search ranking order
    if (search && searchJobIds.length > 0) {
      // Jobs will be sorted by relevance ranking from full-text search
      // We'll sort them in the application layer to maintain search ranking
      orderBy = undefined;
    } else if (sortBy === 'salary') {
      orderBy = { salaryMax: 'desc' };
    }

    // For match sorting, we need to fetch all jobs first, then sort and paginate
    const shouldFetchAll = sortBy === 'match' && req.user;

    // Execute query
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: shouldFetchAll ? undefined : skip,
        take: shouldFetchAll ? undefined : take,
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
    let jobsWithParsedData = jobs.map(job => ({
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

    // Sort by search relevance if we have search results
    if (search && searchJobIds.length > 0) {
      // If user is authenticated, calculate match scores and sort by match percentage
      if (req.user) {
        try {
          const jobsWithMatchScores = await Promise.all(
            jobsWithParsedData.map(async (job) => {
              try {
                const matchScore = await calculateJobMatch(req.user!.userId, job.id);
                return { ...job, matchScore: matchScore.overall };
              } catch (error) {
                console.error(`Error calculating match for job ${job.id}:`, error);
                return { ...job, matchScore: 0 };
              }
            })
          );

          // Sort by match score descending (highest match first)
          jobsWithParsedData = jobsWithMatchScores.sort((a: any, b: any) => {
            return b.matchScore - a.matchScore;
          });
        } catch (error) {
          console.error('Error calculating match scores for search:', error);
          // Fall back to search relevance ranking
          const rankMap = new Map(searchJobIds.map((id, index) => [id, index]));
          jobsWithParsedData.sort((a, b) => {
            const rankA = rankMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
            const rankB = rankMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
            return rankA - rankB;
          });
        }
      } else {
        // For non-authenticated users, use search relevance ranking
        const rankMap = new Map(searchJobIds.map((id, index) => [id, index]));
        jobsWithParsedData.sort((a, b) => {
          const rankA = rankMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
          const rankB = rankMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
          return rankA - rankB;
        });
      }
    }

    // If sorting by match and user is authenticated, calculate match scores and sort
    if (sortBy === 'match' && req.user && !search) {
      try {
        const jobsWithMatchScores = await Promise.all(
          jobsWithParsedData.map(async (job) => {
            try {
              const matchScore = await calculateJobMatch(req.user!.userId, job.id);
              return { ...job, matchScore: matchScore.overall };
            } catch (error) {
              console.error(`Error calculating match for job ${job.id}:`, error);
              return { ...job, matchScore: 0 };
            }
          })
        );

        // Sort by match score descending (highest first)
        const sortedJobs = jobsWithMatchScores.sort((a: any, b: any) => {
          return b.matchScore - a.matchScore;
        });

        // Now apply pagination to sorted results
        jobsWithParsedData = sortedJobs.slice(skip, skip + take);
      } catch (error) {
        console.error('Error calculating match scores:', error);
        // Continue with unsorted jobs if match calculation fails
      }
    }

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

    let { page = 1, limit = 20, search } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Parse search query for intelligent keyword extraction
    const parsedSearch = parseSearchQuery(search || '');

    // Use the cleaned query for actual text search
    if (search) {
      search = parsedSearch.cleanedQuery;
    }

    // Build where clause with search
    const where: any = { userId: req.user.userId };

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Apply parsed filters if present
    if (parsedSearch.locationType) {
      where.locationType = parsedSearch.locationType;
    }
    if (parsedSearch.employmentType) {
      where.employmentType = parsedSearch.employmentType;
    }
    if (parsedSearch.experienceLevel) {
      where.experienceLevel = parsedSearch.experienceLevel;
    }
    if (parsedSearch.location) {
      where.location = { contains: parsedSearch.location, mode: 'insensitive' };
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

    // Set time to start of today (00:00:00) for date-only comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [jobs, total, company] = await Promise.all([
      prisma.job.findMany({
        where: {
          companyId: companyId,
          isActive: true,
          // Only show jobs that haven't expired (no deadline OR deadline is today or in future)
          OR: [
            { applicationDeadline: null },
            { applicationDeadline: { gte: today } },
          ],
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
          isActive: true,
          OR: [
            { applicationDeadline: null },
            { applicationDeadline: { gte: today } },
          ],
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

export const getJobMatchScore = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobId } = req.params;
    const { userId } = req.query; // Optional: calculate match for specific user

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

    // If userId is provided, verify the requester is the job poster
    if (userId && typeof userId === 'string') {
      if (job.userId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only view match scores for applicants of your own jobs',
        });
      }

      // Calculate match score for the specified user
      const matchScore = await calculateJobMatch(userId, jobId);
      return res.status(200).json({
        success: true,
        data: matchScore,
      });
    }

    // Calculate match score for logged-in user
    const matchScore = await calculateJobMatch(req.user.userId, jobId);

    return res.status(200).json({
      success: true,
      data: matchScore,
    });
  } catch (error: any) {
    console.error('Get job match score error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate job match score',
    });
  }
};

export const getJobsWithMatchScores = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { jobIds } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job IDs array is required',
      });
    }

    // Calculate match scores for all jobs
    const matchScores = await calculateJobMatches(req.user.userId, jobIds);

    return res.status(200).json({
      success: true,
      data: matchScores,
    });
  } catch (error: any) {
    console.error('Get jobs with match scores error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate job match scores',
    });
  }
};
