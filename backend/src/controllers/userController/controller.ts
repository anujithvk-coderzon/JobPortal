import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generateProfilePhotoFilename,
  generateResumeFilename,
} from '../../utils/bunnyStorage';
import { cacheInvalidatePattern } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../errors/AppError';
import {
  AddSkillValidation,
  AddExperienceValidation,
  AddEducationValidation,
  ProfilePhotoValidation,
  ResumeValidation,
  formatZodErrors,
} from '../../helper/validation';

const USER_ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  USER_ID_REQUIRED: 'User ID is required',
  USER_NOT_FOUND: 'User not found',
  IMAGE_REQUIRED: 'Image data is required',
  NO_PROFILE_PHOTO: 'No profile photo to delete',
  FILE_REQUIRED: 'File data is required',
  NO_RESUME: 'No resume to delete',
  UPLOAD_FAILED: 'Failed to upload image',
  RESUME_UPLOAD_FAILED: 'Failed to upload resume',
  DEPRECATED: 'This endpoint is deprecated. Please use /api/companies endpoints instead.',
} as const;

// Calculate profile completion score
const calculateCompletionScore = (profile: any, user: any): number => {
  let score = 20; // Base score

  if (user.profilePhoto) score += 10;
  if (profile.bio) score += 10;
  if (profile.resume) score += 15;
  if (profile.skills && profile.skills.length > 0) score += 15;
  if (profile.experiences && profile.experiences.length > 0) score += 15;
  if (profile.education && profile.education.length > 0) score += 15;

  return Math.min(score, 100);
};

// Helper function to recalculate and update completion score
const updateCompletionScore = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profilePhoto: true,
      profile: {
        include: {
          skills: true,
          experiences: true,
          education: true,
        },
      },
    },
  });

  if (!user || !user.profile) {
    return 20; // Base score
  }

  const completionScore = calculateCompletionScore(user.profile, user);

  await prisma.profile.update({
    where: { userId },
    data: { completionScore },
  });

  // Invalidate profile and match caches when profile changes
  await Promise.all([
    cacheInvalidatePattern(`user:profile:${userId}`),
    cacheInvalidatePattern(`user:public:${userId}:*`),
    cacheInvalidatePattern(`jobs:match:${userId}:*`),
    cacheInvalidatePattern(`dashboard:${userId}`),
  ]);

  return completionScore;
};

