const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

const { authenticate, superadminOnly } = require('../middleware/auth.middleware');

// Models
const User = require('../models/user.model');
const PG = require('../models/pg.model');
const Resident = require('../models/resident.model');
const Payment = require('../models/payment.model');
const Ticket = require('../models/ticket.model');
const Room = require('../models/room.model');
const Notification = require('../models/notification.model');

// Utilities
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

// --- Overview ---
router.get('/dashboard/overview', authenticate, superadminOnly, async (req, res) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);

    const [
      totalPGs,
      activePGs,
      totalUsers,
      totalResidents,
      activeResidents,
      totalTickets,
      openTickets,
      resolvedTickets,
      todaysPayments,
      yesterdaysPayments
    ] = await Promise.all([
      PG.countDocuments({}),
      PG.countDocuments({ isActive: true }),
      User.countDocuments({}),
      Resident.countDocuments({}),
      Resident.countDocuments({ status: 'active' }),
      Ticket.countDocuments({}),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { $match: { createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const todayAmount = (todaysPayments[0]?.amount || 0);
    const yesterdayAmount = (yesterdaysPayments[0]?.amount || 0);

    return res.json({
      success: true,
      data: {
        totals: {
          pgs: totalPGs,
          activePgs: activePGs,
          users: totalUsers,
          residents: totalResidents,
          activeResidents
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets
        },
        revenue: {
          today: todayAmount,
          yesterday: yesterdayAmount
        }
      }
    });
  } catch (error) {
    console.error('Superadmin overview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch overview', error: error.message });
  }
});

// --- Realtime snapshot (poll endpoint used by initial load as well) ---
router.get('/dashboard/stats', authenticate, superadminOnly, async (req, res) => {
  try {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 3600000);

    const [newUsers, newResidents, newTickets, newPayments] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: lastHour } }),
      Resident.countDocuments({ createdAt: { $gte: lastHour } }),
      Ticket.countDocuments({ createdAt: { $gte: lastHour } }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: lastHour } } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    return res.json({
      success: true,
      data: {
        since: lastHour,
        newUsers,
        newResidents,
        newTickets,
        payments: {
          count: newPayments[0]?.count || 0,
          amount: newPayments[0]?.amount || 0
        }
      }
    });
  } catch (error) {
    console.error('Superadmin realtime stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch realtime stats', error: error.message });
  }
});

// --- Activities ---
router.get('/activities', authenticate, superadminOnly, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);

    // Use notifications as recent activities fallback
    const items = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error('Superadmin activities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activities', error: error.message });
  }
});

// --- Alerts ---
router.get('/alerts', authenticate, superadminOnly, async (req, res) => {
  try {
    const criticalTickets = await Ticket.find({ priority: 'high', status: { $in: ['open', 'in_progress'] } })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const overduePayments = await Payment.find({ status: 'overdue' }).limit(10).lean();

    return res.json({ success: true, data: { criticalTickets, overduePayments } });
  } catch (error) {
    console.error('Superadmin alerts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch alerts', error: error.message });
  }
});

// --- Simple analytics placeholders (compute quickly from models) ---
router.get('/analytics/revenue', authenticate, superadminOnly, async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const now = new Date();
    const start = new Date(now.getFullYear(), period === 'monthly' ? now.getMonth() : 0, 1);

    const series = await Payment.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, amount: { $sum: '$amount' } } },
      { $sort: { '_id.d': 1 } }
    ]);

    return res.json({ success: true, data: { period, series } });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics', error: error.message });
  }
});

router.get('/analytics/occupancy', authenticate, superadminOnly, async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments({});
    const rooms = await Room.find({}, { numberOfBeds: 1, beds: 1 }).lean();
    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach(r => {
      totalBeds += r.numberOfBeds || (r.beds ? r.beds.length : 0) || 0;
      (r.beds || []).forEach(b => { if (b.isOccupied) occupiedBeds += 1; });
    });
    const rate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    return res.json({ success: true, data: { totalRooms, totalBeds, occupiedBeds, occupancyRate: Number(rate.toFixed(1)) } });
  } catch (error) {
    console.error('Occupancy analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch occupancy analytics', error: error.message });
  }
});

router.get('/analytics/payments', authenticate, superadminOnly, async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const now = new Date();
    const start = new Date(now.getFullYear(), period === 'monthly' ? now.getMonth() : 0, 1);

    const [summary] = await Payment.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    return res.json({ success: true, data: { period, totalAmount: summary?.amount || 0, totalCount: summary?.count || 0 } });
  } catch (error) {
    console.error('Payments analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment analytics', error: error.message });
  }
});

