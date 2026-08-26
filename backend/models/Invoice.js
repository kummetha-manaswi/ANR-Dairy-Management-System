const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer reference is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MilkCollection'
  }],
  totalLiters: {
    type: Number,
    required: [true, 'Total liters is required'],
    min: [0, 'Total liters cannot be negative']
  },
  avgFat: {
    type: Number,
    required: [true, 'Average FAT % is required'],
    min: [0, 'Average FAT cannot be negative']
  },
  avgSnf: {
    type: Number,
    required: [true, 'Average SNF % is required'],
    min: [0, 'Average SNF cannot be negative']
  },
  grossAmount: {
    type: Number,
    required: [true, 'Gross amount is required'],
    min: [0, 'Gross amount cannot be negative']
  },
  bonus: {
    type: Number,
    default: 0,
    min: [0, 'Bonus cannot be negative']
  },
  deductions: {
    type: Number,
    default: 0,
    min: [0, 'Deductions cannot be negative']
  },
  netAmount: {
    type: Number,
    required: [true, 'Net amount is required'],
    min: [0, 'Net amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  pendingAmount: {
    type: Number,
    required: [true, 'Pending amount is required'],
    min: [0, 'Pending amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  generatedDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast lookup
InvoiceSchema.index({ farmer: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
