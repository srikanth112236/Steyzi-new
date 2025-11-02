/**
 * Payment Status Service
 * Handles real-time payment status updates using Server-Sent Events
 */

class PaymentStatusService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to payment status SSE endpoint
   * @param {string} userId - User ID to track payments for
   */
  connect(userId) {
    if (this.eventSource) {
      this.disconnect();
    }

    const eventSourceUrl = `${process.env.REACT_APP_API_URL || 'https://api.steyzi.com'}/api/payments/status?userId=${userId}`;

    console.log('🔗 Connecting to payment status SSE:', eventSourceUrl);

    this.eventSource = new EventSource(eventSourceUrl);

    this.eventSource.onopen = () => {
      console.log('✅ Payment status SSE connected');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Payment status update received:', data);
        this.notifyListeners('paymentStatus', data);
      } catch (error) {
        console.error('❌ Error parsing payment status data:', error);
      }
    };

    this.eventSource.addEventListener('payment_success', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('\n🎉 FRONTEND: Payment Success Event Received');
        console.log('📦 Event Data:');
        console.log('   ├─ Payment ID:', data.paymentId);
        console.log('   ├─ Amount:', `₹${data.amount}`);
        console.log('   ├─ Plan:', data.planName);
        console.log('   ├─ Event Type:', 'payment_success');
        console.log('   └─ Timestamp:', new Date(data.timestamp).toLocaleString());

        this.notifyListeners('paymentSuccess', data);
      } catch (error) {
        console.error('❌ Error parsing payment success data:', error);
      }
    });

    this.eventSource.addEventListener('payment_failed', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('\n❌ FRONTEND: Payment Failed Event Received');
        console.log('📦 Event Data:');
        console.log('   ├─ Payment ID:', data.paymentId);
        console.log('   ├─ Error:', data.error);
        console.log('   ├─ Event Type:', 'payment_failed');
        console.log('   └─ Timestamp:', new Date(data.timestamp).toLocaleString());

        this.notifyListeners('paymentFailed', data);
      } catch (error) {
        console.error('❌ Error parsing payment failed data:', error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error('❌ Payment status SSE error:', error);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
          this.connect(userId);
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.error('❌ Max reconnection attempts reached');
        this.notifyListeners('connectionError', { error: 'Connection lost' });
      }
    };
  }

  /**
   * Disconnect from payment status SSE
   */
  disconnect() {
    if (this.eventSource) {
      console.log('🔌 Disconnecting payment status SSE');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  /**
   * Add event listener for payment status updates
   * @param {string} event - Event type ('paymentStatus', 'paymentSuccess', 'paymentFailed', 'connectionError')
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event type
   * @param {Function} callback - Callback function to remove
   */
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in payment status listener:', error);
        }
      });
    }
  }

  /**
   * Check if connected to SSE
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Get current connection state
   */
  getConnectionState() {
    if (!this.eventSource) return 'disconnected';
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING: return 'connecting';
      case EventSource.OPEN: return 'connected';
      case EventSource.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Create singleton instance
const paymentStatusService = new PaymentStatusService();

export default paymentStatusService;
