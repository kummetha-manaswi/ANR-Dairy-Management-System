const NotificationLog = require('../models/NotificationLog');
const NotificationTemplate = require('../models/NotificationTemplate');
const Farmer = require('../models/Farmer');
const { sendNotification } = require('../services/notificationService');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// Default templates list with requested placeholder casing standards
const DEFAULT_TEMPLATES = [
  { type: 'collection', templateText: 'Dear {FarmerName}, {Liters}L of {MilkType} milk collected with FAT {FAT}% and SNF {SNF}% on {Date} ({Shift} shift). Rate: ₹{Rate}/L. Amount: ₹{Amount}. Thank you, {DairyName}.' },
  { type: 'bill', templateText: 'Dear {FarmerName}, Bill {BillNumber} generated for period {Date}. Qty: {Liters}L, Net Amount: ₹{Amount}. Thank you, {DairyName}.' },
  { type: 'payment', templateText: 'Dear {FarmerName}, Payout of ₹{Amount} has been processed via {PaymentMode} on {Date}. Thank you, {DairyName}.' },
  { type: 'custom', templateText: 'Dear {FarmerName}, message from {DairyName}.' }
];

// Seed templates helper
const getOrCreateTemplates = async () => {
  const templates = await NotificationTemplate.find();
  if (templates.length === 0) {
    const seeded = await NotificationTemplate.insertMany(DEFAULT_TEMPLATES);
    return seeded;
  }
  return templates;
};

// @desc    Get all editable templates
// @route   GET /api/v1/notifications/templates
// @access  Private (Admin Only)
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await getOrCreateTemplates();
    res.status(200).json({
      success: true,
      message: 'Templates retrieved successfully',
      data: templates,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update editable template by type
// @route   PUT /api/v1/notifications/templates/:type
// @access  Private (Admin Only)
exports.updateTemplate = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { templateText } = req.body;

    if (!templateText) {
      return next(new ErrorResponse('Template text is required', 400));
    }

    let template = await NotificationTemplate.findOne({ type });
    if (!template) {
      template = new NotificationTemplate({ type, templateText });
    } else {
      template.templateText = templateText;
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: `Template for ${type} updated successfully`,
      data: template,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Notification Logs (Communication Center logs)
// @route   GET /api/v1/notifications/logs
// @access  Private (Admin Only)
exports.getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { status, type, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingFarmers = await Farmer.find({
        isDeleted: false,
        $or: [
          { name: searchRegex },
          { farmerCode: searchRegex },
          { phone: searchRegex }
        ]
      }).select('_id');
      query.$or = [
        { recipient: searchRegex },
        { message: searchRegex },
        { farmer: { $in: matchingFarmers.map(f => f._id) } }
      ];
    }

    const total = await NotificationLog.countDocuments(query);
    const logs = await NotificationLog.find(query)
      .populate('farmer', 'farmerCode name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Notification logs retrieved successfully',
      data: {
        logs,
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

// @desc    Retry failed notification log
// @route   POST /api/v1/notifications/logs/:id/retry
// @access  Private (Admin Only)
exports.retryLog = async (req, res, next) => {
  try {
    const log = await NotificationLog.findById(req.params.id);
    if (!log) {
      return next(new ErrorResponse('Notification log not found', 404));
    }

    // Trigger dispatch again using the same log object (this will append to retryHistory and increment attempts)
    const updatedLog = await sendNotification(log.farmer, log.recipient, log.message, log.type, log.medium, log);

    res.status(200).json({
      success: true,
      message: `Notification retry processed. Status: ${updatedLog.status}`,
      data: updatedLog,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send bulk custom message to farmers
// @route   POST /api/v1/notifications/bulk
// @access  Private (Admin Only)
exports.sendBulkMessage = async (req, res, next) => {
  try {
    const { farmerIds, message, medium } = req.body;

    if (!message) {
      return next(new ErrorResponse('Message body is required', 400));
    }

    const query = { isDeleted: false, status: 'active' };
    if (farmerIds && Array.isArray(farmerIds) && farmerIds.length > 0) {
      query._id = { $in: farmerIds };
    }

    const activeFarmers = await Farmer.find(query);
    if (activeFarmers.length === 0) {
      return next(new ErrorResponse('No active farmers found to send message to', 400));
    }

    // Dispatch background dispatches
    activeFarmers.forEach((farmer) => {
      // Replace name token custom template placeholders
      let compiled = message.replace(/{farmer_name}/g, farmer.name);
      compiled = compiled.replace(/{FarmerName}/g, farmer.name);
      compiled = compiled.replace(/{farmer_code}/g, farmer.farmerCode);
      compiled = compiled.replace(/{FarmerID}/g, farmer.farmerCode);

      sendNotification(farmer._id, farmer.phone, compiled, 'bulk', medium || 'whatsapp').catch(console.error);
    });

    res.status(200).json({
      success: true,
      message: `Custom broadcast message queued for ${activeFarmers.length} active farmers`,
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send custom message to individual farmer
// @route   POST /api/v1/notifications/individual
// @access  Private (Admin Only)
exports.sendIndividualMessage = async (req, res, next) => {
  try {
    const { farmerId, message, medium } = req.body;

    if (!farmerId || !message) {
      return next(new ErrorResponse('Farmer ID and Message are required', 400));
    }

    const farmer = await Farmer.findOne({ _id: farmerId, isDeleted: false });
    if (!farmer) {
      return next(new ErrorResponse('Farmer not found', 404));
    }

    let compiled = message.replace(/{farmer_name}/g, farmer.name);
    compiled = compiled.replace(/{FarmerName}/g, farmer.name);
    compiled = compiled.replace(/{farmer_code}/g, farmer.farmerCode);
    compiled = compiled.replace(/{FarmerID}/g, farmer.farmerCode);

    const log = await sendNotification(farmer._id, farmer.phone, compiled, 'individual', medium || 'whatsapp');

    res.status(200).json({
      success: true,
      message: `Individual custom message processed. Status: ${log.status}`,
      data: log,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
