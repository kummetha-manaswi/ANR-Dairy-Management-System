const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: [true, 'Payment number is required'],
    unique: true,
    trim: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Invoice reference is required']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer reference is required']
  },
  paidAmount: {
    type: Number,
    required: [true, 'Paid amount is required'],
    min: [0.01, 'Paid amount must be greater than 0']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer'],
    required: [true, 'Payment mode is required']
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for speed queries
PaymentSchema.index({ invoice: 1 });
PaymentSchema.index({ farmer: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
