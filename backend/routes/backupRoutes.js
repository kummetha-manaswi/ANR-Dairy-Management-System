const express = require('express');
const router = express.Router();
const { 
  getBackupLogs, 
  createManualBackup, 
  downloadBackupFile, 
  parseBackupMetadata,
  restoreDatabase 
} = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Require authenticated Admin access for all database backup/restore routes
router.use(protect);
router.use(authorize('admin'));

router.get('/logs', getBackupLogs);
router.post('/create', createManualBackup);
router.get('/download/:filename', downloadBackupFile);
router.post('/parse', parseBackupMetadata);
router.post('/restore', restoreDatabase);

module.exports = router;
