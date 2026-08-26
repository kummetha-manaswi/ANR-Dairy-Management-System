const DairyProfile = require('../models/DairyProfile');
const AuditLog = require('../models/AuditLog');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const fs = require('fs');
const path = require('path');

// Helper to get or bootstrap default profile
const getOrCreateProfile = async () => {
  let profile = await DairyProfile.findOne();
  if (!profile) {
    profile = await DairyProfile.create({
      dairyName: 'ANR Dairy',
      ownerName: 'Admin Owner',
      phone: '9999999999',
      email: 'admin@anrdairy.com',
      address: 'ANR Dairy Head Office, Penugonda, Andhra Pradesh',
      logo: '',
      gstNumber: '',
      defaultMilkType: 'buffalo',
      rememberMilkType: false,
      defaultShift: 'morning',
      useFarmerPreferredMilkType: false,
      rememberFarmerMilkType: false
    });
  }
  return profile;
};

// @desc    Get Dairy Profile details
// @route   GET /api/v1/dairy
// @access  Public (so landing/login pages can load the branding)
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateProfile();
    res.status(200).json({
      success: true,
      message: 'Dairy profile retrieved successfully',
      data: profile,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Dairy Profile details
// @route   PUT /api/v1/dairy
// @access  Private (Admin Only)
exports.updateProfile = async (req, res, next) => {
  try {
    const { 
      dairyName, ownerName, phone, email, address, gstNumber, 
      minFat, maxFat, minSnf, maxSnf, billingCycle, 
      enableWhatsApp, enableSMS,
      whatsappProvider, whatsappApiUrl, whatsappApiKey, whatsappSenderNumber,
      smsProvider, smsApiUrl, smsApiKey, smsSenderId,
      rateMode, language, theme, printLayout, backupFrequency, backupRetentionDays,
      timezone, dateFormat, currency,
      defaultMilkType, rememberMilkType,
      defaultShift, useFarmerPreferredMilkType, rememberFarmerMilkType,
      reason 
    } = req.body;

    let profile = await getOrCreateProfile();
    const previousState = profile.toObject();

    // Update fields
    if (dairyName) profile.dairyName = dairyName;
    if (ownerName) profile.ownerName = ownerName;
    if (phone) profile.phone = phone;
    if (email) profile.email = email;
    if (address) profile.address = address;
    if (gstNumber !== undefined) profile.gstNumber = gstNumber;
    if (minFat !== undefined) profile.minFat = minFat;
    if (maxFat !== undefined) profile.maxFat = maxFat;
    if (minSnf !== undefined) profile.minSnf = minSnf;
    if (maxSnf !== undefined) profile.maxSnf = maxSnf;
    if (billingCycle) profile.billingCycle = billingCycle;
    if (enableWhatsApp !== undefined) profile.enableWhatsApp = enableWhatsApp;
    if (enableSMS !== undefined) profile.enableSMS = enableSMS;

    // Update new administrative configurations
    if (rateMode) profile.rateMode = rateMode;
    if (language) profile.language = language;
    if (theme) profile.theme = theme;
    if (printLayout) profile.printLayout = printLayout;
    if (backupFrequency) profile.backupFrequency = backupFrequency;
    if (backupRetentionDays !== undefined) profile.backupRetentionDays = backupRetentionDays;
    if (timezone) profile.timezone = timezone;
    if (dateFormat) profile.dateFormat = dateFormat;
    if (currency) profile.currency = currency;
    if (defaultMilkType) profile.defaultMilkType = defaultMilkType;
    if (rememberMilkType !== undefined) profile.rememberMilkType = rememberMilkType;
    if (defaultShift) profile.defaultShift = defaultShift;
    if (useFarmerPreferredMilkType !== undefined) profile.useFarmerPreferredMilkType = useFarmerPreferredMilkType;
    if (rememberFarmerMilkType !== undefined) profile.rememberFarmerMilkType = rememberFarmerMilkType;

    // Update Provider details
    if (whatsappProvider) profile.whatsappProvider = whatsappProvider;
    if (whatsappApiUrl !== undefined) profile.whatsappApiUrl = whatsappApiUrl;
    if (whatsappApiKey !== undefined) profile.whatsappApiKey = whatsappApiKey;
    if (whatsappSenderNumber !== undefined) profile.whatsappSenderNumber = whatsappSenderNumber;
    if (smsProvider) profile.smsProvider = smsProvider;
    if (smsApiUrl !== undefined) profile.smsApiUrl = smsApiUrl;
    if (smsApiKey !== undefined) profile.smsApiKey = smsApiKey;
    if (smsSenderId !== undefined) profile.smsSenderId = smsSenderId;

    await profile.save();
    const newState = profile.toObject();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'DAIRY_PROFILE_UPDATED',
      collectionTarget: 'DairyProfile',
      recordId: profile._id,
      previousState,
      newState,
      reason: reason || 'Dairy profile details modified via settings page'
    });

    res.status(200).json({
      success: true,
      message: 'Dairy profile updated successfully',
      data: profile,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload or update Dairy Logo
// @route   POST /api/v1/dairy/logo
// @access  Private (Admin Only)
exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a logo image file', 400));
    }

    let profile = await getOrCreateProfile();
    const previousState = profile.toObject();

    // Delete old logo file if it exists locally
    if (profile.logo) {
      const oldPath = path.join(__dirname, '..', profile.logo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save relative path for static asset loading
    const relativeLogoPath = `/uploads/${req.file.filename}`;
    profile.logo = relativeLogoPath;
    await profile.save();
    const newState = profile.toObject();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      action: 'DAIRY_PROFILE_UPDATED',
      collectionTarget: 'DairyProfile',
      recordId: profile._id,
      previousState,
      newState,
      reason: 'Dairy logo uploaded/changed'
    });

    res.status(200).json({
      success: true,
      message: 'Dairy logo uploaded successfully',
      data: profile,
      errors: null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get System Status and Stats
// @route   GET /api/v1/dairy/system-info
// @access  Private
exports.getSystemInfo = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const User = require('../models/User');
    const Farmer = require('../models/Farmer');
    const MilkCollection = require('../models/MilkCollection');
    const Invoice = require('../models/Invoice');
    const Payment = require('../models/Payment');
    const BackupLog = require('../models/BackupLog');

    // Aggregate counts
    const [usersCount, farmersCount, collectionsCount, invoicesCount, paymentsCount] = await Promise.all([
      User.countDocuments(),
      Farmer.countDocuments(),
      MilkCollection.countDocuments(),
      Invoice.countDocuments(),
      Payment.countDocuments()
    ]);

    // Query last backup details
    const lastBackup = await BackupLog.findOne({ status: 'Success' }).sort({ backupDate: -1 });

    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.status(200).json({
      success: true,
      message: 'System details fetched successfully',
      data: {
        appName: 'ANR Dairy SaaS ERP',
        appVersion: '1.0.0',
        buildVersion: '20260709.01',
        backendStatus: 'operational',
        databaseStatus: dbStatusMap[dbState] || 'unknown',
        totalRecords: {
          users: usersCount,
          farmers: farmersCount,
          collections: collectionsCount,
          invoices: invoicesCount,
          payments: paymentsCount
        },
        lastBackup: lastBackup ? {
          filename: lastBackup.filename,
          date: lastBackup.backupDate,
          type: lastBackup.backupType
        } : null
      },
      errors: null
    });
  } catch (error) {
    next(error);
  }
};
