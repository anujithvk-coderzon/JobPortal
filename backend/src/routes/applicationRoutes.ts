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
  uploadOfferLetter,
} from '../controllers/applicationController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, getDashboardStats);

// Upload offer letter (for employers)
router.post('/upload-offer-letter', authenticate, uploadOfferLetter);

// Application routes (all authenticated users can apply and manage their applications)
router.post(
  '/apply/:jobId',
  authenticate,
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
  withdrawApplication
);

// Job poster routes (ownership checked in controller)
router.get(
  '/job/:jobId',
  authenticate,
  getJobApplications
);

router.put(
  '/:applicationId/status',
  authenticate,
  validate([
    body('status')
      .isIn(['PENDING', 'INTERVIEW_SCHEDULED', 'REJECTED', 'HIRED'])
      .withMessage('Invalid status'),
  ]),
  updateApplicationStatus
);

// Both roles can view application details
router.get('/:applicationId', authenticate, getApplicationById);

export default router;
