const Notification = require('../models/notification.model');

/**
 * Create a notification
 */
async function createNotification({ pgId, branchId, userId, roleScope = 'admin', type, title, message, data = {}, createdBy }) {
  const notification = await Notification.create({
    pgId,
    branchId,
    userId,
    roleScope,
    type,
    title,
    message,
    data,
    createdBy
  });
  return notification;
}

/**
 * List notifications (paginated)
 */
async function listNotifications({ pgId, branchId, userId, roleScope, page = 1, limit = 10, unreadOnly = false }) {
  const query = { pgId };
  if (branchId) query.branchId = branchId;
  if (userId) query.userId = userId;
  if (roleScope) query.roleScope = roleScope;
  if (unreadOnly) query.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [items, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Notification.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
}

/**
 * Mark as read
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new Error('Notification not found');
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  return notification;
}

/**
 * Mark all as read (optional filters)
 */
async function markAllAsRead({ pgId, branchId, userId }) {
  const query = { pgId, isRead: false };
  if (branchId) query.branchId = branchId;
  if (userId) query.userId = userId;
  await Notification.updateMany(query, { $set: { isRead: true, readAt: new Date() } });
  return { success: true };
}

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead
}; 