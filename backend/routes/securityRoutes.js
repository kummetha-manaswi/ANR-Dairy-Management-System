const express = require('express');
const router = express.Router();
const { 
  changePassword, 
  getActiveSessions, 
  terminateSession, 
  logoutAllDevices,
  getLoginHistory,
  getAuditLogs
} = require('../controllers/securityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Secure all endpoints in this router
router.use(protect);

router.put('/change-password', authorize('admin', 'employee'), changePassword);
router.get('/sessions', authorize('admin', 'employee'), getActiveSessions);
router.delete('/sessions/:id', authorize('admin', 'employee'), terminateSession);
router.post('/sessions/logout-all', authorize('admin', 'employee'), logoutAllDevices);
router.get('/history', authorize('admin', 'employee'), getLoginHistory);
router.get('/logs', authorize('admin'), getAuditLogs);

module.exports = router;
