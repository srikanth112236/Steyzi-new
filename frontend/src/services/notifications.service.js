import api from './api';

class NotificationsService {
  async list({ page = 1, limit = 10, unreadOnly = false, branchId } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (unreadOnly) params.append('unreadOnly', 'true');
    if (branchId) params.append('branchId', branchId);
    const res = await api.get(`/notifications?${params.toString()}`);
    return res.data;
  }

  async markRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  }

  async markAllRead({ branchId } = {}) {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    const res = await api.put(`/notifications/mark-all/read?${params.toString()}`);
    return res.data;
  }
}

export default new NotificationsService(); 