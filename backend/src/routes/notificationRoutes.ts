import express from 'express';
import {
  getNotifications,
  markAsRead,
  getUnreadCount,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.delete('/:notificationId', authenticate, markAsRead);

export default router;
