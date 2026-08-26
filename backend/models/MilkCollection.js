const mongoose = require('mongoose');

const MilkCollectionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer is required for milk collection']
  },
  date: {
    type: Date,
    required: [true, 'Collection date is required']
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: [true, 'Shift must be morning or evening']
  },
  milkType: {
    type: String,
    enum: ['cow', 'buffalo', 'mix'],
    required: [true, 'Milk type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Liters quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  fat: {
    type: Number,
    required: [true, 'FAT percentage is required']
  },
  snf: {
    type: Number,
    required: [true, 'SNF percentage is required']
  },
  ratePerLiter: {
    type: Number,
    required: [true, 'Rate per liter is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Collection agent is required']
  },
  rateChartUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RateChart',
    required: [true, 'Rate chart reference is required']
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Normalize date to midnight before saving (vital for compound unique index checks)
MilkCollectionSchema.pre('save', function(next) {
  if (this.date) {
    const d = new Date(this.date);
    d.setUTCHours(0, 0, 0, 0);
    this.date = d;
  }
  next();
});

// Unique compound index: Prevent double entries for the same farmer, date, and shift
MilkCollectionSchema.index({ farmer: 1, date: 1, shift: 1 }, { unique: true });

// Read queries index optimization
MilkCollectionSchema.index({ date: -1, shift: 1 });

module.exports = mongoose.model('MilkCollection', MilkCollectionSchema);
