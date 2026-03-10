import express from 'express';
import { createFirstAdmin, checkSetupStatus } from '../controllers/setupController';
import { setupLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes (no authentication required)
router.post('/create-first-admin', setupLimiter, createFirstAdmin);
router.get('/status', checkSetupStatus);

export default router;
