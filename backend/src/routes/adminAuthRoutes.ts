import express from 'express';
import { adminLogin, getMe, logout } from '../controllers/adminAuthController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/me', authenticateAdmin, getMe);
router.post('/logout', authenticateAdmin, logout);

export default router;
