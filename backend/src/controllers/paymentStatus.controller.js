const logger = require('../utils/logger');

/**
 * Payment Status Controller
 * Handles Server-Sent Events for real-time payment status updates
 */

// Store active SSE connections by userId
const activeConnections = new Map();

/**
 * SSE endpoint for payment status updates
 * @route GET /api/payments/status
 * @access Private (requires userId query param)
 */
exports.getPaymentStatusStream = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId query parameter is required'
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create connection object
    const connection = {
      id: `${userId}_${Date.now()}`,
      userId,
      res,
      createdAt: new Date()
    };

    // Store connection
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, []);
    }
    activeConnections.get(userId).push(connection);

    logger.info('Payment status SSE connection established:', {
      userId,
      connectionId: connection.id
    });

    // Send initial connection confirmation
    sendSSEMessage(res, 'connected', {
      message: 'Payment status tracking started',
      userId,
      timestamp: new Date()
    });

    // Handle client disconnect
    req.on('close', () => {
      logger.info('Payment status SSE connection closed:', {
        userId,
        connectionId: connection.id
      });

      // Remove connection
      const userConnections = activeConnections.get(userId);
      if (userConnections) {
        const index = userConnections.indexOf(connection);
        if (index > -1) {
          userConnections.splice(index, 1);
        }
        if (userConnections.length === 0) {
          activeConnections.delete(userId);
        }
      }
    });

    // Keep connection alive
    const keepAlive = setInterval(() => {
      if (!res.finished) {
        sendSSEMessage(res, 'heartbeat', {
          timestamp: new Date(),
          message: 'Connection alive'
        });
      } else {
        clearInterval(keepAlive);
      }
    }, 30000); // Send heartbeat every 30 seconds

  } catch (error) {
    logger.error('Error establishing payment status SSE connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to establish connection'
    });
  }
};

/**
 * Broadcast payment success to specific user
 * @param {string} userId - User ID
 * @param {Object} paymentData - Payment data
 */
exports.broadcastPaymentSuccess = (userId, paymentData) => {
  const userConnections = activeConnections.get(userId);

  console.log('\n🚀 SSE BROADCAST: Payment Success');
  console.log('👤 Target User:', userId);
  console.log('🔗 Active Connections:', userConnections ? userConnections.length : 0);

  if (userConnections && userConnections.length > 0) {
    console.log('📡 Broadcasting to', userConnections.length, 'connection(s)');

    logger.info('Broadcasting payment success to user connections:', {
      userId,
      connectionCount: userConnections.length,
      paymentId: paymentData.paymentId
    });

    const messageData = {
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'success',
      subscriptionPlanId: paymentData.subscriptionPlanId,
      planName: paymentData.planName,
      bedCount: paymentData.bedCount,
      branchCount: paymentData.branchCount,
      billingCycle: paymentData.billingCycle,
      timestamp: new Date()
    };

    console.log('📦 Message Data:');
    console.log('   ├─ Payment ID:', messageData.paymentId);
    console.log('   ├─ Amount:', `₹${messageData.amount}`);
    console.log('   ├─ Plan:', messageData.planName);
    console.log('   └─ Event: payment_success');

    userConnections.forEach((connection, index) => {
      if (!connection.res.finished) {
        console.log(`   📤 Sending to connection ${index + 1}/${userConnections.length}`);
        sendSSEMessage(connection.res, 'payment_success', messageData);
      } else {
        console.log(`   ⚠️ Connection ${index + 1} is finished, skipping`);
      }
    });

    console.log('✅ SSE broadcast completed');
  } else {
    console.log('⚠️ No active connections for user:', userId);
  }
};

/**
 * Broadcast payment failure to specific user
 * @param {string} userId - User ID
 * @param {Object} paymentData - Payment data
 */
exports.broadcastPaymentFailure = (userId, paymentData) => {
  const userConnections = activeConnections.get(userId);

  if (userConnections && userConnections.length > 0) {
    logger.info('Broadcasting payment failure to user connections:', {
      userId,
      connectionCount: userConnections.length,
      paymentId: paymentData.paymentId
    });

    const messageData = {
      paymentId: paymentData.paymentId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'failed',
      error: paymentData.error,
      timestamp: new Date()
    };

    userConnections.forEach(connection => {
      if (!connection.res.finished) {
        sendSSEMessage(connection.res, 'payment_failed', messageData);
      }
    });
  }
};

/**
 * Broadcast general payment status update
 * @param {string} userId - User ID
 * @param {Object} statusData - Status data
 */
exports.broadcastPaymentStatus = (userId, statusData) => {
  const userConnections = activeConnections.get(userId);

  if (userConnections && userConnections.length > 0) {
    logger.info('Broadcasting payment status update:', {
      userId,
      connectionCount: userConnections.length,
      status: statusData.status
    });

    userConnections.forEach(connection => {
      if (!connection.res.finished) {
        sendSSEMessage(connection.res, 'paymentStatus', {
          ...statusData,
          timestamp: new Date()
        });
      }
    });
  }
};

/**
 * Send SSE message to client
 * @param {Object} res - Response object
 * @param {string} event - Event type
 * @param {Object} data - Data to send
 */
function sendSSEMessage(res, event, data) {
  if (res.finished) return;

  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    logger.error('Error sending SSE message:', error);
  }
}

/**
 * Get active connections count
 */
exports.getActiveConnectionsCount = () => {
  let totalConnections = 0;
  for (const [userId, connections] of activeConnections.entries()) {
    totalConnections += connections.length;
  }
  return totalConnections;
};

/**
 * Get connection details for debugging
 */
exports.getConnectionDetails = () => {
  const details = {};
  for (const [userId, connections] of activeConnections.entries()) {
    details[userId] = connections.map(conn => ({
      id: conn.id,
      createdAt: conn.createdAt,
      finished: conn.res.finished
    }));
  }
  return details;
};
