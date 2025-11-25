import express from 'express';
import { getStats } from '../controllers/adminStatsController';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/overview', authenticateAdmin, getStats);

export default router;
