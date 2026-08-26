const { performBackup } = require('../controllers/backupController');
const DairyProfile = require('../models/DairyProfile');
const BackupLog = require('../models/BackupLog');
const fs = require('fs');
const path = require('path');

const runBackupScheduler = () => {
  console.log('[Backup Scheduler] Initialized background scheduler daemon.');

  // Run scheduler check immediately on server startup, then every hour
  const checkSchedule = async () => {
    try {
      const profile = await DairyProfile.findOne();
      if (!profile) return;

      const frequency = profile.backupFrequency || 'daily';
      
      // Refinement 8: Add manual-only option (no scheduled backup runs)
      if (frequency === 'disabled' || frequency === 'manual-only') {
        return;
      }

      // Find the last successful scheduled backup
      const lastBackup = await BackupLog.findOne({ backupType: 'Scheduled', status: 'Success' }).sort({ backupDate: -1 });

      let shouldBackup = false;
      const now = new Date();

      if (!lastBackup) {
        shouldBackup = true;
      } else {
        const timeDiffHours = (now - lastBackup.backupDate) / (1000 * 60 * 60);

        if (frequency === 'daily' && timeDiffHours >= 24) {
          shouldBackup = true;
        } else if (frequency === 'weekly' && timeDiffHours >= 24 * 7) {
          shouldBackup = true;
        } else if (frequency === 'monthly' && timeDiffHours >= 24 * 30) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log(`[Backup Scheduler] Triggering automatic scheduled backup (${frequency})...`);
        const log = await performBackup('Scheduled');
        console.log(`[Backup Scheduler] Scheduled backup file created: ${log.filename}`);

        // Purge backups exceeding the retention days settings
        const retentionDays = profile.backupRetentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const expiredLogs = await BackupLog.find({ backupDate: { $lt: cutoffDate } });
        for (const logItem of expiredLogs) {
          const filePath = path.join(__dirname, '..', 'backups', logItem.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          await logItem.deleteOne();
          console.log(`[Backup Scheduler] Cleaned up expired backup file: ${logItem.filename}`);
        }
      }
    } catch (err) {
      console.error('[Backup Scheduler] Error executing scheduler checks:', err);
    }
  };

  // Run checking immediately
  checkSchedule();
  // Set to check every 1 hour (3600000 ms)
  setInterval(checkSchedule, 60 * 60 * 1000);
};

module.exports = { runBackupScheduler };
