const express = require('express');
const router = express.Router();
const TicketService = require('../services/ticket.service');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const { uploadTicketAttachments } = require('../middleware/fileUpload.middleware');
const activityService = require('../services/activity.service');
const notificationService = require('../services/notification.service');

// Optional socket broadcaster (if available on req.app.get('io'))
function broadcast(req, channel, payload) {
  try {
    const io = req.app?.get && req.app.get('io');
    if (io) io.emit(channel, payload);
  } catch (_) {}
}

// Get all tickets (admin sees only their PG's tickets, superadmin sees all, support sees assigned tickets)
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      search: req.query.search,
      pg: req.query.pg
    };

    let result;
    if (req.user.role === 'superadmin') {
      result = await TicketService.getAllTickets(filters);
    } else if (req.user.role === 'support') {
      // Support staff should only see tickets assigned to them
      result = await TicketService.getTicketsForSupport(req.user._id, filters);
    } else {
      result = await TicketService.getTicketsForAdmin(req.user._id, filters);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// Get ticket statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await TicketService.getTicketStats(req.user._id, req.user.role);
    res.json(result);
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
});

// Get ticket analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'week';
    const result = await TicketService.getTicketAnalytics(req.user._id, req.user.role, timeRange);
    res.json(result);
  } catch (error) {
    console.error('Error getting ticket analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket analytics',
      error: error.message
    });
  }
});

// Get superadmin analytics
router.get('/superadmin-analytics', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.'
      });
    }

    const timeRange = req.query.timeRange || 'week';
    const filters = {
      pg: req.query.pg,
      category: req.query.category,
      status: req.query.status
    };
    
    const result = await TicketService.getSuperadminAnalytics(timeRange, filters);
    res.json(result);
  } catch (error) {
    console.error('Error getting superadmin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch superadmin analytics',
      error: error.message
    });
  }
});

// Get ticket categories
router.get('/categories', authenticate, (req, res) => {
  try {
    const categories = TicketService.getTicketCategories();
    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error in categories route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get priority levels
router.get('/priorities', authenticate, (req, res) => {
  try {
    const priorities = TicketService.getPriorityLevels();
    res.json({
      success: true,
      data: priorities,
      message: 'Priority levels retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch priority levels',
      error: error.message
    });
  }
});

// Get status options
router.get('/statuses', authenticate, (req, res) => {
  try {
    const statuses = TicketService.getStatusOptions();
    res.json({
      success: true,
      data: statuses,
      message: 'Status options retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status options',
      error: error.message
    });
  }
});

// Create new ticket (admin only)
router.post('/', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await TicketService.createTicket(req.body, req.user._id);
    try {
      if (result?.success && result?.data) {
        await activityService.recordActivity({
          type: 'create',
          title: 'Ticket Created',
          description: `Ticket "${result.data.title || ''}" created`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: result.data._id,
          entityName: result.data.title,
          category: 'ticket',
          priority: 'high',
          status: 'success'
        });
      }
    } catch (_) {}
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

// Get ticket by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await TicketService.getTicketById(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (error) {
    console.error('Error getting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket',
      error: error.message
    });
  }
});

// Update ticket
router.put('/:id', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await TicketService.updateTicket(req.params.id, req.body, req.user._id, req.user.role);
    try {
      if (result?.success && result?.data) {
        await activityService.recordActivity({
          type: 'update',
          title: 'Ticket Updated',
          description: `Ticket "${result.data.title || ''}" updated`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: result.data._id,
          entityName: result.data.title,
          category: 'ticket',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch (_) {}
    res.json(result);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
});

// Delete ticket
router.delete('/:id', authenticate, adminOrSuperadmin, async (req, res) => {
  try {
    const result = await TicketService.deleteTicket(req.params.id, req.user._id, req.user.role);
    res.json(result);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket',
      error: error.message
    });
  }
});

// Assign ticket (superadmin only)
router.post('/:id/assign', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can assign tickets'
      });
    }

    const { assignedToId } = req.body;
    if (!assignedToId) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user ID is required'
      });
    }

    const result = await TicketService.assignTicket(req.params.id, assignedToId, req.user._id);
    try {
      if (result?.success && result?.data) {
        await activityService.recordActivity({
          type: 'assign',
          title: 'Ticket Assigned',
          description: `Ticket "${result.data.title || ''}" assigned`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: req.params.id,
          entityName: result.data.title,
          category: 'ticket',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch (_) {}
    res.json(result);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
});

// Resolve ticket (superadmin only)
router.post('/:id/resolve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can resolve tickets'
      });
    }

    const result = await TicketService.resolveTicket(req.params.id, req.body, req.user._id);
    try {
      if (result?.success && result?.data) {
        await activityService.recordActivity({
          type: 'complete',
          title: 'Ticket Resolved',
          description: `Ticket "${result.data.title || ''}" resolved`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: req.params.id,
          entityName: result.data.title,
          category: 'ticket',
          priority: 'high',
          status: 'success'
        });
      }
    } catch (_) {}
    res.json(result);
  } catch (error) {
    console.error('Error resolving ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve ticket',
      error: error.message
    });
  }
});