export const getProfile = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const userId = req.params.userId || req.user?.userId;

  if (!userId) {
    throw new BadRequestError(USER_ERRORS.USER_ID_REQUIRED);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { orderBy: { createdAt: 'desc' } },
          experiences: { orderBy: { startDate: 'desc' } },
          education: { orderBy: { startDate: 'desc' } },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError(USER_ERRORS.USER_NOT_FOUND);
  }

  // Calculate completion score if profile exists
  if (user.profile) {
    const completionScore = calculateCompletionScore(user.profile, user);

    // Update completion score in database if it changed
    if (user.profile.completionScore !== completionScore) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { completionScore },
      });
      user.profile.completionScore = completionScore;
    }
  }

  // If viewing another user's profile, apply privacy settings
  const isOwnProfile = req.user?.userId === userId;
  if (!isOwnProfile && user.profile && user.profile.privacySettings) {
    const privacy = user.profile.privacySettings as any;

    // Hide private fields
    if (!privacy.email) {
      user.email = '';
      user.phone = '';
    }
    if (!privacy.phone) user.phone = '';
    if (!privacy.location) user.location = '';
    if (!privacy.bio && user.profile) user.profile.bio = '';
    if (!privacy.skills && user.profile) user.profile.skills = [];
    if (!privacy.experience && user.profile) user.profile.experiences = [];
    if (!privacy.education && user.profile) user.profile.education = [];
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

export const getPublicProfile = asyncWrapper(async function (req: AuthRequest, res: Response) {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!userId) {
    throw new BadRequestError(USER_ERRORS.USER_ID_REQUIRED);
  }

  // Fetch user with profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          skills: { orderBy: { createdAt: 'desc' } },
          experiences: { orderBy: { startDate: 'desc' } },
          education: { orderBy: { startDate: 'desc' } },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError(USER_ERRORS.USER_NOT_FOUND);
  }

  // Apply privacy settings
  const isOwnProfile = req.user?.userId === userId;
  if (!isOwnProfile && user.profile && user.profile.privacySettings) {
    const privacy = user.profile.privacySettings as any;

    // Hide private fields
    if (!privacy.email) {
      user.email = '';
      user.phone = '';
    }
    if (!privacy.phone) user.phone = '';
    if (!privacy.location) user.location = '';
    if (!privacy.bio && user.profile) user.profile.bio = '';
    if (!privacy.skills && user.profile) user.profile.skills = [];
    if (!privacy.experience && user.profile) user.profile.experiences = [];
    if (!privacy.education && user.profile) user.profile.education = [];
  }

  // Fetch user's posts with pagination
  const [posts, totalPosts] = await Promise.all([
    prisma.jobNews.findMany({
      where: {
        userId,
        moderationStatus: 'APPROVED',
        isActive: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        companyName: true,
        location: true,
        createdAt: true,
        _count: {
          select: {
            helpfulVotes: true,
          },
        },
      },
    }),
    prisma.jobNews.count({
      where: {
        userId,
        moderationStatus: 'APPROVED',
        isActive: true,
      },
    }),
  ]);

  // Calculate total helpful marks (credibility score)
  const allPosts = await prisma.jobNews.findMany({
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

  const totalHelpfulMarks = allPosts.reduce(
    (sum, post) => sum + post._count.helpfulVotes,
    0
  );

  // Calculate credibility level
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

  // Transform posts to include helpfulCount
  const transformedPosts = posts.map((post) => ({
    ...post,
    helpfulCount: post._count.helpfulVotes,
    _count: undefined,
  }));

  return res.status(200).json({
    success: true,
    data: {
      user: {
        ...user,
        credibilityScore: {
          level: credibilityLevel,
          score: totalHelpfulMarks,
          nextLevel,
          nextLevelAt,
        },
      },
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      },
    },
  });
});

export const updateProfile = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { headline, bio, portfolioUrl, githubUrl, linkedinUrl, websiteUrl, interests } = req.body;

  // Validate interests if provided
  const validInterests = Array.isArray(interests)
    ? interests.filter((i: any) => typeof i === 'string' && i.trim()).map((i: string) => i.trim().toLowerCase())
    : undefined;

  // Get or create profile
  let profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
  });

  const profileData: any = {
    headline,
    bio,
    portfolioUrl,
    githubUrl,
    linkedinUrl,
    websiteUrl,
  };
  if (validInterests !== undefined) {
    profileData.interests = validInterests;
  }

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: req.user.userId,
        ...profileData,
      },
    });
  } else {
    profile = await prisma.profile.update({
      where: { userId: req.user.userId },
      data: profileData,
    });
  }

  // Fetch updated profile with related data
  const updatedProfile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
    include: {
      skills: true,
      experiences: true,
      education: true,
      user: {
        select: {
          profilePhoto: true,
        },
      },
    },
  });

  // Calculate and update completion score
  const completionScore = calculateCompletionScore(updatedProfile, updatedProfile?.user);
  await prisma.profile.update({
    where: { userId: req.user.userId },
    data: { completionScore },
  });

  return res.status(200).json({
    success: true,
    data: { ...updatedProfile, completionScore },
    message: 'Profile updated successfully',
  });
});

export const updateBasicInfo = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { name, phone, location } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.userId },
    data: {
      name,
      phone,
      location,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      location: true,
      profilePhoto: true,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { ...user, completionScore },
    message: 'Basic information updated successfully',
  });
});

// Skills Management
export const addSkill = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const validated = AddSkillValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { name, level } = req.body;

  // Ensure profile exists
  let profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: req.user.userId },
    });
  }

  const skill = await prisma.skill.create({
    data: {
      profileId: profile.id,
      name,
      level,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(201).json({
    success: true,
    data: { skill, completionScore },
    message: 'Skill added successfully',
  });
});

export const deleteSkill = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { skillId } = req.params;

  await prisma.skill.delete({
    where: { id: skillId },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { completionScore },
    message: 'Skill deleted successfully',
  });
});

