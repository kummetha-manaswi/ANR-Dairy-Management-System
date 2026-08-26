const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for audit logs']
  },
  action: {
    type: String,
    required: [true, 'Action is required']
  },
  collectionTarget: {
    type: String,
    required: [true, 'Target collection is required']
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Record ID is required']
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  reason: {
    type: String,
    required: [true, 'A reason must be provided for audit tracking'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce immutability at the Mongoose middleware level
AuditLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be modified.'));
  }
  next();
});

AuditLogSchema.pre('findOneAndUpdate', function(next) {
  return next(new Error('Audit logs are immutable and cannot be modified.'));
});

AuditLogSchema.pre('updateOne', function(next) {
  return next(new Error('Audit logs are immutable and cannot be modified.'));
});

AuditLogSchema.pre('deleteOne', function(next) {
  return next(new Error('Audit logs are immutable and cannot be deleted.'));
});

AuditLogSchema.pre('deleteMany', function(next) {
  return next(new Error('Audit logs are immutable and cannot be deleted.'));
});

AuditLogSchema.pre('findOneAndDelete', function(next) {
  return next(new Error('Audit logs are immutable and cannot be deleted.'));
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
