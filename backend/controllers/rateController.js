const RateChart = require('../models/RateChart');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// Shared utility method to compute milk rate based on a RateChart instance
const calculateRate = (chart, fat, snf) => {
  let rate = chart.baseRate;

  // 1. SNF Deduction Check
  if (snf < chart.snfThreshold) {
    rate -= chart.deduction;
  }

  // Enforce rate cannot be negative
  return Math.max(0, parseFloat(rate.toFixed(2)));
};

// Export the calculation utility for direct import by collection controller
exports.calculateRate = calculateRate;

// @desc    Create a new Rate Chart
// @route   POST /api/v1/rates
// @access  Private (Admin Only)
exports.createRateChart = async (req, res, next) => {
  try {
    const {
      name,
      milkType,
      effectiveFrom,
      baseRate,
      snfThreshold,
      deduction,
      standardFat,
      fatBonus,
      fatPenalty,
      reason
    } = req.body;

    if (!name || !milkType || baseRate === undefined || snfThreshold === undefined) {
      return next(new ErrorResponse('Name, milkType, baseRate, and snfThreshold are required', 400));
    }

    const chart = await RateChart.create({
      name,
      milkType,
      effectiveFrom: effectiveFrom || Date.now(),
      baseRate: parseFloat(baseRate),
      snfThreshold: parseFloat(snfThreshold),
      deduction: deduction !== undefined ? parseFloat(deduction) : 0,
      standardFat: standardFat !== undefined ? parseFloat(standardFat) : 0,
      fatBonus: fatBonus !== undefined ? parseFloat(fatBonus) : 0,
      fatPenalty: fatPenalty !== undefined ? parseFloat(fatPenalty) : 0
    });

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'RATE_CHART_CREATED',
      collectionTarget: 'RateChart',
      recordId: chart._id,
      previousState: null,
      newState: chart.toObject(),
      reason: reason || `Rate chart '${name}' created for ${milkType} milk.`
    });

    res.status(201).json({
      success: true,
      message: 'Rate chart created successfully',
      data: chart,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Rate Charts
// @route   GET /api/v1/rates
// @access  Private (Admin & Employee)
exports.getRateCharts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { milkType, isActive, search } = req.query;

    const query = {};
    if (milkType) query.milkType = milkType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const total = await RateChart.countDocuments(query);
    const charts = await RateChart.find(query)
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Rate charts retrieved successfully',
      data: {
        charts,
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

// @desc    Get Rate Chart by ID
// @route   GET /api/v1/rates/:id
// @access  Private (Admin & Employee)
exports.getRateChartById = async (req, res, next) => {
  try {
    const chart = await RateChart.findById(req.params.id);
    if (!chart) {
      return next(new ErrorResponse(`Rate chart not found with ID ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Rate chart retrieved successfully',
      data: chart,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate a Rate Chart (Deactivates others for the same milkType)
// @route   PUT /api/v1/rates/:id/activate
// @access  Private (Admin Only)
exports.activateRateChart = async (req, res, next) => {
  try {
    const { reason } = req.body;
    let chart = await RateChart.findById(req.params.id);
    if (!chart) {
      return next(new ErrorResponse(`Rate chart not found with ID ${req.params.id}`, 404));
    }

    if (chart.isActive) {
      return next(new ErrorResponse('Rate chart is already active', 400));
    }

    const previousState = chart.toObject();

    // 1. Deactivate all active charts for the same milkType
    await RateChart.updateMany(
      { milkType: chart.milkType, isActive: true },
      { isActive: false }
    );

    // 2. Activate the target chart
    chart.isActive = true;
    await chart.save();
    const newState = chart.toObject();

    // Log to Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'RATE_CHART_ACTIVATED',
      collectionTarget: 'RateChart',
      recordId: chart._id,
      previousState,
      newState,
      reason: reason || `Activated rate chart: ${chart.name} for ${chart.milkType} milk.`
    });

    res.status(200).json({
      success: true,
      message: `Rate chart '${chart.name}' activated successfully`,
      data: chart,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Rate Chart
// @route   PUT /api/v1/rates/:id
// @access  Private (Admin Only)
exports.updateRateChart = async (req, res, next) => {
  try {
    const {
      name,
      effectiveFrom,
      baseRate,
      snfThreshold,
      deduction,
      standardFat,
      fatBonus,
      fatPenalty,
      reason
    } = req.body;

    let chart = await RateChart.findById(req.params.id);
    if (!chart) {
      return next(new ErrorResponse(`Rate chart not found with ID ${req.params.id}`, 404));
    }

    if (chart.isActive) {
      return next(new ErrorResponse('Active rate charts cannot be modified. Deactivate first or create a new chart.', 400));
    }

    const previousState = chart.toObject();

    // Map modifications
    if (name) chart.name = name;
    if (effectiveFrom) chart.effectiveFrom = effectiveFrom;
    if (baseRate !== undefined) chart.baseRate = parseFloat(baseRate);
    if (snfThreshold !== undefined) chart.snfThreshold = parseFloat(snfThreshold);
    if (deduction !== undefined) chart.deduction = parseFloat(deduction);
    if (standardFat !== undefined) chart.standardFat = parseFloat(standardFat);
    if (fatBonus !== undefined) chart.fatBonus = parseFloat(fatBonus);
    if (fatPenalty !== undefined) chart.fatPenalty = parseFloat(fatPenalty);

    await chart.save();
    const newState = chart.toObject();

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'RATE_CHART_UPDATED',
      collectionTarget: 'RateChart',
      recordId: chart._id,
      previousState,
      newState,
      reason: reason || `Updated rate chart details for: ${chart.name}`
    });

    res.status(200).json({
      success: true,
      message: 'Rate chart updated successfully',
      data: chart,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live preview calculate rate per liter (Helper endpoint for UI forms)
// @route   GET /api/v1/rates/calculate
// @access  Private (Admin & Employee)
exports.calculateRatePreview = async (req, res, next) => {
  try {
    const { milkType, fat, snf } = req.query;

    if (!milkType || !fat || !snf) {
      return next(new ErrorResponse('Please supply milkType, fat, and snf parameters', 400));
    }

    const fatNum = parseFloat(fat);
    const snfNum = parseFloat(snf);

    // Fetch active rate chart for the given milkType
    const activeChart = await RateChart.findOne({ milkType, isActive: true });
    if (!activeChart) {
      return next(new ErrorResponse(`No active rate chart configured for ${milkType} milk.`, 404));
    }

    const rate = calculateRate(activeChart, fatNum, snfNum);

    res.status(200).json({
      success: true,
      message: 'Rate preview calculated successfully',
      data: {
        rate,
        rateChartId: activeChart._id,
        rateChartName: activeChart.name
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Rate Chart
// @route   DELETE /api/v1/rates/:id
// @access  Private (Admin Only)
exports.deleteRateChart = async (req, res, next) => {
  try {
    const MilkCollection = require('../models/MilkCollection');
    const chart = await RateChart.findById(req.params.id);
    
    if (!chart) {
      return next(new ErrorResponse(`Rate chart not found with ID ${req.params.id}`, 404));
    }

    // Reject deletion if active
    if (chart.isActive) {
      return next(new ErrorResponse('Active rate charts cannot be deleted', 400));
    }

    // Check whether MilkCollection records reference this rate chart
    const referenced = await MilkCollection.exists({ rateChartUsed: chart._id });
    if (referenced) {
      return next(new ErrorResponse('This rate chart is used by historical milk collections and cannot be deleted.', 400));
    }

    const previousState = chart.toObject();

    // Delete when safe
    await RateChart.findByIdAndDelete(chart._id);

    // Create AuditLog entry
    await AuditLog.create({
      user: req.user._id,
      action: 'RATE_CHART_DELETED',
      collectionTarget: 'RateChart',
      recordId: chart._id,
      previousState,
      newState: null,
      reason: req.body.reason || `Deleted rate chart: ${chart.name}`
    });

    res.status(200).json({
      success: true,
      message: 'Rate chart deleted successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
