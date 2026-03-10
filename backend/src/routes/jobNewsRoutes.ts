import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body } from 'express-validator';
import { writeLimiter } from '../middleware/rateLimiter';
import {
  createJobNews,
  getAllJobNews,
  getJobNewsById,
  updateJobNews,
  deleteJobNews,
  getMyJobNews,
  toggleHelpful,
} from '../controllers/jobNewsController';

const router = express.Router();

// Validation rules
const jobNewsValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('companyName').optional().trim(),
  body('location').optional().trim(),
  body('source').optional().trim(),
  body('externalLink').optional().trim().isURL().withMessage('External link must be a valid URL'),
];

// Public routes (with optional authentication to track helpful votes)
router.get('/', optionalAuthenticate, getAllJobNews);

// Protected routes (must come before /:id to avoid conflicts)
router.post('/', authenticate, writeLimiter, validate(jobNewsValidation), createJobNews);
router.get('/user/my-news', authenticate, getMyJobNews);
router.post('/:id/helpful', authenticate, toggleHelpful);

// Dynamic routes (must come last)
router.get('/:id', optionalAuthenticate, getJobNewsById);
router.put('/:id', authenticate, writeLimiter, validate(jobNewsValidation), updateJobNews);
router.delete('/:id', authenticate, writeLimiter, deleteJobNews);

export default router;
