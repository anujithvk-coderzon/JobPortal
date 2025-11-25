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
  getJobMatchScore,
  getJobsWithMatchScores,
} from '../controllers/jobController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public routes (optional authentication for match sorting)
router.get('/', optionalAuthenticate, getAllJobs);
router.get('/company/:companyId', getCompanyJobs);

// Job detail route (public, but shows extra info if authenticated)
router.get('/job/:jobId', optionalAuthenticate, getJobById);
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/saved', authenticate, getSavedJobs);

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

// Save/Unsave jobs (all authenticated users can save jobs)
router.post(
  '/:jobId/save',
  authenticate,
  saveJob
);

router.delete(
  '/:jobId/save',
  authenticate,
  unsaveJob
);

// Job matching endpoints (batch endpoint must come before dynamic route)
router.post(
  '/match/batch',
  authenticate,
  getJobsWithMatchScores
);

router.get(
  '/:jobId/match',
  authenticate,
  getJobMatchScore
);

export default router;
