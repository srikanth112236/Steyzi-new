const cron = require('node-cron');
const ExpenseSettings = require('../models/expenseSettings.model');
const expenseReportService = require('../services/expenseReport.service');

/**
 * Scheduled job to send monthly expense reports
 * Runs daily at 9:00 AM to check if it's the report day
 */
class ExpenseMonthlyReportJob {
  constructor() {
    this.isRunning = false;
    this.task = null;
  }

  /**
   * Start the scheduled job
   */
  start() {
    // Run daily at 9:00 AM
    this.task = cron.schedule('0 9 * * *', async () => {
      await this.checkAndSendMonthlyReport();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    console.log('✅ Expense Monthly Report Job started (runs daily at 9:00 AM)');
  }

  /**
   * Stop the scheduled job
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('🛑 Expense Monthly Report Job stopped');
    }
  }

  /**
   * Check if it's the report day and send monthly report
   */
  async checkAndSendMonthlyReport() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Expense Monthly Report Job already running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🔍 Checking if monthly expense report should be sent...');

      const settings = await ExpenseSettings.getSettings();

      // Check if monthly reports are enabled
      if (!settings.monthlyReportsEnabled) {
        console.log('ℹ️ Monthly expense reports are disabled');
        this.isRunning = false;
        return;
      }

      // Check if email is configured
      if (!settings.monthlyReportEmail) {
        console.log('ℹ️ Monthly report email not configured');
        this.isRunning = false;
        return;
      }

      // Get current date
      const now = new Date();
      const today = now.getDate();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Check if it's the report day
      if (today !== settings.reportDay) {
        console.log(`ℹ️ Today is ${today}, report day is ${settings.reportDay}. Skipping...`);
        this.isRunning = false;
        return;
      }

      // Check if report was already sent this month
      if (settings.lastSentDate) {
        const lastSent = new Date(settings.lastSentDate);
        if (lastSent.getMonth() === now.getMonth() && lastSent.getFullYear() === now.getFullYear()) {
          console.log('ℹ️ Monthly expense report already sent this month');
          this.isRunning = false;
          return;
        }
      }

      console.log(`📧 Sending monthly expense report for ${currentYear}-${currentMonth}...`);

      // Send report for last month (month that just ended)
      let reportMonth = currentMonth - 1;
      let reportYear = currentYear;

      if (reportMonth === 0) {
        reportMonth = 12;
        reportYear = currentYear - 1;
      }

      // Send the monthly report
      const result = await expenseReportService.sendMonthlyReportEmail(
        settings.monthlyReportEmail,
        reportYear,
        reportMonth
      );

      if (result.success) {
        // Update last sent date
        settings.lastSentDate = now;
        await settings.save();

        console.log(`✅ Monthly expense report sent successfully for ${reportYear}-${reportMonth}`);
      } else {
        console.error(`❌ Failed to send monthly expense report: ${result.error || result.message}`);
      }

      this.isRunning = false;
    } catch (error) {
      console.error('❌ Error in Expense Monthly Report Job:', error);
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger monthly report
   */
  async triggerManually(year, month, emailAddress) {
    try {
      console.log(`📧 Manually triggering monthly expense report for ${year}-${month}...`);
      
      const result = await expenseReportService.sendMonthlyReportEmail(
        emailAddress,
        year,
        month
      );

      if (result.success) {
        console.log(`✅ Monthly expense report sent successfully`);
      } else {
        console.error(`❌ Failed to send monthly expense report: ${result.error || result.message}`);
      }

      return result;
    } catch (error) {
      console.error('❌ Error in manual trigger:', error);
      return {
        success: false,
        message: 'Failed to send monthly expense report',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const expenseMonthlyReportJob = new ExpenseMonthlyReportJob();

module.exports = expenseMonthlyReportJob;

