import express from 'express';
import { login, register, checkSetupStatus, getMe, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/setup-status', checkSetupStatus);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
