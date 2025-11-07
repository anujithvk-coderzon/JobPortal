import express from 'express';
import { body } from 'express-validator';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  getCompanyJobs,
  saveJob,
  unsaveJob,
  getSavedJobs,
} from '../controllers/jobController';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllJobs);
router.get('/company/:companyId', getCompanyJobs);

// Protected routes (authentication required)
router.get('/job/:jobId', authenticate, getJobById);
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/saved', authenticate, authorizeRole('JOB_SEEKER'), getSavedJobs);

// Job CRUD (Any authenticated user can post jobs)
router.post(
  '/',
  authenticate,
  validate([
    body('title').notEmpty().withMessage('Job title is required'),
    body('description').notEmpty().withMessage('Job description is required'),
    body('employmentType')
      .isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
      .withMessage('Invalid employment type'),
    body('experienceLevel')
      .isIn(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'])
      .withMessage('Invalid experience level'),
    body('locationType')
      .isIn(['ONSITE', 'REMOTE', 'HYBRID'])
      .withMessage('Invalid location type'),
  ]),
  createJob
);

router.put(
  '/:jobId',
  authenticate,
  updateJob
);

router.delete(
  '/:jobId',
  authenticate,
  deleteJob
);

// Save/Unsave jobs (Job Seeker only)
router.post(
  '/:jobId/save',
  authenticate,
  authorizeRole('JOB_SEEKER'),
  saveJob
);

router.delete(
  '/:jobId/save',
  authenticate,
  authorizeRole('JOB_SEEKER'),
  unsaveJob
);

export default router;
