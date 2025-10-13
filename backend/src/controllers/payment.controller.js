const paymentService = require('../services/payment.service');
const { createResponse } = require('../utils/response');
const activityService = require('../services/activity.service');

class PaymentController {
  // Mark payment as completed
  async markPaymentAsCompleted(req, res) {
    try {
      const { residentId } = req.params;
      const { paymentDate, paymentMethod, notes } = req.body;
      const paymentImage = req.file;

      if (!paymentDate) {
        return createResponse(res, 400, false, 'Payment date is required');
      }

      if (!paymentMethod) {
        return createResponse(res, 400, false, 'Payment method is required');
      }

      // For UPI payments, image is required. For Cash, it's optional
      if (paymentMethod === 'upi' && !paymentImage) {
        return createResponse(res, 400, false, 'Payment receipt image is required for UPI payments');
      }

      const paymentData = {
        paymentDate,
        paymentMethod,
        notes,
        paymentImage
      };

      const payment = await paymentService.markPaymentAsCompleted(
        residentId,
        paymentData,
        req.user._id
      );

      try {
        await activityService.recordActivity({
          type: 'payment_update',
          title: 'Payment Marked as Completed',
          description: `Payment marked completed for resident ${residentId}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'payment',
          entityId: payment?._id,
          category: 'payment',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      return createResponse(res, 201, true, 'Payment marked as completed successfully', payment);
    } catch (error) {
      console.error('Error marking payment as completed:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        return createResponse(res, 409, false, error.message);
      }
      
      if (error.code === 11000) {
        return createResponse(res, 500, false, 'Payment creation failed due to database constraint. Please try again.');
      }
      
      return createResponse(res, 500, false, error.message || 'Failed to mark payment as completed');
    }
  }

  // Get payments by resident
  async getPaymentsByResident(req, res) {
    try {
      const { residentId } = req.params;
      const payments = await paymentService.getPaymentsByResident(residentId);

      return createResponse(res, 200, true, 'Payments retrieved successfully', payments);
    } catch (error) {
      console.error('Error getting payments by resident:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get payments');
    }
  }

  // Get payments by room
  async getPaymentsByRoom(req, res) {
    try {
      const { roomId } = req.params;
      const payments = await paymentService.getPaymentsByRoom(roomId);

      return createResponse(res, 200, true, 'Payments retrieved successfully', payments);
    } catch (error) {
      console.error('Error getting payments by room:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get payments');
    }
  }

  // Get payment statistics
  async getPaymentStats(req, res) {
    try {
      const { pgId } = req.params;
      const stats = await paymentService.getPaymentStats(pgId);

      return createResponse(res, 200, true, 'Payment statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get payment statistics');
    }
  }

  // Get monthly payments
  async getMonthlyPayments(req, res) {
    try {
      const { pgId } = req.params;
      const { year, month } = req.query;

      if (!year || !month) {
        return createResponse(res, 400, false, 'Year and month are required');
      }

      const payments = await paymentService.getMonthlyPayments(pgId, parseInt(year), month);

      return createResponse(res, 200, true, 'Monthly payments retrieved successfully', payments);
    } catch (error) {
      console.error('Error getting monthly payments:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get monthly payments');
    }
  }

  // Get all payments with filters
  async getPayments(req, res) {
    try {
      const filters = req.query;
      const payments = await paymentService.getPayments(filters);

      return createResponse(res, 200, true, 'Payments retrieved successfully', payments);
    } catch (error) {
      console.error('Error getting payments:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get payments');
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPaymentById(paymentId);

      if (!payment) {
        return createResponse(res, 404, false, 'Payment not found');
      }

      return createResponse(res, 200, true, 'Payment retrieved successfully', payment);
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get payment');
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const updateData = req.body;

      const payment = await paymentService.updatePayment(paymentId, updateData);

      if (!payment) {
        return createResponse(res, 404, false, 'Payment not found');
      }

      try {
        await activityService.recordActivity({
          type: 'payment_update',
          title: 'Payment Updated',
          description: `Payment ${paymentId} updated`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'payment',
          entityId: paymentId,
          category: 'payment',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      return createResponse(res, 200, true, 'Payment updated successfully', payment);
    } catch (error) {
      console.error('Error updating payment:', error);
      return createResponse(res, 500, false, error.message || 'Failed to update payment');
    }
  }

  // Delete payment
  async deletePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.deletePayment(paymentId);

      if (!payment) {
        return createResponse(res, 404, false, 'Payment not found');
      }

      try {
        await activityService.recordActivity({
          type: 'payment_delete',
          title: 'Payment Deleted',
          description: `Payment ${paymentId} deleted`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'payment',
          entityId: paymentId,
          category: 'payment',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      return createResponse(res, 200, true, 'Payment deleted successfully', payment);
    } catch (error) {
      console.error('Error deleting payment:', error);
      return createResponse(res, 500, false, error.message || 'Failed to delete payment');
    }
  }

  // Get residents by room
  async getResidentsByRoom(req, res) {
    try {
      const { roomId } = req.params;
      const residents = await paymentService.getResidentsByRoom(roomId);

      return createResponse(res, 200, true, 'Residents retrieved successfully', residents);
    } catch (error) {
      console.error('Error getting residents by room:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get residents');
    }
  }

  // Get payment receipt
  async getPaymentReceipt(req, res) {
    try {
      const { paymentId } = req.params;
      const receipt = await paymentService.getPaymentReceipt(paymentId);

      if (!receipt) {
        return createResponse(res, 404, false, 'Receipt not found');
      }

      return createResponse(res, 200, true, 'Receipt retrieved successfully', receipt);
    } catch (error) {
      console.error('Error getting payment receipt:', error);
      return createResponse(res, 500, false, error.message || 'Failed to get receipt');
    }
  }

  // Generate payment report
  async generatePaymentReport(req, res) {
    try {
      const { pgId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return createResponse(res, 400, false, 'Start date and end date are required');
      }

      const report = await paymentService.generatePaymentReport(pgId, startDate, endDate);

      try {
        await activityService.recordActivity({
          type: 'report_generate',
          title: 'Payment Report Generated',
          description: `Report ${startDate} to ${endDate}`,
          userId: req.user?._id,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          entityType: 'payment_report',
          category: 'report',
          priority: 'normal',
          status: 'success'
        });
      } catch (_) {}

      return createResponse(res, 200, true, 'Payment report generated successfully', report);
    } catch (error) {
      console.error('Error generating payment report:', error);
      return createResponse(res, 500, false, error.message || 'Failed to generate payment report');
    }
  }
}

module.exports = new PaymentController(); 