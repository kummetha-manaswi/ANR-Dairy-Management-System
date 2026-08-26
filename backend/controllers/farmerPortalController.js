const Farmer = require('../models/Farmer');
const MilkCollection = require('../models/MilkCollection');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const NotificationLog = require('../models/NotificationLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const bcrypt = require('bcryptjs');

// Helper to normalize dates to midnight UTC
const normalizeDate = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// @desc    Authenticate farmer & get token
// @route   POST /api/v1/auth/farmer/login
// @access  Public
exports.farmerLogin = async (req, res, next) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return next(new ErrorResponse('Please provide Farmer ID or mobile number and password', 400));
    }

    // Clean loginId: trim it
    const cleanId = loginId.trim();

    // Query either by phone or farmerCode (case-insensitive for farmerCode)
    const isPhone = /^[6-9]\d{9}$/.test(cleanId);
    const query = { isDeleted: false };
    if (isPhone) {
      query.phone = cleanId;
    } else {
      query.farmerCode = new RegExp('^' + cleanId + '$', 'i');
    }

    const farmer = await Farmer.findOne(query).select('+password');
    if (!farmer) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Verify password
    const isMatch = await farmer.matchPassword(password);
    if (!isMatch) {
      if (!farmer.isActivated) {
        return next(new ErrorResponse('Please complete First-Time Login to activate your account.', 401));
      }
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    if (!farmer.isActivated) {
      return next(new ErrorResponse('Please complete First-Time Login to activate your account.', 401));
    }

    if (!farmer.isLoginEnabled) {
      return next(new ErrorResponse('Farmer portal access is disabled. Contact your administrator.', 403));
    }

    if (farmer.status !== 'active') {
      return next(new ErrorResponse('Your farmer account is suspended or inactive.', 403));
    }

    // Generate JWT token
    const token = farmer.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Farmer authenticated successfully',
      data: {
        token,
        user: {
          id: farmer._id,
          name: farmer.name,
          phone: farmer.phone,
          farmerCode: farmer.farmerCode,
          village: farmer.village,
          role: 'farmer',
          mustChangePassword: farmer.mustChangePassword
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary statistics for the logged-in farmer
// @route   GET /api/v1/farmers/portal/dashboard
// @access  Private (Farmer Only)
exports.getFarmerDashboard = async (req, res, next) => {
  try {
    const farmerId = req.user.id;
    const today = normalizeDate(new Date());

    // Today's Collections
    const todayCollections = await MilkCollection.find({
      farmer: farmerId,
      date: today
    });

    let todayLiters = 0;
    let todayAmount = 0;
    todayCollections.forEach(col => {
      todayLiters += col.quantity;
      todayAmount += col.totalAmount;
    });

    // Current Billing Cycle Amount: Net amount of the latest generated invoice
    const latestInvoice = await Invoice.findOne({ farmer: farmerId, status: { $ne: 'Cancelled' } })
      .sort({ generatedDate: -1 });
    
    const currentBillingAmount = latestInvoice ? latestInvoice.netAmount : 0;

    // Outstanding Pending Payments across all Invoices
    const invoices = await Invoice.find({ farmer: farmerId, status: { $in: ['Generated', 'Draft'] } });
    let pendingPayment = 0;
    invoices.forEach(inv => {
      pendingPayment += inv.pendingAmount;
    });

    // Last Payment details
    const lastPaymentRec = await Payment.findOne({ farmer: farmerId }).sort({ paymentDate: -1 });
    const lastPayment = lastPaymentRec ? lastPaymentRec.paidAmount : 0;

    res.status(200).json({
      success: true,
      message: 'Farmer portal dashboard stats retrieved successfully',
      data: {
        todayMilk: parseFloat(todayLiters.toFixed(2)),
        todayAmount: parseFloat(todayAmount.toFixed(2)),
        currentBillingAmount: parseFloat(currentBillingAmount.toFixed(2)),
        pendingPayment: parseFloat(pendingPayment.toFixed(2)),
        lastPayment: parseFloat(lastPayment.toFixed(2))
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Farmer Milk Collection history
// @route   GET /api/v1/farmers/portal/collections
// @access  Private (Farmer Only)
exports.getFarmerCollections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { farmer: req.user.id };

    const total = await MilkCollection.countDocuments(query);
    const collections = await MilkCollection.find(query)
      .sort({ date: -1, shift: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Collections history retrieved successfully',
      data: {
        collections,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Farmer Invoices/Bills history
// @route   GET /api/v1/farmers/portal/invoices
// @access  Private (Farmer Only)
exports.getFarmerInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { farmer: req.user.id, status: { $ne: 'Cancelled' } };

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ generatedDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        invoices,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Farmer Payments list
// @route   GET /api/v1/farmers/portal/payments
// @access  Private (Farmer Only)
exports.getFarmerPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { farmer: req.user.id };

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('invoice', 'invoiceNumber')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Payments history retrieved successfully',
      data: {
        payments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements and logs sent to farmer
// @route   GET /api/v1/farmers/portal/notifications
// @access  Private (Farmer Only)
exports.getFarmerNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch announcements meant for this farmer specifically, or bulk/general alerts
    const query = {
      $or: [
        { farmer: req.user.id },
        { farmer: null, type: 'bulk' }
      ]
    };

    const total = await NotificationLog.countDocuments(query);
    const notifications = await NotificationLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Notifications log retrieved successfully',
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change farmer password self-service
// @route   PUT /api/v1/auth/farmer/change-password
// @access  Private (Farmer Only)
exports.changeFarmerPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please supply current and new passwords', 400));
    }

    if (newPassword.length < 6) {
      return next(new ErrorResponse('New password must be at least 6 characters', 400));
    }

    // Retrieve farmer explicitly with password select
    const farmer = await Farmer.findById(req.user.id).select('+password');
    if (!farmer) {
      return next(new ErrorResponse('Farmer account not found', 404));
    }

    // Match current password
    const isMatch = await farmer.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Incorrect current password', 401));
    }

    // Assign new password
    farmer.password = newPassword;
    farmer.mustChangePassword = false;
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update farmer portal profile self-service (banks, upi, profile picture)
// @route   PUT /api/v1/farmers/portal/profile
// @access  Private (Farmer Only)
exports.updateFarmerProfile = async (req, res, next) => {
  try {
    const {
      bankHolderName,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      upiId
    } = req.body;

    const farmer = await Farmer.findById(req.user.id);
    if (!farmer) {
      return next(new ErrorResponse('Farmer account not found', 404));
    }

    // Update optional bank details
    if (bankHolderName !== undefined) farmer.bankDetails.accountHolderName = bankHolderName;
    if (bankAccountNumber !== undefined) farmer.bankDetails.accountNumber = bankAccountNumber;
    if (bankIfscCode !== undefined) farmer.bankDetails.ifscCode = bankIfscCode;
    if (bankName !== undefined) farmer.bankDetails.bankName = bankName;
    if (upiId !== undefined) farmer.upiId = upiId;

    // Handle photo file replacement
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      if (farmer.photo) {
        const oldPhotoPath = path.join(__dirname, '..', '..', farmer.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      farmer.photo = `/uploads/${req.file.filename}`;
    }

    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully',
      data: farmer,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register password for farmer (First-time activation)
// @route   POST /api/v1/auth/farmer/first-login
// @access  Public
exports.firstTimeFarmerLogin = async (req, res, next) => {
  try {
    const { farmerCode, phone, password } = req.body;

    if (!farmerCode || !phone || !password) {
      return next(new ErrorResponse('Please provide Farmer ID, mobile number, and password', 400));
    }

    if (password.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    // Find farmer matching both details
    const farmer = await Farmer.findOne({
      farmerCode: new RegExp('^' + farmerCode.trim() + '$', 'i'),
      phone: phone.trim(),
      isDeleted: false
    });

    if (!farmer || !farmer.isLoginEnabled) {
      return next(new ErrorResponse('Invalid credentials.', 400));
    }

    farmer.password = password;
    farmer.isActivated = true;
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Farmer account activated successfully. Please log in.',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password for farmer (Forgot password recovery)
// @route   POST /api/v1/auth/farmer/forgot-password
// @access  Public
exports.forgotFarmerPassword = async (req, res, next) => {
  try {
    const { farmerCode, phone, newPassword } = req.body;

    if (!farmerCode || !phone || !newPassword) {
      return next(new ErrorResponse('Please provide Farmer ID, mobile number, and new password', 400));
    }

    if (newPassword.length < 6) {
      return next(new ErrorResponse('Password must be at least 6 characters', 400));
    }

    // Find farmer matching both details
    const farmer = await Farmer.findOne({
      farmerCode: new RegExp('^' + farmerCode.trim() + '$', 'i'),
      phone: phone.trim(),
      isDeleted: false
    });

    if (!farmer || !farmer.isLoginEnabled) {
      // Return generic message to prevent verification leaks
      return next(new ErrorResponse('Invalid credentials.', 401));
    }

    farmer.password = newPassword;
    farmer.isActivated = true; // reactivate / keep active
    await farmer.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in.',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
