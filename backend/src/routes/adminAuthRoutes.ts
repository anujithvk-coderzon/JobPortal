import express from 'express';
import { checkAdminSetupStatus, adminRegister, adminLogin, getMe, logout, refreshAdminToken, changeAdminPassword } from '../controllers/adminAuthController/controller';
import { authenticateAdmin } from '../middleware/auth';
import { adminAuthLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/setup-status', checkAdminSetupStatus);
router.post('/register', adminAuthLimiter, adminRegister);
router.post('/login', adminAuthLimiter, adminLogin);
router.get('/me', authenticateAdmin, getMe);
router.put('/change-password', authenticateAdmin, changeAdminPassword);
router.post('/logout', authenticateAdmin, logout);

// Refresh admin access token (refresh token comes from httpOnly cookie)
router.post('/refresh-token', refreshAdminToken);

export default router;
