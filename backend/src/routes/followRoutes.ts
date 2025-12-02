import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  checkFollowStatus,
  getFollowCounts,
  getSuggestedUsers,
} from '../controllers/followController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Follow/Unfollow
router.post('/:userId', followUser);
router.delete('/:userId', unfollowUser);

// Get lists
router.get('/following', getFollowing);
router.get('/followers', getFollowers);
router.get('/suggested', getSuggestedUsers);

// Check status and counts
router.get('/status/:userId', checkFollowStatus);
router.get('/counts/:userId', getFollowCounts);

export default router;
