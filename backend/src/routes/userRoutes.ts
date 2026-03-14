import express from 'express';
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
  updatePrivacySettings,
  uploadProfilePhoto,
  deleteProfilePhoto,
  uploadResume,
  deleteResume,
  getMyPosts,
} from '../controllers/userController/controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Profile routes
router.get('/profile/:userId?', authenticate, getProfile);
router.get('/public-profile/:userId', authenticate, getPublicProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/profile-info', authenticate, updateProfile);
router.put('/basic-info', authenticate, updateBasicInfo);

// Skills routes
router.post('/skills', authenticate, addSkill);
router.delete('/skills/:skillId', authenticate, deleteSkill);

// Experience routes
router.post('/experience', authenticate, addExperience);
router.put('/experience/:experienceId', authenticate, updateExperience);
router.delete('/experience/:experienceId', authenticate, deleteExperience);

// Education routes
router.post('/education', authenticate, addEducation);
router.put('/education/:educationId', authenticate, updateEducation);
router.delete('/education/:educationId', authenticate, deleteEducation);

// Privacy settings
router.put('/privacy-settings', authenticate, updatePrivacySettings);

// Company routes
router.put('/company', authenticate, updateCompany);

// Profile photo routes
router.post('/profile-photo', authenticate, uploadLimiter, uploadProfilePhoto);
router.delete('/profile-photo', authenticate, deleteProfilePhoto);

// Resume routes
router.post('/resume', authenticate, uploadLimiter, uploadResume);
router.delete('/resume', authenticate, deleteResume);

// Posts routes
router.get('/my-posts', authenticate, getMyPosts);

export default router;
