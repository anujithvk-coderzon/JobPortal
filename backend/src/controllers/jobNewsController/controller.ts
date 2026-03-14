import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generatePosterFilename,
  uploadVideoToBunnyStream,
  deleteVideoFromBunnyStream,
} from '../../utils/bunnyStorage';
import { cacheGet, cacheInvalidate, cacheInvalidatePattern, TTL, CacheKeys, hashQuery } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError, NotFoundError, BadRequestError, ForbiddenError } from '../../errors/AppError';
import { JobNewsValidation, formatZodErrors } from '../../helper/validation';

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  POSTER_AND_VIDEO: 'You can only upload either a poster image or a video, not both.',
  POSTER_AND_VIDEO_UPDATE: 'You can only have either a poster image or a video, not both.',
  JOB_NEWS_NOT_FOUND: 'Job news not found',
  NOT_AUTHORIZED_UPDATE: 'You are not authorized to update this job news',
  NOT_AUTHORIZED_DELETE: 'You are not authorized to delete this job news',
  POST_NOT_FOUND: 'Post not found',
} as const;

export const createJobNews = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const validated = JobNewsValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const {
    title,
    description,
    companyName,
    location,
    source,
    externalLink,
    poster,
    posterMimeType,
    video,
    videoMimeType,
    videoAspectRatio,
  } = req.body;

  if (poster && video) throw new BadRequestError(ERRORS.POSTER_AND_VIDEO);

  let posterUrl: string | undefined;
  let videoUrl: string | undefined;
  let videoId: string | undefined;

  if (poster && posterMimeType) {
    const extension = posterMimeType.split('/')[1];
    const filename = generatePosterFilename(req.user.userId, extension);
    const buffer = Buffer.from(poster, 'base64');

    const uploadResult = await uploadToBunny(buffer, filename, posterMimeType);

    if (uploadResult.success) {
      posterUrl = uploadResult.url;
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload poster',
      });
    }
  }

  let savedVideoAspectRatio = videoAspectRatio || null;
  if (video) {
    const buffer = Buffer.from(video, 'base64');
    const uploadResult = await uploadVideoToBunnyStream(buffer, title, videoAspectRatio);

    if (uploadResult.success && uploadResult.videoUrl && uploadResult.videoId) {
      videoUrl = uploadResult.videoUrl;
      videoId = uploadResult.videoId;
      savedVideoAspectRatio = uploadResult.aspectRatio || videoAspectRatio || null;
    } else {
      console.error('Video upload failed:', uploadResult.error);
      if (posterUrl) {
        const filename = extractFilenameFromUrl(posterUrl);
        if (filename) {
          await deleteFromBunny(filename);
        }
      }
      return res.status(500).json({
        success: false,
        error: uploadResult.error || 'Failed to upload video',
      });
    }
  }

  const jobNews = await prisma.jobNews.create({
    data: {
      userId: req.user.userId,
      title,
      description,
      companyName,
      location,
      source,
      externalLink,
      poster: posterUrl,
      video: videoUrl,
      videoId,
      videoAspectRatio: savedVideoAspectRatio,
      isActive: false,
      moderationStatus: 'PENDING',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidatePattern(`jobnews:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`user:public:${req.user.userId}:*`),
  ]);

  return res.status(201).json({
    success: true,
    data: jobNews,
    message: 'Your post has been submitted successfully. It will be live shortly!',
  });
});

export const getAllJobNews = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const {
    page = '1',
    limit = '10',
    search,
    location,
    followingOnly,
  } = req.query as { [key: string]: string };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {
    isActive: true,
    isDeleted: false,
    moderationStatus: 'APPROVED',
  };

  if (followingOnly === 'true' && req.user) {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    where.userId = { in: followingIds };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  let userInterests: string[] = [];
  if (req.user) {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      select: { interests: true },
    });
    userInterests = profile?.interests || [];
  }

  const includeClause = {
    user: {
      select: {
        id: true,
        name: true,
        profilePhoto: true,
      },
    },
    _count: {
      select: {
        helpfulVotes: true,
      },
    },
    helpfulVotes: req.user ? {
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
      },
    } : false,
  };

  let jobNews: any[];
  let total: number;

  let seenPostIds: Set<string> = new Set();
  if (req.user) {
    const seenRecords = await prisma.jobNewsSeen.findMany({
      where: { userId: req.user.userId },
      select: { jobNewsId: true },
    });
    seenPostIds = new Set(seenRecords.map((r) => r.jobNewsId));
  }

  if (req.user) {
    const [allPosts, count] = await Promise.all([
      prisma.jobNews.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: includeClause,
      }),
      prisma.jobNews.count({ where }),
    ]);

    total = count;

    const scoredPosts = allPosts.map((post) => {
      let interestScore = 0;
      if (userInterests.length > 0) {
        const text = `${post.title} ${post.description || ''} ${post.companyName || ''} ${post.source || ''}`.toLowerCase();
        interestScore = userInterests.filter((interest) => {
          const escaped = interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (interest.length <= 3 && !interest.includes(' ')) {
            return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
          }
          return text.includes(interest);
        }).length;
      }
      return { ...post, _interestScore: interestScore, _isSeen: seenPostIds.has(post.id) };
    });

    scoredPosts.sort((a, b) => {
      if (a._isSeen !== b._isSeen) return a._isSeen ? 1 : -1;
      if (a._interestScore !== b._interestScore) return b._interestScore - a._interestScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    jobNews = scoredPosts.slice(skip, skip + take).map(({ _interestScore, _isSeen, ...post }) => post);
  } else {
    const [posts, count] = await Promise.all([
      prisma.jobNews.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: includeClause,
      }),
      prisma.jobNews.count({ where }),
    ]);
    jobNews = posts;
    total = count;
  }

  const userIds = [...new Set(jobNews.map(post => post.userId))];

  const userCredibilityMap = new Map();

  await Promise.all(
    userIds.map(async (userId) => {
      const credibility = await cacheGet(
        CacheKeys.credibility(userId),
        async () => {
          const userPosts = await prisma.jobNews.findMany({
            where: {
              userId,
              moderationStatus: 'APPROVED',
              isActive: true,
            },
            select: {
              _count: {
                select: {
                  helpfulVotes: true,
                },
              },
            },
          });

          const totalHelpfulMarks = userPosts.reduce(
            (sum, post) => sum + post._count.helpfulVotes,
            0
          );

          let credibilityLevel = 'Newbie';
          let nextLevel = 'Contributor';
          let nextLevelAt = 10;

          if (totalHelpfulMarks >= 100) {
            credibilityLevel = 'Authority';
            nextLevel = 'Authority';
            nextLevelAt = 100;
          } else if (totalHelpfulMarks >= 50) {
            credibilityLevel = 'Expert';
            nextLevel = 'Authority';
            nextLevelAt = 100;
          } else if (totalHelpfulMarks >= 25) {
            credibilityLevel = 'Trusted';
            nextLevel = 'Expert';
            nextLevelAt = 50;
          } else if (totalHelpfulMarks >= 10) {
            credibilityLevel = 'Contributor';
            nextLevel = 'Trusted';
            nextLevelAt = 25;
          }

          return {
            level: credibilityLevel,
            score: totalHelpfulMarks,
            nextLevel,
            nextLevelAt,
          };
        },
        TTL.VERY_LONG
      );
      userCredibilityMap.set(userId, credibility);
    })
  );

  const jobNewsWithCounts = jobNews.map((post) => ({
    ...post,
    helpfulCount: post._count.helpfulVotes,
    isHelpful: post.helpfulVotes && post.helpfulVotes.length > 0,
    isSeen: seenPostIds.has(post.id),
    user: {
      ...post.user,
      credibilityScore: userCredibilityMap.get(post.userId),
    },
    _count: undefined,
    helpfulVotes: undefined,
  }));

  return res.status(200).json({
    success: true,
    data: {
      jobNews: jobNewsWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getJobNewsById = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const { id } = req.params;

  const jobNews = await prisma.jobNews.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          email: true,
        },
      },
      helpfulVotes: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!jobNews) throw new NotFoundError(ERRORS.JOB_NEWS_NOT_FOUND);

  const isOwner = jobNews.userId === req.user?.userId;
  if (!isOwner) {
    if (jobNews.moderationStatus !== 'APPROVED' || jobNews.isDeleted) {
      throw new NotFoundError(ERRORS.JOB_NEWS_NOT_FOUND);
    }
  }

  if (req.user) {
    prisma.jobNewsSeen.upsert({
      where: {
        jobNewsId_userId: {
          jobNewsId: id,
          userId: req.user.userId,
        },
      },
      create: { jobNewsId: id, userId: req.user.userId },
      update: {},
    }).catch(() => {});
  }

  const helpfulCount = jobNews.helpfulVotes.length;
  const userHasMarkedHelpful = req.user
    ? jobNews.helpfulVotes.some(vote => vote.userId === req.user!.userId)
    : false;

  const userPosts = await prisma.jobNews.findMany({
    where: {
      userId: jobNews.userId,
      moderationStatus: 'APPROVED',
      isActive: true,
    },
    select: {
      _count: {
        select: {
          helpfulVotes: true,
        },
      },
    },
  });

  const totalHelpfulMarks = userPosts.reduce(
    (sum, post) => sum + post._count.helpfulVotes,
    0
  );

  let credibilityLevel = 'Newbie';
  let nextLevel = 'Contributor';
  let nextLevelAt = 10;

  if (totalHelpfulMarks >= 100) {
    credibilityLevel = 'Authority';
    nextLevel = 'Authority';
    nextLevelAt = 100;
  } else if (totalHelpfulMarks >= 50) {
    credibilityLevel = 'Expert';
    nextLevel = 'Authority';
    nextLevelAt = 100;
  } else if (totalHelpfulMarks >= 25) {
    credibilityLevel = 'Trusted';
    nextLevel = 'Expert';
    nextLevelAt = 50;
  } else if (totalHelpfulMarks >= 10) {
    credibilityLevel = 'Contributor';
    nextLevel = 'Trusted';
    nextLevelAt = 25;
  }

  const { helpfulVotes, ...jobNewsData } = jobNews;

  return res.status(200).json({
    success: true,
    data: {
      ...jobNewsData,
      helpfulCount,
      userHasMarkedHelpful,
      user: {
        ...jobNews.user,
        credibilityScore: {
          level: credibilityLevel,
          score: totalHelpfulMarks,
          nextLevel,
          nextLevelAt,
        },
      },
    },
  });
});

export const updateJobNews = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { id } = req.params;

  const existingJobNews = await prisma.jobNews.findUnique({
    where: { id },
  });

  if (!existingJobNews) throw new NotFoundError(ERRORS.JOB_NEWS_NOT_FOUND);
  if (existingJobNews.userId !== req.user.userId) {
    throw new ForbiddenError(ERRORS.NOT_AUTHORIZED_UPDATE);
  }

  const {
    title,
    description,
    companyName,
    location,
    source,
    externalLink,
    isActive,
    poster,
    posterMimeType,
    video,
    videoMimeType,
    videoAspectRatio,
    removePoster,
    removeVideo,
  } = req.body;

  const willHavePoster = poster || (existingJobNews.poster && !removePoster);
  const willHaveVideo = video || (existingJobNews.video && !removeVideo);

  if (willHavePoster && willHaveVideo) {
    throw new BadRequestError(ERRORS.POSTER_AND_VIDEO_UPDATE);
  }

  let posterUrl = existingJobNews.poster;
  let videoUrl = existingJobNews.video;
  let videoId = existingJobNews.videoId;
  let videoRatio = existingJobNews.videoAspectRatio;

  if (removePoster && existingJobNews.poster) {
    const filename = extractFilenameFromUrl(existingJobNews.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
    posterUrl = null;
  }

  if (poster && posterMimeType) {
    if (existingJobNews.poster) {
      const filename = extractFilenameFromUrl(existingJobNews.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    const extension = posterMimeType.split('/')[1];
    const filename = generatePosterFilename(req.user.userId, extension);
    const buffer = Buffer.from(poster, 'base64');

    const uploadResult = await uploadToBunny(buffer, filename, posterMimeType);

    if (uploadResult.success && uploadResult.url) {
      posterUrl = uploadResult.url;
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload new poster',
      });
    }
  }

  if (removeVideo && existingJobNews.videoId) {
    await deleteVideoFromBunnyStream(existingJobNews.videoId);
    videoUrl = null;
    videoId = null;
    videoRatio = null;
  }

  if (video) {
    if (existingJobNews.videoId) {
      await deleteVideoFromBunnyStream(existingJobNews.videoId);
    }

    const buffer = Buffer.from(video, 'base64');
    const uploadResult = await uploadVideoToBunnyStream(buffer, title);

    if (uploadResult.success && uploadResult.videoUrl && uploadResult.videoId) {
      videoUrl = uploadResult.videoUrl;
      videoId = uploadResult.videoId;
      videoRatio = videoAspectRatio || null;
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload new video',
      });
    }
  }

  const jobNews = await prisma.jobNews.update({
    where: { id },
    data: {
      title,
      description,
      companyName,
      location,
      source,
      externalLink,
      isActive,
      poster: posterUrl,
      video: videoUrl,
      videoId: videoId,
      videoAspectRatio: videoRatio,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
  });

  await Promise.all([
    cacheInvalidate(CacheKeys.jobNewsById(id)),
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidatePattern(`jobnews:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`user:public:${req.user.userId}:*`),
  ]);

  return res.status(200).json({
    success: true,
    data: jobNews,
    message: 'Job news updated successfully',
  });
});

