const NotificationLog = require('../models/NotificationLog');
const NotificationTemplate = require('../models/NotificationTemplate');
const DairyProfile = require('../models/DairyProfile');
const Farmer = require('../models/Farmer');
const whatsappService = require('./whatsappService');
const smsService = require('./smsService');

// Default templates fallback in case templates are not initialized in database
const DEFAULT_TEMPLATES = {
  collection: 'Dear {FarmerName}, {Liters}L of {MilkType} milk collected with FAT {FAT}% and SNF {SNF}% on {Date} ({Shift} shift). Rate: ₹{Rate}/L. Amount: ₹{Amount}. Thank you, {DairyName}.',
  bill: 'Dear {FarmerName}, Bill {BillNumber} generated for period {Date}. Qty: {Liters}L, Net Amount: ₹{Amount}. Thank you, {DairyName}.',
  payment: 'Dear {FarmerName}, Payout of ₹{Amount} processed via {PaymentMode} on {Date}. Thank you, {DairyName}.',
  custom: 'Dear {FarmerName}, message from {DairyName}.'
};

/**
 * Fetch template and compile placeholders
 */
const compileTemplate = async (type, variables = {}) => {
  let templateText = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.custom;
  try {
    const template = await NotificationTemplate.findOne({ type });
    if (template) {
      templateText = template.templateText;
    }
  } catch (err) {
    console.error('Failed to load notification template from DB, using fallback', err);
  }

  // Load dairy name
  let dairyName = 'ANR Dairy';
  try {
    const profile = await DairyProfile.findOne();
    if (profile) dairyName = profile.dairyName;
  } catch (err) {}

  // Map placeholders in both casing styles to ensure foolproof compilation
  const mergedVars = {
    // Lowercase / Snake_case
    dairy_name: dairyName,
    farmer_name: variables.farmer_name || variables.FarmerName || '',
    farmer_code: variables.farmer_code || variables.FarmerID || variables.farmer_id || '',
    date: variables.date || variables.Date || '',
    liters: variables.liters !== undefined ? variables.liters : (variables.Liters !== undefined ? variables.Liters : ''),
    fat: variables.fat !== undefined ? variables.fat : (variables.FAT !== undefined ? variables.FAT : ''),
    snf: variables.snf !== undefined ? variables.snf : (variables.SNF !== undefined ? variables.SNF : ''),
    rate: variables.rate !== undefined ? variables.rate : (variables.Rate !== undefined ? variables.Rate : ''),
    amount: variables.amount !== undefined ? variables.amount : (variables.Amount !== undefined ? variables.Amount : ''),
    bill_number: variables.bill_number || variables.BillNumber || variables.invoice_number || '',
    payment_amount: variables.payment_amount || variables.PaymentAmount || variables.amount || '',
    shift: variables.shift || variables.Shift || '',
    milk_type: variables.milk_type || variables.MilkType || '',
    mode: variables.mode || variables.PaymentMode || '',
    
    // PascalCase / UpperCase / CamelCase variants
    DairyName: dairyName,
    FarmerName: variables.farmer_name || variables.FarmerName || '',
    FarmerID: variables.farmer_code || variables.FarmerID || variables.farmer_id || '',
    Date: variables.date || variables.Date || '',
    Liters: variables.liters !== undefined ? variables.liters : (variables.Liters !== undefined ? variables.Liters : ''),
    FAT: variables.fat !== undefined ? variables.fat : (variables.FAT !== undefined ? variables.FAT : ''),
    SNF: variables.snf !== undefined ? variables.snf : (variables.SNF !== undefined ? variables.SNF : ''),
    Rate: variables.rate !== undefined ? variables.rate : (variables.Rate !== undefined ? variables.Rate : ''),
    Amount: variables.amount !== undefined ? variables.amount : (variables.Amount !== undefined ? variables.Amount : ''),
    BillNumber: variables.bill_number || variables.BillNumber || variables.invoice_number || '',
    PaymentAmount: variables.payment_amount || variables.PaymentAmount || variables.amount || '',
    Shift: variables.shift || variables.Shift || '',
    MilkType: variables.milk_type || variables.MilkType || '',
    PaymentMode: variables.mode || variables.PaymentMode || '',
  };

  // Replace all {variable} placeholders in the template text
  let message = templateText;
  Object.keys(mergedVars).forEach((key) => {
    const value = mergedVars[key] !== undefined && mergedVars[key] !== null ? mergedVars[key].toString() : '';
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, value);
  });

  return message;
};

/**
 * Dispatcher: Handles provider execution, status progression, and fallback logic
 */
