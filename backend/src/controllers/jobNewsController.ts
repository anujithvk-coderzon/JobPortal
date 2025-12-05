import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generatePosterFilename,
  uploadVideoToBunnyStream,
  deleteVideoFromBunnyStream,
} from '../utils/bunnyStorage';

export const createJobNews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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

    let posterUrl: string | undefined;
    let videoUrl: string | undefined;
    let videoId: string | undefined;

    // Handle poster upload
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

    // Handle video upload
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
        // If poster was uploaded but video fails, delete the poster
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
        isActive: false, // Post is inactive until approved by admin
        moderationStatus: 'PENDING', // Default to pending moderation
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

    return res.status(201).json({
      success: true,
      data: jobNews,
      message: 'Your post has been submitted successfully. It will be live shortly!',
    });
  } catch (error: any) {
    console.error('Create job news error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create job news',
    });
  }
};

export const getAllJobNews = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      followingOnly,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {
      isActive: true,
      isDeleted: false, // Exclude soft-deleted posts
      moderationStatus: 'APPROVED', // Only show approved posts
    };

    // Filter to only show posts from users the current user follows
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

    const [jobNews, total] = await Promise.all([
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
        },
      }),
      prisma.jobNews.count({ where }),
    ]);

    // Get unique user IDs to calculate credibility scores
    const userIds = [...new Set(jobNews.map(post => post.userId))];

    // Calculate credibility score for each user
    const userCredibilityMap = new Map();

    for (const userId of userIds) {
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

      userCredibilityMap.set(userId, {
        level: credibilityLevel,
        score: totalHelpfulMarks,
        nextLevel,
        nextLevelAt,
      });
    }

    // Map to add helpfulCount, credibilityScore, and isHelpful to each post
    const jobNewsWithCounts = jobNews.map((post) => ({
      ...post,
      helpfulCount: post._count.helpfulVotes,
      isHelpful: post.helpfulVotes && post.helpfulVotes.length > 0,
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
  } catch (error: any) {
    console.error('Get all job news error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job news',
    });
  }
};

export const getJobNewsById = async (req: AuthRequest, res: Response) => {
  try {
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

    if (!jobNews) {
      return res.status(404).json({
        success: false,
        error: 'Job news not found',
      });
    }

    // Check if post is approved and not deleted (unless it's the owner viewing their own post)
    const isOwner = jobNews.userId === req.user?.userId;
    if (!isOwner) {
      if (jobNews.moderationStatus !== 'APPROVED' || jobNews.isDeleted) {
        return res.status(404).json({
          success: false,
          error: 'Job news not found',
        });
      }
    }

    // Calculate helpful count and check if current user marked as helpful
    const helpfulCount = jobNews.helpfulVotes.length;
    const userHasMarkedHelpful = req.user
      ? jobNews.helpfulVotes.some(vote => vote.userId === req.user!.userId)
      : false;

    // Calculate credibility score for the post author
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

    // Remove helpfulVotes from response and add helpful metadata
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
  } catch (error: any) {
    console.error('Get job news by id error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job news details',
    });
  }
};

export const updateJobNews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const existingJobNews = await prisma.jobNews.findUnique({
      where: { id },
    });

    if (!existingJobNews) {
      return res.status(404).json({
        success: false,
        error: 'Job news not found',
      });
    }

    if (existingJobNews.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to update this job news',
      });
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

    let posterUrl = existingJobNews.poster;
    let videoUrl = existingJobNews.video;
    let videoId = existingJobNews.videoId;
    let videoRatio = existingJobNews.videoAspectRatio;

    // Handle poster removal
    if (removePoster && existingJobNews.poster) {
      const filename = extractFilenameFromUrl(existingJobNews.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
      posterUrl = null;
    }

    // Handle new poster upload
    if (poster && posterMimeType) {
      // Delete old poster if exists
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

    // Handle video removal
    if (removeVideo && existingJobNews.videoId) {
      await deleteVideoFromBunnyStream(existingJobNews.videoId);
      videoUrl = null;
      videoId = null;
      videoRatio = null;
    }

    // Handle new video upload
    if (video) {
      // Delete old video if exists
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

    return res.status(200).json({
      success: true,
      data: jobNews,
      message: 'Job news updated successfully',
    });
  } catch (error: any) {
    console.error('Update job news error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update job news',
    });
  }
};

export const deleteJobNews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.params;

    const existingJobNews = await prisma.jobNews.findUnique({
      where: { id },
    });

    if (!existingJobNews) {
      return res.status(404).json({
        success: false,
        error: 'Job news not found',
      });
    }

    if (existingJobNews.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to delete this job news',
      });
    }

    // Delete poster from Bunny Storage if exists
    if (existingJobNews.poster) {
      const filename = extractFilenameFromUrl(existingJobNews.poster);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    // Delete video from Bunny Stream if exists
    if (existingJobNews.videoId) {
      await deleteVideoFromBunnyStream(existingJobNews.videoId);
    }

    await prisma.jobNews.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Job news deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete job news error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job news',
    });
  }
};

export const getMyJobNews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { page = 1, limit = 10, search } = req.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause with search
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

    // Map to add helpfulCount to each post
    const jobNewsWithCounts = jobNews.map((post) => ({
      ...post,
      helpfulCount: post._count.helpfulVotes,
      _count: undefined, // Remove _count from response
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
  } catch (error: any) {
    console.error('Get my job news error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch your job news',
    });
  }
};

export const toggleHelpful = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { id } = req.params;

    // Check if post exists
    const jobNews = await prisma.jobNews.findUnique({
      where: { id },
    });

    if (!jobNews) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user already marked as helpful
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
      // Remove the vote
      await prisma.jobNewsHelpful.delete({
        where: {
          id: existingVote.id,
        },
      });
      isHelpful = false;
    } else {
      // Add the vote
      await prisma.jobNewsHelpful.create({
        data: {
          jobNewsId: id,
          userId: req.user.userId,
        },
      });
      isHelpful = true;
    }

    // Get updated count
    const helpfulCount = await prisma.jobNewsHelpful.count({
      where: { jobNewsId: id },
    });

    return res.status(200).json({
      success: true,
      data: {
        isHelpful,
        helpfulCount,
      },
      message: isHelpful ? 'Marked as helpful' : 'Unmarked as helpful',
    });
  } catch (error: any) {
    console.error('Toggle helpful error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update helpful status',
    });
  }
};
