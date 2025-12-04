import express from 'express';
import {
  reportPost,
  checkReportStatus,
  getReportReasons,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get report reasons (for frontend dropdown)
router.get('/reasons', getReportReasons);

// Report a post
router.post('/:postId', reportPost);

// Check if user has reported a post
router.get('/status/:postId', checkReportStatus);

export default router;
