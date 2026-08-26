const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadLogo, getSystemInfo } = require('../controllers/dairyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Get profile is public so branding loads on the login/landing screens
router.get('/', getProfile);

// System details metrics for About page
router.get('/system-info', protect, getSystemInfo);

// Core updates are restricted to administrators
router.put('/', protect, authorize('admin'), updateProfile);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
