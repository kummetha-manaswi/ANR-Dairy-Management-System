const Farmer = require('../models/Farmer');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const fs = require('fs');
const path = require('path');

// @desc    Register a new farmer
// @route   POST /api/v1/farmers
// @access  Private (Admin & Employee)
exports.addFarmer = async (req, res, next) => {
  try {
    const {
      farmerCode,
      name,
      phone,
      village,
      address,
      bankHolderName,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      upiId,
      milkType,
      collectionPreference,
      isLoginEnabled,
      password,
      reason
    } = req.body;

    // Check if phone number is empty
    if (!name || !phone || !village) {
      return next(new ErrorResponse('Name, phone, and village fields are required', 400));
    }

    const loginEnabled = isLoginEnabled === 'true' || isLoginEnabled === true;

    // Photo file path
    let photoPath = '';
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    }

    // Map bank details
    const bankDetails = {
      accountHolderName: bankHolderName || '',
      accountNumber: bankAccountNumber || '',
      ifscCode: bankIfscCode || '',
      bankName: bankName || ''
    };

    // Create farmer record
    const farmer = await Farmer.create({
      farmerCode: farmerCode ? farmerCode.trim() : undefined,
      name,
      phone,
      village,
      address: address || '',
      photo: photoPath,
      bankDetails,
      upiId: upiId || '',
      milkType: milkType || 'cow',
      collectionPreference: collectionPreference || 'flexible',
      isLoginEnabled: loginEnabled,
      password: loginEnabled && password ? password : undefined,
      isActivated: false,
      status: 'active'
    });

    // Log this action to Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'FARMER_ADDED',
      collectionTarget: 'Farmer',
      recordId: farmer._id,
      previousState: null,
      newState: farmer.toObject(),
      reason: reason || `Farmer registered with ID: ${farmer.farmerCode}`
    });

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: farmer,
      errors: null
    });
  } catch (error) {
    // If saving fails and file was uploaded, remove the file
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Get all active registered farmers (with search, pagination, filter)
// @route   GET /api/v1/farmers
// @access  Private (Admin & Employee)
exports.getFarmers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { search, milkType, collectionPreference, status } = req.query;

    // Base query filters out soft-deleted farmers
    const query = { isDeleted: false };

    // Apply filters
    if (milkType) {
      query.milkType = milkType;
    }
    if (collectionPreference) {
      query.collectionPreference = collectionPreference;
    }
    if (status) {
      query.status = status;
    }

    // Apply smart search matching name, code, phone, or village
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { farmerCode: searchRegex },
        { phone: searchRegex },
        { village: searchRegex }
      ];
    }

    // Sort operations
    const sortBy = req.query.sortBy || 'farmerCode';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    const total = await Farmer.countDocuments(query);
    const farmers = await Farmer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Farmers retrieved successfully',
      data: {
        farmers,
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

// @desc    Get farmer by ID
// @route   GET /api/v1/farmers/:id
// @access  Private (Admin & Employee)
exports.getFarmerById = async (req, res, next) => {
  try {
    // If the logged in user is a farmer, they can only fetch their own profile
    if (req.user.role === 'farmer' && req.user.id.toString() !== req.params.id.toString()) {
      return next(new ErrorResponse('Not authorized to access this farmer profile', 403));
    }

    const farmer = await Farmer.findOne({ _id: req.params.id, isDeleted: false });

    if (!farmer) {
      return next(new ErrorResponse(`Farmer not found with ID of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Farmer profile retrieved successfully',
      data: farmer,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update farmer details
// @route   PUT /api/v1/farmers/:id
// @access  Private (Admin & Employee)
exports.updateFarmer = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      village,
      address,
      bankHolderName,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      upiId,
      milkType,
      collectionPreference,
      isLoginEnabled,
      password,
      reason
    } = req.body;

    let farmer = await Farmer.findOne({ _id: req.params.id, isDeleted: false });
    if (!farmer) {
      return next(new ErrorResponse(`Farmer not found with ID of ${req.params.id}`, 404));
    }

    const previousState = farmer.toObject();

    // Map fields
    if (name) farmer.name = name;
    if (phone) farmer.phone = phone;
    if (village) farmer.village = village;
    if (address !== undefined) farmer.address = address;
    if (upiId !== undefined) farmer.upiId = upiId;
    if (milkType) farmer.milkType = milkType;
    if (collectionPreference) farmer.collectionPreference = collectionPreference;

    if (isLoginEnabled !== undefined) {
      const loginEnabled = isLoginEnabled === 'true' || isLoginEnabled === true;
      if (loginEnabled && !farmer.isLoginEnabled) {
        if (!farmer.password && !password) {
          farmer.isActivated = false;
        }
      }
      farmer.isLoginEnabled = loginEnabled;
    }

    if (password) {
      farmer.password = password;
      farmer.isActivated = false; // Reset activation so they must activate / change on first login
    }

    // Map bank details
    if (bankHolderName !== undefined) farmer.bankDetails.accountHolderName = bankHolderName;
    if (bankAccountNumber !== undefined) farmer.bankDetails.accountNumber = bankAccountNumber;
    if (bankIfscCode !== undefined) farmer.bankDetails.ifscCode = bankIfscCode;
    if (bankName !== undefined) farmer.bankDetails.bankName = bankName;

    // Handle photo upload / replacement
    if (req.file) {
      // Delete old photo if it exists
      if (farmer.photo) {
        const oldPhotoPath = path.join(__dirname, '..', farmer.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      farmer.photo = `/uploads/${req.file.filename}`;
    }

    await farmer.save();
    const newState = farmer.toObject();

    // Log action to Audit Logs
    await AuditLog.create({
      user: req.user._id,
      action: 'FARMER_EDITED',
      collectionTarget: 'Farmer',
      recordId: farmer._id,
      previousState,
      newState,
      reason: reason || `Farmer details updated for ID: ${farmer.farmerCode}`
    });

    res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: farmer,
      errors: null
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

// @desc    Change farmer status (Activate / Deactivate)
// @route   PATCH /api/v1/farmers/:id/status
// @access  Private (Admin & Employee)
exports.toggleFarmerStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return next(new ErrorResponse('Please provide a valid status (active or inactive)', 400));
    }

    let farmer = await Farmer.findOne({ _id: req.params.id, isDeleted: false });
    if (!farmer) {
      return next(new ErrorResponse(`Farmer not found with ID of ${req.params.id}`, 404));
    }

    const previousState = farmer.toObject();
    farmer.status = status;
    await farmer.save();
    const newState = farmer.toObject();

    const action = status === 'active' ? 'FARMER_ACTIVATED' : 'FARMER_DEACTIVATED';

    // Log to Audit Log
    await AuditLog.create({
      user: req.user._id,
      action,
      collectionTarget: 'Farmer',
      recordId: farmer._id,
      previousState,
      newState,
      reason: reason || `Farmer status toggled to: ${status} for ID: ${farmer.farmerCode}`
    });

    res.status(200).json({
      success: true,
      message: `Farmer successfully ${status === 'active' ? 'activated' : 'deactivated'}`,
      data: farmer,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a farmer
// @route   DELETE /api/v1/farmers/:id
// @access  Private (Admin Only)
exports.softDeleteFarmer = async (req, res, next) => {
  try {
    const { reason } = req.body;

    let farmer = await Farmer.findOne({ _id: req.params.id, isDeleted: false });
    if (!farmer) {
      return next(new ErrorResponse(`Farmer not found with ID of ${req.params.id}`, 404));
    }

    const previousState = farmer.toObject();
    
    // Perform soft delete
    farmer.isDeleted = true;
    farmer.status = 'inactive';
    await farmer.save();
    const newState = farmer.toObject();

    // Log to Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'FARMER_DELETED',
      collectionTarget: 'Farmer',
      recordId: farmer._id,
      previousState,
      newState,
      reason: reason || `Farmer soft-deleted with ID: ${farmer.farmerCode}`
    });

    res.status(200).json({
      success: true,
      message: 'Farmer deleted successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
