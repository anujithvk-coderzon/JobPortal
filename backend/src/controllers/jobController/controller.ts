import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { calculateJobMatch, calculateJobMatches, calculateJobMatchFromData } from '../../services/jobMatchingService';
import { parseSearchQuery } from '../../utils/searchParser';
import { cacheGet, cacheInvalidate, cacheInvalidatePattern, TTL, CacheKeys } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../errors/AppError';
import { CreateJobValidation, formatZodErrors } from '../../helper/validation';

const JOB_ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  COMPANY_ID_REQUIRED: 'Company ID is required',
  COMPANY_NOT_FOUND: 'Company not found',
  NO_PERMISSION_POST: 'You do not have permission to post jobs for this company',
  DEADLINE_TOO_FAR: 'Application deadline cannot be more than 30 days from today',
  JOB_NOT_FOUND: 'Job not found',
  NO_PERMISSION_UPDATE: 'You are not authorized to update this job',
  NO_PERMISSION_DELETE: 'You are not authorized to delete this job',
  ALREADY_SAVED: 'Job already saved',
  JOB_IDS_REQUIRED: 'Job IDs array is required',
  NO_PERMISSION_MATCH: 'You can only view match scores for applicants of your own jobs',
} as const;

export const createJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const validated = CreateJobValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

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
    salaryPeriod,
    showSalary,
    numberOfOpenings,
    applicationDeadline,
    companyId,
  } = req.body;

  // Validate company ID
  if (!companyId) {
    throw new BadRequestError(JOB_ERRORS.COMPANY_ID_REQUIRED);
  }

  // Verify company exists and belongs to the user
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError(JOB_ERRORS.COMPANY_NOT_FOUND);
  }

  if (company.userId !== req.user.userId) {
    throw new ForbiddenError(JOB_ERRORS.NO_PERMISSION_POST);
  }

  // Validate application deadline (max 30 days from today)
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    const maxDeadline = new Date();
    maxDeadline.setDate(maxDeadline.getDate() + 30);
    maxDeadline.setHours(23, 59, 59, 999);

    if (deadline > maxDeadline) {
      throw new BadRequestError(JOB_ERRORS.DEADLINE_TOO_FAR);
    }
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
      salaryCurrency: salaryCurrency || 'INR',
      salaryPeriod: salaryPeriod || 'LPA',
      showSalary: showSalary !== undefined ? showSalary : true,
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

  // Invalidate job listing caches
  await Promise.all([
    cacheInvalidatePattern('jobs:all:*'),
    cacheInvalidatePattern(`jobs:company:${companyId}:*`),
    cacheInvalidatePattern(`jobs:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
  ]);

  return res.status(201).json({
    success: true,
    data: job,
    message: 'Job posted successfully',
  });
});

export const getAllJobs = asyncWrapper(async function (req: AuthRequest, res: Response) {
  let {
    page = '1',
    limit = '20',
    search,
    location,
    employmentType,
    experienceLevel,
    locationType,
    salaryMin,
    salaryMax,
    sortBy = 'recent',
  } = req.query as { [key: string]: string };

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
        // Fetch user profile once for all jobs
        const userWithProfile = await prisma.user.findUnique({
          where: { id: req.user.userId },
          include: {
            profile: {
              include: {
                skills: true,
                experiences: true,
                education: true,
              },
            },
          },
        });

        const userProfile = userWithProfile?.profile || null;

        const jobsWithMatchScores = jobsWithParsedData.map((job) => {
          const matchScore = calculateJobMatchFromData(
            userProfile,
            {
              requiredSkills: job.requiredSkills ? JSON.stringify(job.requiredSkills) : null,
              experienceLevel: job.experienceLevel as any,
              requiredQualifications: job.requiredQualifications ? JSON.stringify(job.requiredQualifications) : null,
            }
          );
          return { ...job, matchScore };
        });

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
      // Fetch user profile once instead of per-job (avoids N+1 queries)
      const userWithProfile = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          profile: {
            include: {
              skills: true,
              experiences: true,
              education: true,
            },
          },
        },
      });

      const userProfile = userWithProfile?.profile || null;

      const jobsWithMatchScores = jobsWithParsedData.map((job) => {
        const matchScore = calculateJobMatchFromData(
          userProfile,
          {
            requiredSkills: job.requiredSkills ? JSON.stringify(job.requiredSkills) : null,
            experienceLevel: job.experienceLevel as any,
            requiredQualifications: job.requiredQualifications ? JSON.stringify(job.requiredQualifications) : null,
          }
        );
        return { ...job, matchScore };
      });

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
});

export const getJobById = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const { jobId } = req.params;

  // Cache the core job data (shared across all users)
  const job = await cacheGet(
    CacheKeys.jobById(jobId),
    () => prisma.job.findUnique({
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
    }),
    TTL.LONG
  );

  if (!job) {
    throw new NotFoundError(JOB_ERRORS.JOB_NOT_FOUND);
  }

  // Check if user has applied (if authenticated) - not cached as it's user-specific
  let hasApplied = false;
  let isSaved = false;
  if (req.user) {
    const [application, savedJob] = await Promise.all([
      prisma.application.findUnique({
        where: {
          jobId_applicantId: {
            jobId: jobId,
            applicantId: req.user.userId,
          },
        },
      }),
      prisma.savedJob.findUnique({
        where: {
          userId_jobId: {
            userId: req.user.userId,
            jobId: jobId,
          },
        },
      }),
    ]);
    hasApplied = !!application;
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
});

export const updateJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { jobId } = req.params;

  // Check if job belongs to user
  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existingJob) {
    throw new NotFoundError(JOB_ERRORS.JOB_NOT_FOUND);
  }

  if (existingJob.userId !== req.user.userId) {
    throw new ForbiddenError(JOB_ERRORS.NO_PERMISSION_UPDATE);
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
    salaryPeriod,
    showSalary,
    numberOfOpenings,
    applicationDeadline,
    isActive,
  } = req.body;

  // Validate application deadline (max 30 days from today)
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline);
    const maxDeadline = new Date();
    maxDeadline.setDate(maxDeadline.getDate() + 30);
    maxDeadline.setHours(23, 59, 59, 999);

    if (deadline > maxDeadline) {
      throw new BadRequestError(JOB_ERRORS.DEADLINE_TOO_FAR);
    }
  }

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
      salaryPeriod,
      showSalary: showSalary !== undefined ? showSalary : undefined,
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

  // Invalidate relevant caches
  await Promise.all([
    cacheInvalidate(CacheKeys.jobById(jobId)),
    cacheInvalidatePattern('jobs:all:*'),
    cacheInvalidatePattern(`jobs:company:${existingJob.companyId}:*`),
    cacheInvalidatePattern(`jobs:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
  ]);

  return res.status(200).json({
    success: true,
    data: job,
    message: 'Job updated successfully',
  });
});

