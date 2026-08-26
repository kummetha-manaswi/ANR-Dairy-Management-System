const jwt = require('jsonwebtoken');
const { ErrorResponse } = require('./errorMiddleware');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    // Fallback to query parameter token for file streams
    token = req.query.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support farmer login portal
    if (decoded.role === 'farmer') {
      const Farmer = require('../models/Farmer');
      const farmer = await Farmer.findOne({ _id: decoded.id, isDeleted: false });
      
      if (!farmer) {
        return next(new ErrorResponse('Farmer account no longer exists', 401));
      }
      if (farmer.status !== 'active' || !farmer.isLoginEnabled) {
        return next(new ErrorResponse('Farmer account access has been disabled', 403));
      }

      req.user = {
        _id: farmer._id,
        id: farmer._id,
        name: farmer.name,
        phone: farmer.phone,
        role: 'farmer',
        mustChangePassword: farmer.mustChangePassword
      };

      // Force password change check for farmers
      if (farmer.mustChangePassword && req.originalUrl.split('?')[0] !== '/api/v1/auth/farmer/change-password') {
        return next(new ErrorResponse('Password change required. Please change your password to continue.', 412));
      }

      return next();
    }

    // Get user from database and attach to request
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorResponse('User no longer exists', 401));
    }

    if (req.user.status === 'inactive' || req.user.status === 'suspended') {
      return next(new ErrorResponse(`User account is ${req.user.status}`, 403));
    }

    // Session validation checks
    if (decoded.sessionId) {
      const UserSession = require('../models/UserSession');
      const session = await UserSession.findById(decoded.sessionId);
      if (!session || !session.isActive) {
        return next(new ErrorResponse('Session has been terminated. Please log in again.', 401));
      }
      // Attach session ID to request for subsequent security operations
      req.userSessionId = decoded.sessionId;
    }

    // Force password change check (allow only the change-password API to pass through)
    if (req.user.mustChangePassword && req.originalUrl.split('?')[0] !== '/api/v1/auth/change-password') {
      return next(new ErrorResponse('Password change required. Please change your password to continue.', 412));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize
};
