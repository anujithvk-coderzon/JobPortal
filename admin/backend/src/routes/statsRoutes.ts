import express from 'express';
import { getOverviewStats } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/overview', authenticate, getOverviewStats);

export default router;
