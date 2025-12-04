import express from 'express';
import {
  getPosts,
  getPostDetails,
  approvePost,
  rejectPost,
  deletePost,
  getFlaggedPosts,
  getFlaggedPostDetails,
  dismissReports,
  deleteFlaggedPost,
  getFlaggedPostsCount,
} from '../controllers/adminPostController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Regular post management
router.get('/', authenticateAdmin, getPosts);
router.get('/:postId', authenticateAdmin, getPostDetails);
router.put('/:postId/approve', authenticateAdmin, approvePost);
router.put('/:postId/reject', authenticateAdmin, rejectPost);
router.delete('/:postId', authenticateAdmin, deletePost);

// Flagged posts management
router.get('/flagged/list', authenticateAdmin, getFlaggedPosts);
router.get('/flagged/count', authenticateAdmin, getFlaggedPostsCount);
router.get('/flagged/:postId', authenticateAdmin, getFlaggedPostDetails);
router.put('/flagged/:postId/dismiss', authenticateAdmin, dismissReports);
router.delete('/flagged/:postId', authenticateAdmin, deleteFlaggedPost);

export default router;
