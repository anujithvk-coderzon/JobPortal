import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import {
  deleteFromBunny,
  extractFilenameFromUrl,
  deleteVideoFromBunnyStream,
} from '../../utils/bunnyStorage';
import { cacheInvalidate, cacheInvalidatePattern, CacheKeys } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../../errors/AppError';

// Report threshold - posts with this many reports will be flagged for admin review
const REPORT_THRESHOLD = 5;

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  POST_NOT_FOUND: 'Post not found',
  ALREADY_DELETED: 'Post is already deleted',
  NOT_DELETED: 'Post is not deleted',
  MUST_SOFT_DELETE_FIRST: 'Post must be soft-deleted first before permanent deletion',
} as const;

export const getPosts = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page: pageStr, limit: limitStr, search: searchStr, status } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const search = searchStr || '';
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'all') {
    where.moderationStatus = status;
  }

  const [posts, total] = await Promise.all([
    prisma.jobNews.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        _count: {
          select: {
            helpfulVotes: true,
          },
        },
      },
    }),
    prisma.jobNews.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const getPostDetails = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      helpfulVotes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  return res.status(200).json({
    success: true,
    data: post,
  });
});

export const approvePost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.update({
    where: { id: postId },
    data: {
      moderationStatus: 'APPROVED',
      moderatedBy: req.admin.adminId,
      moderatedAt: new Date(),
      isActive: true,
    },
  });

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'APPROVE',
    },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidatePattern(`user:public:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    data: post,
    message: 'Post approved successfully',
  });
});

export const rejectPost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;
  const { reason } = req.body;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'REJECT',
      reason: reason || null,
    },
  });

  if (reason && reason.trim()) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'POST_REJECTED',
        title: 'Post Rejected',
        message: `Your post "${post.title}" was rejected. Reason: ${reason}`,
        postId: postId,
      },
    });
  }

  if (post.poster) {
    const filename = extractFilenameFromUrl(post.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
  }

  if (post.videoId) {
    await deleteVideoFromBunnyStream(post.videoId);
  }

  await prisma.jobNews.delete({
    where: { id: postId },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidatePattern(`user:public:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
    cacheInvalidate(CacheKeys.unreadCount(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Post rejected and deleted successfully',
  });
});

export const deletePost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'DELETE',
    },
  });

  if (post.poster) {
    const filename = extractFilenameFromUrl(post.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
  }

  if (post.videoId) {
    await deleteVideoFromBunnyStream(post.videoId);
  }

  await prisma.jobNews.delete({
    where: { id: postId },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// Get flagged posts (posts with reports >= threshold)
export const getFlaggedPosts = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page: pageStr, limit: limitStr } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const skip = (page - 1) * limit;

  const flaggedPostIds = await prisma.postReport.groupBy({
    by: ['postId'],
    _count: {
      postId: true,
    },
    having: {
      postId: {
        _count: {
          gte: REPORT_THRESHOLD,
        },
      },
    },
  });

  const postIds = flaggedPostIds.map((p) => p.postId);

  if (postIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        posts: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      },
    });
  }

  const [posts, total] = await Promise.all([
    prisma.jobNews.findMany({
      where: {
        id: { in: postIds },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        reports: {
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            helpfulVotes: true,
            reports: true,
          },
        },
      },
    }),
    prisma.jobNews.count({
      where: {
        id: { in: postIds },
      },
    }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      threshold: REPORT_THRESHOLD,
    },
  });
});

// Get details of a flagged post with all reports
export const getFlaggedPostDetails = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      reports: {
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      helpfulVotes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          helpfulVotes: true,
          reports: true,
        },
      },
    },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  return res.status(200).json({
    success: true,
    data: post,
  });
});

// Dismiss reports for a post (keep the post, delete all reports)
export const dismissReports = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  const deletedReports = await prisma.postReport.deleteMany({
    where: { postId },
  });

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'DISMISS_REPORTS',
      reason: `Dismissed ${deletedReports.count} reports`,
    },
  });

  return res.status(200).json({
    success: true,
    message: `Dismissed ${deletedReports.count} reports for this post`,
    deletedCount: deletedReports.count,
  });
});

