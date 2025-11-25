import express from 'express';
import { createFirstAdmin, checkSetupStatus } from '../controllers/setupController';

const router = express.Router();

// Public routes (no authentication required)
router.post('/create-first-admin', createFirstAdmin);
router.get('/status', checkSetupStatus);

export default router;
