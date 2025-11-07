import express from 'express';
import { body } from 'express-validator';
import {
  applyToJob,
  getMyApplications,
  getApplicationById,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getDashboardStats,
} from '../controllers/applicationController';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, getDashboardStats);

// Job Seeker routes
router.post(
  '/apply/:jobId',
  authenticate,
  authorizeRole('JOB_SEEKER'),
  applyToJob
);

router.get(
  '/my-applications',
  authenticate,
  getMyApplications
);

router.delete(
  '/:applicationId/withdraw',
  authenticate,
  authorizeRole('JOB_SEEKER'),
  withdrawApplication
);

// Employer routes
router.get(
  '/job/:jobId',
  authenticate,
  authorizeRole('EMPLOYER'),
  getJobApplications
);

router.put(
  '/:applicationId/status',
  authenticate,
  authorizeRole('EMPLOYER'),
  validate([
    body('status')
      .isIn(['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'])
      .withMessage('Invalid status'),
  ]),
  updateApplicationStatus
);

// Both roles can view application details
router.get('/:applicationId', authenticate, getApplicationById);

export default router;
