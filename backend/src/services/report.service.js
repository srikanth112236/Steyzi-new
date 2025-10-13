const Resident = require('../models/resident.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const PG = require('../models/pg.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

class ReportService {
  /**
   * Generate residents report
   */
  async generateResidentsReport({ startDate, endDate, pgId, status, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Apply date filters
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Apply status filter
      if (status && status !== 'all') {
        query.status = status;
      }

      console.log('🔍 Residents query:', JSON.stringify(query, null, 2));

      const residents = await Resident.find(query)
        .populate('pgId', 'name')
        .populate('branchId', 'name')
        .populate('roomId', 'roomNumber')
        .sort({ createdAt: -1 });

      console.log('📊 Found residents:', residents.length);

      // Calculate statistics with proper moved out counting
      const stats = {
        total: residents.length,
        active: residents.filter(r => r.status === 'active').length,
        inactive: residents.filter(r => r.status === 'inactive').length,
        noticePeriod: residents.filter(r => r.status === 'notice_period').length,
        pending: residents.filter(r => r.status === 'pending').length,
        movedOut: residents.filter(r => r.status === 'moved_out' || r.status === 'inactive').length
      };

      // Enhanced monthly trend data with comparison
      const monthlyTrend = await this.getEnhancedMonthlyTrend('residents', query, 'createdAt');
      
      // Comparison analytics (current period vs previous period)
      const comparisonData = await this.getComparisonAnalytics('residents', query, startDate, endDate);

      // Status distribution for pie chart
      const statusDistribution = await Resident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Gender distribution
      const genderDistribution = await Resident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]);

      // Room type distribution
      const roomTypeDistribution = await Resident.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $group: {
            _id: '$room.sharingType',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        data: residents,
        statistics: stats,
        monthlyTrend,
        comparisonData,
        statusDistribution,
        genderDistribution,
        roomTypeDistribution,
        filters: { startDate, endDate, pgId, status },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error in generateResidentsReport:', error);
      throw new Error(`Failed to generate residents report: ${error.message}`);
    }
  }

  /**
   * Generate payments report
   */
  async generatePaymentsReport({ startDate, endDate, pgId, status, paymentMethod, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Apply date filters
      if (startDate && endDate) {
        query.paymentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Apply status filter
      if (status && status !== 'all') {
        query.status = status;
      }

      // Apply payment method filter
      if (paymentMethod && paymentMethod !== 'all') {
        query.paymentMethod = paymentMethod;
      }

      console.log('🔍 Payments query:', JSON.stringify(query, null, 2));

      const payments = await Payment.find(query)
        .populate('residentId', 'firstName lastName phone')
        .populate('pgId', 'name')
        .populate('roomId', 'roomNumber')
        .populate('markedBy', 'firstName lastName')
        .sort({ paymentDate: -1 });

      console.log('📊 Found payments:', payments.length);

      // Calculate statistics
      const stats = {
        total: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paid: payments.filter(p => p.status === 'paid').length,
        paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: payments.filter(p => p.status === 'pending').length,
        pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
        overdue: payments.filter(p => p.status === 'overdue').length,
        overdueAmount: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0)
      };

      // Payment method breakdown
      const paymentMethodBreakdown = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Monthly revenue trend
      const monthlyRevenue = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
              ]
            },
            revenue: 1,
            count: 1
          }
        },
        { $sort: { month: 1 } }
      ]);

      // Enhanced monthly trend data
      const monthlyTrend = await this.getEnhancedMonthlyTrend('payments', query, 'paymentDate');
      
      // Comparison analytics
      const comparisonData = await this.getComparisonAnalytics('payments', query, startDate, endDate);

      // Payment status distribution
      const statusDistribution = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      return {
        data: payments,
        statistics: stats,
        paymentMethodBreakdown,
        monthlyRevenue,
        monthlyTrend,
        comparisonData,
        statusDistribution,
        filters: { startDate, endDate, pgId, status, paymentMethod },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error in generatePaymentsReport:', error);
      throw new Error(`Failed to generate payments report: ${error.message}`);
    }
  }

  /**
   * Generate tickets report
   */
  async generateTicketsReport(filters = {}) {
    try {
      const { startDate, endDate, pgId, userId } = filters;
      
      // Build query
      const query = {};
      if (pgId) query.pg = pgId; // Use 'pg' field as per Ticket model
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        };
      }

      console.log('🔍 Tickets query:', JSON.stringify(query, null, 2));

      // Get tickets data
      const tickets = await Ticket.find(query)
        .populate('pg', 'name')
        .populate('assignedTo', 'firstName lastName')
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 });

      console.log('📊 Found tickets:', tickets.length);

      // Calculate statistics
      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
      };

      console.log('📈 Tickets stats:', stats);

      // Get monthly trend
      const monthlyTrend = await this.getEnhancedMonthlyTrend('tickets', query, 'createdAt');

      // Get comparison data
      const comparisonData = await this.getComparisonAnalytics('tickets', query, startDate, endDate);

      // Get resolution time analytics
      const resolutionTimeData = await this.getResolutionTimeAnalytics(query);

      // Prepare data for table
      const data = tickets.map(ticket => ({
        id: ticket._id,
        subject: ticket.title || ticket.description?.substring(0, 50) + '...',
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        pgName: ticket.pg?.name || 'N/A',
        assignedTo: ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unassigned',
        createdBy: ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown',
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolution?.resolvedAt
      }));

      return {
        success: true,
        data: {
          statistics: stats,
          monthlyTrend,
          comparisonData,
          resolutionTimeData,
          data
        }
      };
    } catch (error) {
      console.error('Error generating tickets report:', error);
      throw error;
    }
  }

  /**
   * Generate onboarding report
   */
  async generateOnboardingReport({ startDate, endDate, pgId, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Apply date filters
      if (startDate && endDate) {
        query.checkInDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      console.log('🔍 Onboarding query:', JSON.stringify(query, null, 2));

      const residents = await Resident.find(query)
        .populate('pgId', 'name')
        .populate('roomId', 'roomNumber')
        .sort({ checkInDate: -1 });

      console.log('📊 Found onboarding residents:', residents.length);

      // Calculate statistics
      const stats = {
        total: residents.length,
        totalRevenue: residents.reduce((sum, r) => sum + (r.rentAmount || 8000), 0),
        averageRent: residents.length > 0 ? residents.reduce((sum, r) => sum + (r.rentAmount || 8000), 0) / residents.length : 0,
        thisMonth: residents.filter(r => {
          const checkIn = new Date(r.checkInDate);
          const now = new Date();
          return checkIn.getMonth() === now.getMonth() && checkIn.getFullYear() === now.getFullYear();
        }).length,
        lastMonth: residents.filter(r => {
          const checkIn = new Date(r.checkInDate);
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return checkIn.getMonth() === lastMonth.getMonth() && checkIn.getFullYear() === lastMonth.getFullYear();
        }).length
      };

      // Monthly onboarding trend
      const monthlyTrend = await this.getEnhancedMonthlyTrend('residents', query, 'checkInDate');

      // Room type breakdown
      const roomTypeBreakdown = await Resident.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $group: {
            _id: '$room.sharingType',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$rentAmount' }
          }
        }
      ]);

      // Gender distribution for onboarding
      const genderDistribution = await Resident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]);

      // Comparison analytics
      const comparisonData = await this.getComparisonAnalytics('residents', query, startDate, endDate);

      return {
        data: residents,
        statistics: stats,
        monthlyTrend,
        roomTypeBreakdown,
        genderDistribution,
        comparisonData,
        filters: { startDate, endDate, pgId },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error in generateOnboardingReport:', error);
      throw new Error(`Failed to generate onboarding report: ${error.message}`);
    }
  }

  /**
   * Generate offboarding report
   */
  async generateOffboardingReport({ startDate, endDate, pgId, vacationType, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = { status: { $in: ['inactive', 'moved_out', 'notice_period'] } };

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Apply date filters
      if (startDate && endDate) {
        query.checkOutDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Apply vacation type filter
      if (vacationType && vacationType !== 'all') {
        if (vacationType === 'immediate') {
          query.vacationDate = { $exists: false };
        } else if (vacationType === 'notice') {
          query.vacationDate = { $exists: true };
        }
      }

      console.log('🔍 Offboarding query:', JSON.stringify(query, null, 2));

      const residents = await Resident.find(query)
        .populate('pgId', 'name')
        .populate('roomId', 'roomNumber')
        .sort({ checkOutDate: -1 });

      console.log('📊 Found offboarding residents:', residents.length);

      // Calculate statistics
      const stats = {
        total: residents.length,
        immediate: residents.filter(r => !r.vacationDate).length,
        noticePeriod: residents.filter(r => r.vacationDate).length,
        averageNoticeDays: residents.filter(r => r.noticeDays).reduce((sum, r) => sum + r.noticeDays, 0) / residents.filter(r => r.noticeDays).length || 0,
        thisMonth: residents.filter(r => {
          const checkOut = new Date(r.checkOutDate);
          const now = new Date();
          return checkOut.getMonth() === now.getMonth() && checkOut.getFullYear() === now.getFullYear();
        }).length,
        lastMonth: residents.filter(r => {
          const checkOut = new Date(r.checkOutDate);
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return checkOut.getMonth() === lastMonth.getMonth() && checkOut.getFullYear() === lastMonth.getFullYear();
        }).length
      };

      // Monthly offboarding trend
      const monthlyTrend = await this.getEnhancedMonthlyTrend('residents', query, 'checkOutDate');

      // Vacation type breakdown
      const vacationTypeBreakdown = [
        { type: 'Immediate', count: stats.immediate },
        { type: 'Notice Period', count: stats.noticePeriod }
      ];

      // Gender distribution for offboarding
      const genderDistribution = await Resident.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }
        }
      ]);

      // Room type breakdown for offboarding
      const roomTypeBreakdown = await Resident.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $group: {
            _id: '$room.sharingType',
            count: { $sum: 1 }
          }
        }
      ]);

      // Comparison analytics
      const comparisonData = await this.getComparisonAnalytics('residents', query, startDate, endDate);

      return {
        data: residents,
        statistics: stats,
        monthlyTrend,
        vacationTypeBreakdown,
        genderDistribution,
        roomTypeBreakdown,
        comparisonData,
        filters: { startDate, endDate, pgId, vacationType },
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error in generateOffboardingReport:', error);
      throw new Error(`Failed to generate offboarding report: ${error.message}`);
    }
  }

  /**
   * Generate occupancy report
   */
  async generateOccupancyReport({ startDate, endDate, pgId, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Get rooms and their occupancy
      const rooms = await Room.find(query)
        .populate('pgId', 'name')
        .populate('floorId', 'name');

      // Get residents for occupancy calculation
      const residents = await Resident.find({ ...query, status: 'active' });

      // Calculate occupancy statistics
      const totalBeds = rooms.reduce((sum, room) => sum + room.numberOfBeds, 0);
      const occupiedBeds = residents.length;
      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      // Room-wise occupancy
      const roomOccupancy = rooms.map(room => {
        const roomResidents = residents.filter(r => r.roomId?.toString() === room._id.toString());
        return {
          roomNumber: room.roomNumber,
          totalBeds: room.numberOfBeds,
          occupiedBeds: roomResidents.length,
          occupancyRate: room.numberOfBeds > 0 ? (roomResidents.length / room.numberOfBeds) * 100 : 0,
          floor: room.floorId?.name || 'Ground Floor'
        };
      });

      // Monthly occupancy trend
      const monthlyTrend = await this.getMonthlyOccupancyTrend(query, startDate, endDate);

      return {
        statistics: {
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        roomOccupancy,
        monthlyTrend,
        filters: { startDate, endDate, pgId },
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to generate occupancy report: ${error.message}`);
    }
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialSummaryReport({ startDate, endDate, pgId, userId, format = 'json' }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      // Apply date filters
      if (startDate && endDate) {
        query.paymentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get payment statistics
      const paymentStats = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalPayments: { $sum: 1 },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
              }
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            },
            overdueAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0]
              }
            }
          }
        }
      ]);

      // Get monthly revenue trend
      const monthlyRevenue = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Get payment method breakdown
      const paymentMethodBreakdown = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentMethod',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = paymentStats[0] || {
        totalRevenue: 0,
        totalPayments: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0
      };

      return {
        statistics: stats,
        monthlyRevenue,
        paymentMethodBreakdown,
        filters: { startDate, endDate, pgId },
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to generate financial summary report: ${error.message}`);
    }
  }

  /**
   * Get report analytics and charts data
   */
  async getReportAnalytics({ startDate, endDate, pgId, reportType, userId }) {
    try {
      const user = await User.findById(userId);
      const query = {};

      // Apply PG filter based on user role
      if (user.role === 'admin') {
        query.pgId = user.pgId;
      } else if (pgId) {
        query.pgId = pgId;
      }

      let analyticsData = {};

      switch (reportType) {
        case 'residents':
          analyticsData = await this.getResidentsAnalytics(query, startDate, endDate);
          break;
        case 'payments':
          analyticsData = await this.getPaymentsAnalytics(query, startDate, endDate);
          break;
        case 'tickets':
          analyticsData = await this.getTicketsAnalytics(query, startDate, endDate);
          break;
        case 'occupancy':
          analyticsData = await this.getOccupancyAnalytics(query, startDate, endDate);
          break;
        default:
          analyticsData = await this.getAllAnalytics(query, startDate, endDate);
      }

      return analyticsData;
    } catch (error) {
      throw new Error(`Failed to get report analytics: ${error.message}`);
    }
  }

  /**
   * Get available report options
   */
  async getReportOptions(userId) {
    try {
      const user = await User.findById(userId);
      const query = {};

      if (user.role === 'admin') {
        query._id = user.pgId;
      }

      const pgs = await PG.find(query, 'name');

      return {
        reportTypes: [
          { value: 'residents', label: 'Residents Report' },
          { value: 'payments', label: 'Payments Report' },
          { value: 'tickets', label: 'Tickets Report' },
          { value: 'onboarding', label: 'Onboarding Report' },
          { value: 'offboarding', label: 'Offboarding Report' },
          { value: 'occupancy', label: 'Occupancy Report' },
          { value: 'financial-summary', label: 'Financial Summary' }
        ],
        statusOptions: [
          { value: 'all', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
          { value: 'notice_period', label: 'Notice Period' },
          { value: 'moved_out', label: 'Moved Out' }
        ],
        paymentStatusOptions: [
          { value: 'all', label: 'All Statuses' },
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'overdue', label: 'Overdue' }
        ],
        paymentMethodOptions: [
          { value: 'all', label: 'All Methods' },
          { value: 'cash', label: 'Cash' },
          { value: 'upi', label: 'UPI' },
          { value: 'online_transfer', label: 'Online Transfer' },
          { value: 'card', label: 'Card' },
          { value: 'other', label: 'Other' }
        ],
        ticketStatusOptions: [
          { value: 'all', label: 'All Statuses' },
          { value: 'open', label: 'Open' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' }
        ],
        priorityOptions: [
          { value: 'all', label: 'All Priorities' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ],
        vacationTypeOptions: [
          { value: 'all', label: 'All Types' },
          { value: 'immediate', label: 'Immediate' },
          { value: 'notice', label: 'Notice Period' }
        ],
        pgs: pgs.map(pg => ({ value: pg._id, label: pg.name })),
        dateRanges: [
          { value: 'last7days', label: 'Last 7 Days' },
          { value: 'last30days', label: 'Last 30 Days' },
          { value: 'last3months', label: 'Last 3 Months' },
          { value: 'last6months', label: 'Last 6 Months' },
          { value: 'last12months', label: 'Last 12 Months' },
          { value: 'custom', label: 'Custom Range' }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get report options: ${error.message}`);
    }
  }

  /**
   * Export report to PDF/Excel
   */
  async exportReport({ reportType, filters, format, userId }) {
    try {
      // This would integrate with PDF/Excel generation libraries
      // For now, return the report data
      const reportData = await this.generateReportByType(reportType, { ...filters, userId, format });
      
      return {
        downloadUrl: `/api/reports/download/${reportType}-${Date.now()}.${format}`,
        fileName: `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`,
        data: reportData
      };
    } catch (error) {
      throw new Error(`Failed to export report: ${error.message}`);
    }
  }

  // Helper methods
  async getMonthlyTrend(data, dateField) {
    const monthlyData = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey]++;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Enhanced monthly trend with better data structure
   */
  async getEnhancedMonthlyTrend(collection, query, dateField) {
    try {
      let Model;
      switch (collection) {
        case 'tickets':
          Model = Ticket;
          break;
        case 'payments':
          Model = Payment;
          break;
        case 'residents':
          Model = Resident;
          break;
        default:
          Model = Ticket;
      }

      const monthlyData = await Model.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: `$${dateField}` },
              month: { $month: `$${dateField}` }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            month: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                { $toString: { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] } }
              ]
            },
            count: 1
          }
        },
        { $sort: { month: 1 } }
      ]);

      // Fill in missing months with 0
      const last12Months = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existingData = monthlyData.find(d => d.month === monthKey);
        last12Months.push({
          month: monthKey,
          count: existingData ? existingData.count : 0
        });
      }

      return last12Months;
    } catch (error) {
      console.error('Error in getEnhancedMonthlyTrend:', error);
      return [];
    }
  }

  /**
   * Comparison analytics (current period vs previous period)
   */
  async getComparisonAnalytics(collection, query, startDate, endDate) {
    try {
      let Model;
      switch (collection) {
        case 'tickets':
          Model = Ticket;
          break;
        case 'payments':
          Model = Payment;
          break;
        case 'residents':
          Model = Resident;
          break;
        default:
          Model = Ticket;
      }

      if (!startDate || !endDate) {
        return {
          currentPeriod: { count: 0, percentage: 0 },
          previousPeriod: { count: 0, percentage: 0 },
          change: { count: 0, percentage: 0 }
        };
      }

      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const periodDuration = currentEnd.getTime() - currentStart.getTime();
      
      const previousStart = new Date(currentStart.getTime() - periodDuration);
      const previousEnd = new Date(currentStart.getTime());

      // Current period data
      const currentQuery = { ...query };
      if (currentQuery.createdAt) {
        currentQuery.createdAt = {
          $gte: currentStart,
          $lte: currentEnd
        };
      }

      // Previous period data
      const previousQuery = { ...query };
      if (previousQuery.createdAt) {
        previousQuery.createdAt = {
          $gte: previousStart,
          $lte: previousEnd
        };
      }

      const [currentCount, previousCount] = await Promise.all([
        Model.countDocuments(currentQuery),
        Model.countDocuments(previousQuery)
      ]);

      const changeCount = currentCount - previousCount;
      const changePercentage = previousCount > 0 ? ((changeCount / previousCount) * 100) : 0;

      return {
        currentPeriod: { 
          count: currentCount, 
          percentage: currentCount > 0 ? 100 : 0 
        },
        previousPeriod: { 
          count: previousCount, 
          percentage: previousCount > 0 ? 100 : 0 
        },
        change: { 
          count: changeCount, 
          percentage: changePercentage 
        }
      };
    } catch (error) {
      console.error('Error in getComparisonAnalytics:', error);
      return {
        currentPeriod: { count: 0, percentage: 0 },
        previousPeriod: { count: 0, percentage: 0 },
        change: { count: 0, percentage: 0 }
      };
    }
  }

  /**
   * Resolution time analytics for tickets
   */
  async getResolutionTimeAnalytics(query) {
    try {
      const resolutionData = await Ticket.aggregate([
        { 
          $match: { 
            ...query, 
            status: { $in: ['resolved', 'closed'] },
            'resolution.resolvedAt': { $exists: true }
          } 
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageResolutionTime: { $avg: '$resolutionTime' },
            minResolutionTime: { $min: '$resolutionTime' },
            maxResolutionTime: { $max: '$resolutionTime' },
            totalResolved: { $sum: 1 }
          }
        }
      ]);

      if (resolutionData.length === 0) {
        return {
          averageResolutionTime: 0,
          minResolutionTime: 0,
          maxResolutionTime: 0,
          totalResolved: 0
        };
      }

      return resolutionData[0];
    } catch (error) {
      console.error('Error in getResolutionTimeAnalytics:', error);
      return {
        averageResolutionTime: 0,
        minResolutionTime: 0,
        maxResolutionTime: 0,
        totalResolved: 0
      };
    }
  }

  async getMonthlyOccupancyTrend(query, startDate, endDate) {
    // Implementation for monthly occupancy trend
    return [];
  }

  async getResidentsAnalytics(query, startDate, endDate) {
    // Implementation for residents analytics
    return {};
  }

  async getPaymentsAnalytics(query, startDate, endDate) {
    // Implementation for payments analytics
    return {};
  }

  async getTicketsAnalytics(query, startDate, endDate) {
    // Implementation for tickets analytics
    return {};
  }

  async getOccupancyAnalytics(query, startDate, endDate) {
    // Implementation for occupancy analytics
    return {};
  }

  async getAllAnalytics(query, startDate, endDate) {
    // Implementation for all analytics
    return {};
  }

  async generateReportByType(reportType, filters) {
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
}

module.exports = new ReportService(); 