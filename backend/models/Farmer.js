const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const FarmerSchema = new mongoose.Schema({
  farmerCode: {
    type: String,
    unique: true
    // Generated automatically in the pre-save hook
  },
  name: {
    type: String,
    required: [true, 'Please add farmer name'],
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Please add farmer phone number'],
    match: [/^[6-9]\d{9}$/, 'Please add a valid 10-digit phone number']
  },
  isLoginEnabled: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  village: {
    type: String,
    required: [true, 'Please add farmer village'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' }
  },
  upiId: {
    type: String,
    trim: true,
    default: ''
  },
  milkType: {
    type: String,
    enum: ['cow', 'buffalo', 'mix'],
    default: 'cow'
  },
  collectionPreference: {
    type: String,
    enum: ['morning', 'evening', 'both', 'flexible'],
    default: 'flexible'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
);

// Auto-generate farmerCode in format ANRF0001, ANRF0002...
FarmerSchema.pre('save', async function(next) {
  if (!this.farmerCode) {
    try {
      // Find the last registered farmer by sorting farmerCode in descending order
      const lastFarmer = await this.constructor.findOne({}, { farmerCode: 1 }, { sort: { farmerCode: -1 } });
      let nextNum = 1;
      
      if (lastFarmer && lastFarmer.farmerCode) {
        const matches = lastFarmer.farmerCode.match(/ANRF(\d+)/);
        if (matches && matches[1]) {
          nextNum = parseInt(matches[1], 10) + 1;
        }
      }
      
      this.farmerCode = `ANRF${String(nextNum).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Auto-encrypt password using bcrypt before saving
FarmerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match farmer entered password to hashed password in database
FarmerSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
FarmerSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: 'farmer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = mongoose.model('Farmer', FarmerSchema);