// Experience Management
export const addExperience = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const validated = AddExperienceValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { title, company, location, startDate, endDate, current, description } = req.body;

  // Ensure profile exists
  let profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: req.user.userId },
    });
  }

  const experience = await prisma.experience.create({
    data: {
      profileId: profile.id,
      title,
      company,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current: current || false,
      description,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(201).json({
    success: true,
    data: { experience, completionScore },
    message: 'Experience added successfully',
  });
});

export const updateExperience = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { experienceId } = req.params;
  const { title, company, location, startDate, endDate, current, description } = req.body;

  const experience = await prisma.experience.update({
    where: { id: experienceId },
    data: {
      title,
      company,
      location,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : null,
      current,
      description,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { experience, completionScore },
    message: 'Experience updated successfully',
  });
});

export const deleteExperience = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { experienceId } = req.params;

  await prisma.experience.delete({
    where: { id: experienceId },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { completionScore },
    message: 'Experience deleted successfully',
  });
});

// Education Management
export const addEducation = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const validated = AddEducationValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { institution, degree, fieldOfStudy, startDate, endDate, current, grade, description } =
    req.body;

  // Ensure profile exists
  let profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: req.user.userId },
    });
  }

  const education = await prisma.education.create({
    data: {
      profileId: profile.id,
      institution,
      degree,
      fieldOfStudy,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      current: current || false,
      grade,
      description,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(201).json({
    success: true,
    data: { education, completionScore },
    message: 'Education added successfully',
  });
});

export const updateEducation = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { educationId } = req.params;
  const { institution, degree, fieldOfStudy, startDate, endDate, current, grade, description } =
    req.body;

  const education = await prisma.education.update({
    where: { id: educationId },
    data: {
      institution,
      degree,
      fieldOfStudy,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : null,
      current,
      grade,
      description,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { education, completionScore },
    message: 'Education updated successfully',
  });
});

export const deleteEducation = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { educationId } = req.params;

  await prisma.education.delete({
    where: { id: educationId },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { completionScore },
    message: 'Education deleted successfully',
  });
});

// Company Profile Management - DEPRECATED
// This endpoint is deprecated. Use /api/companies endpoints instead.
export const updateCompany = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  return res.status(410).json({
    success: false,
    error: USER_ERRORS.DEPRECATED,
    message: 'Company management has been moved to /api/companies. You can create multiple companies now.',
  });
});

// Profile Photo Management
export const uploadProfilePhoto = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const validated = ProfilePhotoValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { image, mimeType } = req.body;

  // Get current user to check for existing profile photo
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { profilePhoto: true },
  });

  // Delete old profile photo from Bunny if exists
  if (currentUser?.profilePhoto) {
    const oldFilename = extractFilenameFromUrl(currentUser.profilePhoto);
    if (oldFilename) {
      await deleteFromBunny(oldFilename);
    }
  }

  // Determine file extension from MIME type
  let extension = 'jpg';
  if (mimeType) {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    extension = mimeMap[mimeType] || 'jpg';
  }

  // Convert base64 to buffer
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique filename
  const filename = generateProfilePhotoFilename(req.user.userId, extension);

  // Upload to Bunny
  const uploadResult = await uploadToBunny(buffer, filename, mimeType || 'image/jpeg');

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      error: uploadResult.error || USER_ERRORS.UPLOAD_FAILED,
    });
  }

  // Update user profile photo URL in database
  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: { profilePhoto: uploadResult.url },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      location: true,
      profilePhoto: true,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { ...updatedUser, completionScore },
    message: 'Profile photo uploaded successfully',
  });
});

