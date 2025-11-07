import axios from 'axios';
import { store } from '../store/store';
import { clearAuth } from '../store/slices/authSlice';

// Dynamic API URL detection
const getApiBaseURL = () => {
  // If explicitly set in environment, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use direct URL to backend (no proxy)
  if (import.meta.env.DEV) {
    return 'https://api.steyzi.com/api';
  }
  
  // In production, use production API URL
  return 'https://api.steyzi.com/api';
};

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Track refresh token requests to prevent multiple simultaneous calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available from localStorage
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add language header
    const state = store.getState();
    const language = state.ui?.language;
    if (language) {
      config.headers['Accept-Language'] = language;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post(
            `${getApiBaseURL()}/auth/refresh`,
            {},
            {
              headers: {
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            }
          );

          if (response.data.success) {
            // Update tokens in localStorage
            localStorage.setItem('accessToken', response.data.data.token);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            
            // Update user in localStorage
            if (response.data.data.user) {
              localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            processQueue(null, response.data.data.token);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${response.data.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh token failed, logout user
        store.dispatch(clearAuth());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response.data);
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found:', error.response.data);
    } else if (error.response?.status === 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Superadmin Service
 * Centralized service for all superadmin-related API calls
 */
class SuperadminService {
  /**
   * Get dashboard overview data
   * @returns {Promise} Dashboard overview data
   */
  async getDashboardOverview() {
    try {
      const response = await api.get('/superadmin/dashboard/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get dashboard stats data
   * @returns {Promise} Dashboard stats data
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/superadmin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics data
   * @param {string} period - Time period (daily, weekly, monthly, yearly)
   * @returns {Promise} Revenue analytics data
   */
  async getRevenueAnalytics(period = 'monthly') {
    try {
      const response = await api.get('/superadmin/analytics/revenue', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get occupancy analytics data
   * @returns {Promise} Occupancy analytics data
   */
  async getOccupancyAnalytics() {
    try {
      const response = await api.get('/superadmin/analytics/occupancy');
      return response.data;
    } catch (error) {
      console.error('Error fetching occupancy analytics:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics data
   * @param {string} period - Time period (daily, weekly, monthly, yearly)
   * @returns {Promise} Payment analytics data
   */
  async getPaymentAnalytics(period = 'monthly') {
    try {
      const response = await api.get('/superadmin/analytics/payments', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  }

  /**
   * Get ticket analytics data
   * @returns {Promise} Ticket analytics data
   */
  async getTicketAnalytics() {
    try {
      const response = await api.get('/tickets/superadmin-analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket analytics:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise} Recent activities data
   */
  async getRecentActivities(limit = 15) {
    try {
      const response = await api.get('/superadmin/activities', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get system alerts
   * @returns {Promise} System alerts data
   */
  async getAlerts() {
    try {
      const response = await api.get('/superadmin/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Export dashboard data
   * @param {string} format - Export format (pdf, excel, csv)
   * @returns {Promise} Blob data for download
   */
  async exportDashboardData(format = 'pdf') {
    try {
      const response = await api.get('/superadmin/export/dashboard', {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Fetch all dashboard data in parallel
   * @param {string} period - Time period for analytics
   * @returns {Promise} Combined dashboard data
   */
  async fetchAllDashboardData(period = 'monthly') {
    try {
      const [
        overviewData,
        statsData,
        revenueData,
        occupancyData,
        ticketData,
        paymentData,
        activitiesData,
        alertsData
      ] = await Promise.allSettled([
        this.getDashboardOverview(),
        this.getDashboardStats(),
        this.getRevenueAnalytics(period),
        this.getOccupancyAnalytics(),
        this.getTicketAnalytics(),
        this.getPaymentAnalytics(period),
        this.getRecentActivities(15),
        this.getAlerts()
      ]);

      // Extract raw data payloads from API responses
      const overviewRaw = overviewData.status === 'fulfilled' ? overviewData.value?.data : null;
      const statsRaw = statsData.status === 'fulfilled' ? statsData.value?.data : null;
      const revenueRaw = revenueData.status === 'fulfilled' ? revenueData.value?.data : null;
      const occupancyRaw = occupancyData.status === 'fulfilled' ? occupancyData.value?.data : null;
      const ticketsRaw = ticketData.status === 'fulfilled' ? ticketData.value?.data : null;
      const paymentsRaw = paymentData.status === 'fulfilled' ? paymentData.value?.data : null;
      const activitiesRaw = activitiesData.status === 'fulfilled' ? activitiesData.value?.data : [];
      const alertsRaw = alertsData.status === 'fulfilled' ? alertsData.value?.data : [];

      // Map to client-friendly shapes
      const mappedOverview = overviewRaw ? {
        totalPGs: overviewRaw.totals?.pgs || 0,
        activePGs: overviewRaw.totals?.activePgs || 0,
        totalUsers: overviewRaw.totals?.users || 0,
        totalResidents: overviewRaw.totals?.residents || 0,
        activeResidents: overviewRaw.totals?.activeResidents || 0,
        totalTickets: overviewRaw.tickets?.total || 0,
        openTickets: overviewRaw.tickets?.open || 0,
        resolvedTickets: overviewRaw.tickets?.resolved || 0,
        todayRevenue: overviewRaw.revenue?.today || 0,
        yesterdayRevenue: overviewRaw.revenue?.yesterday || 0
      } : null;

      const mappedStats = statsRaw ? {
        since: statsRaw.since || null,
        newUsers: statsRaw.newUsers || 0,
        newResidents: statsRaw.newResidents || 0,
        newTickets: statsRaw.newTickets || 0,
        newPayments: statsRaw.payments?.count || 0,
        newPaymentsAmount: statsRaw.payments?.amount || 0
      } : null;

      const mappedRevenue = revenueRaw ? {
        period: revenueRaw.period,
        series: Array.isArray(revenueRaw.series) ? revenueRaw.series : [],
        labels: (revenueRaw.series || []).map(s => s._id?.d || s.date || ''),
        values: (revenueRaw.series || []).map(s => s.amount || 0)
      } : null;

      const mappedOccupancy = occupancyRaw ? {
        totalRooms: occupancyRaw.totalRooms || 0,
        totalBeds: occupancyRaw.totalBeds || 0,
        occupiedBeds: occupancyRaw.occupiedBeds || 0,
        occupancyRate: occupancyRaw.occupancyRate || 0,
        // for chart component
        occupied: occupancyRaw.occupiedBeds || 0,
        vacant: (occupancyRaw.totalBeds || 0) - (occupancyRaw.occupiedBeds || 0)
      } : null;

      const mappedTickets = ticketsRaw ? {
        overview: ticketsRaw.overview || {},
        labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
        values: [
          ticketsRaw.overview?.openTickets || 0,
          ticketsRaw.overview?.inProgressTickets || 0,
          ticketsRaw.overview?.resolvedTickets || 0,
          ticketsRaw.overview?.closedTickets || 0
        ],
        urgent: ticketsRaw.overview?.urgentTickets || 0
      } : null;

      // Payments endpoint returns only totals; synthesize a simple distribution for chart UX (client-side)
      const mappedPayments = paymentsRaw ? {
        period: paymentsRaw.period,
        totalAmount: paymentsRaw.totalAmount || 0,
        totalCount: paymentsRaw.totalCount || 0,
        labels: [],
        completed: [],
        pending: [],
        overdue: []
      } : null;

      const mappedActivities = Array.isArray(activitiesRaw) ? activitiesRaw.map(a => ({
        id: a._id,
        type: a.type || 'notification',
        title: a.title || a.message || 'System Activity',
        description: a.description || a.message || '',
        timestamp: a.createdAt || a.timestamp || new Date().toISOString(),
        priority: a.priority || 'normal'
      })) : [];

      const mappedAlerts = alertsRaw ? {
        criticalTickets: alertsRaw.criticalTickets || [],
        overduePayments: alertsRaw.overduePayments || []
      } : { criticalTickets: [], overduePayments: [] };

      return {
        overview: mappedOverview,
        stats: mappedStats,
        revenue: mappedRevenue,
        occupancy: mappedOccupancy,
        tickets: mappedTickets,
        payments: mappedPayments,
        activities: mappedActivities,
        alerts: mappedAlerts
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  }

  async getSalesAnalytics(period = 'monthly', filters = {}) {
    try {
      const response = await api.get('/sales/analytics', {
        params: {
          period,
          ...filters
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch sales analytics',
        error: error
      };
    }
  }
}

// Create and export singleton instance
const superadminService = new SuperadminService();
export default superadminService;