export const deleteJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { jobId } = req.params;

  // Check if job belongs to user
  const existingJob = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!existingJob) {
    throw new NotFoundError(JOB_ERRORS.JOB_NOT_FOUND);
  }

  if (existingJob.userId !== req.user.userId) {
    throw new ForbiddenError(JOB_ERRORS.NO_PERMISSION_DELETE);
  }

  await prisma.job.delete({
    where: { id: jobId },
  });

  // Invalidate relevant caches
  await Promise.all([
    cacheInvalidate(CacheKeys.jobById(jobId)),
    cacheInvalidatePattern('jobs:all:*'),
    cacheInvalidatePattern(`jobs:company:${existingJob.companyId}:*`),
    cacheInvalidatePattern(`jobs:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`dashboard:${req.user.userId}`),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Job deleted successfully',
  });
});

export const getMyJobs = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  let { page = '1', limit = '20', search } = req.query as { [key: string]: string };
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
});

export const getCompanyJobs = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const { companyId } = req.params;
  const { page = '1', limit = '20' } = req.query as { [key: string]: string };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Set time to start of today (00:00:00) for date-only comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if requester is the company owner
  const companyRecord = await prisma.company.findUnique({
    where: { id: companyId },
    select: { userId: true },
  });

  const isOwner = req.user?.userId && companyRecord?.userId === req.user.userId;

  // Owner sees all jobs; others see only active, non-expired jobs
  const jobWhereClause: any = { companyId };
  if (!isOwner) {
    jobWhereClause.isActive = true;
    jobWhereClause.OR = [
      { applicationDeadline: null },
      { applicationDeadline: { gte: today } },
    ];
  }

  const [jobs, total, company, activeCount, totalApplications] = await Promise.all([
    prisma.job.findMany({
      where: jobWhereClause,
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
      where: jobWhereClause,
    }),
    prisma.company.findUnique({
      where: { id: companyId },
    }),
    prisma.job.count({
      where: { ...jobWhereClause, isActive: true },
    }),
    prisma.application.count({
      where: {
        job: { companyId },
      },
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
      stats: {
        totalJobs: total,
        activeJobs: activeCount,
        totalApplications,
      },
    },
  });
});

export const saveJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { jobId } = req.params;

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError(JOB_ERRORS.JOB_NOT_FOUND);
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
    throw new BadRequestError(JOB_ERRORS.ALREADY_SAVED);
  }

  await prisma.savedJob.create({
    data: {
      userId: req.user.userId,
      jobId: jobId,
    },
  });

  // Invalidate saved jobs cache
  await cacheInvalidatePattern(`jobs:saved:${req.user.userId}:*`);

  return res.status(200).json({
    success: true,
    message: 'Job saved successfully',
  });
});

export const unsaveJob = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
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

  // Invalidate saved jobs cache
  await cacheInvalidatePattern(`jobs:saved:${req.user.userId}:*`);

  return res.status(200).json({
    success: true,
    message: 'Job unsaved successfully',
  });
});

export const getSavedJobs = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { page = '1', limit = '20' } = req.query as { [key: string]: string };
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
});

export const getJobMatchScore = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { jobId } = req.params;
  const { userId } = req.query as { [key: string]: string }; // Optional: calculate match for specific user

  // Check if job exists
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError(JOB_ERRORS.JOB_NOT_FOUND);
  }

  // If userId is provided, verify the requester is the job poster
  if (userId && typeof userId === 'string') {
    if (job.userId !== req.user.userId) {
      throw new ForbiddenError(JOB_ERRORS.NO_PERMISSION_MATCH);
    }

    // Calculate match score for the specified user (cached)
    const matchScore = await cacheGet(
      CacheKeys.jobMatch(userId, jobId),
      () => calculateJobMatch(userId, jobId),
      TTL.VERY_LONG
    );
    return res.status(200).json({
      success: true,
      data: matchScore,
    });
  }

  // Calculate match score for logged-in user (cached)
  const currentUserId = req.user!.userId;
  const matchScore = await cacheGet(
    CacheKeys.jobMatch(currentUserId, jobId),
    () => calculateJobMatch(currentUserId, jobId),
    TTL.VERY_LONG
  );

  return res.status(200).json({
    success: true,
    data: matchScore,
  });
});

export const getJobsWithMatchScores = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(JOB_ERRORS.UNAUTHORIZED);
  }

  const { jobIds } = req.body;

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    throw new BadRequestError(JOB_ERRORS.JOB_IDS_REQUIRED);
  }

  // Calculate match scores for all jobs
  const matchScores = await calculateJobMatches(req.user.userId, jobIds);

  return res.status(200).json({
    success: true,
    data: matchScores,
  });
});
