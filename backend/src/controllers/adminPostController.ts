import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import {
  deleteFromBunny,
  extractFilenameFromUrl,
  deleteVideoFromBunnyStream,
} from '../utils/bunnyStorage';

// Report threshold - posts with this many reports will be flagged for admin review
const REPORT_THRESHOLD = 5;

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    // Build where clause - exclude soft-deleted posts from regular view
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
  } catch (error: any) {
    console.error('Get posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
    });
  }
};

export const getPostDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Get post details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch post details',
    });
  }
};

export const approvePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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

    // Log the action
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'APPROVE',
      },
    });

    return res.status(200).json({
      success: true,
      data: post,
      message: 'Post approved successfully',
    });
  } catch (error: any) {
    console.error('Approve post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve post',
    });
  }
};

export const rejectPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;
    const { reason } = req.body; // Optional reason

    // Get the post first to access media URLs
    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Log the action before deletion
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'REJECT',
        reason: reason || null,
      },
    });

    // Create notification only if there's a reason
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

    // Delete media files from Bunny
    if (post.poster) {
      const filename = extractFilenameFromUrl(post.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    if (post.videoId) {
      await deleteVideoFromBunnyStream(post.videoId);
    }

    // Delete the post from database
    await prisma.jobNews.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      success: true,
      message: 'Post rejected and deleted successfully',
    });
  } catch (error: any) {
    console.error('Reject post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject post',
    });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;

    // Get the post first to access media URLs
    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Log the action before deletion
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'DELETE',
      },
    });

    // Delete media files from Bunny
    if (post.poster) {
      const filename = extractFilenameFromUrl(post.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    if (post.videoId) {
      await deleteVideoFromBunnyStream(post.videoId);
    }

    // Delete the post from database
    await prisma.jobNews.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
};

// Get flagged posts (posts with reports >= threshold)
export const getFlaggedPosts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get posts that have at least REPORT_THRESHOLD reports
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
  } catch (error: any) {
    console.error('Get flagged posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch flagged posts',
    });
  }
};

// Get details of a flagged post with all reports
export const getFlaggedPostDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    console.error('Get flagged post details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch post details',
    });
  }
};

// Dismiss reports for a post (keep the post, delete all reports)
export const dismissReports = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;

    // Check if post exists
    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Delete all reports for this post
    const deletedReports = await prisma.postReport.deleteMany({
      where: { postId },
    });

    // Log the action
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
  } catch (error: any) {
    console.error('Dismiss reports error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to dismiss reports',
    });
  }
};

// Delete a flagged post (removes post, media, and all reports)
export const deleteFlaggedPost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;
    const { reason } = req.body;

    // Get the post first to access media URLs
    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: { reports: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Log the action before deletion
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'DELETE_FLAGGED',
        reason: reason || `Deleted due to ${post._count.reports} reports`,
      },
    });

    // Create notification for the post owner
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

    // Delete media files from Bunny
    if (post.poster) {
      const filename = extractFilenameFromUrl(post.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    if (post.videoId) {
      await deleteVideoFromBunnyStream(post.videoId);
    }

    // Delete the post from database (reports will be cascade deleted)
    await prisma.jobNews.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      success: true,
      message: 'Post and all associated reports deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete flagged post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
};

// Get count of flagged posts for dashboard
export const getFlaggedPostsCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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
  } catch (error: any) {
    console.error('Get flagged posts count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get flagged posts count',
    });
  }
};

// Soft delete a post (hide from everyone but keep in database)
export const softDeletePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;
    const { reason } = req.body;

    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (post.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'Post is already deleted',
      });
    }

    // Soft delete the post
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

    // Log the action
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'SOFT_DELETE',
        reason: reason || null,
      },
    });

    // Create notification for the post owner
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

    return res.status(200).json({
      success: true,
      data: updatedPost,
      message: 'Post soft deleted successfully',
    });
  } catch (error: any) {
    console.error('Soft delete post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to soft delete post',
    });
  }
};

// Get all soft-deleted posts with user context info
export const getSoftDeletedPosts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    // Build where clause
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

    // Get additional user context (total posts and credibility score) for each unique user
    const userIds = [...new Set(posts.map((p) => p.userId))];
    const userContextMap = new Map();

    for (const userId of userIds) {
      // Get total posts count for this user
      const totalPosts = await prisma.jobNews.count({
        where: { userId },
      });

      // Get approved active posts for credibility calculation
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

      // Get deleted posts count for this user
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

    // Enrich posts with user context
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
  } catch (error: any) {
    console.error('Get soft deleted posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deleted posts',
    });
  }
};

// Get count of soft-deleted posts
export const getSoftDeletedPostsCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const count = await prisma.jobNews.count({
      where: { isDeleted: true },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error('Get soft deleted posts count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get deleted posts count',
    });
  }
};

// Restore a soft-deleted post
export const restorePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;

    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (!post.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'Post is not deleted',
      });
    }

    // Restore the post
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

    // Log the action
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'RESTORE',
      },
    });

    // Create notification for the post owner
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'POST_RESTORED',
        title: 'Post Restored',
        message: `Your post "${post.title}" has been restored and is now visible again.`,
        postId: postId,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedPost,
      message: 'Post restored successfully',
    });
  } catch (error: any) {
    console.error('Restore post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restore post',
    });
  }
};

// Permanently delete a soft-deleted post (removes from database and media)
export const permanentDeletePost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { postId } = req.params;

    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    if (!post.isDeleted) {
      return res.status(400).json({
        success: false,
        error: 'Post must be soft-deleted first before permanent deletion',
      });
    }

    // Log the action before deletion
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin.adminId,
        action: 'PERMANENT_DELETE',
      },
    });

    // Delete media files from Bunny
    if (post.poster) {
      const filename = extractFilenameFromUrl(post.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    if (post.videoId) {
      await deleteVideoFromBunnyStream(post.videoId);
    }

    // Delete the post from database
    await prisma.jobNews.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      success: true,
      message: 'Post permanently deleted successfully',
    });
  } catch (error: any) {
    console.error('Permanent delete post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to permanently delete post',
    });
  }
};
