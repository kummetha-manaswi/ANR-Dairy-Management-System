const express = require('express');
const router = express.Router();
const {
  addCollection,
  getCollections,
  updateCollection,
  deleteCollection,
  unlockCollection,
  getTodaySummary
} = require('../controllers/collectionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Logging daily milk entries and listing logs
router.post('/', protect, authorize('admin', 'employee'), addCollection);
router.get('/', protect, authorize('admin', 'employee'), getCollections);
router.get('/today-summary', protect, authorize('admin', 'employee'), getTodaySummary);

// Edit/Delete operations are protected under Admin locks checks
router.put('/:id', protect, authorize('admin', 'employee'), updateCollection);
router.delete('/:id', protect, authorize('admin'), deleteCollection);
router.patch('/:id/unlock', protect, authorize('admin'), unlockCollection);

module.exports = router;
