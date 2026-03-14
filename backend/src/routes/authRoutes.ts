import express from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
  googleRegister,
  googleLogin,
  requestVerificationCode,
  requestPasswordReset,
  resetPassword,
  refreshAccessToken,
  logout,
  logoutAll,
} from '../controllers/authController/controller';
import { authenticate } from '../middleware/auth';
import { authLimiter, verificationLimiter, passwordLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Request verification code
router.post(
  '/request-verification-code',
  verificationLimiter,
  requestVerificationCode
);

// Register (with verification code)
router.post(
  '/register',
  authLimiter,
  register
);

// Login
router.post(
  '/login',
  authLimiter,
  login
);

// Refresh access token (refresh token comes from httpOnly cookie)
router.post('/refresh-token', refreshAccessToken);

// Get current user
router.get('/me', authenticate, getMe);

// Update password
router.put(
  '/password',
  authenticate,
  passwordLimiter,
  updatePassword
);

// Forgot password - request reset code
router.post(
  '/forgot-password',
  verificationLimiter,
  requestPasswordReset
);

// Reset password with code
router.post(
  '/reset-password',
  passwordLimiter,
  resetPassword
);

// Logout (revoke current refresh token)
router.post('/logout', authenticate, logout);

// Logout from all devices
router.post('/logout-all', authenticate, logoutAll);

// Google Sign-In for Registration
router.post(
  '/google/register',
  authLimiter,
  googleRegister
);

// Google Sign-In for Login
router.post(
  '/google/login',
  authLimiter,
  googleLogin
);

export default router;
