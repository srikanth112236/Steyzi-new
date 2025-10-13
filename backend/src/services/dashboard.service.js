const Resident = require('../models/resident.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const Room = require('../models/room.model');
const PG = require('../models/pg.model');

class DashboardService {
  /**
   * Get dashboard overview data
   * @param {string} pgId - PG ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Dashboard overview data
   */
  async getDashboardOverview(pgId, filters = {}) {
    try {
      console.log('🔄 DashboardService: Getting dashboard overview for PG:', pgId);

      const baseQuery = { pgId, ...filters };
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Get all required data in parallel
      const [
        totalResidents,
        activeResidents,
        pendingResidents,
        movedOutResidents,
        totalRooms,
        occupiedRooms,
        totalRevenue,
        monthlyRevenue,
        pendingPayments,
        overduePayments,
        openTickets,
        urgentTickets,
        pgInfo
      ] = await Promise.all([
        // Resident counts
        Resident.countDocuments({ ...baseQuery, isActive: true }),
        Resident.countDocuments({ ...baseQuery, status: 'active', isActive: true }),
        Resident.countDocuments({ ...baseQuery, status: 'pending', isActive: true }),
        Resident.countDocuments({ 
          ...baseQuery, 
          status: { $in: ['inactive', 'moved_out'] },
          isActive: { $in: [true, false] }
        }),
        
        // Room counts
        Room.countDocuments({ ...baseQuery }),
        Resident.countDocuments({ 
          ...baseQuery, 
          status: 'active', 
          isActive: true,
          roomId: { $exists: true, $ne: null }
        }),
        
        // Revenue calculations
        Payment.aggregate([
          { $match: { ...baseQuery, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { 
            $match: { 
              ...baseQuery, 
              status: 'completed',
              paymentDate: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1)
              }
            } 
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        
        // Payment counts
        Payment.countDocuments({ ...baseQuery, status: 'pending' }),
        Payment.countDocuments({ 
          ...baseQuery, 
          status: 'pending',
          dueDate: { $lt: currentDate }
        }),
        
        // Ticket counts
        Ticket.countDocuments({ ...baseQuery, status: { $in: ['open', 'in_progress'] } }),
        Ticket.countDocuments({ ...baseQuery, priority: 'urgent', status: { $in: ['open', 'in_progress'] } }),
        
        // PG information
        PG.findById(pgId).select('name description address phone email')
      ]);

      // Calculate derived metrics
      const totalRevenueAmount = totalRevenue[0]?.total || 0;
      const monthlyRevenueAmount = monthlyRevenue[0]?.total || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      const revenueGrowth = monthlyRevenueAmount > 0 ? Math.round((monthlyRevenueAmount / totalRevenueAmount) * 100) : 0;

      const overview = {
        // Resident Statistics
        residents: {
          total: totalResidents,
          active: activeResidents,
          pending: pendingResidents,
          movedOut: movedOutResidents,
          occupancyRate: occupancyRate
        },
        
        // Financial Statistics
        financial: {
          totalRevenue: totalRevenueAmount,
          monthlyRevenue: monthlyRevenueAmount,
          revenueGrowth: revenueGrowth,
          pendingPayments: pendingPayments,
          overduePayments: overduePayments
        },
        
        // Operational Statistics
        operational: {
          totalRooms: totalRooms,
          occupiedRooms: occupiedRooms,
          openTickets: openTickets,
          urgentTickets: urgentTickets
        },
        
        // PG Information
        pgInfo: pgInfo || {}
      };

      console.log('✅ DashboardService: Overview data calculated successfully');

      return {
        success: true,
        data: overview,
        message: 'Dashboard overview retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ DashboardService: Get dashboard overview error:', error);
      return {
        success: false,
        message: 'Failed to get dashboard overview',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get revenue analytics
   * @param {string} pgId - PG ID
   * @param {string} period - Time period (monthly, weekly, daily)
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Revenue analytics data
   */
  async getRevenueAnalytics(pgId, period = 'monthly', filters = {}) {
    try {
      console.log('🔄 DashboardService: Getting revenue analytics for PG:', pgId);

      const baseQuery = { pgId, status: 'completed', ...filters };
      const currentDate = new Date();
      
      let dateFormat, groupBy, dateRange;
      
      switch (period) {
        case 'daily':
          dateFormat = '%Y-%m-%d';
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
          dateRange = { $gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case 'weekly':
          dateFormat = '%Y-%U';
          groupBy = { $dateToString: { format: '%Y-%U', date: '$paymentDate' } };
          dateRange = { $gte: new Date(currentDate.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) };
          break;
        default: // monthly
          dateFormat = '%Y-%m';
          groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
          dateRange = { $gte: new Date(currentDate.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) };
      }

      const revenueData = await Payment.aggregate([
        { $match: { ...baseQuery, paymentDate: dateRange } },
        { $group: { _id: groupBy, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      // Calculate growth rate
      const currentPeriod = revenueData[revenueData.length - 1]?.total || 0;
      const previousPeriod = revenueData[revenueData.length - 2]?.total || 0;
      const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;

      const analytics = {
        period: period,
        data: revenueData,
        summary: {
          totalRevenue: revenueData.reduce((sum, item) => sum + item.total, 0),
          totalPayments: revenueData.reduce((sum, item) => sum + item.count, 0),
          currentPeriod: currentPeriod,
          previousPeriod: previousPeriod,
          growthRate: Math.round(growthRate * 100) / 100
        }
      };

      console.log('✅ DashboardService: Revenue analytics calculated successfully');

      return {
        success: true,
        data: analytics,
        message: 'Revenue analytics retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ DashboardService: Get revenue analytics error:', error);
      return {
        success: false,
        message: 'Failed to get revenue analytics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get occupancy analytics
   * @param {string} pgId - PG ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Occupancy analytics data
   */
  async getOccupancyAnalytics(pgId, filters = {}) {
    try {
      console.log('🔄 DashboardService: Getting occupancy analytics for PG:', pgId);

      const baseQuery = { pgId, ...filters };
      const currentDate = new Date();

      // Get room and occupancy data
      const [roomData, occupancyTrend] = await Promise.all([
        // Current room status
        Room.aggregate([
          { $match: baseQuery },
          {
            $lookup: {
              from: 'residents',
              localField: '_id',
              foreignField: 'roomId',
              as: 'residents'
            }
          },
          {
            $project: {
              roomNumber: 1,
              floorId: 1,
              sharingType: 1,
              isOccupied: { $gt: [{ $size: '$residents' }, 0] },
              residentCount: { $size: '$residents' }
            }
          }
        ]),
        
        // Occupancy trend over time
        Resident.aggregate([
          { 
            $match: { 
              ...baseQuery, 
              status: 'active',
              isActive: true,
              checkInDate: { $exists: true }
            } 
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m', date: '$checkInDate' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      const totalRooms = roomData.length;
      const occupiedRooms = roomData.filter(room => room.isOccupied).length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // Room type distribution
      const roomTypeDistribution = await Room.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$sharingType',
            count: { $sum: 1 },
            occupied: {
              $sum: {
                $cond: [
                  { $in: ['$_id', '$residents.roomId'] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const analytics = {
        current: {
          totalRooms: totalRooms,
          occupiedRooms: occupiedRooms,
          vacantRooms: totalRooms - occupiedRooms,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        trend: occupancyTrend,
        roomTypes: roomTypeDistribution,
        roomDetails: roomData
      };

      console.log('✅ DashboardService: Occupancy analytics calculated successfully');

      return {
        success: true,
        data: analytics,
        message: 'Occupancy analytics retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ DashboardService: Get occupancy analytics error:', error);
      return {
        success: false,
        message: 'Failed to get occupancy analytics',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get recent activities
   * @param {string} pgId - PG ID
   * @param {number} limit - Number of activities to return
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Recent activities data
   */
  async getRecentActivities(pgId, limit = 10, filters = {}) {
    try {
      console.log('🔄 DashboardService: Getting recent activities for PG:', pgId);

      const baseQuery = { pgId, ...filters };
      const currentDate = new Date();
      const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get recent activities from different collections
      const [recentPayments, recentResidents, recentTickets] = await Promise.all([
        // Recent payments
        Payment.find({ ...baseQuery, paymentDate: { $gte: oneWeekAgo } })
          .populate('residentId', 'firstName lastName')
          .sort({ paymentDate: -1 })
          .limit(limit)
          .lean(),
        
        // Recent resident activities
        Resident.find({ 
          ...baseQuery, 
          $or: [
            { checkInDate: { $gte: oneWeekAgo } },
            { checkOutDate: { $gte: oneWeekAgo } },
            { createdAt: { $gte: oneWeekAgo } }
          ]
        })
          .sort({ updatedAt: -1 })
          .limit(limit)
          .lean(),
        
        // Recent tickets
        Ticket.find({ ...baseQuery, createdAt: { $gte: oneWeekAgo } })
          .populate('user', 'firstName lastName')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean()
      ]);

      // Combine and format activities
      const activities = [];

      // Add payment activities
      recentPayments.forEach(payment => {
        activities.push({
          id: payment._id,
          type: 'payment',
          title: `Payment received from ${payment.residentId?.firstName} ${payment.residentId?.lastName}`,
          description: `₹${payment.amount} - ${payment.paymentMethod}`,
          timestamp: payment.paymentDate,
          status: payment.status,
          icon: 'credit-card',
          color: 'green'
        });
      });

      // Add resident activities
      recentResidents.forEach(resident => {
        if (resident.checkInDate && resident.checkInDate >= oneWeekAgo) {
          activities.push({
            id: resident._id,
            type: 'resident',
            title: `New resident check-in: ${resident.firstName} ${resident.lastName}`,
            description: `Room ${resident.roomNumber || 'Not assigned'}`,
            timestamp: resident.checkInDate,
            status: resident.status,
            icon: 'user-plus',
            color: 'blue'
          });
        }
        
        if (resident.checkOutDate && resident.checkOutDate >= oneWeekAgo) {
          activities.push({
            id: resident._id,
            type: 'resident',
            title: `Resident check-out: ${resident.firstName} ${resident.lastName}`,
            description: `Room ${resident.roomNumber || 'Not assigned'}`,
            timestamp: resident.checkOutDate,
            status: 'moved_out',
            icon: 'user-minus',
            color: 'red'
          });
        }
      });

      // Add ticket activities
      recentTickets.forEach(ticket => {
        activities.push({
          id: ticket._id,
          type: 'ticket',
          title: `New ticket: ${ticket.title}`,
          description: `${ticket.category} - ${ticket.priority} priority`,
          timestamp: ticket.createdAt,
          status: ticket.status,
          icon: 'message-square',
          color: ticket.priority === 'urgent' ? 'red' : 'orange'
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedActivities = activities.slice(0, limit);

      console.log('✅ DashboardService: Recent activities retrieved successfully');

      return {
        success: true,
        data: limitedActivities,
        message: 'Recent activities retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ DashboardService: Get recent activities error:', error);
      return {
        success: false,
        message: 'Failed to get recent activities',
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get pending tasks
   * @param {string} pgId - PG ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Pending tasks data
   */
  async getPendingTasks(pgId, filters = {}) {
    try {
      console.log('🔄 DashboardService: Getting pending tasks for PG:', pgId);

      const baseQuery = { pgId, ...filters };
      const currentDate = new Date();

      // Get pending tasks from different sources
      const [pendingPayments, overduePayments, openTickets, pendingResidents] = await Promise.all([
        // Pending payments
        Payment.find({ ...baseQuery, status: 'pending' })
          .populate('residentId', 'firstName lastName')
          .sort({ dueDate: 1 })
          .lean(),
        
        // Overdue payments
        Payment.find({ 
          ...baseQuery, 
          status: 'pending',
          dueDate: { $lt: currentDate }
        })
          .populate('residentId', 'firstName lastName')
          .sort({ dueDate: 1 })
          .lean(),
        
        // Open tickets
        Ticket.find({ ...baseQuery, status: { $in: ['open', 'in_progress'] } })
          .populate('user', 'firstName lastName')
          .sort({ priority: -1, createdAt: 1 })
          .lean(),
        
        // Pending residents (not assigned to rooms)
        Resident.find({ 
          ...baseQuery, 
          status: 'active',
          isActive: true,
          roomId: { $exists: false }
        })
          .sort({ createdAt: 1 })
          .lean()
      ]);

      const tasks = {
        payments: {
          pending: pendingPayments.length,
          overdue: overduePayments.length,
          total: pendingPayments.length + overduePayments.length
        },
        tickets: {
          open: openTickets.length,
          urgent: openTickets.filter(t => t.priority === 'urgent').length
        },
        residents: {
          pending: pendingResidents.length
        },
        details: {
          pendingPayments,
          overduePayments,
          openTickets,
          pendingResidents
        }
      };

      console.log('✅ DashboardService: Pending tasks retrieved successfully');

      return {
        success: true,
        data: tasks,
        message: 'Pending tasks retrieved successfully',
        statusCode: 200
      };
    } catch (error) {
      console.error('❌ DashboardService: Get pending tasks error:', error);
      return {
        success: false,
        message: 'Failed to get pending tasks',
        error: error.message,
        statusCode: 500
      };
    }
  }
}

module.exports = new DashboardService(); 