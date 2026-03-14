import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import {
  uploadToBunny,
  deleteFromBunny,
  extractFilenameFromUrl,
  generateCompanyLogoFilename
} from '../../utils/bunnyStorage';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../errors/AppError';

const COMPANY_ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Company not found',
  NO_PERMISSION_ACCESS: 'You do not have permission to access this company',
  NO_PERMISSION_UPDATE: 'You do not have permission to update this company',
  NO_PERMISSION_DELETE: 'You do not have permission to delete this company',
  REQUIRED_FIELDS: 'All required fields must be provided',
  HAS_ACTIVE_JOBS: 'Cannot delete company with active job postings. Please delete or reassign jobs first.',
  NO_FILE: 'No file provided',
  NO_LOGO: 'Company has no logo to delete',
  UPLOAD_FAILED: 'Failed to upload logo',
} as const;

// Get all companies for the authenticated user
export const getUserCompanies = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
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
});

// Get a single company by ID
export const getCompanyById = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
  }

  const { companyId } = req.params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError(COMPANY_ERRORS.NOT_FOUND);
  }

  // Verify ownership
  if (company.userId !== req.user.userId) {
    throw new ForbiddenError(COMPANY_ERRORS.NO_PERMISSION_ACCESS);
  }

  return res.status(200).json({
    success: true,
    data: { company },
  });
});

// Create a new company
export const createCompany = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
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
    throw new BadRequestError(COMPANY_ERRORS.REQUIRED_FIELDS);
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
});

// Update a company
export const updateCompany = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
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
    throw new NotFoundError(COMPANY_ERRORS.NOT_FOUND);
  }

  if (existingCompany.userId !== req.user.userId) {
    throw new ForbiddenError(COMPANY_ERRORS.NO_PERMISSION_UPDATE);
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
});

// Delete a company
export const deleteCompany = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
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
    throw new NotFoundError(COMPANY_ERRORS.NOT_FOUND);
  }

  if (company.userId !== req.user.userId) {
    throw new ForbiddenError(COMPANY_ERRORS.NO_PERMISSION_DELETE);
  }

  // Check if company has active jobs
  if (company.jobs.length > 0) {
    throw new BadRequestError(COMPANY_ERRORS.HAS_ACTIVE_JOBS);
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
});

// Upload company logo
export const uploadCompanyLogo = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
  }

  const { companyId } = req.params;
  const { file, mimeType } = req.body;

  if (!file) {
    throw new BadRequestError(COMPANY_ERRORS.NO_FILE);
  }

  // Check if company exists and user owns it
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError(COMPANY_ERRORS.NOT_FOUND);
  }

  if (company.userId !== req.user.userId) {
    throw new ForbiddenError(COMPANY_ERRORS.NO_PERMISSION_UPDATE);
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
      error: COMPANY_ERRORS.UPLOAD_FAILED,
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
});

// Delete company logo
export const deleteCompanyLogo = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) {
    throw new UnauthorizedError(COMPANY_ERRORS.UNAUTHORIZED);
  }

  const { companyId } = req.params;

  // Check if company exists and user owns it
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new NotFoundError(COMPANY_ERRORS.NOT_FOUND);
  }

  if (company.userId !== req.user.userId) {
    throw new ForbiddenError(COMPANY_ERRORS.NO_PERMISSION_UPDATE);
  }

  if (!company.logo) {
    throw new BadRequestError(COMPANY_ERRORS.NO_LOGO);
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
});
