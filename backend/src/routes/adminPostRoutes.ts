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
  softDeletePost,
  getSoftDeletedPosts,
  getSoftDeletedPostsCount,
  restorePost,
  permanentDeletePost,
} from '../controllers/adminPostController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Regular post management
router.get('/', authenticateAdmin, getPosts);
router.get('/:postId', authenticateAdmin, getPostDetails);
router.put('/:postId/approve', authenticateAdmin, approvePost);
router.put('/:postId/reject', authenticateAdmin, rejectPost);
router.delete('/:postId', authenticateAdmin, deletePost);

// Soft delete management
router.get('/deleted/list', authenticateAdmin, getSoftDeletedPosts);
router.get('/deleted/count', authenticateAdmin, getSoftDeletedPostsCount);
router.put('/:postId/soft-delete', authenticateAdmin, softDeletePost);
router.put('/:postId/restore', authenticateAdmin, restorePost);
router.delete('/:postId/permanent', authenticateAdmin, permanentDeletePost);

// Flagged posts management
router.get('/flagged/list', authenticateAdmin, getFlaggedPosts);
router.get('/flagged/count', authenticateAdmin, getFlaggedPostsCount);
router.get('/flagged/:postId', authenticateAdmin, getFlaggedPostDetails);
router.put('/flagged/:postId/dismiss', authenticateAdmin, dismissReports);
router.delete('/flagged/:postId', authenticateAdmin, deleteFlaggedPost);

export default router;
