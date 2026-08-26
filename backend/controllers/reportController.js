const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Farmer = require('../models/Farmer');
const MilkCollection = require('../models/MilkCollection');
const DairyProfile = require('../models/DairyProfile');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const ExcelJS = require('exceljs');

// Helper to normalize dates
const normalizeDate = (dateVal, isEnd = false) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isEnd) {
    d.setUTCHours(23, 59, 59, 999);
  } else {
    d.setUTCHours(0, 0, 0, 0);
  }
  return d;
};

// @desc    Get Billing Report Data
// @route   GET /api/v1/reports/billing
// @access  Private (Admin & Employee)
exports.getBillingReport = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (farmerId) query.farmer = farmerId;

    if (startDate || endDate) {
      query.generatedDate = {};
      if (startDate) query.generatedDate.$gte = normalizeDate(startDate);
      if (endDate) query.generatedDate.$lte = normalizeDate(endDate, true);
    }

    const invoices = await Invoice.find(query)
      .populate('farmer', 'farmerCode name phone village')
      .sort({ generatedDate: -1 });

    // Aggregate totals
    const summary = invoices.reduce(
      (acc, inv) => {
        acc.totalLiters += inv.totalLiters;
        acc.grossAmount += inv.grossAmount;
        acc.netAmount += inv.netAmount;
        acc.paidAmount += inv.paidAmount;
        acc.pendingAmount += inv.pendingAmount;
        acc.count += 1;
        return acc;
      },
      { totalLiters: 0, grossAmount: 0, netAmount: 0, paidAmount: 0, pendingAmount: 0, count: 0 }
    );

    res.status(200).json({
      success: true,
      message: 'Billing report retrieved successfully',
      data: {
        summary,
        invoices
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Excel sheet for Billing Report
// @route   GET /api/v1/reports/billing/excel
// @access  Private (Admin & Employee)
exports.exportBillingExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, status } = req.query;

    const query = {};
    if (status) query.status = status;
    if (farmerId) query.farmer = farmerId;

    if (startDate || endDate) {
      query.generatedDate = {};
      if (startDate) query.generatedDate.$gte = normalizeDate(startDate);
      if (endDate) query.generatedDate.$lte = normalizeDate(endDate, true);
    }

    const invoices = await Invoice.find(query)
      .populate('farmer', 'farmerCode name')
      .sort({ generatedDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Billing Report');

    // Headers
    worksheet.columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 22 },
      { header: 'Farmer ID', key: 'farmerCode', width: 14 },
      { header: 'Farmer Name', key: 'farmerName', width: 22 },
      { header: 'Start Date', key: 'startDate', width: 14 },
      { header: 'End Date', key: 'endDate', width: 14 },
      { header: 'Liters', key: 'totalLiters', width: 12 },
      { header: 'Avg FAT %', key: 'avgFat', width: 12 },
      { header: 'Avg SNF %', key: 'avgSnf', width: 12 },
      { header: 'Net Amount', key: 'netAmount', width: 16 },
      { header: 'Paid', key: 'paidAmount', width: 14 },
      { header: 'Pending', key: 'pendingAmount', width: 14 },
      { header: 'Status', key: 'status', width: 12 }
    ];

    // Format headers style (slate blue theme)
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    invoices.forEach((inv) => {
      worksheet.addRow({
        invoiceNumber: inv.invoiceNumber,
        farmerCode: inv.farmer?.farmerCode || 'N/A',
        farmerName: inv.farmer?.name || 'N/A',
        startDate: inv.startDate.toISOString().split('T')[0],
        endDate: inv.endDate.toISOString().split('T')[0],
        totalLiters: inv.totalLiters,
        avgFat: inv.avgFat,
        avgSnf: inv.avgSnf,
        netAmount: inv.netAmount,
        paidAmount: inv.paidAmount,
        pendingAmount: inv.pendingAmount,
        status: inv.status
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Billing_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get Outstanding Balance Report data
// @route   GET /api/v1/reports/outstanding
// @access  Private (Admin & Employee)
exports.getOutstandingReport = async (req, res, next) => {
  try {
    // Aggregate pending amount group by farmer
    const outstanding = await Invoice.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, pendingAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$farmer',
          outstandingAmount: { $sum: '$pendingAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'farmers',
          localField: '_id',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      { $match: { 'farmerDetails.isDeleted': false } },
      {
        $project: {
          farmerId: '$_id',
          farmerCode: '$farmerDetails.farmerCode',
          name: '$farmerDetails.name',
          phone: '$farmerDetails.phone',
          village: '$farmerDetails.village',
          outstandingAmount: 1,
          invoiceCount: 1
        }
      },
      { $sort: { outstandingAmount: -1 } }
    ]);

    const totalOutstanding = outstanding.reduce((sum, item) => sum + item.outstandingAmount, 0);

    res.status(200).json({
      success: true,
      message: 'Outstanding report retrieved successfully',
      data: {
        totalOutstanding,
        outstanding
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Excel sheet for Outstanding Report
// @route   GET /api/v1/reports/outstanding/excel
// @access  Private (Admin & Employee)
exports.exportOutstandingExcel = async (req, res, next) => {
  try {
    const outstanding = await Invoice.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, pendingAmount: { $gt: 0 } } },
      {
        $group: {
          _id: '$farmer',
          outstandingAmount: { $sum: '$pendingAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'farmers',
          localField: '_id',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      { $match: { 'farmerDetails.isDeleted': false } },
      {
        $project: {
          farmerCode: '$farmerDetails.farmerCode',
          name: '$farmerDetails.name',
          phone: '$farmerDetails.phone',
          village: '$farmerDetails.village',
          outstandingAmount: 1,
          invoiceCount: 1
        }
      },
      { $sort: { outstandingAmount: -1 } }
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Outstanding Balances');

    worksheet.columns = [
      { header: 'Farmer ID', key: 'farmerCode', width: 14 },
      { header: 'Farmer Name', key: 'name', width: 22 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Village', key: 'village', width: 18 },
      { header: 'Unpaid Invoices', key: 'invoiceCount', width: 16 },
      { header: 'Outstanding Due (₹)', key: 'outstandingAmount', width: 20 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    outstanding.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Outstanding_Balances.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get Passbook Timeline Report (Collections, Invoices, Payments chronologically)
// @route   GET /api/v1/reports/passbook/:farmerId
// @access  Private (Admin & Employee)
exports.getPassbookTimeline = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return next(new ErrorResponse('Farmer not found', 404));
    }

    // 1. Fetch Invoices
    const invoices = await Invoice.find({ farmer: farmerId, status: { $ne: 'Cancelled' } })
      .sort({ startDate: 1 });

    // 2. Fetch Payments
    const payments = await Payment.find({ farmer: farmerId })
      .sort({ paymentDate: 1 });

    // 3. Compile timeline entries
    const timeline = [];

    invoices.forEach((inv) => {
      timeline.push({
        type: 'invoice',
        date: inv.startDate, // Billing cycle start as relative time marker
        generatedDate: inv.generatedDate,
        reference: inv.invoiceNumber,
        description: `Billing Cycle: ${inv.startDate.toISOString().split('T')[0]} to ${inv.endDate.toISOString().split('T')[0]}`,
        liters: inv.totalLiters,
        amount: inv.netAmount,
        change: inv.netAmount // Invoice represents amount added to farmer ledger credits
      });
    });

    payments.forEach((pay) => {
      timeline.push({
        type: 'payment',
        date: pay.paymentDate,
        generatedDate: pay.paymentDate,
        reference: pay.paymentNumber,
        description: `Payout via ${pay.paymentMode}${pay.referenceNumber ? ' (Ref: ' + pay.referenceNumber + ')' : ''}`,
        liters: 0,
        amount: pay.paidAmount,
        change: -pay.paidAmount // Payment represents debit reduction of outstanding credit
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running outstanding balance due to farmer
    let runningBalance = 0;
    const timelineWithBalance = timeline.map((item) => {
      runningBalance += item.change;
      return {
        ...item,
        runningBalance: parseFloat(runningBalance.toFixed(2))
      };
    });

    res.status(200).json({
      success: true,
      message: 'Farmer passbook ledger retrieved successfully',
      data: {
        farmer: {
          farmerCode: farmer.farmerCode,
          name: farmer.name,
          phone: farmer.phone,
          village: farmer.village
        },
        runningBalance: parseFloat(runningBalance.toFixed(2)),
        passbook: timelineWithBalance
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Stats Counters
// @route   GET /api/v1/reports/dashboard
// @access  Private (Admin & Employee)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Collections calculations
    const todayCollections = await MilkCollection.find({
      date: { $gte: today, $lte: endOfToday }
    });

    let todayLiters = 0;
    let morningLiters = 0;
    let eveningLiters = 0;
    let todayValue = 0;

    todayCollections.forEach((c) => {
      todayLiters += c.quantity;
      todayValue += c.totalAmount;
      if (c.shift === 'morning') {
        morningLiters += c.quantity;
      } else {
        eveningLiters += c.quantity;
      }
    });

    // Monthly collection value
    const monthCollections = await MilkCollection.aggregate([
      { $match: { date: { $gte: firstOfMonth, $lte: endOfToday } } },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);
    const monthlyRevenue = monthCollections.length > 0 ? monthCollections[0].totalAmount : 0;

    // 2. Farmers Count
    const totalFarmers = await Farmer.countDocuments({ isDeleted: false });
    const activeFarmers = await Farmer.countDocuments({ isDeleted: false, status: 'active' });
    const inactiveFarmers = totalFarmers - activeFarmers;

    // 3. Bills (Invoices) stats
    const billsGeneratedToday = await Invoice.countDocuments({
      generatedDate: { $gte: today, $lte: endOfToday }
    });

    // Payments received today
    const paymentsToday = await Payment.find({
      paymentDate: { $gte: today, $lte: endOfToday }
    });
    const paymentsReceivedTodayCount = paymentsToday.length;
    const paymentsReceivedTodayValue = paymentsToday.reduce((sum, p) => sum + p.paidAmount, 0);

    // Outstanding stats
    const outstandingInvoices = await Invoice.find({
      status: { $ne: 'Cancelled' },
      pendingAmount: { $gt: 0 }
    });

    const pendingPaymentsCount = outstandingInvoices.length;
    const outstandingAmount = outstandingInvoices.reduce((sum, p) => sum + p.pendingAmount, 0);

    // Dynamic dynamic backup timestamp
    const profile = await DairyProfile.findOne();
    const lastBackupTime = profile && profile.lastBackupTime ? profile.lastBackupTime : new Date(Date.now() - 3600000 * 2.5);

    // Recent items
    const recentCollections = await MilkCollection.find()
      .populate('farmer', 'farmerCode name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate('farmer', 'farmerCode name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Dashboard metrics retrieved successfully',
      data: {
        todayCollections: {
          total: parseFloat(todayLiters.toFixed(2)),
          morning: parseFloat(morningLiters.toFixed(2)),
          evening: parseFloat(eveningLiters.toFixed(2)),
          value: parseFloat(todayValue.toFixed(2))
        },
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        farmers: {
          total: totalFarmers,
          active: activeFarmers,
          inactive: inactiveFarmers
        },
        billing: {
          billsGeneratedToday
        },
        payments: {
          countToday: paymentsReceivedTodayCount,
          valueToday: parseFloat(paymentsReceivedTodayValue.toFixed(2)),
          pendingCount: pendingPaymentsCount,
          outstandingAmount: parseFloat(outstandingAmount.toFixed(2))
        },
        lastBackupTime,
        recentCollections,
        recentPayments
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Analytics Charts Datasets
// @route   GET /api/v1/reports/charts
// @access  Private (Admin & Employee)
exports.getChartsData = async (req, res, next) => {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setUTCDate(fifteenDaysAgo.getUTCDate() - 15);
    fifteenDaysAgo.setUTCHours(0,0,0,0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
    sixMonthsAgo.setUTCDate(1);
    sixMonthsAgo.setUTCHours(0,0,0,0);

    // 1. Daily stats (liters, amounts, quality average FAT/SNF)
    const dailyStats = await MilkCollection.aggregate([
      { $match: { date: { $gte: fifteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' },
          avgFat: { $avg: '$fat' },
          avgSnf: { $avg: '$snf' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Weekly stats (liters)
    const weeklyStats = await MilkCollection.aggregate([
      { $match: { date: { $gte: fifteenDaysAgo } } },
      {
        $group: {
          _id: { $isoWeek: '$date' },
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Monthly stats (liters, revenue)
    const monthlyStats = await MilkCollection.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Village-wise collections
    const villageStats = await MilkCollection.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      {
        $group: {
          _id: '$farmerDetails.village',
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { liters: -1 } }
    ]);

    // 5. Top 10 Farmers by Milk Quantity
    const topQuantityFarmers = await MilkCollection.aggregate([
      {
        $group: {
          _id: '$farmer',
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { liters: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'farmers',
          localField: '_id',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      {
        $project: {
          farmerCode: '$farmerDetails.farmerCode',
          name: '$farmerDetails.name',
          liters: { $round: ['$liters', 2] },
          amount: { $round: ['$amount', 2] }
        }
      }
    ]);

    // 6. Top 10 Farmers by Revenue payouts
    const topRevenueFarmers = await MilkCollection.aggregate([
      {
        $group: {
          _id: '$farmer',
          liters: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'farmers',
          localField: '_id',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      {
        $project: {
          farmerCode: '$farmerDetails.farmerCode',
          name: '$farmerDetails.name',
          liters: { $round: ['$liters', 2] },
          amount: { $round: ['$amount', 2] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Charts datasets compiled successfully',
      data: {
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        village: villageStats,
        topQuantity: topQuantityFarmers,
        topRevenue: topRevenueFarmers
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Collection Report Data
// @route   GET /api/v1/reports/collections
// @access  Private (Admin & Employee)
exports.getCollectionsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, village, shift, milkType, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

    const matchQuery = {};
    if (shift) matchQuery.shift = shift;
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' }
    ];

    if (village) {
      lookupPipeline.push({
        $match: { 'farmerDetails.village': new RegExp(village, 'i') }
      });
    }

    // Averages/totals aggregation pipeline
    const summaryPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLiters: { $sum: '$quantity' },
          totalAmount: { $sum: '$totalAmount' },
          avgFat: { $avg: '$fat' },
          avgSnf: { $avg: '$snf' },
          count: { $sum: 1 }
        }
      }
    ];

    const summaryResult = await MilkCollection.aggregate(summaryPipeline);
    const summary = summaryResult[0] || { totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0, count: 0 };

    // Paginated list pipeline
    const listPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $project: {
          _id: 1,
          date: 1,
          shift: 1,
          milkType: 1,
          quantity: 1,
          fat: 1,
          snf: 1,
          ratePerLiter: 1,
          totalAmount: 1,
          farmerCode: '$farmerDetails.farmerCode',
          farmerName: '$farmerDetails.name',
          village: '$farmerDetails.village'
        }
      }
    ];

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    listPipeline.push({ $sort: sort });

    const pg = parseInt(page, 10) || 1;
    const lim = parseInt(limit, 10) || 20;
    const skip = (pg - 1) * lim;

    listPipeline.push({ $skip: skip });
    listPipeline.push({ $limit: lim });

    const collections = await MilkCollection.aggregate(listPipeline);

    res.status(200).json({
      success: true,
      message: 'Collections report completed successfully',
      data: {
        summary,
        collections,
        pagination: {
          total: summary.count,
          page: pg,
          limit: lim,
          pages: Math.ceil(summary.count / lim)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Collections Report to Excel sheet
// @route   GET /api/v1/reports/collections/excel
// @access  Private (Admin & Employee)
exports.exportCollectionsExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, village, shift, milkType } = req.query;

    const matchQuery = {};
    if (shift) matchQuery.shift = shift;
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' }
    ];

    if (village) {
      lookupPipeline.push({
        $match: { 'farmerDetails.village': new RegExp(village, 'i') }
      });
    }

    const listPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $project: {
          date: 1,
          shift: 1,
          milkType: 1,
          quantity: 1,
          fat: 1,
          snf: 1,
          ratePerLiter: 1,
          totalAmount: 1,
          farmerCode: '$farmerDetails.farmerCode',
          farmerName: '$farmerDetails.name',
          village: '$farmerDetails.village'
        }
      },
      { $sort: { date: -1 } }
    ];

    const collections = await MilkCollection.aggregate(listPipeline);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Collection Report');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Shift', key: 'shift', width: 12 },
      { header: 'Farmer ID', key: 'farmerCode', width: 14 },
      { header: 'Farmer Name', key: 'farmerName', width: 22 },
      { header: 'Village', key: 'village', width: 18 },
      { header: 'Milk Type', key: 'milkType', width: 12 },
      { header: 'Quantity (L)', key: 'quantity', width: 14 },
      { header: 'FAT %', key: 'fat', width: 10 },
      { header: 'SNF %', key: 'snf', width: 10 },
      { header: 'Rate / L', key: 'ratePerLiter', width: 12 },
      { header: 'Amount (₹)', key: 'totalAmount', width: 16 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    collections.forEach((col) => {
      worksheet.addRow({
        date: col.date.toISOString().split('T')[0],
        shift: col.shift,
        farmerCode: col.farmerCode,
        farmerName: col.farmerName,
        village: col.village,
        milkType: col.milkType,
        quantity: col.quantity,
        fat: col.fat,
        snf: col.snf,
        ratePerLiter: col.ratePerLiter,
        totalAmount: col.totalAmount
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Milk_Collections_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export Collections Report to PDF receipt table
// @route   GET /api/v1/reports/collections/pdf
// @access  Private (Admin & Employee)
exports.streamCollectionsPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, village, shift, milkType } = req.query;

    const matchQuery = {};
    if (shift) matchQuery.shift = shift;
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' }
    ];

    if (village) {
      lookupPipeline.push({
        $match: { 'farmerDetails.village': new RegExp(village, 'i') }
      });
    }

    const listPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $project: {
          date: 1,
          shift: 1,
          milkType: 1,
          quantity: 1,
          fat: 1,
          snf: 1,
          ratePerLiter: 1,
          totalAmount: 1,
          farmerCode: '$farmerDetails.farmerCode',
          farmerName: '$farmerDetails.name',
          village: '$farmerDetails.village'
        }
      },
      { $sort: { date: -1 } }
    ];

    const collections = await MilkCollection.aggregate(listPipeline);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Milk_Collections_Report.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(16).fillColor('#0f172a').text('Milk Collection Ledger Summary', { align: 'center', bold: true });
    doc.fontSize(8).fillColor('#64748b').text(`Compiled Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    if (startDate && endDate) {
      doc.text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    }

    doc.fillColor('#e2e8f0').rect(40, 75, 532, 1).fill();

    let y = 90;
    doc.fillColor('#0f172a').fontSize(8);
    doc.text('Date', 40, y, { bold: true });
    doc.text('Shift', 110, y, { bold: true });
    doc.text('Farmer', 160, y, { bold: true });
    doc.text('Milk', 280, y, { bold: true });
    doc.text('Qty (L)', 330, y, { bold: true });
    doc.text('FAT / SNF', 390, y, { bold: true });
    doc.text('Amount Due', 490, y, { align: 'right', bold: true });

    doc.fillColor('#cbd5e1').rect(40, y + 12, 532, 1).fill();
    y += 20;

    doc.fillColor('#334155').fontSize(7.5);
    collections.forEach((col) => {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
      doc.text(col.date.toISOString().split('T')[0], 40, y);
      doc.text(col.shift, 110, y);
      doc.text(`${col.farmerName} (${col.farmerCode})`, 160, y);
      doc.text(col.milkType.toUpperCase(), 280, y);
      doc.text(col.quantity.toFixed(2), 330, y);
      doc.text(`${col.fat.toFixed(1)} / ${col.snf.toFixed(1)}`, 390, y);
      doc.text(`₹${col.totalAmount.toFixed(2)}`, 490, y, { align: 'right' });
      y += 15;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Get FAT & SNF Quality Report Data
// @route   GET /api/v1/reports/quality
// @access  Private (Admin & Employee)
exports.getQualityReport = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, milkType, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

    const matchQuery = {};
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' }
    ];

    // Summary aggregates for quality
    const summaryPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          avgFat: { $avg: '$fat' },
          minFat: { $min: '$fat' },
          maxFat: { $max: '$fat' },
          avgSnf: { $avg: '$snf' },
          minSnf: { $min: '$snf' },
          maxSnf: { $max: '$snf' },
          count: { $sum: 1 }
        }
      }
    ];

    const summaryResult = await MilkCollection.aggregate(summaryPipeline);
    const summary = summaryResult[0] || { avgFat: 0, minFat: 0, maxFat: 0, avgSnf: 0, minSnf: 0, maxSnf: 0, count: 0 };

    const listPipeline = [
      ...lookupPipeline,
      { $match: matchQuery },
      {
        $project: {
          _id: 1,
          date: 1,
          shift: 1,
          milkType: 1,
          quantity: 1,
          fat: 1,
          snf: 1,
          farmerCode: '$farmerDetails.farmerCode',
          farmerName: '$farmerDetails.name'
        }
      }
    ];

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    listPipeline.push({ $sort: sort });

    const pg = parseInt(page, 10) || 1;
    const lim = parseInt(limit, 10) || 20;
    const skip = (pg - 1) * lim;

    listPipeline.push({ $skip: skip });
    listPipeline.push({ $limit: lim });

    const qualityLogs = await MilkCollection.aggregate(listPipeline);

    res.status(200).json({
      success: true,
      message: 'Quality report compiled successfully',
      data: {
        summary,
        qualityLogs,
        pagination: {
          total: summary.count,
          page: pg,
          limit: lim,
          pages: Math.ceil(summary.count / lim)
        }
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Quality Report to Excel
// @route   GET /api/v1/reports/quality/excel
// @access  Private (Admin & Employee)
exports.exportQualityExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, milkType } = req.query;

    const matchQuery = {};
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      { $match: matchQuery },
      { $sort: { date: -1 } }
    ];

    const qualityLogs = await MilkCollection.aggregate(lookupPipeline);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quality Logs');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Shift', key: 'shift', width: 12 },
      { header: 'Farmer ID', key: 'farmerCode', width: 14 },
      { header: 'Farmer Name', key: 'farmerName', width: 22 },
      { header: 'Milk Type', key: 'milkType', width: 12 },
      { header: 'Quantity (L)', key: 'quantity', width: 14 },
      { header: 'FAT %', key: 'fat', width: 12 },
      { header: 'SNF %', key: 'snf', width: 12 }
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center' };
    });

    qualityLogs.forEach((col) => {
      worksheet.addRow({
        date: col.date.toISOString().split('T')[0],
        shift: col.shift,
        farmerCode: col.farmerDetails.farmerCode,
        farmerName: col.farmerDetails.name,
        milkType: col.milkType,
        quantity: col.quantity,
        fat: col.fat,
        snf: col.snf
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=FAT_SNF_Quality_Report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export Quality Report to PDF
// @route   GET /api/v1/reports/quality/pdf
// @access  Private (Admin & Employee)
exports.streamQualityPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, farmerId, milkType } = req.query;

    const matchQuery = {};
    if (milkType) matchQuery.milkType = milkType;
    if (farmerId) matchQuery.farmer = new mongoose.Types.ObjectId(farmerId);

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = normalizeDate(startDate);
      if (endDate) matchQuery.date.$lte = normalizeDate(endDate, true);
    }

    const lookupPipeline = [
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDetails'
        }
      },
      { $unwind: '$farmerDetails' },
      { $match: matchQuery },
      { $sort: { date: -1 } }
    ];

    const qualityLogs = await MilkCollection.aggregate(lookupPipeline);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=FAT_SNF_Quality_Report.pdf');
    doc.pipe(res);

    doc.fontSize(16).fillColor('#0f172a').text('FAT & SNF Quality Ledger Summary', { align: 'center', bold: true });
    doc.fontSize(8).fillColor('#64748b').text(`Compiled Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.fillColor('#e2e8f0').rect(40, 75, 532, 1).fill();

    let y = 95;
    doc.fillColor('#0f172a').fontSize(8);
    doc.text('Date', 40, y, { bold: true });
    doc.text('Shift', 110, y, { bold: true });
    doc.text('Farmer', 165, y, { bold: true });
    doc.text('Milk Type', 290, y, { bold: true });
    doc.text('Liters (L)', 350, y, { bold: true });
    doc.text('FAT %', 420, y, { bold: true });
    doc.text('SNF %', 490, y, { bold: true });

    doc.fillColor('#cbd5e1').rect(40, y + 12, 532, 1).fill();
    y += 22;

    doc.fillColor('#334155').fontSize(7.5);
    qualityLogs.forEach((col) => {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
      doc.text(col.date.toISOString().split('T')[0], 40, y);
      doc.text(col.shift, 110, y);
      doc.text(`${col.farmerDetails.name} (${col.farmerDetails.farmerCode})`, 165, y);
      doc.text(col.milkType.toUpperCase(), 290, y);
      doc.text(col.quantity.toFixed(2), 350, y);
      doc.text(`${col.fat.toFixed(1)}%`, 420, y);
      doc.text(`${col.snf.toFixed(1)}%`, 490, y);
      y += 15;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Generate and stream Farmer Passbook PDF
// @route   GET /api/v1/reports/passbook/:farmerId/pdf
// @access  Private (Admin & Employee)
exports.streamPassbookPDF = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      return next(new ErrorResponse('Farmer not found', 404));
    }

    const invoices = await Invoice.find({ farmer: farmerId, status: { $ne: 'Cancelled' } }).sort({ startDate: 1 });
    const payments = await Payment.find({ farmer: farmerId }).sort({ paymentDate: 1 });

    const timeline = [];
    invoices.forEach((inv) => {
      timeline.push({
        type: 'invoice',
        date: inv.startDate,
        reference: inv.invoiceNumber,
        description: `Billing: ${inv.startDate.toISOString().split('T')[0]} to ${inv.endDate.toISOString().split('T')[0]}`,
        change: inv.netAmount
      });
    });

    payments.forEach((pay) => {
      timeline.push({
        type: 'payment',
        date: pay.paymentDate,
        reference: pay.paymentNumber,
        description: `Payout via ${pay.paymentMode}${pay.referenceNumber ? ' (Ref: ' + pay.referenceNumber + ')' : ''}`,
        change: -pay.paidAmount
      });
    });

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const passbook = timeline.map((item) => {
      runningBalance += item.change;
      return { ...item, runningBalance: parseFloat(runningBalance.toFixed(2)) };
    });

    const profile = await DairyProfile.findOne();
    const dairyName = profile ? profile.dairyName : 'ANR Dairy';
    const ownerName = profile ? profile.ownerName : 'ANR Owner';
    const dairyPhone = profile ? profile.phone : '9999999999';
    const dairyEmail = profile ? profile.email : 'info@anrdairy.com';
    const dairyAddress = profile ? profile.address : 'Penugonda, AP';

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Passbook_${farmer.farmerCode}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).fillColor('#0f172a').text(dairyName, { align: 'left', bold: true });
    doc.fontSize(8).fillColor('#64748b').text(`Farmer Passbook Ledger Summary | Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Owner: ${ownerName} | Ph: ${dairyPhone} | Email: ${dairyEmail}`);
    doc.text(dairyAddress);

    doc.fillColor('#cbd5e1').rect(40, 95, 532, 1).fill();

    doc.fillColor('#0f172a').fontSize(11).text('FARMER ACCOUNT DETAILS', 40, 110, { bold: true });
    doc.fontSize(9).fillColor('#334155');
    doc.text(`Farmer Name: ${farmer.name}`, 40, 125);
    doc.text(`Farmer ID: ${farmer.farmerCode}`, 40, 137);
    doc.text(`Mobile: ${farmer.phone} | Village: ${farmer.village}`, 40, 149);

    doc.text(`Ledger Balance: ₹${runningBalance.toFixed(2)}`, 320, 125, { bold: true });

    doc.fillColor('#cbd5e1').rect(40, 165, 532, 1).fill();

    let y = 185;
    doc.fillColor('#0f172a').fontSize(8);
    doc.text('Date', 40, y, { bold: true });
    doc.text('Reference No.', 110, y, { bold: true });
    doc.text('Type', 200, y, { bold: true });
    doc.text('Description', 260, y, { bold: true });
    doc.text('Tx Amount', 420, y, { align: 'right', bold: true });
    doc.text('Running Balance', 510, y, { align: 'right', bold: true });

    doc.fillColor('#cbd5e1').rect(40, y + 12, 532, 1).fill();
    y += 22;

    doc.fillColor('#334155').fontSize(7.5);
    passbook.forEach((row) => {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
      doc.text(new Date(row.date).toLocaleDateString(), 40, y);
      doc.text(row.reference, 110, y);
      doc.text(row.type.toUpperCase(), 200, y);
      doc.text(row.description, 260, y);
      
      const amtStr = row.change > 0 ? `+₹${row.change.toFixed(2)}` : `-₹${Math.abs(row.change).toFixed(2)}`;
      doc.text(amtStr, 420, y, { align: 'right' });
      doc.text(`₹${row.runningBalance.toFixed(2)}`, 510, y, { align: 'right', bold: true });
      y += 18;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

