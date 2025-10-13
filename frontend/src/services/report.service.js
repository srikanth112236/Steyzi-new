import api from './api';

class ReportService {
  /**
   * Generate residents report
   */
  async generateResidentsReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/residents?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate residents report: ${error.message}`);
    }
  }

  /**
   * Generate payments report
   */
  async generatePaymentsReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/payments?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate payments report: ${error.message}`);
    }
  }

  /**
   * Generate tickets report
   */
  async generateTicketsReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/tickets?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate tickets report: ${error.message}`);
    }
  }

  /**
   * Generate onboarding report
   */
  async generateOnboardingReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/onboarding?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate onboarding report: ${error.message}`);
    }
  }

  /**
   * Generate offboarding report
   */
  async generateOffboardingReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/offboarding?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate offboarding report: ${error.message}`);
    }
  }

  /**
   * Generate occupancy report
   */
  async generateOccupancyReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/occupancy?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate occupancy report: ${error.message}`);
    }
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialSummaryReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/reports/financial-summary?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate financial summary report: ${error.message}`);
    }
  }

  /**
   * Get report analytics and charts data
   */
  async getReportAnalytics(reportType, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value);
        }
      });
      queryParams.append('reportType', reportType);

      const response = await api.get(`/reports/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get report analytics: ${error.message}`);
    }
  }

  /**
   * Export report to PDF/Excel/CSV
   */
  async exportReport(reportType, filters, format) {
    try {
      const response = await api.post('/reports/export', {
        reportType,
        filters,
        format
      });
      
      return response.data;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  /**
   * Get available export formats
   */
  async getExportFormats() {
    try {
      const response = await api.get('/reports/export-formats');
      return response.data;
    } catch (error) {
      console.error('Get export formats error:', error);
      throw error;
    }
  }

  /**
   * Get available report options and filters
   */
  async getReportOptions() {
    try {
      const response = await api.get('/reports/options');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get report options: ${error.message}`);
    }
  }

  /**
   * Generate report by type
   */
  async generateReportByType(reportType, filters = {}) {
    switch (reportType) {
      case 'residents':
        return await this.generateResidentsReport(filters);
      case 'payments':
        return await this.generatePaymentsReport(filters);
      case 'tickets':
        return await this.generateTicketsReport(filters);
      case 'onboarding':
        return await this.generateOnboardingReport(filters);
      case 'offboarding':
        return await this.generateOffboardingReport(filters);
      case 'occupancy':
        return await this.generateOccupancyReport(filters);
      case 'financial-summary':
        return await this.generateFinancialSummaryReport(filters);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  /**
   * Download exported report
   */
  async downloadReport(downloadUrl, fileName) {
    try {
      const response = await api.get(downloadUrl, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download report: ${error.message}`);
    }
  }
}

export default new ReportService(); 