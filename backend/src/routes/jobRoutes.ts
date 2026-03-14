import express from 'express';
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
} from '../controllers/jobController/controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { writeLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes (optional authentication for match sorting)
router.get('/', optionalAuthenticate, getAllJobs);
router.get('/company/:companyId', optionalAuthenticate, getCompanyJobs);

// Job detail route (public, but shows extra info if authenticated)
router.get('/job/:jobId', optionalAuthenticate, getJobById);
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/saved', authenticate, getSavedJobs);

// Job CRUD (Any authenticated user can post jobs)
router.post('/', authenticate, writeLimiter, createJob);
router.put('/:jobId', authenticate, writeLimiter, updateJob);
router.delete('/:jobId', authenticate, writeLimiter, deleteJob);

// Save/Unsave jobs (all authenticated users can save jobs)
router.post('/:jobId/save', authenticate, saveJob);
router.delete('/:jobId/save', authenticate, unsaveJob);

// Job matching endpoints (batch endpoint must come before dynamic route)
router.post('/match/batch', authenticate, getJobsWithMatchScores);
router.get('/:jobId/match', authenticate, getJobMatchScore);

export default router;
