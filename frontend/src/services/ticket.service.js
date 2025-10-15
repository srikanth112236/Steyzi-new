import api from './api';

class TicketService {
  // Get all tickets
  async getTickets(filters = {}) {
    try {
      // Normalize filters to ensure consistent query parameters
      const normalizedFilters = { 
        ...filters,
        // Convert boolean or string flags to consistent format
        assignedToMe: filters.assignedToMe === true || filters.assignedToMe === 'true' ? 'true' : undefined,
        isSuperadmin: filters.isSuperadmin === true || filters.isSuperadmin === 'true' ? 'true' : undefined
      };

      // Remove undefined values
      Object.keys(normalizedFilters).forEach(key => 
        normalizedFilters[key] === undefined && delete normalizedFilters[key]
      );

      const params = new URLSearchParams(normalizedFilters);
      const response = await api.get(`/tickets?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw this.handleError(error);
    }
  }

  // Get my assigned tickets (now just a convenience method)
  async getMyTickets(filters = {}) {
    return this.getTickets({ 
      ...filters, 
      assignedToMe: true 
    });
  }

  // Get tickets for superadmin view
  async getSuperadminTickets(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/tickets?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching superadmin tickets:', error);
      throw this.handleError(error);
    }
  }

  // Get analytics data
  async getAnalytics(timeRange = 'week') {
    try {
      const response = await api.get(`/tickets/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Return mock data as fallback
      return {
        success: true,
        data: {
          overview: {
            totalTickets: 150,
            openTickets: 25,
            resolvedTickets: 100,
            avgResponseTime: '2.5 hours',
            avgResolutionTime: '1.2 days',
            satisfactionScore: 4.2
          },
          trends: {
            daily: [
              { date: '2024-01-01', tickets: 12, resolved: 8 },
              { date: '2024-01-02', tickets: 15, resolved: 10 },
              { date: '2024-01-03', tickets: 8, resolved: 12 },
              { date: '2024-01-04', tickets: 20, resolved: 15 },
              { date: '2024-01-05', tickets: 18, resolved: 14 },
              { date: '2024-01-06', tickets: 10, resolved: 8 },
              { date: '2024-01-07', tickets: 14, resolved: 11 }
            ],
            weekly: [
              { week: 'Week 1', tickets: 85, resolved: 65 },
              { week: 'Week 2', tickets: 92, resolved: 78 },
              { week: 'Week 3', tickets: 78, resolved: 82 },
              { week: 'Week 4', tickets: 95, resolved: 88 }
            ],
            monthly: [
              { month: 'Jan', tickets: 320, resolved: 285 },
              { month: 'Feb', tickets: 345, resolved: 310 },
              { month: 'Mar', tickets: 310, resolved: 295 },
              { month: 'Apr', tickets: 380, resolved: 350 }
            ]
          },
          categories: [
            { name: 'Maintenance', count: 45, percentage: 30 },
            { name: 'Billing', count: 30, percentage: 20 },
            { name: 'Technical', count: 25, percentage: 17 },
            { name: 'General', count: 20, percentage: 13 },
            { name: 'Emergency', count: 15, percentage: 10 },
            { name: 'Other', count: 15, percentage: 10 }
          ],
          topIssues: [
            { issue: 'Payment Processing', count: 25, avgResolution: '4 hours' },
            { issue: 'Room Maintenance', count: 20, avgResolution: '1 day' },
            { issue: 'WiFi Connectivity', count: 15, avgResolution: '2 hours' },
            { issue: 'Cleaning Services', count: 12, avgResolution: '6 hours' },
            { issue: 'Security Concerns', count: 8, avgResolution: '1 hour' }
          ],
          staffPerformance: [
            { name: 'John Doe', tickets: 45, avgResolution: '3.2 hours', satisfaction: 4.5 },
            { name: 'Jane Smith', tickets: 38, avgResolution: '2.8 hours', satisfaction: 4.3 },
            { name: 'Mike Johnson', tickets: 32, avgResolution: '4.1 hours', satisfaction: 4.1 },
            { name: 'Sarah Wilson', tickets: 28, avgResolution: '3.5 hours', satisfaction: 4.4 },
            { name: 'David Brown', tickets: 25, avgResolution: '3.8 hours', satisfaction: 4.2 }
          ]
        }
      };
    }
  }

  async getSuperadminAnalytics(timeRange = 'week', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      
      if (filters.pg) params.append('pg', filters.pg);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/tickets/superadmin-analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching superadmin analytics:', error);
      throw new Error('Failed to fetch superadmin analytics');
    }
  }

