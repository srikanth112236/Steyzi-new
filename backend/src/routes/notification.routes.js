const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');
const { trackAdminActivity } = require('../middleware/adminActivity.middleware');

router.get('/', authenticate, adminOrSuperadmin, trackAdminActivity(), controller.list);
router.post('/', authenticate, adminOrSuperadmin, trackAdminActivity(), controller.create);
router.put('/:id/read', authenticate, adminOrSuperadmin, trackAdminActivity(), controller.markRead);
router.put('/mark-all/read', authenticate, adminOrSuperadmin, trackAdminActivity(), controller.markAllRead);

module.exports = router; 