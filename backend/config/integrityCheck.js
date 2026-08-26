const User = require('../models/User');

/**
 * Checks database integrity on startup.
 * Logs whether an Administrator account exists.
 * If not, logs a warning indicating that First-Time Setup is required.
 */
const runStartupIntegrityCheck = async () => {
  try {
    console.log('[Integrity Check] Running startup integrity checks...');

    // Find first active administrator
    const admin = await User.findOne({ role: 'admin', status: 'active' });

    if (!admin) {
      console.warn('[Integrity Check] WARNING: No active Administrator account found! The system is in First-Time Setup mode.');
      return;
    }

    console.log(`[Integrity Check] Active administrator account "${admin.name}" (${admin.phone}) verified.`);

  } catch (error) {
    console.error('[Integrity Check] Error running startup integrity check:', error);
  }
};

module.exports = runStartupIntegrityCheck;
