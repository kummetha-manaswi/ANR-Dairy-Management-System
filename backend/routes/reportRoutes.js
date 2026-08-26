const express = require('express');
const router = express.Router();
const {
  getBillingReport,
  exportBillingExcel,
  getOutstandingReport,
  exportOutstandingExcel,
  getPassbookTimeline,
  getDashboardStats,
  getChartsData,
  getCollectionsReport,
  exportCollectionsExcel,
  streamCollectionsPDF,
  getQualityReport,
  exportQualityExcel,
  streamQualityPDF,
  streamPassbookPDF
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'employee'));

router.get('/dashboard', getDashboardStats);
router.get('/charts', getChartsData);

router.get('/billing', getBillingReport);
router.get('/billing/excel', exportBillingExcel);

router.get('/outstanding', getOutstandingReport);
router.get('/outstanding/excel', exportOutstandingExcel);

router.get('/collections', getCollectionsReport);
router.get('/collections/excel', exportCollectionsExcel);
router.get('/collections/pdf', streamCollectionsPDF);

router.get('/quality', getQualityReport);
router.get('/quality/excel', exportQualityExcel);
router.get('/quality/pdf', streamQualityPDF);

router.get('/passbook/:farmerId', getPassbookTimeline);
router.get('/passbook/:farmerId/pdf', streamPassbookPDF);

module.exports = router;
