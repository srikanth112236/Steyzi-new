const notificationService = require('../services/notification.service');
const { successResponse, errorResponse } = require('../utils/response');
const activityService = require('../services/activity.service');

async function list(req, res) {
  try {
    const { page, limit, unreadOnly, branchId } = req.query;
    const result = await notificationService.listNotifications({
      pgId: req.user.pgId,
      branchId,
      userId: undefined,
      roleScope: req.user.role === 'superadmin' ? 'superadmin' : 'admin',
      page,
      limit,
      unreadOnly: unreadOnly === 'true'
    });
    return successResponse(res, 'Notifications retrieved', result);
  } catch (e) {
    return errorResponse(res, e.message, 500);
  }
}

async function create(req, res) {
  try {
    const payload = {
      ...req.body,
      pgId: req.user.pgId,
      createdBy: req.user._id
    };
    const item = await notificationService.createNotification(payload);
    
    // Record activity
    try {
      await activityService.recordActivity({
        type: 'notification_send',
        title: 'Notification Sent',
        description: `Notification "${item.title || 'Untitled'}" sent`,
        userId: req.user._id,
        userEmail: req.user.email,
        userRole: req.user.role,
        entityType: 'notification',
        entityId: item._id,
        entityName: item.title,
        branchId: req.user.branchId,
        category: 'communication',
        priority: 'normal',
        status: 'success'
      });
    } catch (error) {
      console.error('Error recording notification activity:', error);
    }
    
    return successResponse(res, 'Notification created', item);
  } catch (e) {
    return errorResponse(res, e.message, 500);
  }
}

async function markRead(req, res) {
  try {
    const item = await notificationService.markAsRead(req.params.id, req.user._id);
    return successResponse(res, 'Notification marked as read', item);
  } catch (e) {
    return errorResponse(res, e.message, 500);
  }
}

async function markAllRead(req, res) {
  try {
    const result = await notificationService.markAllAsRead({
      pgId: req.user.pgId,
      branchId: req.query.branchId,
      userId: undefined
    });
    return successResponse(res, 'All notifications marked as read', result);
  } catch (e) {
    return errorResponse(res, e.message, 500);
  }
}

module.exports = { list, create, markRead, markAllRead }; 