import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import crypto from 'crypto';
import { generateVerificationCode, sendVerificationCode, sendWelcomeEmail } from '../services/emailService';
import { storeVerificationCode, verifyCode, deleteVerificationCode, hasVerificationCode } from '../services/verificationStore';

// Request verification code for registration
export const requestVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email, password, name, mobile } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Check if there's already a pending verification for this email
    // Allow resend if explicitly requested (after 60 seconds)
    if (hasVerificationCode(email)) {
      const allowResend = req.body.resend === true;
      if (!allowResend) {
        return res.status(400).json({
          success: false,
          error: 'Verification code already sent. Please check your email or wait before requesting a new one.',
          canResend: true, // Tell frontend they can resend
        });
      }
      // Clear the old code to allow resend
      deleteVerificationCode(email);
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store verification code with user data
    storeVerificationCode(email, code, { name, password, mobile });

    // Send verification email
    const emailSent = await sendVerificationCode({ email, name, code });

    if (!emailSent) {
      // Clean up stored code if email failed to send
      deleteVerificationCode(email);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Request verification code error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification code',
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, verificationCode } = req.body;

    // Validate required fields
    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required',
      });
    }

    // Verify the code
    const verificationData = verifyCode(email, verificationCode);

    if (!verificationData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code',
      });
    }

    // Check if user already exists (double-check)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      deleteVerificationCode(email);
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password from verification data
    const hashedPassword = await hashPassword(verificationData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: verificationData.email,
        password: hashedPassword,
        name: verificationData.name,
        phone: verificationData.mobile || null,
        location: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        createdAt: true,
      },
    });

    // Create profile for all users
    await prisma.profile.create({
      data: {
        userId: user.id,
        completionScore: 20, // Base score for registration
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Delete verification code after successful registration
    deleteVerificationCode(email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if welcome email fails
    });

    return res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phone: true,
        location: true,
        profilePhoto: true,
        isBlocked: true,
        isDeleted: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deleted. Please try registering with another email.',
        code: 'USER_DELETED',
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked by the admin. Please contact support.',
        code: 'USER_BLOCKED',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Remove password, isBlocked, isDeleted from response
    const { password: _, isBlocked, isDeleted, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        profilePhoto: true,
        createdAt: true,
        profile: {
          include: {
            skills: true,
            experiences: true,
            education: true,
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

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
    });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update password',
    });
  }
};

// Google Sign-In for Registration
export const googleRegister = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId, profilePhoto, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists. Please use the login page.',
        isRegistered: true,
      });
    }

    // Generate a random password for Google users (they won't use it)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        location: location || null,
        profilePhoto: profilePhoto || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        profilePhoto: true,
        createdAt: true,
      },
    });

    // Create profile for all users
    await prisma.profile.create({
      data: {
        userId: user.id,
        completionScore: 30, // Higher base score for Google users with profile photo
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if welcome email fails
    });

    return res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'User registered successfully with Google',
    });
  } catch (error: any) {
    console.error('Google registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register user with Google',
    });
  }
};

// Google Sign-In for Login
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId, profilePhoto } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        profilePhoto: true,
        isBlocked: true,
        isDeleted: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email. Please register first.',
        isRegistered: false,
      });
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deleted. Please try registering with another email.',
        code: 'USER_DELETED',
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked by the admin. Please contact support.',
        code: 'USER_BLOCKED',
      });
    }

    // Update profile photo if not set
    if (!user.profilePhoto && profilePhoto) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profilePhoto },
      });
      user.profilePhoto = profilePhoto;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Remove isBlocked and isDeleted from response
    const { isBlocked, isDeleted, ...userWithoutSensitiveData } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutSensitiveData,
        token,
      },
      message: 'Login successful with Google',
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to login with Google',
    });
  }
};