export const deleteProfilePhoto = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { profilePhoto: true },
  });

  if (!currentUser?.profilePhoto) {
    throw new BadRequestError(USER_ERRORS.NO_PROFILE_PHOTO);
  }

  // Delete from Bunny Storage
  const filename = extractFilenameFromUrl(currentUser.profilePhoto);
  if (filename) {
    await deleteFromBunny(filename);
  }

  // Update database
  const updatedUser = await prisma.user.update({
    where: { id: req.user.userId },
    data: { profilePhoto: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      location: true,
      profilePhoto: true,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { ...updatedUser, completionScore },
    message: 'Profile photo deleted successfully',
  });
});

// Resume Management
export const uploadResume = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const validated = ResumeValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { file, mimeType, fileName } = req.body;

  // Get or create profile
  let profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
    select: { resume: true },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { userId: req.user.userId },
      select: { resume: true },
    });
  }

  // Delete old resume from Bunny if exists
  if (profile?.resume) {
    const oldFilename = extractFilenameFromUrl(profile.resume);
    if (oldFilename) {
      await deleteFromBunny(oldFilename);
    }
  }

  // Determine file extension
  let extension = 'pdf';
  if (fileName) {
    const parts = fileName.split('.');
    extension = parts[parts.length - 1].toLowerCase();
  } else if (mimeType) {
    const mimeMap: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    extension = mimeMap[mimeType] || 'pdf';
  }

  // Convert base64 to buffer
  const base64Data = file.replace(/^data:.*?;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate unique filename
  const filename = generateResumeFilename(req.user.userId, extension);

  // Upload to Bunny
  const uploadResult = await uploadToBunny(
    buffer,
    filename,
    mimeType || 'application/pdf'
  );

  if (!uploadResult.success) {
    return res.status(500).json({
      success: false,
      error: uploadResult.error || USER_ERRORS.RESUME_UPLOAD_FAILED,
    });
  }

  // Update profile with resume URL
  const updatedProfile = await prisma.profile.update({
    where: { userId: req.user.userId },
    data: { resume: uploadResult.url },
    select: {
      resume: true,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { ...updatedProfile, completionScore },
    message: 'Resume uploaded successfully',
  });
});

export const deleteResume = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  // Get current profile
  const profile = await prisma.profile.findUnique({
    where: { userId: req.user.userId },
    select: { resume: true },
  });

  if (!profile?.resume) {
    throw new BadRequestError(USER_ERRORS.NO_RESUME);
  }

  // Delete from Bunny Storage
  const filename = extractFilenameFromUrl(profile.resume);
  if (filename) {
    await deleteFromBunny(filename);
  }

  // Update database
  const updatedProfile = await prisma.profile.update({
    where: { userId: req.user.userId },
    data: { resume: null },
    select: {
      resume: true,
    },
  });

  // Recalculate completion score
  const completionScore = await updateCompletionScore(req.user.userId);

  return res.status(200).json({
    success: true,
    data: { ...updatedProfile, completionScore },
    message: 'Resume deleted successfully',
  });
});

// Get user's own posts
export const getMyPosts = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    userId: req.user.userId,
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get posts with pagination
  const [posts, total] = await Promise.all([
    prisma.jobNews.findMany({
      where,
      include: {
        helpfulVotes: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.jobNews.count({ where }),
  ]);

  // Format posts
  const formattedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    companyName: post.companyName,
    location: post.location,
    source: post.source,
    externalLink: post.externalLink,
    poster: post.poster,
    video: post.video,
    isActive: post.isActive,
    helpfulCount: post.helpfulVotes.length,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));

  return res.status(200).json({
    success: true,
    posts: formattedPosts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Update Privacy Settings
export const updatePrivacySettings = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(USER_ERRORS.UNAUTHORIZED);
  }

  const { email, phone, location, bio, education, experience, skills } = req.body;

  const privacySettings = {
    email: !!email,
    phone: !!phone,
    location: !!location,
    bio: !!bio,
    education: !!education,
    experience: !!experience,
    skills: !!skills,
  };

  const profile = await prisma.profile.upsert({
    where: { userId: req.user.userId },
    update: { privacySettings },
    create: {
      userId: req.user.userId,
      privacySettings,
    },
  });

  return res.status(200).json({
    success: true,
    data: profile.privacySettings,
  });
});
