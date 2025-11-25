import express from 'express';
import { body } from 'express-validator';
import {
  getProfile,
  getPublicProfile,
  updateProfile,
  updateBasicInfo,
  addSkill,
  deleteSkill,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  updateCompany,
  uploadProfilePhoto,
  deleteProfilePhoto,
  uploadResume,
  deleteResume,
  getMyPosts,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Profile routes
router.get('/profile/:userId?', authenticate, getProfile);
router.get('/public-profile/:userId', authenticate, getPublicProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/profile-info', authenticate, updateProfile);
router.put('/basic-info', authenticate, updateBasicInfo);

// Skills routes
router.post(
  '/skills',
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Skill name is required'),
  ]),
  addSkill
);
router.delete('/skills/:skillId', authenticate, deleteSkill);

// Experience routes
router.post(
  '/experience',
  authenticate,
  validate([
    body('title').notEmpty().withMessage('Job title is required'),
    body('company').notEmpty().withMessage('Company name is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ]),
  addExperience
);
router.put('/experience/:experienceId', authenticate, updateExperience);
router.delete('/experience/:experienceId', authenticate, deleteExperience);

// Education routes
router.post(
  '/education',
  authenticate,
  validate([
    body('institution').notEmpty().withMessage('Institution name is required'),
    body('degree').notEmpty().withMessage('Degree is required'),
    body('fieldOfStudy').notEmpty().withMessage('Field of study is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
  ]),
  addEducation
);
router.put('/education/:educationId', authenticate, updateEducation);
router.delete('/education/:educationId', authenticate, deleteEducation);

// Company routes
router.put(
  '/company',
  authenticate,
  validate([
    body('name').notEmpty().withMessage('Company name is required'),
  ]),
  updateCompany
);

// Profile photo routes
router.post(
  '/profile-photo',
  authenticate,
  validate([
    body('image').notEmpty().withMessage('Image data is required'),
  ]),
  uploadProfilePhoto
);
router.delete('/profile-photo', authenticate, deleteProfilePhoto);

// Resume routes
router.post(
  '/resume',
  authenticate,
  validate([
    body('file').notEmpty().withMessage('File data is required'),
  ]),
  uploadResume
);
router.delete('/resume', authenticate, deleteResume);

// Posts routes
router.get('/my-posts', authenticate, getMyPosts);

export default router;
