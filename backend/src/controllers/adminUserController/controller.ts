import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { cacheInvalidate, cacheInvalidatePattern, CacheKeys } from '../../utils/cache';
import { revokeAllUserRefreshTokens } from '../../utils/jwt';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError, NotFoundError } from '../../errors/AppError';

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  USER_NOT_FOUND: 'User not found',
} as const;

export const getUsers = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { page: pageStr, limit: limitStr, search: searchStr, isBlocked: isBlockedStr, isDeleted: isDeletedStr } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const search = searchStr || '';
  const isBlocked = isBlockedStr === 'true';
  const isDeleted = isDeletedStr === 'true';
  const skip = (page - 1) * limit;

  const where: any = {
    isDeleted: false,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isBlocked) {
    where.isBlocked = true;
  }

  if (isDeleted) {
    where.isDeleted = true;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            jobNews: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const getUserDetails = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { userId } = req.params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      jobNews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          jobNews: true,
          applications: true,
        },
      },
    },
  });

  if (!user) throw new NotFoundError(ERRORS.USER_NOT_FOUND);

  return res.status(200).json({
    success: true,
    data: user,
  });
});

export const blockUser = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { userId } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: true },
  });

  await prisma.userAction.create({
    data: {
      userId,
      adminId: req.admin.adminId,
      action: 'BLOCK',
      reason,
    },
  });

  await Promise.all([
    revokeAllUserRefreshTokens(userId),
    cacheInvalidate(CacheKeys.userAuth(userId)),
    cacheInvalidate(CacheKeys.adminStats()),
  ]);

  return res.status(200).json({
    success: true,
    data: user,
    message: 'User blocked successfully',
  });
});

export const unblockUser = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { userId } = req.params;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: false },
  });

  await prisma.userAction.create({
    data: {
      userId,
      adminId: req.admin.adminId,
      action: 'UNBLOCK',
    },
  });

  await Promise.all([
    cacheInvalidate(CacheKeys.userAuth(userId)),
    cacheInvalidate(CacheKeys.adminStats()),
  ]);

  return res.status(200).json({
    success: true,
    data: user,
    message: 'User unblocked successfully',
  });
});

export const deleteUser = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { userId } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  await prisma.userAction.create({
    data: {
      userId,
      adminId: req.admin.adminId,
      action: 'DELETE',
      reason,
    },
  });

  await Promise.all([
    revokeAllUserRefreshTokens(userId),
    cacheInvalidate(CacheKeys.userAuth(userId)),
    cacheInvalidate(CacheKeys.adminStats()),
  ]);

  return res.status(200).json({
    success: true,
    data: user,
    message: 'User deleted successfully',
  });
});
