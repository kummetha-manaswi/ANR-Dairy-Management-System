const mongoose = require('mongoose');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const DairyProfile = require('../models/DairyProfile');
const { isStrongPassword } = require('../utils/passwordValidator');

// Simple User-Agent parser to identify browser and device type
const parseUserAgent = (ua) => {
  if (!ua) return { browser: 'Unknown Browser', device: 'Unknown Device' };
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|iceweasel/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opera|opr/i.test(ua)) {
    browser = 'Opera';
  }

  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      device = 'Tablet';
    } else {
      device = 'Mobile Phone';
    }
  }
  return { browser, device };
};

// Helper function to send token in response
const sendTokenResponse = async (user, statusCode, req, res) => {
  // Generate session ID
  const sessionId = new mongoose.Types.ObjectId();
  const rawUa = req ? req.headers['user-agent'] : '';
  const { browser, device } = parseUserAgent(rawUa);
  const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';

  // Create active session record
  await UserSession.create({
    _id: sessionId,
    user: user._id,
    deviceInfo: device,
    browser,
    ipAddress,
    isActive: true
  });

  // Create audit log for login event
  try {
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      collectionTarget: 'UserSession',
      recordId: sessionId,
      newState: { deviceInfo: device, browser, ipAddress },
      reason: 'Successful user login and session initialization'
    });
  } catch (err) {
    console.error('Failed to write login audit log:', err);
  }

  // Create token with sessionId
  const token = user.getSignedJwtToken(sessionId);

  // Fetch dairy profile to get session timeout setting
  const profile = await DairyProfile.findOne();
  const sessionTimeout = profile ? (profile.sessionTimeout || 30) : 30;

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'User registered successfully' : 'User logged in successfully',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status,
        mustChangePassword: user.mustChangePassword || false
      },
      sessionTimeout
    },
    errors: null
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public (for initial admin setup) / Private (Admin only, to register employees)
exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, role } = req.body;

    let finalRole = role || 'employee';

    // Only admins can register new users (this is verified in routes and here)
    if (!req.user || req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          'Please authenticate as Admin to register new users.',
          401
        )
      );
    }

    // Check if phone number is already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ErrorResponse('Phone number is already registered', 400));
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      password,
      role: finalRole
    });

    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Validate phone & password
    if (!phone || !password) {
      return next(new ErrorResponse('Please provide a phone number and password', 400));
    }

    // Check for user
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return next(new ErrorResponse('User account is deactivated. Contact system admin.', 403));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          role: req.user.role,
          status: req.user.status,
          createdAt: req.user.createdAt
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check whether an Administrator account exists (First-time setup check)
// @route   GET /api/v1/auth/setup-status
// @access  Public
exports.getSetupStatus = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    const setupRequired = adminCount === 0;

    res.status(200).json({
      success: true,
      message: 'Setup status checked successfully',
      data: {
        setupRequired
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register the first administrator (First-time setup)
// @route   POST /api/v1/auth/setup
// @access  Public (Only if no Administrator exists)
exports.setupAdmin = async (req, res, next) => {
  try {
    const { name, phone, password, confirmPassword, recoveryQuestion, recoveryAnswer } = req.body;

    // Check if an admin already exists
    const adminCount = await User.countDocuments({ role: 'admin', status: 'active' });
    if (adminCount > 0) {
      return next(new ErrorResponse('First-time setup has already been completed.', 400));
    }

    if (!name || !phone || !password || !confirmPassword || !recoveryQuestion || !recoveryAnswer) {
      return next(new ErrorResponse('Please provide name, phone, password, confirmPassword, recoveryQuestion, and recoveryAnswer', 400));
    }

    if (password !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }

    // Validate strong password
    if (!isStrongPassword(password)) {
      return next(
        new ErrorResponse(
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
          400
        )
      );
    }

    // Check if phone number is registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ErrorResponse('Phone number is already registered', 400));
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedAnswer = await bcrypt.hash(recoveryAnswer.toLowerCase().trim(), salt);

    // Create Admin user
    const user = await User.create({
      name,
      phone,
      password,
      role: 'admin',
      status: 'active',
      mustChangePassword: false,
      recoveryQuestion,
      recoveryAnswer: hashedAnswer
    });

    // Auto-initialize Dairy Profile if none exists
    const profileCount = await DairyProfile.countDocuments();
    if (profileCount === 0) {
      await DairyProfile.create({
        dairyName: 'ANR Dairy',
        ownerName: name,
        phone: phone,
        email: 'info@anrdairy.com',
        address: 'Dairy Office Address'
      });
    }

    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Change logged-in user's own password
// @route   PUT /api/v1/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide currentPassword and newPassword', 400));
    }

    // Validate strong password policy for the new password
    if (!isStrongPassword(newPassword)) {
      return next(
        new ErrorResponse(
          'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
          400
        )
      );
    }

    // Retrieve user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Incorrect current password', 401));
    }

    // Update password & clear mustChangePassword flag
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    // Terminate other active sessions for that user
    const UserSession = require('../models/UserSession');
    if (req.userSessionId) {
      await UserSession.updateMany(
        { user: user._id, _id: { $ne: req.userSessionId }, isActive: true },
        { isActive: false, logoutTime: new Date() }
      );
    } else {
      await UserSession.updateMany(
        { user: user._id, isActive: true },
        { isActive: false, logoutTime: new Date() }
      );
    }

    // Audit Log for password change
    await AuditLog.create({
      user: user._id,
      action: 'USER_PASSWORD_CHANGED',
      collectionTarget: 'User',
      recordId: user._id,
      reason: 'User successfully updated their own password'
    });

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

// @desc    Get Admin Recovery Question
// @route   POST /api/v1/auth/forgot-password/question
// @access  Public
exports.getRecoveryQuestion = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return next(new ErrorResponse('Please supply your phone number', 400));
    }

    const user = await User.findOne({ phone, role: 'admin' }).select('+recoveryQuestion');
    if (!user) {
      return next(new ErrorResponse('Administrator account not found', 404));
    }

    if (!user.recoveryQuestion) {
      return next(new ErrorResponse('No recovery question set for this account', 400));
    }

    res.status(200).json({
      success: true,
      message: 'Recovery question fetched successfully',
      data: {
        question: user.recoveryQuestion
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Admin Password using recovery answer
// @route   POST /api/v1/auth/forgot-password/reset
// @access  Public
exports.resetAdminPassword = async (req, res, next) => {
  try {
    const { phone, recoveryAnswer, newPassword } = req.body;
    if (!phone || !recoveryAnswer || !newPassword) {
      return next(new ErrorResponse('Please supply phone number, recovery answer, and new password', 400));
    }

    // Validate new strong password
    if (!isStrongPassword(newPassword)) {
      return next(
        new ErrorResponse(
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
          400
        )
      );
    }

    const user = await User.findOne({ phone, role: 'admin' }).select('+recoveryAnswer');
    if (!user) {
      return next(new ErrorResponse('Administrator account not found', 404));
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(recoveryAnswer.toLowerCase().trim(), user.recoveryAnswer);
    if (!isMatch) {
      return next(new ErrorResponse('Incorrect recovery answer', 401));
    }

    user.password = newPassword;
    await user.save();

    // Terminate all sessions for security
    const UserSession = require('../models/UserSession');
    await UserSession.updateMany(
      { user: user._id, isActive: true },
      { isActive: false, logoutTime: new Date() }
    );

    // Audit Log for password reset
    await AuditLog.create({
      user: user._id,
      action: 'USER_PASSWORD_RESET',
      collectionTarget: 'User',
      recordId: user._id,
      reason: 'Administrator password reset via account recovery question'
    });

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

// @desc    Get aggregate stats for public landing page
// @route   GET /api/v1/auth/public-stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
  try {
    const Farmer = require('../models/Farmer');
    const MilkCollection = require('../models/MilkCollection');

    const totalFarmers = await Farmer.countDocuments({ isDeleted: false });
    const activeFarmers = await Farmer.countDocuments({ status: 'active', isDeleted: false });
    
    // Aggregation pipeline for total quantity
    const collectionStats = await MilkCollection.aggregate([
      {
        $group: {
          _id: null,
          totalLiters: { $sum: "$quantity" },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    const totalLiters = collectionStats.length > 0 ? collectionStats[0].totalLiters : 0;
    const totalCollections = collectionStats.length > 0 ? collectionStats[0].totalCount : 0;

    res.status(200).json({
      success: true,
      message: 'Public stats retrieved successfully',
      data: {
        totalFarmers,
        activeFarmers,
        totalLiters: parseFloat(totalLiters.toFixed(2)),
        totalCollections
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
