import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Get all posts
export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (status) where.moderationStatus = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.jobNews.findMany({
        where,
        skip,
        take,
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
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
    });
  }
};

// Get pending posts
export const getPendingPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.jobNews.findMany({
      where: { moderationStatus: 'PENDING' },
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
      },
    });

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error: any) {
    console.error('Get pending posts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pending posts',
    });
  }
};

// Approve post
export const approvePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;

    const post = await prisma.jobNews.update({
      where: { id: postId },
      data: {
        moderationStatus: 'APPROVED',
        moderatedBy: req.admin!.adminId,
        moderatedAt: new Date(),
        isActive: true,
      },
    });

    // Log moderation action
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin!.adminId,
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

// Reject post
export const rejectPost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    const post = await prisma.jobNews.update({
      where: { id: postId },
      data: {
        moderationStatus: 'REJECTED',
        moderatedBy: req.admin!.adminId,
        moderatedAt: new Date(),
        rejectionReason: reason,
        isActive: false,
      },
    });

    // Log moderation action
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin!.adminId,
        action: 'REJECT',
        reason,
      },
    });

    return res.status(200).json({
      success: true,
      data: post,
      message: 'Post rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject post',
    });
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    // Log moderation action before deletion
    await prisma.postModeration.create({
      data: {
        postId,
        adminId: req.admin!.adminId,
        action: 'DELETE',
        reason,
      },
    });

    await prisma.jobNews.delete({
      where: { id: postId },
    });

    return res.status(200).json({
      success: true,
      message: 'Post deleted permanently',
    });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
};

// Get post details
export const getPostDetails = async (req: AuthRequest, res: Response) => {
  try {
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
