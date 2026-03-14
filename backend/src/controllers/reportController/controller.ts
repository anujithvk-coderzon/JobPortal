import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../types';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, NotFoundError } from '../../errors/AppError';

const prisma = new PrismaClient();

// Report threshold - posts with this many reports will be flagged for admin review
const REPORT_THRESHOLD = 5;

const ERRORS = {
  INVALID_REASON: 'Invalid report reason',
  DESCRIPTION_REQUIRED: 'Description is required for "Other" reason',
  POST_NOT_FOUND: 'Post not found',
  CANNOT_REPORT_OWN: 'You cannot report your own post',
  ALREADY_REPORTED: 'You have already reported this post',
} as const;

// Report a post
export const reportPost = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const reporterId = req.user!.userId;
  const { postId } = req.params;
  const { reason, description } = req.body;

  const validReasons = ['SPAM', 'MISLEADING', 'INAPPROPRIATE', 'HARASSMENT', 'OTHER'];
  if (!reason || !validReasons.includes(reason)) {
    throw new BadRequestError(ERRORS.INVALID_REASON);
  }

  if (reason === 'OTHER' && (!description || description.trim() === '')) {
    throw new BadRequestError(ERRORS.DESCRIPTION_REQUIRED);
  }

  const post = await prisma.jobNews.findUnique({
    where: { id: postId },
  });

  if (!post) throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  if (post.userId === reporterId) throw new BadRequestError(ERRORS.CANNOT_REPORT_OWN);

  const existingReport = await prisma.postReport.findUnique({
    where: {
      postId_reporterId: {
        postId,
        reporterId,
      },
    },
  });

  if (existingReport) throw new BadRequestError(ERRORS.ALREADY_REPORTED);

  await prisma.postReport.create({
    data: {
      postId,
      reporterId,
      reason,
      description: description?.trim() || null,
    },
  });

  const reportCount = await prisma.postReport.count({
    where: { postId },
  });

  res.status(201).json({
    message: 'Report submitted successfully',
    reportCount,
    isFlagged: reportCount >= REPORT_THRESHOLD,
  });
});

// Check if current user has reported a post
export const checkReportStatus = asyncWrapper(async function (req: AuthRequest, res: Response) {
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
});

// Get report reasons (for frontend dropdown)
export const getReportReasons = asyncWrapper(async function (_req: AuthRequest, res: Response) {
  const reasons = [
    { value: 'SPAM', label: 'Spam / Advertisement' },
    { value: 'MISLEADING', label: 'Misleading / False Information' },
    { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
    { value: 'HARASSMENT', label: 'Harassment / Bullying' },
    { value: 'OTHER', label: 'Other' },
  ];

  res.json({ reasons });
});
