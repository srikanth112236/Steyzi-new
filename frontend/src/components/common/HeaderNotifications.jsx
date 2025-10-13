import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markRead, markAllRead, pushNotification } from '../../store/slices/notifications.slice';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const HeaderNotifications = () => {
  const dispatch = useDispatch();
  const selectedBranch = useSelector(selectSelectedBranch);
  const { items, loading } = useSelector((state) => state.notifications || { items: [], loading: false });
  const [open, setOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (open) {
      dispatch(fetchNotifications({ page: 1, limit: 10, unreadOnly: true, branchId: selectedBranch?._id }));
    }
  }, [dispatch, selectedBranch?._id, open]);

  useEffect(() => {
    // init socket
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const s = io(base, { withCredentials: true });
      setSocket(s);

      s.on('connect', () => {});
      s.on('ticket_status_updated', (payload) => {
        // convert payload to notification-like item
        const n = {
          _id: `tmp_${Date.now()}`,
          type: 'ticket_status',
          title: 'Ticket Status Updated',
          message: `${payload?.title || 'Ticket'} is now ${payload?.status}`,
          data: payload,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        dispatch(pushNotification(n));
      });

      return () => { try { s.close(); } catch (_) {} };
    } catch (_) {}
  }, [dispatch]);

  const unreadItems = items.filter(n => !n.isRead);
  const unreadCount = unreadItems.length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Notifications</div>
            {unreadCount > 0 && (
              <button onClick={() => dispatch(markAllRead({ branchId: selectedBranch?._id }))} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">Mark all as read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : unreadItems.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600">You're all caught up</div>
              </div>
            ) : (
              unreadItems.map(n => (
                <div key={n._id} className="px-4 py-3 border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200">
                          {n.type?.split('.')?.pop() || 'update'}
                        </span>
                        {n.data?.branchName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {n.data.branchName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-medium text-gray-900 truncate">{n.title}</div>
                      <div className="text-xs text-gray-600 truncate">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={() => dispatch(markRead(n._id))} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">Mark read</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 text-right">
            <Link to="/admin/notifications" className="text-xs text-blue-600 hover:text-blue-700 hover:underline" onClick={() => setOpen(false)}>View more</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderNotifications; 