import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '../utils/jwt';
import { AuthRequest } from '../types';
import crypto from 'crypto';
import { generateVerificationCode, sendVerificationCode, sendWelcomeEmail, sendPasswordResetCode } from '../services/emailService';
import { storeVerificationCode, verifyCode, deleteVerificationCode, hasVerificationCode } from '../services/verificationStore';
import { cacheInvalidate, cacheSet, cacheGetDirect, cacheDel, cacheExists, CacheKeys, TTL } from '../utils/cache';

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// Helper to generate both tokens and return auth response
const generateAuthTokens = async (userId: string, email: string) => {
  const accessToken = generateToken({ userId, email });
  const refreshToken = await generateRefreshToken({ userId, email });
  return { accessToken, refreshToken };
};

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
    if (await hasVerificationCode(email)) {
      const allowResend = req.body.resend === true;
      if (!allowResend) {
        return res.status(400).json({
          success: false,
          error: 'Verification code already sent. Please check your email or wait before requesting a new one.',
          canResend: true, // Tell frontend they can resend
        });
      }
      // Clear the old code to allow resend
      await deleteVerificationCode(email);
    }

    // Generate verification code
    const code = generateVerificationCode();

    // Store verification code with user data
    await storeVerificationCode(email, code, { name, password, mobile });

    // Send verification email
    const emailSent = await sendVerificationCode({ email, name, code });

    if (!emailSent) {
      // Clean up stored code if email failed to send
      await deleteVerificationCode(email);
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
    const verificationData = await verifyCode(email, verificationCode);

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
      await deleteVerificationCode(email);
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

    // Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, user.email);

    // Delete verification code after successful registration
    await deleteVerificationCode(email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      data: {
        user,
        token: accessToken,
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

    // Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, user.email);

    // Remove password, isBlocked, isDeleted from response
    const { password: _, isBlocked, isDeleted, ...userWithoutPassword } = user;

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: accessToken,
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

    // Revoke all refresh tokens — forces re-login on all devices
    await revokeAllUserRefreshTokens(req.user.userId);

    // Generate new tokens for the current session
    const { accessToken, refreshToken } = await generateAuthTokens(
      req.user.userId,
      req.user.email
    );

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        token: accessToken,
      },
      message: 'Password updated successfully. You have been logged out from all other devices.',
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update password',
    });
  }
};

// Refresh token endpoint — get new access token using refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify the refresh token exists in Redis (extracts userId from stored data)
    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token. Please login again.',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    // Check if user still exists and is not blocked
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isBlocked: true, isDeleted: true },
    });

    if (!user || user.isDeleted) {
      await revokeAllUserRefreshTokens(payload.userId);
      return res.status(403).json({
        success: false,
        error: 'User account not found.',
        code: 'USER_DELETED',
      });
    }

    if (user.isBlocked) {
      await revokeAllUserRefreshTokens(payload.userId);
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked. Please contact support.',
        code: 'USER_BLOCKED',
      });
    }

    // Rotate: delete old refresh token, create new one
    const newRefreshToken = await rotateRefreshToken(refreshToken, {
      userId: user.id,
      email: user.email,
    });

    if (!newRefreshToken) {
      // Token reuse detected — all tokens revoked
      return res.status(401).json({
        success: false,
        error: 'Security alert: refresh token reuse detected. All sessions have been logged out. Please login again.',
        code: 'REFRESH_TOKEN_REUSE',
      });
    }

    // Generate new access token
    const newAccessToken = generateToken({ userId: user.id, email: user.email });

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        token: newAccessToken,
      },
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
};

// Logout — revoke the refresh token
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }

    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken, req.user.userId);
    }

    // Clear auth cache
    await cacheInvalidate(CacheKeys.userAuth(req.user.userId));

    res.clearCookie('refreshToken', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
};

// Logout from all devices — revoke all refresh tokens
export const logoutAll = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    await revokeAllUserRefreshTokens(req.user.userId);
    await cacheInvalidate(CacheKeys.userAuth(req.user.userId));

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error: any) {
    console.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices',
    });
  }
};

// Request password reset code
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.',
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isBlocked: true, isDeleted: true },
    });

    if (!user || user.isBlocked || user.isDeleted) {
      return res.status(200).json(successResponse);
    }

    // Check if there's already a pending reset code
    if (await cacheExists(CacheKeys.passwordReset(email))) {
      const allowResend = req.body.resend === true;
      if (!allowResend) {
        return res.status(400).json({
          success: false,
          error: 'Reset code already sent. Please check your email or wait before requesting a new one.',
          canResend: true,
        });
      }
      await cacheDel(CacheKeys.passwordReset(email));
    }

    // Generate and store reset code
    const code = generateVerificationCode();
    await cacheSet(
      CacheKeys.passwordReset(email),
      { code, email, expiresAt: Date.now() + 10 * 60 * 1000 },
      TTL.VERIFICATION
    );

    // Send reset code email
    const emailSent = await sendPasswordResetCode({ email, name: user.name, code });

    if (!emailSent) {
      await cacheDel(CacheKeys.passwordReset(email));
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again.',
      });
    }

    return res.status(200).json(successResponse);
  } catch (error: any) {
    console.error('Request password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
    });
  }
};

// Reset password with code
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, code, and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    // Verify the reset code
    const data = await cacheGetDirect<{ code: string; email: string; expiresAt: number }>(
      CacheKeys.passwordReset(email)
    );

    if (!data || data.code !== code || data.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code',
      });
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens (log out all devices)
    await revokeAllUserRefreshTokens(user.id);

    // Clean up reset code
    await cacheDel(CacheKeys.passwordReset(email));

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
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

    // Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, user.email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email,
      name: user.name,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      data: {
        user,
        token: accessToken,
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

    // Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user.id, user.email);

    // Remove isBlocked and isDeleted from response
    const { isBlocked, isDeleted, ...userWithoutSensitiveData } = user;

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutSensitiveData,
        token: accessToken,
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
