import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const { userId } = req.params;

    // Can't follow yourself
    if (followerId === userId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToFollow.isDeleted || userToFollow.isBlocked) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    res.status(201).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const { userId } = req.params;

    // Check if following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      return res.status(400).json({ error: 'You are not following this user' });
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Get users that the current user is following
export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
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
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ error: 'Failed to get following list' });
  }
};

// Get followers of the current user
export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
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

    // Check if current user follows back each follower
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
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Failed to get followers list' });
  }
};

// Check if current user is following a specific user
export const checkFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
};

// Get follow counts for a user
export const getFollowCounts = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    res.json({
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error('Error getting follow counts:', error);
    res.status(500).json({ error: 'Failed to get follow counts' });
  }
};

// Get suggested users to follow (based on credibility/activity)
export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get users that current user is already following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Get active users with most helpful votes who aren't followed yet
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
      take: limit * 2, // Get more to filter
    });

    // Calculate total helpful votes for each user and sort
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

    // Sort by helpful count and posts count
    usersWithScore.sort((a, b) => {
      if (b.helpfulCount !== a.helpfulCount) {
        return b.helpfulCount - a.helpfulCount;
      }
      return b.postsCount - a.postsCount;
    });

    res.json({ users: usersWithScore.slice(0, limit) });
  } catch (error) {
    console.error('Error getting suggested users:', error);
    res.status(500).json({ error: 'Failed to get suggested users' });
  }
};
