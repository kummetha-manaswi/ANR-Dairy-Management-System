const mongoose = require('mongoose');

const RateChartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a rate chart name'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  milkType: {
    type: String,
    enum: ['cow', 'buffalo'],
    required: [true, 'Please specify milk type']
  },
  effectiveFrom: {
    type: Date,
    required: [true, 'Please add effective date'],
    default: Date.now
  },
  baseRate: {
    type: Number,
    required: [true, 'Please add base rate per litre']
  },
  snfThreshold: {
    type: Number,
    required: [true, 'Please add SNF threshold']
  },
  deduction: {
    type: Number,
    required: [true, 'Please add deduction amount'],
    default: 0
  },
  standardFat: {
    type: Number,
    required: [true, 'Please add standard FAT percentage'],
    default: 0
  },
  fatBonus: {
    type: Number,
    required: [true, 'Please add FAT bonus per point'],
    default: 0
  },
  fatPenalty: {
    type: Number,
    required: [true, 'Please add FAT penalty per point'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index active charts for performance
RateChartSchema.index({ milkType: 1, isActive: 1 });

module.exports = mongoose.model('RateChart', RateChartSchema);
