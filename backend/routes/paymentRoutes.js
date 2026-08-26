const express = require('express');
const router = express.Router();
const {
  recordPayment,
  getPayments,
  deletePayment,
  getPaymentById,
  streamPaymentPDF
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Record payment - Admin only
router.post('/', protect, authorize('admin'), recordPayment);

// Get payments list - Admin & Employee
router.get('/', protect, authorize('admin', 'employee'), getPayments);

// Get single payment details and PDF - Admin, Employee, and Farmer
router.get('/:id', protect, authorize('admin', 'employee', 'farmer'), getPaymentById);
router.get('/:id/pdf', protect, authorize('admin', 'employee', 'farmer'), streamPaymentPDF);

// Delete payment - Admin only
router.delete('/:id', protect, authorize('admin'), deletePayment);

module.exports = router;
