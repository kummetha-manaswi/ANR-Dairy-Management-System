const express = require('express');
const router = express.Router();
const {
  getFarmerDashboard,
  getFarmerCollections,
  getFarmerInvoices,
  getFarmerPayments,
  getFarmerNotifications,
  updateFarmerProfile
} = require('../controllers/farmerPortalController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Enforce that all routes in this file require farmer role authorization
router.use(protect);
router.use(authorize('farmer'));

router.get('/dashboard', getFarmerDashboard);
router.get('/collections', getFarmerCollections);
router.get('/invoices', getFarmerInvoices);
router.get('/payments', getFarmerPayments);
router.get('/notifications', getFarmerNotifications);
router.put('/profile', upload.single('photo'), updateFarmerProfile);

module.exports = router;
