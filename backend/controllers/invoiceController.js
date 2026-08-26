const Invoice = require('../models/Invoice');
const MilkCollection = require('../models/MilkCollection');
const Farmer = require('../models/Farmer');
const DairyProfile = require('../models/DairyProfile');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const PDFDocument = require('pdfkit');

// @desc    Generate a new Invoice Bill (Locks collections)
// @route   POST /api/v1/invoices
// @access  Private (Admin Only)
exports.generateInvoice = async (req, res, next) => {
  try {
    const { farmerId, startDate, endDate, bonus, deductions, status, reason } = req.body;

    if (!farmerId || !startDate || !endDate) {
      return next(new ErrorResponse('Farmer, Start Date, and End Date are required', 400));
    }

    const start = new Date(startDate);
    start.setUTCHours(0,0,0,0);
    const end = new Date(endDate);
    end.setUTCHours(23,59,59,999);

    if (start > end) {
      return next(new ErrorResponse('Start Date must be before or equal to End Date', 400));
    }

    // 1. Check for overlapping invoices
    const overlap = await Invoice.findOne({
      farmer: farmerId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlap) {
      return next(
        new ErrorResponse(
          `Billing overlap detected. Invoice ${overlap.invoiceNumber} already covers a portion of the range: ${startDate} to ${endDate}`,
          400
        )
      );
    }

    // 2. Fetch unbilled milk collections in range
    const collections = await MilkCollection.find({
      farmer: farmerId,
      date: { $gte: start, $lte: end },
      isLocked: false
    });

    if (collections.length === 0) {
      return next(new ErrorResponse('No unbilled milk collections found for the selected period', 400));
    }

    // 3. Aggregate totals and averages
    let totalLiters = 0;
    let totalFatPoints = 0;
    let totalSnfPoints = 0;
    let grossAmount = 0;

    collections.forEach((col) => {
      totalLiters += col.quantity;
      totalFatPoints += col.fat * col.quantity;
      totalSnfPoints += col.snf * col.quantity;
      grossAmount += col.totalAmount;
    });

    const avgFat = parseFloat((totalFatPoints / totalLiters).toFixed(2));
    const avgSnf = parseFloat((totalSnfPoints / totalLiters).toFixed(2));
    const gross = parseFloat(grossAmount.toFixed(2));

    const bonusVal = parseFloat(bonus) || 0;
    const deductionVal = parseFloat(deductions) || 0;
    const netAmount = Math.max(0, parseFloat((gross + bonusVal - deductionVal).toFixed(2)));

    // 4. Generate Invoice number (sequential XXXX reset monthly)
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // e.g. "202607"
    
    // Count invoices generated in this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const invoiceCount = await Invoice.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const index = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNumber = `ANR-INV-${yearMonth}-${index}`;

    // 5. Create Invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      farmer: farmerId,
      startDate: start,
      endDate: end,
      collections: collections.map((c) => c._id),
      totalLiters: parseFloat(totalLiters.toFixed(2)),
      avgFat,
      avgSnf,
      grossAmount: gross,
      bonus: bonusVal,
      deductions: deductionVal,
      netAmount,
      pendingAmount: netAmount,
      status: status || 'Generated'
    });

    // 6. Bulk Lock collection entries
    await MilkCollection.updateMany(
      { _id: { $in: collections.map((c) => c._id) } },
      { isLocked: true, invoice: invoice._id }
    );

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'INVOICE_GENERATED',
      collectionTarget: 'Invoice',
      recordId: invoice._id,
      previousState: null,
      newState: invoice.toObject(),
      reason: reason || `Billing run invoice ${invoiceNumber} created for farmer.`
    });

    const populated = await invoice.populate('farmer', 'farmerCode name phone');

    // Dispatch invoice notification in background
    try {
      const { compileTemplate, sendNotification } = require('../services/notificationService');
      compileTemplate('bill', {
        farmer_name: populated.farmer.name,
        farmer_code: populated.farmer.farmerCode,
        invoice_number: invoice.invoiceNumber,
        start_date: invoice.startDate.toISOString().split('T')[0],
        end_date: invoice.endDate.toISOString().split('T')[0],
        liters: invoice.totalLiters,
        amount: invoice.netAmount
      }).then(compiledMsg => {
        sendNotification(populated.farmer._id, populated.farmer.phone, compiledMsg, 'bill').catch(console.error);
      }).catch(console.error);
    } catch (nErr) {
      console.error('Failed to trigger bill invoice notification helper', nErr);
    }

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} generated successfully`,
      data: populated,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Invoices List
// @route   GET /api/v1/invoices
// @access  Private (Admin & Employee)
exports.getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { status, farmerId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (farmerId) query.farmer = farmerId;

    // Restrict to own invoices if farmer
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    }

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
      query.farmer = { $in: matchingFarmers.map(f => f._id) };
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('farmer', 'farmerCode name phone village')
      .sort({ generatedDate: -1, createdAt: -1 })
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

// @desc    Get Invoice Details by ID (populates collections list)
// @route   GET /api/v1/invoices/:id
// @access  Private (Admin & Employee)
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('farmer', 'farmerCode name phone village bankDetails upiId')
      .populate({
        path: 'collections',
        options: { sort: { date: 1, shift: 1 } }
      });

    if (!invoice) {
      return next(new ErrorResponse('Invoice not found', 404));
    }

    // Verify ownership if farmer
    if (req.user.role === 'farmer' && invoice.farmer._id.toString() !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to access this invoice', 403));
    }

    res.status(200).json({
      success: true,
      message: 'Invoice details retrieved successfully',
      data: invoice,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an Invoice (Unlocks collections)
// @route   PUT /api/v1/invoices/:id/cancel
// @access  Private (Admin Only)
exports.cancelInvoice = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return next(new ErrorResponse('A reason is required to cancel invoices', 400));
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return next(new ErrorResponse('Invoice not found', 404));
    }

    if (invoice.status === 'Cancelled') {
      return next(new ErrorResponse('Invoice is already cancelled', 400));
    }

    if (invoice.paidAmount > 0) {
      return next(
        new ErrorResponse(
          `Cannot cancel. Invoice has already received payments of ₹${invoice.paidAmount.toFixed(2)}. Delete payments first.`,
          400
        )
      );
    }

    const previousState = invoice.toObject();

    // Update status
    invoice.status = 'Cancelled';
    invoice.pendingAmount = 0;
    await invoice.save();
    const newState = invoice.toObject();

    // Bulk UNLOCK collection entries linked to this invoice
    await MilkCollection.updateMany(
      { invoice: invoice._id },
      { isLocked: false, invoice: null }
    );

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'INVOICE_CANCELLED',
      collectionTarget: 'Invoice',
      recordId: invoice._id,
      previousState,
      newState,
      reason: reason || 'Invoice cancelled by Admin'
    });

    res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} cancelled and associated collections unlocked.`,
      data: invoice,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate and stream professional Invoice PDF
