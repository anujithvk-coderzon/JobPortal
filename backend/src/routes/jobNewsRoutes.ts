import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimiter';
import {
  createJobNews,
  getAllJobNews,
  getJobNewsById,
  updateJobNews,
  deleteJobNews,
  getMyJobNews,
  toggleHelpful,
} from '../controllers/jobNewsController/controller';

const router = express.Router();

// Public routes (with optional authentication to track helpful votes)
router.get('/', optionalAuthenticate, getAllJobNews);

// Protected routes (must come before /:id to avoid conflicts)
router.post('/', authenticate, writeLimiter, createJobNews);
router.get('/user/my-news', authenticate, getMyJobNews);
router.post('/:id/helpful', authenticate, toggleHelpful);

// Dynamic routes (must come last)
router.get('/:id', optionalAuthenticate, getJobNewsById);
router.put('/:id', authenticate, writeLimiter, updateJobNews);
router.delete('/:id', authenticate, writeLimiter, deleteJobNews);

export default router;
