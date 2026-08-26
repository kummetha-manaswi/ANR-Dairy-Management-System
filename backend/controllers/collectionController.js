const MilkCollection = require('../models/MilkCollection');
const Farmer = require('../models/Farmer');
const RateChart = require('../models/RateChart');
const AuditLog = require('../models/AuditLog');
const { calculateRate } = require('./rateController');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const DairyProfile = require('../models/DairyProfile');

// Helper to normalize dates to midnight UTC
const normalizeDate = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Helper to auto-detect shift based on local time
const detectShift = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : 'evening';
};

// @desc    Record a new milk collection entry
// @route   POST /api/v1/collections
// @access  Private (Admin & Employee)
exports.addCollection = async (req, res, next) => {
  try {
    const { farmerId, quantity, fat, snf, date, shift, milkType, notes } = req.body;

    if (!farmerId || !quantity || !fat || !snf) {
      return next(new ErrorResponse('Farmer, Liters quantity, FAT, and SNF are required', 400));
    }

    const qtyNum = parseFloat(quantity);
    const fatNum = parseFloat(fat);
    const snfNum = parseFloat(snf);

    // 1. Liters validation
    if (qtyNum <= 0) {
      return next(new ErrorResponse('Liters quantity must be greater than 0', 400));
    }

    // 2. FAT & SNF range validation
    const profile = await DairyProfile.findOne();
    const fatMin = profile ? profile.minFat : 1.5;
    const fatMax = profile ? profile.maxFat : 15.0;
    const snfMin = profile ? profile.minSnf : 5.0;
    const snfMax = profile ? profile.maxSnf : 12.0;

    if (fatNum < fatMin || fatNum > fatMax) {
      return next(new ErrorResponse(`FAT % must be between ${fatMin}% and ${fatMax}%`, 400));
    }
    if (snfNum < snfMin || snfNum > snfMax) {
      return next(new ErrorResponse(`SNF % must be between ${snfMin}% and ${snfMax}%`, 400));
    }

    // 3. Verify Farmer is active and exists
    const farmer = await Farmer.findOne({ _id: farmerId, isDeleted: false });
    if (!farmer) {
      return next(new ErrorResponse('Farmer not found or has been soft-deleted', 404));
    }
    if (farmer.status !== 'active') {
      return next(new ErrorResponse(`Farmer account is ${farmer.status}. Cannot record milk.`, 400));
    }

    // 4. Set date and shift parameters
    const targetDate = normalizeDate(date);
    const targetShift = shift || detectShift();

    // 5. Duplicate shift verification
    const duplicate = await MilkCollection.findOne({
      farmer: farmer._id,
      date: targetDate,
      shift: targetShift
    });

    if (duplicate) {
      const formattedDate = targetDate.toISOString().split('T')[0];
      return next(
        new ErrorResponse(
          `Duplicate entry: Farmer ${farmer.farmerCode} (${farmer.name}) already has a record for ${formattedDate} (${targetShift} shift)`,
          400
        )
      );
    }

    // 6. Retrieve active Rate Chart matching target milkType
    const targetMilkType = milkType || farmer.milkType || 'buffalo';
    const activeChart = await RateChart.findOne({ milkType: targetMilkType, isActive: true });
    if (!activeChart) {
      return next(new ErrorResponse(`No active rate chart configured for ${targetMilkType} milk.`, 404));
    }

    // 7. Calculate Pricing
    const ratePerLiter = calculateRate(activeChart, fatNum, snfNum);
    if (ratePerLiter <= 0) {
      return next(
        new ErrorResponse(
          'Calculated rate is ₹0.00. Please verify the active rate configuration rules.',
          400
        )
      );
    }

    const totalAmount = parseFloat((ratePerLiter * qtyNum).toFixed(2));

    // 8. Create Entry
    const collection = await MilkCollection.create({
      farmer: farmer._id,
      date: targetDate,
      shift: targetShift,
      milkType: targetMilkType,
      quantity: qtyNum,
      fat: fatNum,
      snf: snfNum,
      ratePerLiter,
      totalAmount,
      collectedBy: req.user._id,
      rateChartUsed: activeChart._id,
      notes: notes || '',
      isLocked: false
    });

    // Populate farmer info for client response
    const populated = await collection.populate('farmer', 'farmerCode name phone');

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'COLLECTION_ADDED',
      collectionTarget: 'MilkCollection',
      recordId: collection._id,
      previousState: null,
      newState: collection.toObject(),
      reason: `Milk collection entry logged for farmer ${farmer.farmerCode}`
    });

    // Dispatch notification dispatch in background
    try {
      const { compileTemplate, sendNotification } = require('../services/notificationService');
      compileTemplate('collection', {
        farmer_name: farmer.name,
        farmer_code: farmer.farmerCode,
        liters: qtyNum,
        milk_type: farmer.milkType,
        fat: fatNum,
        snf: snfNum,
        rate: ratePerLiter,
        amount: totalAmount,
        shift: targetShift,
        date: targetDate.toISOString().split('T')[0]
      }).then(compiledMsg => {
        sendNotification(farmer._id, farmer.phone, compiledMsg, 'collection').catch(console.error);
      }).catch(console.error);
    } catch (nErr) {
      console.error('Failed to trigger daily collection notification helper', nErr);
    }

    res.status(201).json({
      success: true,
      message: 'Milk collection entry recorded successfully',
      data: populated,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Milk Collections list (with pagination, filters, and smart search)
// @route   GET /api/v1/collections
// @access  Private (Admin & Employee)
exports.getCollections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { startDate, endDate, shift, farmerId, search } = req.query;

    const query = {};

    // Restrict to own collections if farmer
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = normalizeDate(startDate);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = normalizeDate(endDate);
        query.date.$lte = end;
      }
    }

    // Shift filter
    if (shift) {
      query.shift = shift;
    }

    // Specific farmer profile filter
    if (farmerId) {
      query.farmer = farmerId;
    }

    // Smart search: queries matching farmer's Code, Name, Phone, or Village
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find matching farmers first
      const matchingFarmers = await Farmer.find({
        isDeleted: false,
        $or: [
          { name: searchRegex },
          { farmerCode: searchRegex },
          { phone: searchRegex },
          { village: searchRegex }
        ]
      }).select('_id');

      const farmerIds = matchingFarmers.map(f => f._id);
      query.farmer = { $in: farmerIds };
    }

    const total = await MilkCollection.countDocuments(query);
    const collections = await MilkCollection.find(query)
      .populate('farmer', 'farmerCode name phone village')
      .populate('collectedBy', 'name')
      .sort({ date: -1, shift: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Milk collections retrieved successfully',
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

// @desc    Update a Milk Collection entry (Admin Only, requires unlock check)
// @route   PUT /api/v1/collections/:id
// @access  Private (Admin Only)
exports.updateCollection = async (req, res, next) => {
  try {
    const { milkType, quantity, fat, snf, date, shift, notes, overrideEdit, reason } = req.body;

    if (!quantity || !fat || !snf) {
      return next(new ErrorResponse('Quantity, FAT, and SNF are required', 400));
    }

    let collection = await MilkCollection.findById(req.params.id);
    if (!collection) {
      return next(new ErrorResponse(`Milk collection record not found with ID ${req.params.id}`, 404));
    }

    // 1. Lock check with Override Edit option
    if (collection.invoice || collection.isLocked) {
      const isOverride = overrideEdit && req.user.role === 'admin';
      if (!isOverride) {
        const Invoice = require('../models/Invoice');
        const inv = await Invoice.findById(collection.invoice || null);
        const invNum = inv ? inv.invoiceNumber : 'INV-XXXX';
        return next(
          new ErrorResponse(
            `This collection is already included in Invoice ${invNum}.`,
            403
          )
        );
      }
    }

    const qtyNum = parseFloat(quantity);
    const fatNum = parseFloat(fat);
    const snfNum = parseFloat(snf);

    // Range checks
    if (qtyNum <= 0) return next(new ErrorResponse('Quantity must be greater than 0', 400));

    const profile = await DairyProfile.findOne();
    const fatMin = profile ? profile.minFat : 1.5;
    const fatMax = profile ? profile.maxFat : 15.0;
    const snfMin = profile ? profile.minSnf : 5.0;
    const snfMax = profile ? profile.maxSnf : 12.0;

    if (fatNum < fatMin || fatNum > fatMax) {
      return next(new ErrorResponse(`FAT must be between ${fatMin}% and ${fatMax}%`, 400));
    }
    if (snfNum < snfMin || snfNum > snfMax) {
      return next(new ErrorResponse(`SNF must be between ${snfMin}% and ${snfMax}%`, 400));
    }

    const previousState = collection.toObject();

    // 2. Resolve target milk type
    const targetMilkType = milkType || collection.milkType || 'buffalo';

    // 3. Resolve target date and shift and verify duplicate
    const targetDate = date ? normalizeDate(date) : collection.date;
    const targetShift = shift || collection.shift;

    if (date || shift) {
      const duplicate = await MilkCollection.findOne({
        _id: { $ne: collection._id },
        farmer: collection.farmer,
        date: targetDate,
        shift: targetShift
      });
      if (duplicate) {
        return next(new ErrorResponse('Another collection record already exists for this farmer at the target date and shift.', 400));
      }
      collection.date = targetDate;
      collection.shift = targetShift;
    }

    // 4. Retrieve rate chart (use active chart if milk type has changed, else historic)
    let rateChart;
    if (milkType && milkType !== previousState.milkType) {
      rateChart = await RateChart.findOne({ milkType: targetMilkType, isActive: true });
      if (!rateChart) {
        return next(new ErrorResponse(`No active rate chart configured for ${targetMilkType} milk.`, 404));
      }
      collection.milkType = targetMilkType;
      collection.rateChartUsed = rateChart._id;
    } else {
      rateChart = await RateChart.findById(collection.rateChartUsed);
      if (!rateChart) {
        rateChart = await RateChart.findOne({ milkType: targetMilkType, isActive: true });
        if (!rateChart) {
          return next(new ErrorResponse('The rate chart for this record no longer exists', 404));
        }
        collection.rateChartUsed = rateChart._id;
      }
    }

    // 5. Calculate Pricing
    const ratePerLiter = calculateRate(rateChart, fatNum, snfNum);
    if (ratePerLiter <= 0) {
      return next(new ErrorResponse('Altered parameters yield no price value in rate chart.', 400));
    }

    const totalAmount = parseFloat((ratePerLiter * qtyNum).toFixed(2));

    // Update fields
    collection.quantity = qtyNum;
    collection.fat = fatNum;
    collection.snf = snfNum;
    collection.ratePerLiter = ratePerLiter;
    collection.totalAmount = totalAmount;
    if (notes !== undefined) collection.notes = notes;

    await collection.save();
    const newState = collection.toObject();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'COLLECTION_EDITED',
      collectionTarget: 'MilkCollection',
      recordId: collection._id,
      previousState,
      newState,
      reason: reason || 'Milk collection entry updated'
    });

    const populated = await collection.populate('farmer', 'farmerCode name');

    res.status(200).json({
      success: true,
      message: 'Milk collection entry updated successfully',
      data: populated,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a collection entry (Admin Only, requires unlock check)
// @route   DELETE /api/v1/collections/:id
// @access  Private (Admin Only)
exports.deleteCollection = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const collection = await MilkCollection.findById(req.params.id);
    if (!collection) {
      return next(new ErrorResponse(`Milk collection record not found with ID ${req.params.id}`, 404));
    }

    // Lock check
    if (collection.isLocked) {
      return next(
        new ErrorResponse(
          'Locked record. This collection is locked (invoiced) and cannot be deleted. Ask an Admin to unlock first.',
          403
        )
      );
    }

    const previousState = collection.toObject();

    // Delete record from DB
    await MilkCollection.deleteOne({ _id: collection._id });

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'COLLECTION_DELETED',
      collectionTarget: 'MilkCollection',
      recordId: collection._id,
      previousState,
      newState: null,
      reason: reason || 'Milk collection entry deleted by Admin'
    });

    res.status(200).json({
      success: true,
      message: 'Milk collection entry deleted successfully',
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlock a locked (invoiced) milk collection entry
// @route   PATCH /api/v1/collections/:id/unlock
// @access  Private (Admin Only)
exports.unlockCollection = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return next(new ErrorResponse('A reason is required to unlock collection records', 400));
    }

    let collection = await MilkCollection.findById(req.params.id);
    if (!collection) {
      return next(new ErrorResponse(`Milk collection record not found with ID ${req.params.id}`, 404));
    }

    if (!collection.isLocked) {
      return next(new ErrorResponse('Milk collection record is already unlocked', 400));
    }

    const previousState = collection.toObject();
    collection.isLocked = false;
    await collection.save();
    const newState = collection.toObject();

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'COLLECTION_UNLOCKED',
      collectionTarget: 'MilkCollection',
      recordId: collection._id,
      previousState,
      newState,
      reason: reason || `Collection unlocked by Admin: ${reason}`
    });

    const populated = await collection.populate('farmer', 'farmerCode name');

    res.status(200).json({
      success: true,
      message: 'Milk collection record unlocked successfully',
      data: populated,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's summary stats
// @route   GET /api/v1/collections/today-summary
// @access  Private (Admin & Employee)
exports.getTodaySummary = async (req, res, next) => {
  try {
    const today = normalizeDate(new Date());

    // Find all collections for today
    const collections = await MilkCollection.find({ date: today }).populate('farmer');

    const uniqueFarmers = new Set();
    let morningCount = 0;
    let eveningCount = 0;
    let totalLiters = 0;
    let totalCowLiters = 0;
    let totalBuffaloLiters = 0;
    let totalAmount = 0;

    collections.forEach(col => {
      if (col.farmer) {
        uniqueFarmers.add(col.farmer._id.toString());
      }

      if (col.shift === 'morning') {
        morningCount++;
      } else if (col.shift === 'evening') {
        eveningCount++;
      }

      totalLiters += col.quantity;

      if (col.milkType === 'cow') {
        totalCowLiters += col.quantity;
      } else if (col.milkType === 'buffalo') {
        totalBuffaloLiters += col.quantity;
      }

      totalAmount += col.totalAmount;
    });

    res.status(200).json({
      success: true,
      message: "Today's summary stats retrieved successfully",
      data: {
        totalFarmersCollected: uniqueFarmers.size,
        morningCollections: morningCount,
        eveningCollections: eveningCount,
        totalCowMilk: parseFloat(totalCowLiters.toFixed(2)),
        totalBuffaloMilk: parseFloat(totalBuffaloLiters.toFixed(2)),
        totalMilk: parseFloat(totalLiters.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
