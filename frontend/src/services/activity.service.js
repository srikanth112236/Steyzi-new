import api from './api';

class ActivityService {
  async recordActivity(activityData) {
    try {
      const response = await api.post('/activities/record', activityData);
      return response.data;
    } catch (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  }

  async getRecentActivities(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/activities/recent?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  async getAdminActivities(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/activities/admin?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin activities:', error);
      throw error;
    }
  }

  async getBranchActivities(branchId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/activities/branch/${branchId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching branch activities:', error);
      throw error;
    }
  }

  async getActivityStats(timeRange = '24h') {
    try {
      const response = await api.get(`/activities/stats?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  async getRoleSpecificStats(timeRange = '24h') {
    try {
      const response = await api.get(`/activities/stats/role-specific?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role-specific stats:', error);
      throw error;
    }
  }

  async exportActivities(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/activities/export/csv?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'activities.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error exporting activities:', error);
      throw error;
    }
  }

  // Activity tracking helper methods
  trackPageView(page, metadata = {}) {
    return this.recordActivity({
      type: 'view',
      title: `Viewed ${page} page`,
      description: `Accessed the ${page} page`,
      category: 'general',
      metadata: {
        page,
        ...metadata
      }
    });
  }

  trackAction(action, details, category = 'general', metadata = {}) {
    return this.recordActivity({
      type: action,
      title: details.title,
      description: details.description,
      category,
      metadata: {
        action,
        ...metadata
      }
    });
  }

  trackError(error, context, metadata = {}) {
    return this.recordActivity({
      type: 'error',
      title: `Error: ${context}`,
      description: error.message || 'An error occurred',
      category: 'error',
      priority: 'high',
      status: 'failed',
      metadata: {
        error: error.toString(),
        stack: error.stack,
        context,
        ...metadata
      }
    });
  }
}

export default new ActivityService();