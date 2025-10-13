import api from './api';

class PaymentInfoService {
  /**
   * Get payment info for a branch
   */
  async getPaymentInfo(branchId) {
    try {
      const response = await api.get(`/payment-info/admin/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment info:', error);
      throw error;
    }
  }

  /**
   * Save/Update payment info (upsert operation)
   * Uses PUT for both create and update operations
   */
  async savePaymentInfo(branchId, paymentData) {
    try {
      const response = await api.put(`/payment-info/admin/${branchId}`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error saving payment info:', error);
      throw error;
    }
  }

  /**
   * Update payment info (alias for savePaymentInfo for backward compatibility)
   */
  async updatePaymentInfo(branchId, paymentData) {
    return this.savePaymentInfo(branchId, paymentData);
  }

  /**
   * Delete payment info
   */
  async deletePaymentInfo(branchId) {
    try {
      const response = await api.delete(`/payment-info/admin/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment info:', error);
      throw error;
    }
  }

  /**
   * Get all payment info for admin
   */
  async getAllPaymentInfo(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/payment-info/admin/all${queryParams ? `?${queryParams}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all payment info:', error);
      throw error;
    }
  }

  /**
   * Get payment info by QR code (public access)
   */
  async getPaymentInfoByQRCode(qrCode) {
    try {
      const response = await api.get(`/public/qr/${qrCode}/payment-info`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment info by QR code:', error);
      throw error;
    }
  }
}

export default new PaymentInfoService(); 