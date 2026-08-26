const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const { isStrongPassword } = require('../utils/passwordValidator');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin Only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new user
// @route   POST /api/v1/users
// @access  Private (Admin Only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password || !role) {
      return next(new ErrorResponse('Please provide name, phone, password, and role', 400));
    }

    // Validate strong password policy (Refinement 5)
    if (!isStrongPassword(password)) {
      return next(new ErrorResponse('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 400));
    }

    // Check if phone number is registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return next(new ErrorResponse('Phone number is already registered', 400));
    }

    const user = await User.create({
      name,
      phone,
      password,
      role,
      status: 'active'
    });

    // Write audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'USER_CREATED',
      collectionTarget: 'User',
      recordId: user._id,
      newState: { name, phone, role, status: 'active' },
      reason: 'Administrator registered new system user account'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit user details
// @route   PUT /api/v1/users/:id
// @access  Private (Admin Only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, role } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const previousState = user.toObject();

    if (name) user.name = name;
    if (phone) {
      // Check if phone number is taken by another user
      const takenUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (takenUser) {
        return next(new ErrorResponse('Phone number is already registered by another account', 400));
      }
      user.phone = phone;
    }
    if (role) user.role = role;

    await user.save();
    const newState = user.toObject();

    // Write audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'USER_UPDATED',
      collectionTarget: 'User',
      recordId: user._id,
      previousState,
      newState,
      reason: 'Administrator updated system user details'
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Deactivate / Reactivate / Suspend)
// @route   PUT /api/v1/users/:id/status
// @access  Private (Admin Only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Refinement 3: Add suspended user status
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return next(new ErrorResponse('Please provide a valid status: active, inactive, or suspended', 400));
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Prevent admin from changing their own status
    if (user._id.toString() === req.user._id.toString()) {
      return next(new ErrorResponse('You cannot modify your own administrator account status', 400));
    }

    const previousState = user.toObject();
    user.status = status;
    await user.save();
    const newState = user.toObject();

    // Terminate all sessions if deactivating or suspending
    if (status === 'inactive' || status === 'suspended') {
      const UserSession = require('../models/UserSession');
      // Set isActive: false and populate logoutTime
      await UserSession.updateMany(
        { user: user._id, isActive: true }, 
        { isActive: false, logoutTime: new Date() }
      );
    }

    // Write audit log
    await AuditLog.create({
      user: req.user._id,
      action: `USER_STATUS_${status.toUpperCase()}`,
      collectionTarget: 'User',
      recordId: user._id,
      previousState,
      newState,
      reason: `Administrator changed user account status to ${status}`
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status} successfully`,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        status: user.status
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset user password
// @route   PUT /api/v1/users/:id/reset-password
// @access  Private (Admin Only)
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Validate strong password policy (Refinement 5)
    if (!isStrongPassword(password)) {
      return next(new ErrorResponse('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 400));
    }

    let user = await User.findById(req.params.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Update password
    user.password = password;
    user.mustChangePassword = true;
    await user.save();

    // Terminate all current active sessions for that user to force relogin
    const UserSession = require('../models/UserSession');
    await UserSession.updateMany(
      { user: user._id, isActive: true }, 
      { isActive: false, logoutTime: new Date() }
    );

    // Write audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'USER_PASSWORD_RESET',
      collectionTarget: 'User',
      recordId: user._id,
      reason: 'Administrator forced password reset on user account'
    });

    res.status(200).json({
      success: true,
      message: 'User password reset and active sessions terminated successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
