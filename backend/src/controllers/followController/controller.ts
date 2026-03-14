import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../types';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, NotFoundError } from '../../errors/AppError';

const prisma = new PrismaClient();

const ERRORS = {
  CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
  USER_NOT_FOUND: 'User not found',
  ALREADY_FOLLOWING: 'You are already following this user',
  NOT_FOLLOWING: 'You are not following this user',
} as const;

// Follow a user
export const followUser = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const followerId = req.user!.userId;
  const { userId } = req.params;

  if (followerId === userId) throw new BadRequestError(ERRORS.CANNOT_FOLLOW_SELF);

  const userToFollow = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userToFollow) throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  if (userToFollow.isDeleted || userToFollow.isBlocked) throw new NotFoundError(ERRORS.USER_NOT_FOUND);

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  if (existingFollow) throw new BadRequestError(ERRORS.ALREADY_FOLLOWING);

  await prisma.follow.create({
    data: {
      followerId,
      followingId: userId,
    },
  });

  res.status(201).json({ message: 'Successfully followed user' });
});

// Unfollow a user
export const unfollowUser = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const followerId = req.user!.userId;
  const { userId } = req.params;

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  if (!existingFollow) throw new BadRequestError(ERRORS.NOT_FOLLOWING);

  await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  res.json({ message: 'Successfully unfollowed user' });
});

// Get users that the current user is following
export const getFollowing = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { page: pageStr, limit: limitStr } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  const users = following.map((f) => ({
    id: f.following.id,
    name: f.following.name,
    profilePhoto: f.following.profilePhoto,
    headline: f.following.profile?.headline,
    followedAt: f.createdAt,
  }));

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get followers of the current user
export const getFollowers = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { page: pageStr, limit: limitStr } = req.query as { [key: string]: string };
  const page = parseInt(pageStr) || 1;
  const limit = parseInt(limitStr) || 20;
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            profile: {
              select: {
                headline: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  const followerIds = followers.map((f) => f.follower.id);
  const followingBack = await prisma.follow.findMany({
    where: {
      followerId: userId,
      followingId: { in: followerIds },
    },
    select: { followingId: true },
  });
  const followingBackIds = new Set(followingBack.map((f) => f.followingId));

  const users = followers.map((f) => ({
    id: f.follower.id,
    name: f.follower.name,
    profilePhoto: f.follower.profilePhoto,
    headline: f.follower.profile?.headline,
    followedAt: f.createdAt,
    isFollowingBack: followingBackIds.has(f.follower.id),
  }));

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Check if current user is following a specific user
export const checkFollowStatus = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const followerId = req.user!.userId;
  const { userId } = req.params;

  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId: userId,
      },
    },
  });

  res.json({ isFollowing: !!follow });
});

// Get follow counts for a user
export const getFollowCounts = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const { userId } = req.params;

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  res.json({
    followersCount,
    followingCount,
  });
});

// Get suggested users to follow (based on credibility/activity)
export const getSuggestedUsers = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { limit: limitStr } = req.query as { [key: string]: string };
  const limit = parseInt(limitStr) || 5;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const suggestedUsers = await prisma.user.findMany({
    where: {
      id: {
        notIn: [...followingIds, userId],
      },
      isDeleted: false,
      isBlocked: false,
      jobNews: {
        some: {
          moderationStatus: 'APPROVED',
        },
      },
    },
    select: {
      id: true,
      name: true,
      profilePhoto: true,
      profile: {
        select: {
          headline: true,
        },
      },
      _count: {
        select: {
          jobNews: {
            where: { moderationStatus: 'APPROVED' },
          },
        },
      },
      jobNews: {
        where: { moderationStatus: 'APPROVED' },
        select: {
          _count: {
            select: { helpfulVotes: true },
          },
        },
      },
    },
    take: limit * 2,
  });

  const usersWithScore = suggestedUsers.map((user) => {
    const totalHelpful = user.jobNews.reduce(
      (sum, post) => sum + post._count.helpfulVotes,
      0
    );
    return {
      id: user.id,
      name: user.name,
      profilePhoto: user.profilePhoto,
      headline: user.profile?.headline,
      postsCount: user._count.jobNews,
      helpfulCount: totalHelpful,
    };
  });

  usersWithScore.sort((a, b) => {
    if (b.helpfulCount !== a.helpfulCount) {
      return b.helpfulCount - a.helpfulCount;
    }
    return b.postsCount - a.postsCount;
  });

  res.json({ users: usersWithScore.slice(0, limit) });
});