router.get('/analytics/user-growth', authenticate, superadminOnly, async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const now = new Date();
    const start = new Date(now.getFullYear(), period === 'monthly' ? now.getMonth() : 0, 1);
    const series = await User.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { d: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } } }, count: { $sum: 1 } } },
      { $sort: { '_id.d': 1 } }
    ]);
    return res.json({ success: true, data: { period, series } });
  } catch (error) {
    console.error('User growth analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user growth analytics', error: error.message });
  }
});

router.get('/analytics/operational', authenticate, superadminOnly, async (req, res) => {
  try {
    const [activePGs, openTickets, overduePayments] = await Promise.all([
      PG.countDocuments({ isActive: true }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Payment.countDocuments({ status: 'overdue' })
    ]);
    return res.json({ success: true, data: { activePGs, openTickets, overduePayments } });
  } catch (error) {
    console.error('Operational analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch operational analytics', error: error.message });
  }
});

router.get('/analytics/satisfaction', authenticate, superadminOnly, async (req, res) => {
  try {
    // Placeholder: derive from tickets resolved time as proxy
    const avgResolution = await Ticket.aggregate([
      { $match: { status: 'resolved' } },
      { $project: { diff: { $subtract: ['$updatedAt', '$createdAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$diff' } } }
    ]);
    return res.json({ success: true, data: { avgResolutionMs: Math.round(avgResolution[0]?.avgMs || 0) } });
  } catch (error) {
    console.error('Satisfaction analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch satisfaction analytics', error: error.message });
  }
});

router.get('/analytics/geographic', authenticate, superadminOnly, async (req, res) => {
  try {
    // Group PGs by city if available
    const groups = await PG.aggregate([
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    return res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Geographic analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch geographic analytics', error: error.message });
  }
});

router.get('/analytics/top-pgs', authenticate, superadminOnly, async (req, res) => {
  try {
    const metric = req.query.metric || 'revenue';
    if (metric === 'revenue') {
      const top = await Payment.aggregate([
        { $match: { pgId: { $exists: true } } },
        { $group: { _id: '$pgId', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
        { $limit: Math.min(parseInt(req.query.limit || '10', 10), 50) },
        { $lookup: { from: 'pgs', localField: '_id', foreignField: '_id', as: 'pg' } },
        { $unwind: { path: '$pg', preserveNullAndEmptyArrays: true } }
      ]);
      return res.json({ success: true, data: top });
    }
    // Fallback metric: occupancy
    const rooms = await Room.aggregate([
      { $group: { _id: '$pgId', rooms: { $sum: 1 }, beds: { $sum: { $ifNull: ['$numberOfBeds', { $size: '$beds' }] } } } }
    ]);
    return res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Top PGs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch top PGs', error: error.message });
  }
});

// --- Export dashboard (stubbed CSV) ---
router.get('/export/dashboard', authenticate, superadminOnly, async (req, res) => {
  try {
    const totalPGs = await PG.countDocuments({});
    const totalResidents = await Resident.countDocuments({});
    const totalTickets = await Ticket.countDocuments({});
    const csv = `metric,value\npgs,${totalPGs}\nresidents,${totalResidents}\ntickets,${totalTickets}\n`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dashboard.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export', error: error.message });
  }
});

// --- SSE realtime stream ---
// We accept access_token via query to support EventSource (no auth headers capability)
router.get('/realtime', async (req, res) => {
  try {
    const token = req.query.access_token;
    if (!token) {
      return res.status(401).end();
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    } catch (e) {
      return res.status(401).end();
    }

    // Ensure superadmin
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user || user.role !== 'superadmin' || !user.isActive) {
      return res.status(403).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = async () => {
      try {
        const [
          totalPGs,
          activePGs,
          totalResidents,
          openTickets,
          paymentsLastMinute
        ] = await Promise.all([
          PG.countDocuments({}),
          PG.countDocuments({ isActive: true }),
          Resident.countDocuments({ status: 'active' }),
          Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
          Payment.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 60000) } } },
            { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ])
        ]);

        const payload = {
          time: new Date().toISOString(),
          overview: { totalPGs, activePGs, activeResidents: totalResidents, openTickets },
          payments: { count: paymentsLastMinute[0]?.count || 0, amount: paymentsLastMinute[0]?.amount || 0 }
        };
        res.write(`event: stats\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) {
        // ignore single send failure
      }
    };

    // Initial push
    await send();

    // Heartbeat
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\n`);
      res.write(`data: {"time":"${new Date().toISOString()}"}\n\n`);
    }, 25000);

    // Periodic updates
    const interval = setInterval(send, 10000);

    req.on('close', () => {
      clearInterval(interval);
      clearInterval(heartbeat);
    });
  } catch (error) {
    console.error('SSE error:', error);
    try { res.end(); } catch (_) {}
  }
});

module.exports = router; 