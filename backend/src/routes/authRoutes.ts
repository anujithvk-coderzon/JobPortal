import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updatePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Register
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role')
      .isIn(['JOB_SEEKER', 'EMPLOYER'])
      .withMessage('Role must be either JOB_SEEKER or EMPLOYER'),
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

export default router;
