import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generateProfilePhotoFilename,
  generateResumeFilename,
} from '../utils/bunnyStorage';

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

  return completionScore;
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
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
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
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

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { headline, bio, portfolioUrl, githubUrl, linkedinUrl, websiteUrl } = req.body;

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: req.user.userId,
          headline,
          bio,
          portfolioUrl,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        },
      });
    } else {
      profile = await prisma.profile.update({
        where: { userId: req.user.userId },
        data: {
          headline,
          bio,
          portfolioUrl,
          githubUrl,
          linkedinUrl,
          websiteUrl,
        },
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
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

export const updateBasicInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Update basic info error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update basic information',
    });
  }
};

// Skills Management
export const addSkill = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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
  } catch (error: any) {
    console.error('Add skill error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add skill',
    });
  }
};

export const deleteSkill = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Delete skill error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete skill',
    });
  }
};

// Experience Management
export const addExperience = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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
  } catch (error: any) {
    console.error('Add experience error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add experience',
    });
  }
};

export const updateExperience = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Update experience error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update experience',
    });
  }
};

export const deleteExperience = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Delete experience error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete experience',
    });
  }
};

// Education Management
export const addEducation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

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
  } catch (error: any) {
    console.error('Add education error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add education',
    });
  }
};

export const updateEducation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Update education error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update education',
    });
  }
};

export const deleteEducation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
  } catch (error: any) {
    console.error('Delete education error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete education',
    });
  }
};

// Company Profile Management - DEPRECATED
// This endpoint is deprecated. Use /api/companies endpoints instead.
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    return res.status(410).json({
      success: false,
      error: 'This endpoint is deprecated. Please use /api/companies endpoints instead.',
      message: 'Company management has been moved to /api/companies. You can create multiple companies now.',
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update company profile',
    });
  }
};

// Profile Photo Management
export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required',
      });
    }

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
        error: uploadResult.error || 'Failed to upload image',
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
  } catch (error: any) {
    console.error('Upload profile photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload profile photo',
    });
  }
};

export const deleteProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { profilePhoto: true },
    });

    if (!currentUser?.profilePhoto) {
      return res.status(400).json({
        success: false,
        error: 'No profile photo to delete',
      });
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
  } catch (error: any) {
    console.error('Delete profile photo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete profile photo',
    });
  }
};

// Resume Management
export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { file, mimeType, fileName } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'File data is required',
      });
    }

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
        error: uploadResult.error || 'Failed to upload resume',
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
  } catch (error: any) {
    console.error('Upload resume error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload resume',
    });
  }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get current profile
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.userId },
      select: { resume: true },
    });

    if (!profile?.resume) {
      return res.status(400).json({
        success: false,
        error: 'No resume to delete',
      });
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
  } catch (error: any) {
    console.error('Delete resume error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete resume',
    });
  }
};

