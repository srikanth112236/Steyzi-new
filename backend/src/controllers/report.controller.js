const ReportService = require('../services/report.service');
const { createResponse } = require('../utils/response');
const { generateCSV, generateExcel, generatePDF } = require('../utils/fileGenerator');
const activityService = require('../services/activity.service');

class ReportController {
  /**
   * Generate residents report
   * @route GET /api/reports/residents
   */
  async generateResidentsReport(req, res) {
    try {
      const { startDate, endDate, pgId, status, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateResidentsReport({
        startDate,
        endDate,
        pgId,
        status,
        userId,
        format
      });

      // Record activity
      try {
        await activityService.recordActivity({
          type: 'report_generate',
          title: 'Residents Report Generated',
          description: `Residents report generated (${format.toUpperCase()})`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'report',
          entityName: 'Residents Report',
          branchId: req.user.branchId,
          category: 'system',
          priority: 'normal',
          status: 'success'
        });
      } catch (error) {
        console.error('Error recording report generation activity:', error);
      }

      return createResponse(res, 200, true, 'Residents report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating residents report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate residents report');
    }
  }

  /**
   * Generate payments report
   * @route GET /api/reports/payments
   */
  async generatePaymentsReport(req, res) {
    try {
      const { startDate, endDate, pgId, status, paymentMethod, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generatePaymentsReport({
        startDate,
        endDate,
        pgId,
        status,
        paymentMethod,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Payments report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating payments report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate payments report');
    }
  }

  /**
   * Generate tickets report
   * @route GET /api/reports/tickets
   */
  async generateTicketsReport(req, res) {
    try {
      const { startDate, endDate, pgId, status, priority, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateTicketsReport({
        startDate,
        endDate,
        pgId,
        status,
        priority,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Tickets report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating tickets report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate tickets report');
    }
  }

  /**
   * Generate onboarding report
   * @route GET /api/reports/onboarding
   */
  async generateOnboardingReport(req, res) {
    try {
      const { startDate, endDate, pgId, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateOnboardingReport({
        startDate,
        endDate,
        pgId,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Onboarding report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating onboarding report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate onboarding report');
    }
  }

  /**
   * Generate offboarding report
   * @route GET /api/reports/offboarding
   */
  async generateOffboardingReport(req, res) {
    try {
      const { startDate, endDate, pgId, vacationType, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateOffboardingReport({
        startDate,
        endDate,
        pgId,
        vacationType,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Offboarding report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating offboarding report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate offboarding report');
    }
  }

  /**
   * Generate occupancy report
   * @route GET /api/reports/occupancy
   */
  async generateOccupancyReport(req, res) {
    try {
      const { startDate, endDate, pgId, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateOccupancyReport({
        startDate,
        endDate,
        pgId,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Occupancy report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating occupancy report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate occupancy report');
    }
  }

  /**
   * Generate financial summary report
   * @route GET /api/reports/financial-summary
   */
  async generateFinancialSummaryReport(req, res) {
    try {
      const { startDate, endDate, pgId, format = 'json' } = req.query;
      const userId = req.user._id;

      const reportData = await ReportService.generateFinancialSummaryReport({
        startDate,
        endDate,
        pgId,
        userId,
        format
      });

      return createResponse(res, 200, true, 'Financial summary report generated successfully', reportData);
    } catch (error) {
      console.error('Error generating financial summary report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate financial summary report');
    }
  }

  /**
   * Get report analytics and charts data
   * @route GET /api/reports/analytics
   */
  async getReportAnalytics(req, res) {
    try {
      const { startDate, endDate, pgId, reportType } = req.query;
      const userId = req.user._id;

      const analyticsData = await ReportService.getReportAnalytics({
        startDate,
        endDate,
        pgId,
        reportType,
        userId
      });

      return createResponse(res, 200, true, 'Analytics data retrieved successfully', analyticsData);
    } catch (error) {
      console.error('Error getting report analytics:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get report analytics');
    }
  }

  /**
   * Export report to PDF/Excel
   */
  async exportReport(req, res) {
    try {
      const { reportType, filters, format } = req.body;
      const userId = req.user.id;

      console.log('📤 Export request:', { reportType, format, filters });

      // Validate format
      if (!['pdf', 'excel', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid format. Supported formats: pdf, excel, csv'
        });
      }

      // Generate report data
      const reportData = await ReportService.generateReportByType(reportType, { ...filters, userId, format });
      
      if (!reportData.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to generate report data'
        });
      }

      // Create file content based on format
      let fileContent, fileName, contentType;

      switch (format) {
        case 'csv':
          fileContent = await generateCSV(reportData.data);
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
          contentType = 'text/csv';
          break;
        case 'excel':
          fileContent = await generateExcel(reportData.data);
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          fileContent = await generatePDF(reportData.data, reportType);
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
          contentType = 'application/pdf';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported format'
          });
      }

      // Set response headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', Buffer.byteLength(fileContent));

      // Send file content
      res.send(fileContent);

    } catch (error) {
      console.error('❌ Export error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message
      });
    }
  }

  /**
   * Get available export formats
   */
  async getExportFormats(req, res) {
    try {
      const formats = [
        { value: 'pdf', label: 'PDF Document', icon: '📄' },
        { value: 'excel', label: 'Excel Spreadsheet', icon: '📊' },
        { value: 'csv', label: 'CSV File', icon: '📋' }
      ];

      res.json({
        success: true,
        data: formats
      });
    } catch (error) {
      console.error('Error getting export formats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get export formats'
      });
    }
  }

  /**
   * Get available report types and filters
   * @route GET /api/reports/options
   */
  async getReportOptions(req, res) {
    try {
      const userId = req.user._id;
      const options = await ReportService.getReportOptions(userId);

      return createResponse(res, 200, true, 'Report options retrieved successfully', options);
    } catch (error) {
      console.error('Error getting report options:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get report options');
    }
  }
}

module.exports = new ReportController(); 