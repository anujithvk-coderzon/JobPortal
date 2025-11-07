import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Calculate profile completion score
const calculateCompletionScore = (profile: any, user: any): number => {
  let score = 20; // Base score

  if (user.profilePhoto) score += 10;
  if (profile.headline) score += 10;
  if (profile.bio) score += 10;
  if (profile.resume) score += 15;
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.experiences && profile.experiences.length > 0) score += 15;
  if (profile.education && profile.education.length > 0) score += 10;

  return Math.min(score, 100);
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        location: true,
        profilePhoto: true,
        createdAt: true,
        profile: {
          include: {
            skills: { orderBy: { createdAt: 'desc' } },
            experiences: { orderBy: { startDate: 'desc' } },
            education: { orderBy: { startDate: 'desc' } },
          },
        },
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
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

    return res.status(200).json({
      success: true,
      data: user,
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

    return res.status(201).json({
      success: true,
      data: skill,
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

    return res.status(200).json({
      success: true,
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

    return res.status(201).json({
      success: true,
      data: experience,
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

    return res.status(200).json({
      success: true,
      data: experience,
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

    return res.status(200).json({
      success: true,
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

    return res.status(201).json({
      success: true,
      data: education,
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

    return res.status(200).json({
      success: true,
      data: education,
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

    return res.status(200).json({
      success: true,
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

// Company Profile Management
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { name, website, industry, foundedYear, description, location } = req.body;

    const company = await prisma.company.upsert({
      where: { userId: req.user.userId },
      update: {
        name,
        website,
        industry,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        description,
        location,
      },
      create: {
        userId: req.user.userId,
        name,
        website,
        industry,
        foundedYear: foundedYear ? parseInt(foundedYear) : null,
        description,
        location,
      },
    });

    return res.status(200).json({
      success: true,
      data: company,
      message: 'Company profile updated successfully',
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update company profile',
    });
  }
};