// Delete a flagged post (removes post, media, and all reports)
export const deleteFlaggedPost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;
  const { reason } = req.body;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
    include: {
      _count: {
        select: { reports: true },
      },
    },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'DELETE_FLAGGED',
      reason: reason || `Deleted due to ${post._count.reports} reports`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: post.userId,
      type: 'POST_DELETED',
      title: 'Post Removed',
      message: reason
        ? `Your post "${post.title}" was removed. Reason: ${reason}`
        : `Your post "${post.title}" was removed due to community reports.`,
      postId: postId,
    },
  });

  if (post.poster) {
    const filename = extractFilenameFromUrl(post.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
  }

  if (post.videoId) {
    await deleteVideoFromBunnyStream(post.videoId);
  }

  await prisma.jobNews.delete({
    where: { id: postId },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
    cacheInvalidate(CacheKeys.unreadCount(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Post and all associated reports deleted successfully',
  });
});

// Get count of flagged posts for dashboard
export const getFlaggedPostsCount = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const flaggedPostIds = await prisma.postReport.groupBy({
    by: ['postId'],
    _count: {
      postId: true,
    },
    having: {
      postId: {
        _count: {
          gte: REPORT_THRESHOLD,
        },
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: {
      count: flaggedPostIds.length,
      threshold: REPORT_THRESHOLD,
    },
  });
});

// Soft delete a post (hide from everyone but keep in database)
export const softDeletePost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;
  const { reason } = req.body;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  if (post.isDeleted) throw new BadRequestError(ERRORS.ALREADY_DELETED);

  const updatedPost = await prisma.jobNews.update({
    where: { id: postId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.admin.adminId,
      deletionReason: reason || null,
      isActive: false,
    },
  });

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'SOFT_DELETE',
      reason: reason || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: post.userId,
      type: 'POST_DELETED',
      title: 'Post Removed',
      message: reason
        ? `Your post "${post.title}" was removed. Reason: ${reason}`
        : `Your post "${post.title}" was removed by a moderator.`,
      postId: postId,
    },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidatePattern(`user:public:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
    cacheInvalidate(CacheKeys.unreadCount(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    data: updatedPost,
    message: 'Post soft deleted successfully',
  });
});

// Get all soft-deleted posts with user context info
export const getSoftDeletedPosts = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page: pageStr, limit: limitStr, search: searchStr } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const search = searchStr || '';
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: true,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.jobNews.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deletedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            isBlocked: true,
            isDeleted: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            helpfulVotes: true,
            reports: true,
          },
        },
      },
    }),
    prisma.jobNews.count({ where }),
  ]);

  const userIds = [...new Set(posts.map((p) => p.userId))];
  const userContextMap = new Map();

  for (const userId of userIds) {
    const totalPosts = await prisma.jobNews.count({
      where: { userId },
    });

    const userPosts = await prisma.jobNews.findMany({
      where: {
        userId,
        moderationStatus: 'APPROVED',
        isActive: true,
        isDeleted: false,
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
    if (totalHelpfulMarks >= 100) {
      credibilityLevel = 'Authority';
    } else if (totalHelpfulMarks >= 50) {
      credibilityLevel = 'Expert';
    } else if (totalHelpfulMarks >= 25) {
      credibilityLevel = 'Trusted';
    } else if (totalHelpfulMarks >= 10) {
      credibilityLevel = 'Contributor';
    }

    const deletedPostsCount = await prisma.jobNews.count({
      where: { userId, isDeleted: true },
    });

    userContextMap.set(userId, {
      totalPosts,
      deletedPostsCount,
      credibilityScore: totalHelpfulMarks,
      credibilityLevel,
    });
  }

  const enrichedPosts = posts.map((post) => ({
    ...post,
    userContext: userContextMap.get(post.userId),
  }));

  return res.status(200).json({
    success: true,
    data: {
      posts: enrichedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// Get count of soft-deleted posts
export const getSoftDeletedPostsCount = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const count = await prisma.jobNews.count({
    where: { isDeleted: true },
  });

  return res.status(200).json({
    success: true,
    data: { count },
  });
});

// Restore a soft-deleted post
export const restorePost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  if (!post.isDeleted) throw new BadRequestError(ERRORS.NOT_DELETED);

  const updatedPost = await prisma.jobNews.update({
    where: { id: postId },
    data: {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      isActive: true,
    },
  });

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'RESTORE',
    },
  });

  await prisma.notification.create({
    data: {
      userId: post.userId,
      type: 'POST_RESTORED',
      title: 'Post Restored',
      message: `Your post "${post.title}" has been restored and is now visible again.`,
      postId: postId,
    },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidatePattern(`user:public:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
    cacheInvalidate(CacheKeys.unreadCount(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    data: updatedPost,
    message: 'Post restored successfully',
  });
});

// Permanently delete a soft-deleted post (removes from database and media)
export const permanentDeletePost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { postId } = req.params;

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  if (!post.isDeleted) throw new BadRequestError(ERRORS.MUST_SOFT_DELETE_FIRST);

  await prisma.postModeration.create({
    data: {
      postId,
      adminId: req.admin.adminId,
      action: 'PERMANENT_DELETE',
    },
  });

  if (post.poster) {
    const filename = extractFilenameFromUrl(post.poster);
    if (filename) {
      await deleteFromBunny(filename);
    }
  }

  if (post.videoId) {
    await deleteVideoFromBunnyStream(post.videoId);
  }

  await prisma.jobNews.delete({
    where: { id: postId },
  });

  await Promise.all([
    cacheInvalidatePattern('jobnews:all:*'),
    cacheInvalidate(CacheKeys.jobNewsById(postId)),
    cacheInvalidate(CacheKeys.adminStats()),
    cacheInvalidatePattern(`jobnews:my:${post.userId}:*`),
    cacheInvalidate(CacheKeys.credibility(post.userId)),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Post permanently deleted successfully',
  });
});