// Close ticket (superadmin only)
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can close tickets'
      });
    }

    const result = await TicketService.closeTicket(req.params.id, req.user._id);
    try {
      if (result?.success && result?.data) {
        await activityService.recordActivity({
          type: 'complete',
          title: 'Ticket Closed',
          description: `Ticket "${result.data.title || ''}" closed`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: req.params.id,
          entityName: result.data.title,
          category: 'ticket',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch (_) {}
    res.json(result);
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: error.message
    });
  }
});

// Support staff update ticket status
router.post('/:id/update-status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'support') {
      return res.status(403).json({
        success: false,
        message: 'Only support staff can update ticket status'
      });
    }

    const { status, resolution } = req.body;
    const result = await TicketService.updateTicketStatus(req.params.id, status, resolution, req.user._id);
    try {
      if (result?.success) {
        await activityService.recordActivity({
          type: 'update',
          title: 'Ticket Status Updated',
          description: `Status changed to ${status}${resolution ? `, note: ${resolution}` : ''}`,
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: req.params.id,
          category: 'ticket',
          priority: 'normal',
          status: 'success'
        });

        // Persist notifications for admin and superadmin scopes
        const title = 'Ticket Status Updated';
        const message = `${result?.data?.title || 'Ticket'} is now ${status}`;
        const notifPayload = {
          pgId: result?.data?.pgId || req.user?.pgId,
          branchId: result?.data?.branchId,
          type: 'ticket_status',
          title,
          message,
          data: { ticketId: req.params.id, status, resolution },
          createdBy: req.user._id
        };
        // Admin scope
        await notificationService.createNotification({ ...notifPayload, roleScope: 'admin' });
        // Superadmin scope
        await notificationService.createNotification({ ...notifPayload, roleScope: 'superadmin' });

        // Broadcast via socket if available
        broadcast(req, 'ticket_status_updated', {
          ticketId: req.params.id,
          status,
          resolution,
          title: result?.data?.title
        });
      }
    } catch(_) {}
    res.json(result);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
});

// Get support staff list (superadmin only)
router.get('/support-staff/list', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can view support staff list'
      });
    }

    const result = await TicketService.getSupportStaff();
    res.json(result);
  } catch (error) {
    console.error('Error getting support staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get support staff',
      error: error.message
    });
  }
});

// Upload ticket attachments
router.post('/:id/attachments', authenticate, adminOrSuperadmin, uploadTicketAttachments, async (req, res) => {
  try {
    // This would be implemented to handle file uploads
    res.json({
      success: true,
      message: 'Attachments uploaded successfully',
      data: req.files
    });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload attachments',
      error: error.message
    });
  }
});

// Add comment to ticket (superadmin, admin, support)
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    // Allowed roles: superadmin, admin, support
    if (!['superadmin', 'admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { message } = req.body;
    const result = await TicketService.addComment(
      req.params.id,
      message,
      req.user._id,
      req.user.role
    );
    try {
      if (result?.success) {
        await activityService.recordActivity({
          type: 'update',
          title: 'Ticket Comment Added',
          description: message?.slice(0, 140) || 'Comment added',
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.role,
          entityType: 'ticket',
          entityId: req.params.id,
          category: 'ticket',
          priority: 'normal',
          status: 'success'
        });
      }
    } catch(_) {}
    res.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
});

module.exports = router; 