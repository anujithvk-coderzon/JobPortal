import express from 'express';
import {
  createNewAdmin,
  getAllAdmins,
  deactivateAdmin,
  activateAdmin,
} from '../controllers/adminManagementController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireSuperAdmin);

router.post('/', createNewAdmin);
router.get('/', getAllAdmins);
router.put('/:adminId/deactivate', deactivateAdmin);
router.put('/:adminId/activate', activateAdmin);

export default router;
