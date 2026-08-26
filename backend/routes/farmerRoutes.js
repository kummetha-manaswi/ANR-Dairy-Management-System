const express = require('express');
const router = express.Router();
const {
  addFarmer,
  getFarmers,
  getFarmerById,
  updateFarmer,
  toggleFarmerStatus,
  softDeleteFarmer
} = require('../controllers/farmerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Fetching lists and registering new farmers (allows profile image upload)
router.get('/', protect, authorize('admin', 'employee'), getFarmers);
router.post('/', protect, authorize('admin'), upload.single('photo'), addFarmer);

// Single record profiles
router.get('/:id', protect, authorize('admin', 'employee', 'farmer'), getFarmerById);
router.put('/:id', protect, authorize('admin'), upload.single('photo'), updateFarmer);

// State controllers
router.patch('/:id/status', protect, authorize('admin'), toggleFarmerStatus);
router.delete('/:id', protect, authorize('admin'), softDeleteFarmer);

module.exports = router;
