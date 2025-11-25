import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import {
  deleteFromBunny,
  extractFilenameFromUrl,
  deleteVideoFromBunnyStream,
} from '../utils/bunnyStorage';

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

    // Build where clause
    const where: any = {};

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
