import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generateCompanyLogoFilename
} from '../utils/bunnyStorage';

// Get all companies for the authenticated user
export const getUserCompanies = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const companies = await prisma.company.findMany({
      where: {
        userId: req.user.userId,
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: { companies },
    });
  } catch (error: any) {
    console.error('Get user companies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch companies',
    });
  }
};

// Get a single company by ID
export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Verify ownership
    if (company.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this company',
      });
    }

    return res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error: any) {
    console.error('Get company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company',
    });
  }
};

// Create a new company
export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const {
      name,
      location,
      pinCode,
      contactEmail,
      contactPhone,
      logo,
      website,
      industry,
      about,
      companySize,
      foundedYear,
      linkedIn,
      twitter,
      facebook,
    } = req.body;

    // Validate required fields
    if (!name || !location || !pinCode || !contactEmail || !contactPhone) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided',
      });
    }

    const company = await prisma.company.create({
      data: {
        userId: req.user.userId,
        name,
        location,
        pinCode,
        contactEmail,
        contactPhone,
        logo: logo || undefined,
        website: website || undefined,
        industry: industry || undefined,
        about: about || undefined,
        companySize: companySize || undefined,
        foundedYear: foundedYear ? parseInt(foundedYear) : undefined,
        linkedIn: linkedIn || undefined,
        twitter: twitter || undefined,
        facebook: facebook || undefined,
      },
    });

    return res.status(201).json({
      success: true,
      data: { company },
      message: 'Company created successfully',
    });
  } catch (error: any) {
    console.error('Create company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create company',
    });
  }
};

// Update a company
export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { companyId } = req.params;
    const {
      name,
      location,
      pinCode,
      contactEmail,
      contactPhone,
      logo,
      website,
      industry,
      about,
      companySize,
      foundedYear,
      linkedIn,
      twitter,
      facebook,
    } = req.body;

    // Check if company exists and user owns it
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    if (existingCompany.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this company',
      });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name || existingCompany.name,
        location: location || existingCompany.location,
        pinCode: pinCode || existingCompany.pinCode,
        contactEmail: contactEmail || existingCompany.contactEmail,
        contactPhone: contactPhone || existingCompany.contactPhone,
        logo: logo !== undefined ? logo : existingCompany.logo,
        website: website !== undefined ? website : existingCompany.website,
        industry: industry !== undefined ? industry : existingCompany.industry,
        about: about !== undefined ? about : existingCompany.about,
        companySize: companySize !== undefined ? companySize : existingCompany.companySize,
        foundedYear: foundedYear !== undefined ? (foundedYear ? parseInt(foundedYear) : null) : existingCompany.foundedYear,
        linkedIn: linkedIn !== undefined ? linkedIn : existingCompany.linkedIn,
        twitter: twitter !== undefined ? twitter : existingCompany.twitter,
        facebook: facebook !== undefined ? facebook : existingCompany.facebook,
      },
    });

    return res.status(200).json({
      success: true,
      data: { company },
      message: 'Company updated successfully',
    });
  } catch (error: any) {
    console.error('Update company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update company',
    });
  }
};

// Delete a company
export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { companyId } = req.params;

    // Check if company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        jobs: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    if (company.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this company',
      });
    }

    // Check if company has active jobs
    if (company.jobs.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete company with active job postings. Please delete or reassign jobs first.',
      });
    }

    // Delete logo from Bunny if exists
    if (company.logo) {
      const filename = extractFilenameFromUrl(company.logo);
      if (filename) {
        await deleteFromBunny(filename);
      }
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete company error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete company',
    });
  }
};

// Upload company logo
export const uploadCompanyLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { companyId } = req.params;
    const { file, mimeType } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Check if company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    if (company.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this company',
      });
    }

    // Delete old logo if exists
    if (company.logo) {
      const oldFilename = extractFilenameFromUrl(company.logo);
      if (oldFilename) {
        await deleteFromBunny(oldFilename);
      }
    }

    // Upload new logo
    const buffer = Buffer.from(file, 'base64');
    const extension = mimeType.split('/')[1] || 'png';
    const filename = generateCompanyLogoFilename(companyId, extension);

    const uploadResult = await uploadToBunny(buffer, filename, mimeType);

    if (!uploadResult.success || !uploadResult.url) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload logo',
      });
    }

    // Update company with new logo URL
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { logo: uploadResult.url },
    });

    return res.status(200).json({
      success: true,
      data: { company: updatedCompany },
      message: 'Logo uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload company logo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload logo',
    });
  }
};

// Delete company logo
export const deleteCompanyLogo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { companyId } = req.params;

    // Check if company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    if (company.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this company',
      });
    }

    if (!company.logo) {
      return res.status(400).json({
        success: false,
        error: 'Company has no logo to delete',
      });
    }

    // Delete logo from Bunny
    const filename = extractFilenameFromUrl(company.logo);
    if (filename) {
      await deleteFromBunny(filename);
    }

    // Update company to remove logo URL
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { logo: null },
    });

    return res.status(200).json({
      success: true,
      data: { company: updatedCompany },
      message: 'Logo deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete company logo error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete logo',
    });
  }
};
