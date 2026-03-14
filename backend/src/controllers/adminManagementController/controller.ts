import { Response } from 'express';
import prisma from '../../config/database';
import { hashPassword } from '../../utils/password';
import { AuthRequest } from '../../types';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../errors/AppError';

const ERRORS = {
  NOT_SUPER_ADMIN_CREATE: 'Only Super Admins can create new admin accounts',
  MISSING_FIELDS: 'Email, password, and name are required',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  ADMIN_EXISTS: 'Admin with this email already exists',
  NOT_SUPER_ADMIN_VIEW: 'Only Super Admins can view all admins',
  NOT_SUPER_ADMIN_DEACTIVATE: 'Only Super Admins can deactivate admins',
  CANNOT_DEACTIVATE_SELF: 'Cannot deactivate your own account',
  ADMIN_NOT_FOUND: 'Admin not found',
  CANNOT_DEACTIVATE_SUPER: 'Cannot deactivate a Super Admin account',
  NOT_SUPER_ADMIN_DELETE: 'Only Super Admins can delete admins',
  CANNOT_DELETE_SELF: 'Cannot delete your own account',
  CANNOT_DELETE_SUPER: 'Cannot delete a Super Admin account',
  NOT_SUPER_ADMIN_ACTIVATE: 'Only Super Admins can activate admins',
} as const;

// Create new admin (only SUPER_ADMIN can create)
export const createNewAdmin = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(ERRORS.NOT_SUPER_ADMIN_CREATE);
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) throw new BadRequestError(ERRORS.MISSING_FIELDS);
  if (password.length < 6) throw new BadRequestError(ERRORS.PASSWORD_TOO_SHORT);

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) throw new ConflictError(ERRORS.ADMIN_EXISTS);

  const hashedPassword = await hashPassword(password);

  const newAdmin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'MODERATOR',
    },
  });

  const { password: _, ...adminWithoutPassword } = newAdmin;

  return res.status(201).json({
    success: true,
    data: adminWithoutPassword,
    message: 'Admin created successfully',
  });
});

// Get all admins
export const getAllAdmins = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(ERRORS.NOT_SUPER_ADMIN_VIEW);
  }

  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: admins,
  });
});

// Deactivate admin
export const deactivateAdmin = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(ERRORS.NOT_SUPER_ADMIN_DEACTIVATE);
  }

  const { adminId } = req.params;

  if (adminId === req.admin.adminId) throw new BadRequestError(ERRORS.CANNOT_DEACTIVATE_SELF);

  const targetAdmin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (!targetAdmin) throw new NotFoundError(ERRORS.ADMIN_NOT_FOUND);
  if (targetAdmin.role === 'SUPER_ADMIN') throw new ForbiddenError(ERRORS.CANNOT_DEACTIVATE_SUPER);

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: admin,
    message: 'Admin deactivated successfully',
  });
});

// Delete admin (only moderators can be deleted)
export const deleteAdmin = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(ERRORS.NOT_SUPER_ADMIN_DELETE);
  }

  const { adminId } = req.params;

  if (adminId === req.admin.adminId) throw new BadRequestError(ERRORS.CANNOT_DELETE_SELF);

  const targetAdmin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { role: true },
  });

  if (!targetAdmin) throw new NotFoundError(ERRORS.ADMIN_NOT_FOUND);
  if (targetAdmin.role === 'SUPER_ADMIN') throw new ForbiddenError(ERRORS.CANNOT_DELETE_SUPER);

  await prisma.admin.delete({
    where: { id: adminId },
  });

  return res.status(200).json({
    success: true,
    message: 'Admin deleted successfully',
  });
});

// Activate admin
export const activateAdmin = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(ERRORS.NOT_SUPER_ADMIN_ACTIVATE);
  }

  const { adminId } = req.params;

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: admin,
    message: 'Admin activated successfully',
  });
});
