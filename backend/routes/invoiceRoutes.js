const express = require('express');
const router = express.Router();
const {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  cancelInvoice,
  streamInvoicePDF
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Generate invoice - Admin only
router.post('/', protect, authorize('admin'), generateInvoice);

// Get invoices list - Admin & Employee
router.get('/', protect, authorize('admin', 'employee'), getInvoices);

// Get invoice by ID and download PDF - Admin, Employee, and Farmer
router.get('/:id', protect, authorize('admin', 'employee', 'farmer'), getInvoiceById);
router.put('/:id/cancel', protect, authorize('admin'), cancelInvoice);
router.get('/:id/pdf', protect, authorize('admin', 'employee', 'farmer'), streamInvoicePDF);

module.exports = router;
