import express from 'express';
import {
  getAllPosts,
  getPendingPosts,
  getPostDetails,
  approvePost,
  rejectPost,
  deletePost,
} from '../controllers/postController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllPosts);
router.get('/pending', getPendingPosts);
router.get('/:postId', getPostDetails);
router.put('/:postId/approve', approvePost);
router.put('/:postId/reject', rejectPost);
router.delete('/:postId', deletePost);

export default router;
