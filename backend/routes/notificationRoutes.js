const express = require('express');
const router = express.Router();
const {
  getTemplates,
  updateTemplate,
  getLogs,
  retryLog,
  sendBulkMessage,
  sendIndividualMessage
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All endpoints in this router require authentication and admin role privileges
router.use(protect);
router.use(authorize('admin'));

router.get('/templates', getTemplates);
router.put('/templates/:type', updateTemplate);

router.get('/logs', getLogs);
router.post('/logs/:id/retry', retryLog);

router.post('/bulk', sendBulkMessage);
router.post('/individual', sendIndividualMessage);

module.exports = router;
