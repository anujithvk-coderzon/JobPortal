import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';

// ONE-TIME SETUP: Create first admin
// This endpoint can only be used when NO admins exist in the database
export const createFirstAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Check if ANY admin exists (this endpoint only works for first admin)
    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        error: 'Setup already completed. Admin accounts exist. Use the admin creation API or CLI script instead.',
      });
    }

    // Check if admin with email already exists (extra safety)
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create first SUPER_ADMIN
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin',
        role: 'SUPER_ADMIN',
      },
    });

    console.log('\n🎉 First admin created successfully!');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🆔 Admin ID:', admin.id);
    console.log('⚠️  This setup endpoint is now disabled.\n');

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

    return res.status(201).json({
      success: true,
      data: adminWithoutPassword,
      message: 'First admin created successfully. This setup endpoint is now disabled.',
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create first admin',
    });
  }
};

// Check if setup is needed
export const checkSetupStatus = async (req: Request, res: Response) => {
  try {
    const adminCount = await prisma.admin.count();

    return res.status(200).json({
      success: true,
      data: {
        setupRequired: adminCount === 0,
        adminCount: adminCount,
        message: adminCount === 0
          ? 'Setup required. No admin accounts exist.'
          : 'Setup completed. Admin accounts exist.',
      },
    });
  } catch (error: any) {
    console.error('Check setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check setup status',
    });
  }
};
