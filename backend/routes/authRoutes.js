const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  getSetupStatus, 
  setupAdmin, 
  changePassword,
  getRecoveryQuestion,
  resetAdminPassword,
  getPublicStats
} = require('../controllers/authController');
const { 
  farmerLogin, 
  changeFarmerPassword,
  firstTimeFarmerLogin,
  forgotFarmerPassword
} = require('../controllers/farmerPortalController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Setup Status (Check if admin exists)
router.get('/setup-status', getSetupStatus);

// Public Stats for landing page
router.get('/public-stats', getPublicStats);

// First-Time Admin Setup
router.post('/setup', setupAdmin);

// Standard Login
router.post('/login', login);

// Admin Account Recovery (Forgot Password)
router.post('/forgot-password/question', getRecoveryQuestion);
router.post('/forgot-password/reset', resetAdminPassword);

// Farmer Portal Authentication
router.post('/farmer/login', farmerLogin);
router.post('/farmer/first-login', firstTimeFarmerLogin);
router.post('/farmer/forgot-password', forgotFarmerPassword);
router.put('/farmer/change-password', protect, authorize('farmer'), changeFarmerPassword);

// Register User (Employees - Admin only)
router.post('/register', protect, authorize('admin'), register);

// Get Profile
router.get('/me', protect, getMe);

// Change own password
router.put('/change-password', protect, changePassword);

module.exports = router;