const sendNotification = async (farmerId, recipientPhone, message, type, forceMedium = null, existingLog = null) => {
  let enableWhatsApp = false;
  let enableSMS = false;
  let profile = null;

  try {
    profile = await DairyProfile.findOne();
    if (profile) {
      enableWhatsApp = profile.enableWhatsApp;
      enableSMS = profile.enableSMS;
    }
  } catch (err) {
    console.error('Error fetching dairy profile settings:', err);
  }

  const recipient = recipientPhone || 'N/A';
  let log;

  if (existingLog) {
    log = existingLog;
    // Record current state in retryHistory before mutating status
    if (log.status === 'Failed' || log.status === 'Sent') {
      log.retryHistory.push({
        attemptedAt: log.updatedAt || new Date(),
        status: log.status,
        errorMessage: log.errorMessage || 'Manually retried from history.',
        medium: log.medium
      });
    }
    log.status = 'Queued';
    log.attempts += 1;
    log.errorMessage = '';
    // If medium is 'both' we might retry specific or whatever is configured
    log.medium = forceMedium || log.medium;
  } else {
    const medium = forceMedium || (enableWhatsApp && enableSMS ? 'both' : enableWhatsApp ? 'whatsapp' : 'sms');
    log = new NotificationLog({
      farmer: farmerId,
      type,
      medium,
      recipient,
      message,
      status: 'Queued',
      attempts: 1
    });
  }
  await log.save();

  // If both channels are disabled globally and we are not forcing a specific medium
  if (!enableWhatsApp && !enableSMS && !forceMedium) {
    log.status = 'Failed';
    log.errorMessage = 'WhatsApp and SMS notifications are globally disabled in Settings';
    await log.save();
    return log;
  }

  // 2. Transition status to 'Sending'
  log.status = 'Sending';
  await log.save();

  let whatsappSuccess = false;
  let whatsappErrMessage = '';

  const activeMedium = log.medium;

  // 3. Attempt WhatsApp Dispatch
  if (activeMedium === 'whatsapp' || activeMedium === 'both') {
    if (enableWhatsApp || forceMedium === 'whatsapp') {
      try {
        const result = await whatsappService.sendMessage(recipient, message, profile);
        if (result && result.success) {
          log.status = existingLog ? 'Retried' : 'Sent';
          log.messageId = result.messageId;
          log.deliveryTime = result.timestamp || new Date();
          whatsappSuccess = true;
        } else {
          whatsappErrMessage = 'WhatsApp provider failed to dispatch.';
        }
      } catch (error) {
        whatsappErrMessage = error.message || 'WhatsApp API Connection Timeout';
      }
    } else {
      whatsappErrMessage = 'WhatsApp notifications are disabled.';
    }
  }

  // 4. SMS Fallback Trigger
  const triggerSMS = 
    (activeMedium === 'sms') || 
    (activeMedium === 'both' && !whatsappSuccess) || 
    (activeMedium === 'whatsapp' && !whatsappSuccess && enableSMS);

  if (triggerSMS) {
    // If WhatsApp failed, log it in retry history first
    if ((activeMedium === 'whatsapp' || activeMedium === 'both') && !whatsappSuccess) {
      log.retryHistory.push({
        attemptedAt: new Date(),
        status: 'Failed',
        errorMessage: `WhatsApp Dispatch Failed: ${whatsappErrMessage}. Attempting SMS Fallback.`,
        medium: 'whatsapp'
      });
      log.attempts += 1;
    }

    if (enableSMS || forceMedium === 'sms') {
      try {
        const result = await smsService.sendSMS(recipient, message, profile);
        if (result && result.success) {
          log.status = existingLog ? 'Retried' : 'Sent';
          log.messageId = result.messageId;
          log.deliveryTime = result.timestamp || new Date();
          log.errorMessage = whatsappSuccess ? '' : 'Sent via SMS fallback.';
        } else {
          log.status = 'Failed';
          log.errorMessage = `SMS Dispatch Failed. WhatsApp Error: ${whatsappErrMessage}`;
        }
      } catch (error) {
        log.status = 'Failed';
        log.errorMessage = `SMS Fallback Error: ${error.message}. WhatsApp Error: ${whatsappErrMessage}`;
      }
    } else {
      log.status = 'Failed';
      log.errorMessage = `WhatsApp Failed: ${whatsappErrMessage}. SMS fallback is disabled in settings.`;
    }
  } else if (!whatsappSuccess) {
    log.status = 'Failed';
    log.errorMessage = `WhatsApp Dispatch Failed: ${whatsappErrMessage}`;
  }

  await log.save();
  return log;
};

module.exports = {
  compileTemplate,
  sendNotification
};
