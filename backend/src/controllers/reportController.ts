import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Report threshold - posts with this many reports will be flagged for admin review
const REPORT_THRESHOLD = 5;

// Report a post
export const reportPost = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user!.userId;
    const { postId } = req.params;
    const { reason, description } = req.body;

    // Validate reason
    const validReasons = ['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    // If reason is OTHER, description is required
    if (reason === 'OTHER' && (!description || description.trim() === '')) {
      return res.status(400).json({ error: 'Description is required for "Other" reason' });
    }

    // Check if post exists
    const post = await prisma.jobNews.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Can't report your own post
    if (post.userId === reporterId) {
      return res.status(400).json({ error: 'You cannot report your own post' });
    }

    // Check if user already reported this post
    const existingReport = await prisma.postReport.findUnique({
      where: {
        postId_reporterId: {
          postId,
          reporterId,
        },
      },
    });

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    // Create the report
    await prisma.postReport.create({
      data: {
        postId,
        reporterId,
        reason,
        description: description?.trim() || null,
      },
    });

    // Get updated report count
    const reportCount = await prisma.postReport.count({
      where: { postId },
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      reportCount,
      isFlagged: reportCount >= REPORT_THRESHOLD,
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};

// Check if current user has reported a post
export const checkReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user!.userId;
    const { postId } = req.params;

    const report = await prisma.postReport.findUnique({
      where: {
        postId_reporterId: {
          postId,
          reporterId,
        },
      },
    });

    res.json({ hasReported: !!report });
  } catch (error) {
    console.error('Error checking report status:', error);
    res.status(500).json({ error: 'Failed to check report status' });
  }
};

// Get report reasons (for frontend dropdown)
export const getReportReasons = async (_req: AuthRequest, res: Response) => {
  const reasons = [
    { value: 'SPAM', label: 'Spam / Advertisement' },
    { value: 'MISLEADING', label: 'Misleading / False Information' },
    { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
    { value: 'HARASSMENT', label: 'Harassment / Bullying' },
    { value: 'OTHER', label: 'Other' },
  ];

  res.json({ reasons });
};
