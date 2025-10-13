const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate, adminOrSuperadmin } = require('../middleware/auth.middleware');

router.get('/', authenticate, adminOrSuperadmin, controller.list);
router.post('/', authenticate, adminOrSuperadmin, controller.create);
router.put('/:id/read', authenticate, adminOrSuperadmin, controller.markRead);
router.put('/mark-all/read', authenticate, adminOrSuperadmin, controller.markAllRead);

module.exports = router; 