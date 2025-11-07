import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { body } from 'express-validator';
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

// Public routes
router.get('/', getAllJobNews);

// Protected routes (must come before /:id to avoid conflicts)
router.post('/', authenticate, validate(jobNewsValidation), createJobNews);
router.get('/user/my-news', authenticate, getMyJobNews);
router.post('/:id/helpful', authenticate, toggleHelpful);

// Dynamic routes (must come last)
router.get('/:id', optionalAuthenticate, getJobNewsById);
router.put('/:id', authenticate, validate(jobNewsValidation), updateJobNews);
router.delete('/:id', authenticate, deleteJobNews);

export default router;
