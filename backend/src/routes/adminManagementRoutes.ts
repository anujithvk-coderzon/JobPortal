import express from 'express';
import {
  createNewAdmin,
  getAllAdmins,
  deactivateAdmin,
  activateAdmin,
  deleteAdmin,
} from '../controllers/adminManagementController';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require SUPER_ADMIN
router.use(authenticateAdmin);
router.use(requireSuperAdmin);

router.post('/', createNewAdmin);
router.get('/', getAllAdmins);
router.put('/:adminId/deactivate', deactivateAdmin);
router.put('/:adminId/activate', activateAdmin);
router.delete('/:adminId', deleteAdmin);

export default router;
