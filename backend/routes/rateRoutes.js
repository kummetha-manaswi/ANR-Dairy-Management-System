const express = require('express');
const router = express.Router();
const {
  createRateChart,
  getRateCharts,
  getRateChartById,
  activateRateChart,
  updateRateChart,
  calculateRatePreview,
  deleteRateChart
} = require('../controllers/rateController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get active pricing preview helper (used during entries live preview calculations)
router.get('/calculate', protect, authorize('admin', 'employee'), calculateRatePreview);

// Standard directories
router.get('/', protect, authorize('admin', 'employee'), getRateCharts);
router.post('/', protect, authorize('admin'), createRateChart);

// Individual profile configs
router.get('/:id', protect, authorize('admin', 'employee'), getRateChartById);
router.put('/:id', protect, authorize('admin'), updateRateChart);
router.delete('/:id', protect, authorize('admin'), deleteRateChart);
router.put('/:id/activate', protect, authorize('admin'), activateRateChart);

module.exports = router;
