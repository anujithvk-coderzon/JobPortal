import express from 'express';
import { body } from 'express-validator';
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
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authLimiter, verificationLimiter, passwordLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Request verification code
router.post(
  '/request-verification-code',
  verificationLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ]),
  requestVerificationCode
);

// Register (with verification code)
router.post(
  '/register',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('verificationCode')
      .isLength({ min: 4, max: 4 })
      .withMessage('Verification code must be 4 digits'),
  ]),
  register
);

// Login
router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
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
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ]),
  updatePassword
);

// Forgot password - request reset code
router.post(
  '/forgot-password',
  verificationLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
  ]),
  requestPasswordReset
);

// Reset password with code
router.post(
  '/reset-password',
  passwordLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('code').isLength({ min: 4, max: 4 }).withMessage('Reset code must be 4 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ]),
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
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('name').notEmpty().withMessage('Name is required'),
  ]),
  googleRegister
);

// Google Sign-In for Login
router.post(
  '/google/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
  ]),
  googleLogin
);

export default router;
