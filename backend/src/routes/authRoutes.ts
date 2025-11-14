import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updatePassword, googleRegister, googleLogin, requestVerificationCode } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Request verification code
router.post(
  '/request-verification-code',
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
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

// Get current user
router.get('/me', authenticate, getMe);

// Update password
router.put(
  '/password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ]),
  updatePassword
);

// Google Sign-In for Registration
router.post(
  '/google/register',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('name').notEmpty().withMessage('Name is required'),
  ]),
  googleRegister
);

// Google Sign-In for Login
router.post(
  '/google/login',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
  ]),
  googleLogin
);

export default router;
