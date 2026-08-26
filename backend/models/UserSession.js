const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceInfo: {
    type: String,
    default: 'Unknown Device'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Auto-update lastActivity timestamp on save
UserSessionSchema.pre('save', function (next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('UserSession', UserSessionSchema);
