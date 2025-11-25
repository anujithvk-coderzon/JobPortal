import express from 'express';
import {
  getAllUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAllUsers);
router.get('/:userId', getUserDetails);
router.put('/:userId/block', blockUser);
router.put('/:userId/unblock', unblockUser);
router.delete('/:userId', deleteUser);

export default router;
