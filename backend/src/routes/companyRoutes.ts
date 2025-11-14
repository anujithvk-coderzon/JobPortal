import express from 'express';
import {
  getUserCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  deleteCompanyLogo,
} from '../controllers/companyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/companies - Get all companies for authenticated user
router.get('/', getUserCompanies);

// GET /api/companies/:companyId - Get a specific company
router.get('/:companyId', getCompanyById);

// POST /api/companies - Create a new company
router.post('/', createCompany);

// PUT /api/companies/:companyId - Update a company
router.put('/:companyId', updateCompany);

// DELETE /api/companies/:companyId - Delete a company
router.delete('/:companyId', deleteCompany);

// POST /api/companies/:companyId/logo - Upload company logo
router.post('/:companyId/logo', uploadCompanyLogo);

// DELETE /api/companies/:companyId/logo - Delete company logo
router.delete('/:companyId/logo', deleteCompanyLogo);

export default router;
