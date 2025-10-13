import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markRead, markAllRead } from '../../store/slices/notifications.slice';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const selectedBranch = useSelector(selectSelectedBranch);
  const { items, pagination, loading } = useSelector((s) => s.notifications || { items: [], pagination: {}, loading: false });

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 20, unreadOnly: false, branchId: selectedBranch?._id }));
  }, [dispatch, selectedBranch?._id]);

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Recent events and alerts across your branches.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">{items.length} of {pagination.total || items.length} items</div>
        <button onClick={() => dispatch(markAllRead({ branchId: selectedBranch?._id }))} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">Mark all as read</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-500">No notifications found.</div>
        ) : (
          items.map(n => (
            <div key={n._id} className={`px-4 py-3 border-b border-gray-100 ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}>
              <div className="flex items-start justify-between">
                <div className="pr-4">
                  <div className="font-semibold text-gray-900">{n.title}</div>
                  <div className="text-sm text-gray-700">{n.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && (
                  <button onClick={() => dispatch(markRead(n._id))} className="text-xs text-blue-600 hover:underline">Mark read</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 