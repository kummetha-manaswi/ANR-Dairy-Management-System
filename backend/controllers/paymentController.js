const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// @desc    Record a new payment for an invoice
// @route   POST /api/v1/payments
// @access  Private (Admin Only)
exports.recordPayment = async (req, res, next) => {
  try {
    const { invoiceId, paidAmount, paymentMode, referenceNumber, notes, reason } = req.body;

    if (!invoiceId || !paidAmount || !paymentMode) {
      return next(new ErrorResponse('Invoice, Paid Amount, and Payment Mode are required', 400));
    }

    const payAmt = parseFloat(paidAmount);
    if (payAmt <= 0) {
      return next(new ErrorResponse('Payment amount must be greater than 0', 400));
    }

    // 1. Fetch Invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return next(new ErrorResponse('Invoice not found', 404));
    }

    if (invoice.status === 'Cancelled') {
      return next(new ErrorResponse('Cannot record payment for a cancelled invoice', 400));
    }

    // 2. Validate payment amount against outstanding balance
    // Allow small rounding precision error buffer (0.01)
    if (payAmt > invoice.pendingAmount + 0.01) {
      return next(
        new ErrorResponse(
          `Payment amount ₹${payAmt.toFixed(2)} exceeds the pending invoice balance of ₹${invoice.pendingAmount.toFixed(2)}`,
          400
        )
      );
    }

    // 3. Generate payment number sequential reset monthly
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', ''); // "202607"
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const payCount = await Payment.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const index = String(payCount + 1).padStart(4, '0');
    const paymentNumber = `ANR-PAY-${yearMonth}-${index}`;

    // 4. Create Payment record
    const payment = await Payment.create({
      paymentNumber,
      invoice: invoice._id,
      farmer: invoice.farmer,
      paidAmount: payAmt,
      paymentMode,
      referenceNumber: referenceNumber || '',
      notes: notes || ''
    });

    // 5. Update Invoice outstanding balances and status
    invoice.paidAmount = parseFloat((invoice.paidAmount + payAmt).toFixed(2));
    invoice.pendingAmount = Math.max(0, parseFloat((invoice.pendingAmount - payAmt).toFixed(2)));

    if (invoice.pendingAmount <= 0.01) {
      invoice.status = 'Paid';
      invoice.pendingAmount = 0;
    }
    await invoice.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'PAYMENT_RECORDED',
      collectionTarget: 'Payment',
      recordId: payment._id,
      previousState: null,
      newState: payment.toObject(),
      reason: reason || `Payment ${paymentNumber} recorded for invoice ${invoice.invoiceNumber}.`
    });

    const populated = await payment.populate([
      { path: 'invoice', select: 'invoiceNumber netAmount pendingAmount status' },
      { path: 'farmer', select: 'farmerCode name' }
    ]);

    // Dispatch payment confirmation notification in background
    try {
      const dbFarmer = await Farmer.findById(invoice.farmer);
      if (dbFarmer) {
        const { compileTemplate, sendNotification } = require('../services/notificationService');
        compileTemplate('payment', {
          farmer_name: dbFarmer.name,
          farmer_code: dbFarmer.farmerCode,
          amount: payment.paidAmount,
          mode: payment.paymentMode,
          date: payment.paymentDate.toISOString().split('T')[0],
          ref_number: payment.referenceNumber || 'N/A'
        }).then(compiledMsg => {
          sendNotification(dbFarmer._id, dbFarmer.phone, compiledMsg, 'payment').catch(console.error);
        }).catch(console.error);
      }
    } catch (nErr) {
      console.error('Failed to trigger payment confirmation notification helper', nErr);
    }

    res.status(201).json({
      success: true,
      message: `Payment ${paymentNumber} recorded successfully`,
      data: populated,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Payments list
// @route   GET /api/v1/payments
// @access  Private (Admin & Employee)
exports.getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { paymentMode, farmerId, search } = req.query;

    const query = {};
    if (paymentMode) query.paymentMode = paymentMode;
    if (farmerId) query.farmer = farmerId;

    // Restrict to own payments if farmer
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

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('farmer', 'farmerCode name phone village')
      .populate('invoice', 'invoiceNumber netAmount')
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: {
        payments,
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

// @desc    Delete a payment (Rolls back invoice balances, Admin Only)
// @route   DELETE /api/v1/payments/:id
// @access  Private (Admin Only)
exports.deletePayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return next(new ErrorResponse('A deletion audit reason is required to remove payments', 400));
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return next(new ErrorResponse('Payment record not found', 404));
    }

    const invoice = await Invoice.findById(payment.invoice);
    if (!invoice) {
      return next(new ErrorResponse('Associated invoice not found. Cannot rollback payment.', 404));
    }

    const previousState = payment.toObject();

    // 1. Rollback invoice amounts
    invoice.paidAmount = parseFloat((invoice.paidAmount - payment.paidAmount).toFixed(2));
    invoice.pendingAmount = parseFloat((invoice.pendingAmount + payment.paidAmount).toFixed(2));
    
    // Reset status back to Generated if it was Paid
    if (invoice.status === 'Paid') {
      invoice.status = 'Generated';
    }
    await invoice.save();

    // 2. Delete payment entry
    await Payment.deleteOne({ _id: payment._id });

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'PAYMENT_DELETED',
      collectionTarget: 'Payment',
      recordId: payment._id,
      previousState,
      newState: null,
      reason: reason || 'Payment deleted and invoice balances rolled back by Admin'
    });

    res.status(200).json({
      success: true,
      message: `Payment ${payment.paymentNumber} deleted successfully. Invoice balance restored.`,
      data: null,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Single Payment by ID
// @route   GET /api/v1/payments/:id
// @access  Private (Admin & Employee)
exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('farmer', 'farmerCode name phone village bankDetails upiId')
      .populate('invoice', 'invoiceNumber netAmount pendingAmount status');

    if (!payment) {
      return next(new ErrorResponse('Payment record not found', 404));
    }

    // Verify ownership if farmer
    if (req.user.role === 'farmer' && payment.farmer._id.toString() !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to access this payment', 403));
    }

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: payment,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate and stream Payment Receipt PDF
// @route   GET /api/v1/payments/:id/pdf
// @access  Private (Admin & Employee)
exports.streamPaymentPDF = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('farmer', 'farmerCode name phone village bankDetails upiId')
      .populate('invoice', 'invoiceNumber netAmount');

    if (!payment) {
      return next(new ErrorResponse('Payment record not found', 404));
    }

    // Verify ownership if farmer
    if (req.user.role === 'farmer' && payment.farmer._id.toString() !== req.user.id.toString()) {
      return next(new ErrorResponse('Not authorized to access this payment', 403));
    }

    const DairyProfile = require('../models/DairyProfile');
    const profile = await DairyProfile.findOne();
    const dairyName = profile ? profile.dairyName : 'ANR Dairy';
    const ownerName = profile ? profile.ownerName : 'ANR Owner';
    const dairyPhone = profile ? profile.phone : '9999999999';
    const dairyEmail = profile ? profile.email : 'info@anrdairy.com';
    const dairyAddress = profile ? profile.address : 'Penugonda, AP';

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.paymentNumber}.pdf`);
    doc.pipe(res);

    // Document Header
    doc.fillColor('#0f172a').fontSize(20).text(dairyName, 50, 45, { align: 'left' });
    doc.fontSize(8).fillColor('#64748b');
    doc.text(`Owner: ${ownerName} | Ph: ${dairyPhone} | Email: ${dairyEmail}`, 50, 68);
    doc.text(dairyAddress, 50, 78);

    doc.fillColor('#cbd5e1').rect(50, 95, 512, 1).fill();

    // Receipt Meta block
    doc.fillColor('#0f172a').fontSize(14).text('PAYMENT RECEIPT STATEMENT', 50, 115, { align: 'center', bold: true });
    
    let y = 145;
    doc.fontSize(9).fillColor('#334155');
    doc.text(`Receipt No: ${payment.paymentNumber}`, 50, y);
    doc.text(`Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 320, y);

    y += 18;
    doc.text(`Farmer ID: ${payment.farmer.farmerCode}`, 50, y);
    doc.text(`Farmer Name: ${payment.farmer.name}`, 320, y);

    y += 18;
    doc.text(`Village: ${payment.farmer.village}`, 50, y);
    doc.text(`Mobile: ${payment.farmer.phone}`, 320, y);

    y += 25;
    doc.fillColor('#e2e8f0').rect(50, y, 512, 1).fill();

    y += 15;
    doc.fillColor('#0f172a').fontSize(10).text('Payment Transaction Summary', 50, y, { bold: true });

    y += 20;
    doc.fontSize(9).fillColor('#475569');
    doc.text('Invoice Reference:', 50, y);
    doc.fillColor('#0f172a').text(payment.invoice ? payment.invoice.invoiceNumber : 'N/A', 170, y);

    y += 18;
    doc.fillColor('#475569').text('Invoice Net Payout Due:', 50, y);
    doc.fillColor('#0f172a').text(`₹${payment.invoice ? payment.invoice.netAmount.toFixed(2) : '0.00'}`, 170, y);

    y += 18;
    doc.fillColor('#475569').text('Payment Method Mode:', 50, y);
    doc.fillColor('#0f172a').text(payment.paymentMode, 170, y);

    if (payment.referenceNumber) {
      y += 18;
      doc.fillColor('#475569').text('Transaction Reference ID:', 50, y);
      doc.fillColor('#0f172a').text(payment.referenceNumber, 170, y);
    }

    y += 25;
    doc.fillColor('#1e293b').rect(50, y, 512, 35).fill();
    doc.fillColor('#ffffff').fontSize(11).text('Receipt Amount Disbursed:', 70, y + 12, { bold: true });
    doc.text(`₹${payment.paidAmount.toFixed(2)}`, 430, y + 12, { align: 'right', bold: true });

    y += 55;
    if (payment.notes) {
      doc.fillColor('#475569').fontSize(8.5).text(`Notes/Remarks: ${payment.notes}`, 50, y);
      y += 25;
    }

    // Signature Block
    y = 600;
    doc.fillColor('#cbd5e1').rect(50, y, 150, 1).fill();
    doc.rect(362, y, 150, 1).fill();
    
    doc.fillColor('#64748b').fontSize(8);
    doc.text('Farmer Signature', 50, y + 10, { align: 'center', width: 150 });
    doc.text('Authorized Receiver Seal', 362, y + 10, { align: 'center', width: 150 });

    doc.end();
  } catch (error) {
    next(error);
  }
};
