const mongoose = require('mongoose');

const NotificationTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['collection', 'bill', 'payment', 'custom'],
    required: true,
    unique: true
  },
  templateText: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

NotificationTemplateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NotificationTemplate', NotificationTemplateSchema);
