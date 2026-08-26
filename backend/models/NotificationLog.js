const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: false // Can be null for bulk notifications or general system alerts
  },
  type: {
    type: String,
    enum: ['collection', 'bill', 'payment', 'bulk', 'individual'],
    required: true
  },
  medium: {
    type: String,
    enum: ['whatsapp', 'sms', 'both'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Queued', 'Sending', 'Sent', 'Failed', 'Retried'],
    default: 'Queued'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  attempts: {
    type: Number,
    default: 1
  },
  messageId: {
    type: String,
    default: ''
  },
  deliveryTime: {
    type: Date
  },
  readStatus: {
    type: Boolean,
    default: false
  },
  retryHistory: [
    {
      attemptedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['Sent', 'Failed'],
        required: true
      },
      errorMessage: {
        type: String,
        default: ''
      },
      medium: {
        type: String,
        enum: ['whatsapp', 'sms'],
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

NotificationLogSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