// @route   GET /api/v1/invoices/:id/pdf
// @access  Private (Admin & Employee)
exports.streamInvoicePDF = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('farmer', 'farmerCode name phone village bankDetails upiId')
      .populate({
        path: 'collections',
        options: { sort: { date: 1, shift: 1 } }
      });

    if (!invoice) {
      return next(new ErrorResponse('Invoice not found', 404));
    }

    // Verify ownership if farmer
    if (req.user.role === 'farmer' && invoice.farmer._id.toString() !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to access this invoice', 403));
    }

    const profile = await DairyProfile.findOne();
    const dairyName = profile ? profile.dairyName : 'ANR Dairy';
    const ownerName = profile ? profile.ownerName : 'ANR Owner';
    const dairyPhone = profile ? profile.phone : '9999999999';
    const dairyEmail = profile ? profile.email : 'info@anrdairy.com';
    const dairyAddress = profile ? profile.address : 'Penugonda, AP';

    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
    doc.pipe(res);

    // Document Header Title
    doc.fillColor('#0f172a').fontSize(20).text(dairyName, 50, 45, { align: 'left' });
    doc.fontSize(8).fillColor('#64748b');
    doc.text(`Owner: ${ownerName} | Ph: ${dairyPhone} | Email: ${dairyEmail}`, 50, 68);
    doc.text(dairyAddress, 50, 78);

    doc.fillColor('#cbd5e1').rect(50, 95, 512, 1).fill(); // Divider line

    // Invoice Metadata Block
    doc.fillColor('#0f172a').fontSize(12).text('BILL INVOICE SUMMARY', 50, 110, { bold: true });
    doc.fontSize(8).fillColor('#334155');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, 130);
    doc.text(`Billing Cycle: ${invoice.startDate.toISOString().split('T')[0]} to ${invoice.endDate.toISOString().split('T')[0]}`, 50, 142);
    doc.text(`Generated Date: ${new Date(invoice.generatedDate).toLocaleDateString()}`, 50, 154);

    // Farmer Info Block
    doc.text(`Farmer ID: ${invoice.farmer.farmerCode}`, 320, 130);
    doc.text(`Farmer Name: ${invoice.farmer.name}`, 320, 142);
    doc.text(`Phone: ${invoice.farmer.phone} | Village: ${invoice.farmer.village}`, 320, 154);

    doc.fillColor('#e2e8f0').rect(50, 175, 512, 1).fill();

    // Table Header
    let y = 195;
    doc.fillColor('#0f172a').fontSize(8);
    doc.text('Date', 50, y, { bold: true });
    doc.text('Shift', 130, y, { bold: true });
    doc.text('Liters (L)', 200, y, { bold: true });
    doc.text('FAT / SNF', 270, y, { bold: true });
    doc.text('Rate / L', 350, y, { bold: true });
    doc.text('Amount', 450, y, { align: 'right', bold: true });

    doc.fillColor('#cbd5e1').rect(50, y + 12, 512, 1).fill();

    // Table Rows
    y = 215;
    doc.fillColor('#334155').fontSize(7.5);
    invoice.collections.forEach((col) => {
      // Prevent overflow pagination bounds simply
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(new Date(col.date).toLocaleDateString(), 50, y);
      doc.text(col.shift === 'morning' ? 'Morning' : 'Evening', 130, y);
      doc.text(col.quantity.toFixed(2), 200, y);
      doc.text(`${col.fat.toFixed(1)}% / ${col.snf.toFixed(1)}%`, 270, y);
      doc.text(`₹${col.ratePerLiter.toFixed(2)}`, 350, y);
      doc.text(`₹${col.totalAmount.toFixed(2)}`, 450, y, { align: 'right' });
      y += 15;
    });

    doc.fillColor('#cbd5e1').rect(50, y + 5, 512, 1).fill();

    // Summary Totals Block
    y += 18;
    doc.fillColor('#475569').fontSize(8);
    doc.text(`Total Liters: ${invoice.totalLiters.toFixed(2)} L`, 50, y);
    doc.text(`Avg FAT: ${invoice.avgFat.toFixed(2)}%`, 180, y);
    doc.text(`Avg SNF: ${invoice.avgSnf.toFixed(2)}%`, 300, y);
    doc.text(`Gross Amount:`, 380, y);
    doc.fillColor('#0f172a').text(`₹${invoice.grossAmount.toFixed(2)}`, 450, y, { align: 'right' });

    y += 15;
    doc.fillColor('#475569').text(`Bonus (+):`, 380, y);
    doc.fillColor('#10b981').text(`₹${invoice.bonus.toFixed(2)}`, 450, y, { align: 'right' });

    y += 15;
    doc.fillColor('#475569').text(`Deductions (-):`, 380, y);
    doc.fillColor('#ef4444').text(`₹${invoice.deductions.toFixed(2)}`, 450, y, { align: 'right' });

    y += 18;
    doc.fillColor('#e2e8f0').rect(350, y - 5, 212, 1).fill();
    doc.fillColor('#0f172a').fontSize(10);
    doc.text(`Net Amount Due:`, 350, y, { bold: true });
    doc.text(`₹${invoice.netAmount.toFixed(2)}`, 450, y, { align: 'right', bold: true });

    y += 18;
    doc.fontSize(8).fillColor('#64748b');
    doc.text(`Status: ${invoice.status.toUpperCase()} | Paid: ₹${invoice.paidAmount.toFixed(2)} | Outstanding: ₹${invoice.pendingAmount.toFixed(2)}`, 50, y);

    // Footer
    doc.fontSize(7).text('This is a system generated statement and does not require signature.', 50, 750, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
