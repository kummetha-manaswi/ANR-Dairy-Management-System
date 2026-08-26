const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const BackupLog = require('../models/BackupLog');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Database models list to backup
const MODELS_LIST = [
  { name: 'User', model: require('../models/User') },
  { name: 'Farmer', model: require('../models/Farmer') },
  { name: 'RateChart', model: require('../models/RateChart') },
  { name: 'MilkCollection', model: require('../models/MilkCollection') },
  { name: 'Invoice', model: require('../models/Invoice') },
  { name: 'Payment', model: require('../models/Payment') },
  { name: 'DairyProfile', model: require('../models/DairyProfile') },
  { name: 'NotificationTemplate', model: require('../models/NotificationTemplate') },
  { name: 'NotificationLog', model: require('../models/NotificationLog') },
  { name: 'AuditLog', model: require('../models/AuditLog') }
];

// Helper to create a backup JSON payload and save file
const performBackup = async (type = 'Manual') => {
  const collections = {};
  const recordCounts = {};

  // Fetch all documents from all collections
  for (const m of MODELS_LIST) {
    let query = m.model.find({});
    if (m.name === 'User') {
      query = query.select('+password');
    }
    const docs = await query;
    collections[m.name] = docs;
    recordCounts[m.name] = docs.length;
  }

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '_').substring(0, 19);
  const prefix = type === 'Safety' ? 'backup_safety_before_restore_' : type === 'Scheduled' ? 'backup_scheduled_' : 'backup_manual_';
  const filename = `${prefix}${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, filename);

  const backupData = {
    metadata: {
      dbName: 'anr_dairy',
      backupDate: new Date(),
      backupType: type,
      appVersion: '1.0.0', // Refinement 2
      backupVersion: '1.0.0', // Refinement 2
      recordCounts
    },
    collections
  };

  // Write file to backups folder
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
  const stats = fs.statSync(filePath);

  // Write log history
  const log = await BackupLog.create({
    filename,
    backupDate: new Date(),
    backupType: type,
    status: 'Success',
    fileSize: stats.size,
    appVersion: '1.0.0',
    backupVersion: '1.0.0'
  });

  return log;
};

// @desc    Get backup histories logs
// @route   GET /api/v1/backup/logs
// @access  Private (Admin Only)
exports.getBackupLogs = async (req, res, next) => {
  try {
    const logs = await BackupLog.find({}).sort({ backupDate: -1 });
    res.status(200).json({
      success: true,
      message: 'Backup history logs retrieved successfully',
      data: logs,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger a manual database backup
// @route   POST /api/v1/backup/create
// @access  Private (Admin Only)
exports.createManualBackup = async (req, res, next) => {
  try {
    const log = await performBackup('Manual');

    // Audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DATABASE_BACKUP_CREATED',
      collectionTarget: 'BackupLog',
      recordId: log._id,
      newState: log.toObject(),
      reason: 'Administrator triggered a manual database backup'
    });

    res.status(201).json({
      success: true,
      message: 'Manual database backup created successfully',
      data: log,
      errors: null
    });
  } catch (error) {
    // Record failed backup log
    try {
      await BackupLog.create({
        filename: `failed_backup_${Date.now()}.json`,
        backupDate: new Date(),
        backupType: 'Manual',
        status: 'Failed',
        fileSize: 0,
        errorMessage: error.message
      });
    } catch (logErr) {
      console.error('Failed to log failed backup:', logErr);
    }
    next(error);
  }
};

// @desc    Download backup JSON file
// @route   GET /api/v1/backup/download/:filename
// @access  Private (Admin Only)
exports.downloadBackupFile = async (req, res, next) => {
  try {
    const filePath = path.join(BACKUP_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return next(new ErrorResponse('Backup file not found', 404));
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};

// @desc    Parse uploaded backup metadata details without restoring (Refinement 1)
// @route   POST /api/v1/backup/parse
// @access  Private (Admin Only)
exports.parseBackupMetadata = async (req, res, next) => {
  try {
    const { backupContent } = req.body;

    if (!backupContent) {
      return next(new ErrorResponse('No backup content provided for analysis', 400));
    }

    let parsed;
    try {
      parsed = typeof backupContent === 'string' ? JSON.parse(backupContent) : backupContent;
    } catch (e) {
      return next(new ErrorResponse('Invalid JSON format. Please upload a valid JSON backup file.', 400));
    }

    if (!parsed.metadata || !parsed.metadata.dbName || parsed.metadata.dbName !== 'anr_dairy') {
      return next(new ErrorResponse('Incompatible database format. The file is not a valid ANR Dairy backup.', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Backup parsed successfully',
      data: parsed.metadata,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore database from backup payload (Refinement 1)
// @route   POST /api/v1/backup/restore
// @access  Private (Admin Only)
exports.restoreDatabase = async (req, res, next) => {
  try {
    const { backupContent, confirmRestore } = req.body;

    if (!backupContent) {
      return next(new ErrorResponse('No backup content provided for restoration', 400));
    }

    if (!confirmRestore) {
      return next(new ErrorResponse('Please confirm the restore operation. Current database will be overwritten.', 400));
    }

    let parsed;
    try {
      parsed = typeof backupContent === 'string' ? JSON.parse(backupContent) : backupContent;
    } catch (e) {
      return next(new ErrorResponse('Invalid JSON file format', 400));
    }

    // Verify metadata
    if (!parsed.metadata || !parsed.metadata.dbName || parsed.metadata.dbName !== 'anr_dairy') {
      return next(new ErrorResponse('Invalid database format. Backup file mismatch.', 400));
    }

    console.log('--- RESTORE INITIATED: CREATING SAFETY BACKUP FIRST ---');
    // Refinement 1: Automatically create a safety backup of current data first
    const safetyLog = await performBackup('Safety');
    console.log(`Safety backup created: ${safetyLog.filename}`);

    // Clean up current database collections and insert backup records
    console.log('--- CLEARING CURRENT COLLECTIONS AND RESTORING ---');
    for (const m of MODELS_LIST) {
      // Use raw collection to bypass mongoose middleware restrictions (like AuditLog immutability checks)
      await m.model.collection.deleteMany({});
      const docs = parsed.collections[m.name];
      if (docs && docs.length > 0) {
        // Insert docs back into collection
        await m.model.insertMany(docs);
      }
    }

    // Write audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DATABASE_RESTORED',
      collectionTarget: 'BackupLog',
      recordId: safetyLog._id,
      previousState: { safetyBackupFile: safetyLog.filename },
      newState: parsed.metadata,
      reason: `Administrator restored database from backup file dated ${new Date(parsed.metadata.backupDate).toLocaleDateString()}`
    });

    res.status(200).json({
      success: true,
      message: `Database successfully restored. Safety backup file '${safetyLog.filename}' created.`,
      data: {
        safetyBackupCreated: safetyLog.filename,
        restoredRecords: parsed.metadata.recordCounts
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// Export raw performBackup for schedule usage
exports.performBackup = performBackup;
