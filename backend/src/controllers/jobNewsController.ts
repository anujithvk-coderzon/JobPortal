import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

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
    } = req.body;

    const jobNews = await prisma.jobNews.create({
      data: {
        userId: req.user.userId,
        title,
        description,
        companyName,
        location,
        source,
        externalLink,
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
      message: 'Job news posted successfully',
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
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {
      isActive: true,
    };

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

    // Calculate helpful count and check if current user marked as helpful
    const helpfulCount = jobNews.helpfulVotes.length;
    const userHasMarkedHelpful = req.user
      ? jobNews.helpfulVotes.some(vote => vote.userId === req.user!.userId)
      : false;

    // Remove helpfulVotes from response and add helpful metadata
    const { helpfulVotes, ...jobNewsData } = jobNews;

    return res.status(200).json({
      success: true,
      data: {
        ...jobNewsData,
        helpfulCount,
        userHasMarkedHelpful,
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
    } = req.body;

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
      }),
      prisma.jobNews.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobNews,
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
