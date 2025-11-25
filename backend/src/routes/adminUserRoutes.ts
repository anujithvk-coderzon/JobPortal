import express from 'express';
import {
  getUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  deleteUser,
} from '../controllers/adminUserController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateAdmin, getUsers);
router.get('/:userId', authenticateAdmin, getUserDetails);
router.put('/:userId/block', authenticateAdmin, blockUser);
router.put('/:userId/unblock', authenticateAdmin, unblockUser);
router.delete('/:userId', authenticateAdmin, deleteUser);

export default router;
