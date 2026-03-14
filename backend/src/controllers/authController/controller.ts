import { Request, Response } from 'express';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '../../utils/jwt';
import { AuthRequest } from '../../types';
import crypto from 'crypto';
import { generateVerificationCode, sendVerificationCode, sendWelcomeEmail, sendPasswordResetCode } from '../../services/emailService';
import { storeVerificationCode, verifyCode, deleteVerificationCode, hasVerificationCode } from '../../services/verificationStore';
import { cacheInvalidate, cacheSet, cacheGetDirect, cacheDel, cacheExists, CacheKeys, TTL } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../errors/AppError';
import {
  RequestVerificationCodeValidation,
  RegisterValidation,
  LoginValidation,
  UpdatePasswordValidation,
  ForgotPasswordValidation,
  ResetPasswordValidation,
  GoogleRegisterValidation,
  GoogleLoginValidation,
  formatZodErrors,
} from '../../helper/validation';

const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_BLOCKED: 'Your account has been blocked by the admin. Please contact support.',
  USER_DELETED: 'Your account has been deleted. Please try registering with another email.',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized',
  EMAIL_EXISTS: 'User with this email already exists',
  VERIFICATION_ALREADY_SENT: 'Verification code already sent. Please check your email or wait before requesting a new one.',
  INVALID_VERIFICATION_CODE: 'Invalid or expired verification code',
  EMAIL_SEND_FAILED: 'Failed to send verification email. Please try again.',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token. Please login again.',
  REFRESH_TOKEN_REUSE: 'Security alert: refresh token reuse detected. All sessions have been logged out. Please login again.',
  USER_ACCOUNT_NOT_FOUND: 'User account not found.',
  RESET_ALREADY_SENT: 'Reset code already sent. Please check your email or wait before requesting a new one.',
  RESET_EMAIL_FAILED: 'Failed to send reset email. Please try again.',
  INVALID_RESET_CODE: 'Invalid or expired reset code',
  GOOGLE_EMAIL_EXISTS: 'User with this email already exists. Please use the login page.',
  GOOGLE_NOT_REGISTERED: 'No account found with this email. Please register first.',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
} as const;

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
export const requestVerificationCode = asyncWrapper(async (req: Request, res: Response) => {
  const validated = RequestVerificationCodeValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, password, name, mobile, resend } = validated.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new BadRequestError(AUTH_ERRORS.EMAIL_EXISTS);
  }

  // Check if there's already a pending verification for this email
  if (await hasVerificationCode(email)) {
    const allowResend = resend === true;
    if (!allowResend) {
      return res.status(400).json({
        success: false,
        error: AUTH_ERRORS.VERIFICATION_ALREADY_SENT,
        canResend: true,
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
    throw new BadRequestError(AUTH_ERRORS.EMAIL_SEND_FAILED);
  }

  return res.status(200).json({
    success: true,
    message: 'Verification code sent to your email. Please check your inbox.',
  });
});

export const register = asyncWrapper(async (req: Request, res: Response) => {
  const validated = RegisterValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, verificationCode } = validated.data;

  // Verify the code
  const verificationData = await verifyCode(email, verificationCode);

  if (!verificationData) {
    throw new BadRequestError(AUTH_ERRORS.INVALID_VERIFICATION_CODE);
  }

  // Check if user already exists (double-check)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await deleteVerificationCode(email);
    throw new BadRequestError(AUTH_ERRORS.EMAIL_EXISTS);
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
});

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const validated = LoginValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, password } = validated.data;

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
    throw new UnauthorizedError(AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  // Check if user is deleted
  if (user.isDeleted) {
    throw new ForbiddenError(AUTH_ERRORS.USER_DELETED, 'USER_DELETED');
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw new ForbiddenError(AUTH_ERRORS.USER_BLOCKED, 'USER_BLOCKED');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError(AUTH_ERRORS.INVALID_CREDENTIALS);
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
});

export const getMe = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
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
    throw new NotFoundError(AUTH_ERRORS.USER_NOT_FOUND);
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
});

export const updatePassword = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
  }

  const validated = UpdatePasswordValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { currentPassword, newPassword } = validated.data;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { password: true },
  });

  if (!user) {
    throw new NotFoundError(AUTH_ERRORS.USER_NOT_FOUND);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError(AUTH_ERRORS.CURRENT_PASSWORD_INCORRECT);
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
});

// Refresh token endpoint — get new access token using refresh token
export const refreshAccessToken = asyncWrapper(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new BadRequestError(AUTH_ERRORS.REFRESH_TOKEN_REQUIRED);
  }

  // Verify the refresh token exists in Redis (extracts userId from stored data)
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: AUTH_ERRORS.REFRESH_TOKEN_INVALID,
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
      error: AUTH_ERRORS.USER_ACCOUNT_NOT_FOUND,
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
    return res.status(401).json({
      success: false,
      error: AUTH_ERRORS.REFRESH_TOKEN_REUSE,
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
});

// Logout — revoke the refresh token
export const logout = asyncWrapper(async (req: AuthRequest, res: Response) => {
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
});

// Logout from all devices — revoke all refresh tokens
export const logoutAll = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError(AUTH_ERRORS.UNAUTHORIZED);
  }

  await revokeAllUserRefreshTokens(req.user.userId);
  await cacheInvalidate(CacheKeys.userAuth(req.user.userId));

  return res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

// Request password reset code
export const requestPasswordReset = asyncWrapper(async (req: Request, res: Response) => {
  const validated = ForgotPasswordValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, resend } = validated.data;

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
    const allowResend = resend === true;
    if (!allowResend) {
      return res.status(400).json({
        success: false,
        error: AUTH_ERRORS.RESET_ALREADY_SENT,
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
    throw new BadRequestError(AUTH_ERRORS.RESET_EMAIL_FAILED);
  }

  return res.status(200).json(successResponse);
});

// Reset password with code
export const resetPassword = asyncWrapper(async (req: Request, res: Response) => {
  const validated = ResetPasswordValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, code, newPassword } = validated.data;

  // Verify the reset code
  const data = await cacheGetDirect<{ code: string; email: string; expiresAt: number }>(
    CacheKeys.passwordReset(email)
  );

  if (!data || data.code !== code || data.expiresAt < Date.now()) {
    throw new BadRequestError(AUTH_ERRORS.INVALID_RESET_CODE);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new BadRequestError(AUTH_ERRORS.INVALID_RESET_CODE);
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
});

// Google Sign-In for Registration
export const googleRegister = asyncWrapper(async (req: Request, res: Response) => {
  const validated = GoogleRegisterValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, name, profilePhoto, phone, location } = validated.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: AUTH_ERRORS.GOOGLE_EMAIL_EXISTS,
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
});

// Google Sign-In for Login
export const googleLogin = asyncWrapper(async (req: Request, res: Response) => {
  const validated = GoogleLoginValidation.safeParse(req.body);
  if (!validated.success) return res.status(400).json(formatZodErrors(validated.error));

  const { email, profilePhoto } = validated.data;

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
      error: AUTH_ERRORS.GOOGLE_NOT_REGISTERED,
      isRegistered: false,
    });
  }

  // Check if user is deleted
  if (user.isDeleted) {
    throw new ForbiddenError(AUTH_ERRORS.USER_DELETED, 'USER_DELETED');
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw new ForbiddenError(AUTH_ERRORS.USER_BLOCKED, 'USER_BLOCKED');
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
});
