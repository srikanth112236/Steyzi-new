const express = require('express');
const router = express.Router();
const Resident = require('../models/resident.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const Room = require('../models/room.model');
const PG = require('../models/pg.model');
const Branch = require('../models/branch.model');
const User = require('../models/user.model');

console.log('📊 Dashboard routes loaded');

// Helper function to get date range for current month
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { startOfMonth, endOfMonth };
};

// Helper function to get date range for last month
const getLastMonthRange = () => {
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  return { startOfLastMonth, endOfLastMonth };
};

// Dynamic overview route with real data
router.get('/overview', async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Ensure branchId is a string and valid ObjectId format
    const branchIdString = String(branchId).trim();
    if (!branchIdString || branchIdString === '[object Object]' || branchIdString.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Branch ID format'
      });
    }

    // First get branch info to get the PG ID for tickets
    const branchInfo = await Branch.findOne({ _id: branchIdString }).populate('pgId', 'name description address phone email');
    if (!branchInfo) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const pgId = branchInfo.pgId._id;

    // Get current and last month ranges
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const { startOfLastMonth, endOfLastMonth } = getLastMonthRange();

    // Fetch real data from database
    const [
      totalResidents,
      activeResidents,
      pendingResidents,
      movedOutResidents,
      thisMonthResidents,
      lastMonthResidents,
      totalPayments,
      monthlyPayments,
      pendingPayments,
      overduePayments,
      totalTickets,
      openTickets,
      urgentTickets,
      resolvedTickets,
      totalRooms,
      occupiedRooms
    ] = await Promise.all([
      // Resident counts
      Resident.countDocuments({ branchId: branchIdString, isActive: { $in: [true, false] } }),
      Resident.countDocuments({ branchId: branchIdString, isActive: true, status: 'active' }),
      Resident.countDocuments({ branchId: branchIdString, isActive: true, status: 'pending' }),
      Resident.countDocuments({ branchId: branchIdString, status: { $in: ['moved_out', 'inactive'] } }),
      Resident.countDocuments({ 
        branchId: branchIdString, 
        createdAt: { $gte: startOfMonth, $lte: endOfMonth } 
      }),
      Resident.countDocuments({ 
        branchId: branchIdString, 
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
      }),

      // Payment data - Using correct branchId field
      Payment.countDocuments({ branchId: branchIdString }),
      Payment.countDocuments({ 
        branchId: branchIdString, 
        createdAt: { $gte: startOfMonth, $lte: endOfMonth } 
      }),
      Payment.countDocuments({ branchId: branchIdString, status: 'pending' }),
      Payment.countDocuments({ branchId: branchIdString, status: 'overdue' }),

      // Ticket data - Using correct pg field (tickets belong to PG, not branch)
      Ticket.countDocuments({ pg: pgId }),
      Ticket.countDocuments({ pg: pgId, status: 'open' }),
      Ticket.countDocuments({ pg: pgId, status: 'open', priority: 'high' }),
      Ticket.countDocuments({ pg: pgId, status: 'resolved' }),

      // Room data
      Room.countDocuments({ branchId: branchIdString }),
      Room.countDocuments({ branchId: branchIdString, isOccupied: true })
    ]);

    // Calculate financial data from payments only
    const [monthlyRevenue, totalRevenue] = await Promise.all([
      Payment.aggregate([
        { $match: { branchId: branchIdString, status: 'paid', createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { branchId: branchIdString, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const monthlyRevenueAmount = monthlyRevenue[0]?.total || 0;
    const totalRevenueAmount = totalRevenue[0]?.total || 0;

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const availableRooms = totalRooms - occupiedRooms;

    // Calculate revenue growth
    const lastMonthRevenue = await Payment.aggregate([
      { $match: { branchId: branchIdString, status: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthRevenueAmount = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastMonthRevenueAmount > 0 
      ? ((monthlyRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100 
      : 0;

    // Calculate average rent
    const averageRent = activeResidents > 0 ? Math.round(totalRevenueAmount / activeResidents) : 0;

    // Calculate ticket resolution rate
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    // Get resident statistics by gender
    const residentsByGender = await Resident.aggregate([
      { $match: { branchId: branchIdString, isActive: true } },
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    const genderStats = {
      male: residentsByGender.find(g => g._id === 'male')?.count || 0,
      female: residentsByGender.find(g => g._id === 'female')?.count || 0
    };

    // Get resident statistics by status
    const residentsByStatus = await Resident.aggregate([
      { $match: { branchId: branchIdString, isActive: { $in: [true, false] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusStats = {
      active: residentsByStatus.find(s => s._id === 'active')?.count || 0,
      pending: residentsByStatus.find(s => s._id === 'pending')?.count || 0,
      inactive: residentsByStatus.find(s => s._id === 'inactive')?.count || 0
    };

    res.json({
      success: true,
      data: {
        // Resident Statistics
        residents: {
          total: totalResidents,
          active: activeResidents,
          pending: pendingResidents,
          movedOut: movedOutResidents,
          thisMonth: thisMonthResidents,
          byStatus: statusStats,
          byGender: genderStats
        },
        // Financial Statistics (calculated from payments only)
        financial: {
          totalRevenue: totalRevenueAmount,
          monthlyRevenue: monthlyRevenueAmount,
          pendingPayments: pendingPayments,
          overduePayments: overduePayments,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          averageRent: averageRent
        },
        // Occupancy Statistics
        occupancy: {
          totalRooms: totalRooms,
          occupiedRooms: occupiedRooms,
          availableRooms: availableRooms,
          occupancyRate: occupancyRate,
          occupancyTrend: thisMonthResidents - lastMonthResidents
        },
        // Ticket Statistics
        tickets: {
          open: openTickets,
          urgent: urgentTickets,
          resolved: resolvedTickets,
          total: totalTickets,
          resolutionRate: resolutionRate
        },
        // PG Information
        pg: {
          name: branchInfo?.pgId?.name || 'Unknown PG',
          description: branchInfo?.pgId?.description || '',
          address: branchInfo?.pgId?.address || '',
          phone: branchInfo?.pgId?.phone || '',
          email: branchInfo?.pgId?.email || '',
          totalBranches: 1 // For now, assuming single branch
        }
      },
      message: 'Dashboard overview retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: error.message
    });
  }
});

// Dynamic activities route with real data
router.get('/activities', async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Ensure branchId is a string and valid ObjectId format
    const branchIdString = String(branchId).trim();
    if (!branchIdString || branchIdString === '[object Object]' || branchIdString.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Branch ID format'
      });
    }

    // Get branch info to get PG ID for tickets
    const branchInfo = await Branch.findOne({ _id: branchIdString });
    if (!branchInfo) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const pgId = branchInfo.pgId;

    // Fetch recent activities from different collections with error handling
    let recentPayments = [];
    let recentResidents = [];
    let recentTickets = [];

    try {
      recentPayments = await Payment.find({ branchId: branchIdString })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('residentId', 'firstName lastName')
        .lean();
    } catch (error) {
      console.error('Error fetching payments:', error.message);
    }

    try {
      recentResidents = await Resident.find({ branchId: branchIdString })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    } catch (error) {
      console.error('Error fetching residents:', error.message);
    }

    try {
      recentTickets = await Ticket.find({ pg: pgId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName')
        .lean();
    } catch (error) {
      console.error('Error fetching tickets:', error.message);
    }

    // Combine and format activities
    const activities = [];

    // Add payment activities
    recentPayments.forEach(payment => {
      activities.push({
        id: payment._id,
        type: 'payment',
        title: `Payment of ₹${payment.amount}`,
        description: `${payment.paymentMethod} payment for ${payment.month} ${payment.year}`,
        status: payment.status,
        amount: payment.amount,
        residentName: payment.residentId ? `${payment.residentId.firstName} ${payment.residentId.lastName}` : 'Unknown Resident',
        timestamp: payment.createdAt,
        priority: payment.status === 'overdue' ? 'high' : 'medium'
      });
    });

    // Add resident activities
    recentResidents.forEach(resident => {
      activities.push({
        id: resident._id,
        type: 'resident',
        title: `New Resident: ${resident.firstName} ${resident.lastName}`,
        description: `Resident joined with status: ${resident.status}`,
        status: resident.status,
        residentName: `${resident.firstName} ${resident.lastName}`,
        timestamp: resident.createdAt,
        priority: 'medium'
      });
    });

    // Add ticket activities
    recentTickets.forEach(ticket => {
      activities.push({
        id: ticket._id,
        type: 'ticket',
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        residentName: ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : 'Unknown User',
        timestamp: ticket.createdAt
      });
    });

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: activities.slice(0, 10), // Return top 10 activities
      message: 'Recent activities retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
});

// Dynamic pending tasks route with real data
router.get('/pending-tasks', async (req, res) => {
  try {
    const { branchId } = req.query;
    
    // Validate branchId
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Branch ID is required'
      });
    }

    // Ensure branchId is a string and valid ObjectId format
    const branchIdString = String(branchId).trim();
    if (!branchIdString || branchIdString === '[object Object]' || branchIdString.length !== 24) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Branch ID format'
      });
    }

    // Get branch info to get PG ID for tickets
    const branchInfo = await Branch.findOne({ _id: branchIdString });
    if (!branchInfo) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const pgId = branchInfo.pgId;

    // Fetch pending tasks with error handling
    let pendingPayments = [];
    let overduePayments = [];
    let openTickets = [];
    let pendingResidents = [];

    try {
      pendingPayments = await Payment.find({ branchId: branchIdString, status: 'pending' })
        .populate('residentId', 'firstName lastName')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean();
    } catch (error) {
      console.error('Error fetching pending payments:', error.message);
    }

    try {
      overduePayments = await Payment.find({ branchId: branchIdString, status: 'overdue' })
        .populate('residentId', 'firstName lastName')
        .sort({ dueDate: 1 })
        .limit(5)
        .lean();
    } catch (error) {
      console.error('Error fetching overdue payments:', error.message);
    }

    try {
      openTickets = await Ticket.find({ pg: pgId, status: 'open' })
        .populate('user', 'firstName lastName')
        .sort({ priority: -1, createdAt: 1 })
        .limit(5)
        .lean();
    } catch (error) {
      console.error('Error fetching open tickets:', error.message);
    }

    try {
      pendingResidents = await Resident.find({ branchId: branchIdString, status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(5)
        .lean();
    } catch (error) {
      console.error('Error fetching pending residents:', error.message);
    }

    // Calculate totals
    const [pendingPaymentsCount, overduePaymentsCount, openTicketsCount, urgentTicketsCount, pendingResidentsCount] = await Promise.all([
      Payment.countDocuments({ branchId: branchIdString, status: 'pending' }),
      Payment.countDocuments({ branchId: branchIdString, status: 'overdue' }),
      Ticket.countDocuments({ pg: pgId, status: 'open' }),
      Ticket.countDocuments({ pg: pgId, status: 'open', priority: 'high' }),
      Resident.countDocuments({ branchId: branchIdString, status: 'pending' })
    ]);

    // Calculate total pending amount
    const pendingAmounts = await Payment.aggregate([
      { $match: { branchId: branchIdString, status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPendingAmount = pendingAmounts[0]?.total || 0;

    res.json({
      success: true,
      data: {
        payments: {
          pending: pendingPaymentsCount,
          overdue: overduePaymentsCount,
          totalAmount: totalPendingAmount,
          items: [...pendingPayments, ...overduePayments].slice(0, 5)
        },
        tickets: {
          open: openTicketsCount,
          urgent: urgentTicketsCount,
          items: openTickets
        },
        residents: {
          pending: pendingResidentsCount,
          items: pendingResidents
        },
        totals: {
          totalPending: pendingPaymentsCount + overduePaymentsCount + openTicketsCount + pendingResidentsCount,
          totalAmount: totalPendingAmount
        }
      },
      message: 'Pending tasks retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching pending tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending tasks',
      error: error.message
    });
  }
});

module.exports = router; 