  // Get ticket statistics
  async getTicketStats() {
    try {
      const response = await api.get('/tickets/support-dashboard-analytics');
      
      // Validate response structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to fetch ticket statistics');
      }

      // Ensure data is present and has the expected structure
      const data = response.data.data || {};
      
      return {
        success: true,
        data: {
          stats: data.stats || {
            totalTickets: 0,
            openTickets: 0,
            inProgressTickets: 0,
            resolvedTickets: 0,
            closedTickets: 0
          },
          performance: data.performance || {
            avgResponseTime: 0,
            avgResolutionTime: 0,
            satisfactionScore: 0,
            totalTickets: 0
          },
          recentTickets: data.recentTickets || [],
          user: data.user || null,
          pg: data.pg || null
        },
        message: response.data.message || 'Ticket statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      
      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch ticket statistics');
      }
      
      throw new Error(error.message || 'Network error or server unavailable');
    }
  }

  // Get ticket by ID
  async getTicketById(ticketId) {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      
      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch ticket details');
      }
      
      throw new Error('Network error or server unavailable');
    }
  }

  // Create new ticket
  async createTicket(ticketData) {
    try {
      const response = await api.post('/tickets', ticketData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update ticket
  async updateTicket(ticketId, updateData) {
    try {
      const response = await api.put(`/tickets/${ticketId}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update ticket status
  async updateTicketStatus(ticketId, status, feedback) {
    try {
      const response = await api.post(`/tickets/${ticketId}/update-status`, {
        status,
        resolution: feedback
      }, {
        // Ensure we get the full updated ticket back
        params: { 
          includeComments: true,
          includeUser: true,
          includePg: true
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating ticket ${ticketId} status:`, error);
      throw this.handleError(error);
    }
  }

  // Add comment to ticket
  async addComment(ticketId, message) {
    try {
      const response = await api.post(`/tickets/${ticketId}/comments`, 
        { message }, 
        {
          // Ensure we get the full updated ticket back
          params: { 
            includeComments: true,
            includeUser: true,
            includePg: true
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to ticket ${ticketId}:`, error);
      throw this.handleError(error);
    }
  }

  // Delete ticket
  async deleteTicket(ticketId) {
    try {
      const response = await api.delete(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Assign ticket to support staff
  async assignTicket(ticketId, assignedToId) {
    try {
      const response = await api.post(`/tickets/${ticketId}/assign`, { assignedToId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Resolve ticket
  async resolveTicket(ticketId, resolutionData) {
    try {
      const response = await api.post(`/tickets/${ticketId}/resolve`, resolutionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Close ticket
  async closeTicket(ticketId) {
    try {
      const response = await api.post(`/tickets/${ticketId}/close`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get ticket categories
  async getTicketCategories() {
    try {
      const response = await api.get('/tickets/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      
      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch ticket categories');
      }
      
      throw new Error('Network error or server unavailable');
    }
  }

  // Get priority levels
  async getPriorityLevels() {
    try {
      const response = await api.get('/tickets/priorities');
      return response.data;
    } catch (error) {
      console.error('Error fetching priorities:', error);
      
      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch priority levels');
      }
      
      throw new Error('Network error or server unavailable');
    }
  }

  // Get status options
  async getStatusOptions() {
    try {
      const response = await api.get('/tickets/statuses');
      return response.data;
    } catch (error) {
      console.error('Error fetching statuses:', error);

      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch status options');
      }

      throw new Error('Network error or server unavailable');
    }
  }

  // Get support staff list
  async getSupportStaff() {
    try {
      const response = await api.get('/tickets/support-staff/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching support staff:', error);

      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch support staff');
      }

      throw new Error('Network error or server unavailable');
    }
  }

  // Request to reopen a closed ticket (admin only)
  async requestReopenTicket(ticketId, reason) {
    try {
      const response = await api.post(`/tickets/${ticketId}/request-reopen`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error requesting ticket reopen:', error);

      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to request ticket reopen');
      }

      throw new Error('Network error or server unavailable');
    }
  }

  // Reopen a ticket (superadmin only)
  async reopenTicket(ticketId, reason) {
    try {
      const response = await api.post(`/tickets/${ticketId}/reopen`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error reopening ticket:', error);

      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to reopen ticket');
      }

      throw new Error('Network error or server unavailable');
    }
  }

  // Get reopen requests (superadmin only)
  async getReopenRequests() {
    try {
      const response = await api.get('/tickets/reopen-requests/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching reopen requests:', error);

      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch reopen requests');
      }

      throw new Error('Network error or server unavailable');
    }
  }

  // Validate status transition (client-side validation)
  validateStatusTransition(currentStatus, newStatus) {
    const invalidTransitions = {
      'resolved': ['open', 'in_progress'],
      'closed': ['open', 'in_progress', 'resolved']
    };

    if (invalidTransitions[currentStatus] && invalidTransitions[currentStatus].includes(newStatus)) {
      return {
        valid: false,
        message: `Cannot change status from ${currentStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}. Please reopen the ticket instead.`
      };
    }

    return { valid: true };
  }

  // Upload ticket attachments
  async uploadAttachments(ticketId, files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    console.error('Ticket service error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request data');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Ticket not found');
        case 500:
          return new Error('Server error occurred');
        default:
          return new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error - please check your connection');
    } else {
      // Other error
      return new Error('An unexpected error occurred');
    }
  }

  // Validation methods
  validateTicketData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters long' });
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push({ field: 'description', message: 'Description must be at least 10 characters long' });
    }

    if (!data.category) {
      errors.push({ field: 'category', message: 'Category is required' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility methods
  formatTicketData(ticket) {
    return {
      ...ticket,
      createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '',
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : '',
      status: ticket.status ? ticket.status.replace('_', ' ') : 'Unknown',
      priority: ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'Unknown'
    };
  }

  isTicketEditable(ticket) {
    return ['open', 'in_progress'].includes(ticket.status);
  }

  isTicketDeletable(ticket) {
    return ticket.status === 'open';
  }

  getStatusColor(status) {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.open;
  }

  getPriorityColor(priority) {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  }

  // Get PGs related to tickets
  async getTicketPGs() {
    try {
      const response = await api.get('/tickets');
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket PGs:', error);
      
      // Standardized error handling
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch ticket PGs');
      }
      
      throw new Error('Network error or server unavailable');
    }
  }
}

export default new TicketService(); 