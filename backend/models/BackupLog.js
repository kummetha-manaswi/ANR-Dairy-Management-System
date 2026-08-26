const mongoose = require('mongoose');

const BackupLogSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  backupDate: {
    type: Date,
    default: Date.now
  },
  backupType: {
    type: String,
    enum: ['Manual', 'Scheduled', 'Safety'],
    default: 'Manual'
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  appVersion: {
    type: String,
    default: '1.0.0'
  },
  backupVersion: {
    type: String,
    default: '1.0.0'
  },
  errorMessage: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('BackupLog', BackupLogSchema);