export const deleteJobNews = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { id } = req.params;

  const existingJobNews = await prisma.jobNews.findUnique({
    where: { id },
  });

  if (!existingJobNews) throw new NotFoundError(ERRORS.JOB_NEWS_NOT_FOUND);
  if (existingJobNews.userId !== req.user.userId) {
    throw new ForbiddenError(ERRORS.NOT_AUTHORIZED_DELETE);
  }

  if (existingJobNews.poster) {
    const filename = extractFilenameFromUrl(existingJobNews.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
  }

  if (existingJobNews.videoId) {
    await deleteVideoFromBunnyStream(existingJobNews.videoId);
  }

  await prisma.jobNews.delete({
    where: { id },
  });

  await Promise.all([
    cacheInvalidate(CacheKeys.jobNewsById(id)),
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidatePattern(`jobnews:my:${req.user.userId}:*`),
    cacheInvalidatePattern(`user:public:${req.user.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(req.user.userId)),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Job news deleted successfully',
  });
});

export const getMyJobNews = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page = '1', limit = '10', search } = req.query as { [key: string]: string };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = { userId: req.user.userId };

  if (search && search.trim() !== '') {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [jobNews, total] = await Promise.all([
    prisma.jobNews.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            helpfulVotes: true,
          },
        },
      },
    }),
    prisma.jobNews.count({ where }),
  ]);

  const jobNewsWithCounts = jobNews.map((post) => ({
    ...post,
    helpfulCount: post._count.helpfulVotes,
    _count: undefined,
  }));

  return res.status(200).json({
    success: true,
    data: {
      jobNews: jobNewsWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const toggleHelpful = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { id } = req.params;

  const jobNews = await prisma.jobNews.findUnique({
    where: { id },
  });

  if (!jobNews) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  const existingVote = await prisma.jobNewsHelpful.findUnique({
    where: {
      jobNewsId_userId: {
        jobNewsId: id,
        userId: req.user.userId,
      },
    },
  });

  let isHelpful = false;

  if (existingVote) {
    await prisma.jobNewsHelpful.delete({
      where: {
        id: existingVote.id,
      },
    });
    isHelpful = false;
  } else {
    await prisma.jobNewsHelpful.create({
      data: {
        jobNewsId: id,
        userId: req.user.userId,
      },
    });
    isHelpful = true;
  }

  const helpfulCount = await prisma.jobNewsHelpful.count({
    where: { jobNewsId: id },
  });

  await Promise.all([
    cacheInvalidate(CacheKeys.credibility(jobNews.userId)),
    cacheInvalidate(CacheKeys.jobNewsById(id)),
    cacheInvalidatePattern('jobnews:all:*'),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      isHelpful,
      helpfulCount,
    },
    message: isHelpful ? 'Marked as helpful' : 'Unmarked as helpful',
  });
});
