import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Dashboard stats route
router.get('/stats', authenticate, getDashboardStats);

export default router;
