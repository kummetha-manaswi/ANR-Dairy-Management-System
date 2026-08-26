const mongoose = require('mongoose');

const DairyProfileSchema = new mongoose.Schema({
  dairyName: {
    type: String,
    required: [true, 'Please add a dairy name'],
    trim: true,
    default: 'ANR Dairy'
  },
  logo: {
    type: String,
    default: ''
  },
  ownerName: {
    type: String,
    required: [true, 'Please add an owner name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a contact phone number'],
    match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number']
  },
  email: {
    type: String,
    required: [true, 'Please add a contact email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email address'
    ]
  },
  address: {
    type: String,
    required: [true, 'Please add a physical address']
  },
  gstNumber: {
    type: String,
    trim: true,
    default: ''
  },
  minFat: {
    type: Number,
    default: 1.5
  },
  maxFat: {
    type: Number,
    default: 15.0
  },
  minSnf: {
    type: Number,
    default: 5.0
  },
  maxSnf: {
    type: Number,
    default: 12.0
  },
  billingCycle: {
    type: String,
    enum: ['10-day', '15-day', 'monthly', 'custom'],
    default: '15-day'
  },
  enableWhatsApp: {
    type: Boolean,
    default: false
  },
  enableSMS: {
    type: Boolean,
    default: false
  },
  whatsappProvider: {
    type: String,
    enum: ['development', 'meta'],
    default: 'development'
  },
  whatsappApiUrl: {
    type: String,
    default: 'https://api.whatsapp.example.com/v1/messages'
  },
  whatsappApiKey: {
    type: String,
    default: ''
  },
  whatsappSenderNumber: {
    type: String,
    default: ''
  },
  smsProvider: {
    type: String,
    enum: ['development', 'twilio'],
    default: 'development'
  },
  smsApiUrl: {
    type: String,
    default: ''
  },
  smsApiKey: {
    type: String,
    default: ''
  },
  smsSenderId: {
    type: String,
    default: ''
  },
  rateMode: {
    type: String,
    enum: ['fat-only', 'fat-snf', 'fixed'],
    default: 'fat-snf'
  },
  language: {
    type: String,
    enum: ['en', 'te'],
    default: 'en'
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  printLayout: {
    type: String,
    enum: ['a4', 'thermal'],
    default: 'a4'
  },
  backupFrequency: {
    type: String,
    enum: ['disabled', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  backupRetentionDays: {
    type: Number,
    default: 30
  },
  sessionTimeout: {
    type: Number,
    default: 30
  },
  defaultMilkType: {
    type: String,
    enum: ['cow', 'buffalo'],
    default: 'buffalo'
  },
  rememberMilkType: {
    type: Boolean,
    default: false
  },
  defaultShift: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'morning'
  },
  useFarmerPreferredMilkType: {
    type: Boolean,
    default: false
  },
  rememberFarmerMilkType: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt date before saving
DairyProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DairyProfile', DairyProfileSchema);
