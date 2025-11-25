import express from 'express';
import {
  getPosts,
  getPostDetails,
  approvePost,
  rejectPost,
  deletePost,
} from '../controllers/adminPostController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateAdmin, getPosts);
router.get('/:postId', authenticateAdmin, getPostDetails);
router.put('/:postId/approve', authenticateAdmin, approvePost);
router.put('/:postId/reject', authenticateAdmin, rejectPost);
router.delete('/:postId', authenticateAdmin, deletePost);

export default router;
