const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// Strong password validator helper (Refinement 5)
const isStrongPassword = (password) => {
  if (!password) return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

// @desc    Change own password
// @route   PUT /api/v1/security/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide current and new passwords', 400));
    }

    // Get user from database with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Validate strong password policy (Refinement 5)
    if (!isStrongPassword(newPassword)) {
      return next(new ErrorResponse('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 400));
    }

    // Save new password
    user.password = newPassword;
    await user.save();

    // Terminate all other sessions for this user (except the current one) to enforce re-authentication
    if (req.userSessionId) {
      await UserSession.updateMany(
        { user: user._id, _id: { $ne: req.userSessionId }, isActive: true },
        { isActive: false, logoutTime: new Date() }
      );
    }

    // Create Audit Log
    await AuditLog.create({
      user: user._id,
      action: 'USER_PASSWORD_CHANGED',
      collectionTarget: 'User',
      recordId: user._id,
      reason: 'User changed their own password'
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. Other active sessions terminated.',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List active sessions
// @route   GET /api/v1/security/sessions
// @access  Private
exports.getActiveSessions = async (req, res, next) => {
  try {
    let query = { isActive: true };

    // Employees can only view their own sessions. Admins can view all users' sessions (Refinement 10).
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const sessions = await UserSession.find(query)
      .populate('user', 'name phone role')
      .sort({ loginTime: -1 });

    res.status(200).json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: sessions,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force logout / terminate an individual session
// @route   DELETE /api/v1/security/sessions/:id
// @access  Private
exports.terminateSession = async (req, res, next) => {
  try {
    const session = await UserSession.findById(req.params.id);

    if (!session) {
      return next(new ErrorResponse('Session not found', 404));
    }

    // Employees can only terminate their own sessions. Admins can terminate any session (Refinement 10).
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to terminate this session', 403));
    }

    // Mutate state to inactive and set logout time
    session.isActive = false;
    session.logoutTime = new Date();
    await session.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'SESSION_TERMINATED',
      collectionTarget: 'UserSession',
      recordId: session._id,
      reason: `User session terminated. Request initiated by ${req.user.role}`
    });

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout all other active sessions
// @route   POST /api/v1/security/sessions/logout-all
// @access  Private
exports.logoutAllDevices = async (req, res, next) => {
  try {
    const currentSessionId = req.userSessionId;
    let filter = { user: req.user._id, isActive: true };

    if (currentSessionId) {
      filter._id = { $ne: currentSessionId };
    }

    // Update sessions
    await UserSession.updateMany(filter, { isActive: false, logoutTime: new Date() });

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'SESSIONS_LOGOUT_ALL',
      collectionTarget: 'UserSession',
      recordId: req.user._id,
      reason: 'User logged out of all other active devices'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out of all other devices',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get login history (active and completed sessions)
// @route   GET /api/v1/security/history
// @access  Private
exports.getLoginHistory = async (req, res, next) => {
  try {
    let query = {};

    // Non-admins can only see their own login history
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const history = await UserSession.find(query)
      .populate('user', 'name phone role')
      .sort({ loginTime: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      message: 'Login history retrieved successfully',
      data: history,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/v1/security/logs
// @access  Private (Admin Only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    // Only Admin can retrieve global audit trails
    if (req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access security audit trails', 403));
    }

    const logs = await AuditLog.find({})
      .populate('user', 'name phone role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      message: 'Security audit logs retrieved successfully',
      data: logs,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
