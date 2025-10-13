import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Filter, RefreshCw, Search, ChevronLeft, ChevronRight, Download, Info, Activity, Shield, HeadphonesIcon, DollarSign, FileText, Building2, Users, Clipboard, Crown, Settings } from 'lucide-react';
import activityService from '../../services/activity.service';
import { selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const categoryStyles = (cat) => ({
  wrap: 'p-2 rounded-lg',
  icon: (
    cat === 'payment' ? { wrap: 'bg-emerald-100 text-emerald-600', Icon: DollarSign } :
    cat === 'support' ? { wrap: 'bg-orange-100 text-orange-600', Icon: HeadphonesIcon } :
    cat === 'authentication' ? { wrap: 'bg-purple-100 text-purple-600', Icon: Shield } :
    cat === 'management' ? { wrap: 'bg-blue-100 text-blue-600', Icon: Building2 } :
    cat === 'resident' ? { wrap: 'bg-teal-100 text-teal-600', Icon: Users } :
    cat === 'document' ? { wrap: 'bg-amber-100 text-amber-600', Icon: FileText } :
    cat === 'system' ? { wrap: 'bg-red-100 text-red-600', Icon: Settings } :
    { wrap: 'bg-gray-100 text-gray-600', Icon: Activity }
  )
});

const Badge = ({ children, color = 'gray' }) => (
  <span className={`px-2 py-0.5 text-xs rounded-full border ${
    color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
    color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
    color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
    color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-gray-50 text-gray-700 border-gray-200'
  }`}>{children}</span>
);

const DetailDrawer = ({ open, onClose, item }) => {
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!item?.entityType || !item?.entityId) {
        setTimeline([]);
        return;
      }
      try {
        setLoadingTimeline(true);
        const res = await activityService.getEntityTimeline(item.entityType, item.entityId);
        if (res?.success) setTimeline(res.data || []);
        else setTimeline([]);
      } catch (_) {
        setTimeline([]);
      } finally {
        setLoadingTimeline(false);
      }
    };
    if (open) loadTimeline();
  }, [open, item?.entityType, item?.entityId]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
      toast.success('Details copied');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
          <div className="flex items-center gap-2">
            <button onClick={onCopy} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"><Clipboard className="h-4 w-4 text-gray-500" /></button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div><span className="text-gray-500">Title:</span> <span className="font-medium">{item?.title}</span></div>
          <div><span className="text-gray-500">Description:</span> <span>{item?.description}</span></div>
          <div className="flex items-center gap-2">
            <Badge>{item?.category || 'general'}</Badge>
            <Badge color={item?.status === 'success' ? 'green' : item?.status === 'failed' ? 'red' : 'yellow'}>{item?.status || 'info'}</Badge>
            <Badge color={item?.userRole === 'superadmin' ? 'blue' : 'gray'}>{item?.userRole}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500">Type:</span> <span>{item?.type}</span></div>
            <div><span className="text-gray-500">Priority:</span> <span>{item?.priority || 'normal'}</span></div>
            <div><span className="text-gray-500">User:</span> <span>{item?.userEmail} ({item?.userRole})</span></div>
            {item?.branchName && <div><span className="text-gray-500">Branch:</span> <span>{item.branchName}</span></div>}
            <div><span className="text-gray-500">Time:</span> <span>{new Date(item?.timestamp).toLocaleString('en-IN')}</span></div>
            <div><span className="text-gray-500">IP:</span> <span>{item?.ipAddress || '-'}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Agent:</span> <span className="break-all">{item?.userAgent || '-'}</span></div>
          </div>
          {item?.entityType && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500">Entity</div>
                <div className="text-xs text-gray-400">{item.entityType}</div>
              </div>
              <div className="text-xs">{item.entityName || item.entityId}</div>
            </div>
          )}
          {item?.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-gray-500 mb-1">Metadata</div>
              <pre className="bg-gray-50 p-2 rounded border border-gray-200 text-xs whitespace-pre-wrap break-all">{JSON.stringify(item.metadata, null, 2)}</pre>
            </div>
          )}
          {(item?.entityType && item?.entityId) && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-gray-900 font-medium mb-2">Recent Timeline</div>
              {loadingTimeline ? (
                <div className="text-xs text-gray-500">Loading timeline…</div>
              ) : timeline.length === 0 ? (
                <div className="text-xs text-gray-500">No related activity</div>
              ) : (
                <div className="space-y-2">
                  {timeline.slice(0, 6).map((t) => (
                    <div key={t._id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                      <div className="text-xs">
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="text-gray-600">{t.description}</div>
                        <div className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleString('en-IN')} • {t.userEmail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SuperadminActivities = () => {
  const user = useSelector(selectUser);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 20, sort: '-timestamp' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [userRole, setUserRole] = useState('');
  const [drawerItem, setDrawerItem] = useState(null);

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await activityService.getSuperadminActivities({ 
        ...filters, 
        q: search, 
        type, 
        category, 
        status,
        userRole
      });
      if (res.success) {
        setItems(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res.message || 'Failed to load superadmin activities');
      }
    } catch (e) {
      toast.error('Failed to load superadmin activities');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN');

  const onExportCSV = async () => {
    try {
      const params = new URLSearchParams({ ...filters, q: search, type, category, status, userRole });
      const base = import.meta.env.VITE_API_BASE_URL || '/api';
      const url = `${base.replace(/\/$/, '')}/activities/export/csv?${params.toString()}`;
      window.open(url, '_blank');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Crown className="h-7 w-7 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Superadmin & Support Activities</h1>
            <p className="text-sm text-gray-600">View and track superadmin and support staff actions and logs</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onExportCSV} className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={load} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search superadmin activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setFilters(f => ({ ...f, page: 1 })); }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={category} onChange={(e) => { setCategory(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="management">Management</option>
              <option value="resident">Resident</option>
              <option value="payment">Payment</option>
              <option value="support">Support/Tickets</option>
              <option value="document">Document</option>
              <option value="system">System</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={type} onChange={(e) => { setType(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Types</option>
              <option value="user_login">User Login</option>
              <option value="pg_create">PG Created</option>
              <option value="pg_update">PG Updated</option>
              <option value="support_staff_create">Support Staff Created</option>
              <option value="support_staff_update">Support Staff Updated</option>
              <option value="ticket_assign">Ticket Assigned</option>
              <option value="ticket_resolve">Ticket Resolved</option>
              <option value="system_backup">System Backup</option>
              <option value="system_maintenance">System Maintenance</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={userRole} onChange={(e) => { setUserRole(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="support">Support</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filters.sort} onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}>
              <option value="-timestamp">Newest first</option>
              <option value="timestamp">Oldest first</option>
            </select>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-500 mt-3">Loading superadmin activities...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <Crown className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No superadmin activities found</p>
              <p className="text-sm text-gray-400 mt-1">Superadmin and support activities will appear here</p>
            </div>
          ) : (
            items.map(item => {
              const cat = categoryStyles(item.category);
              const { wrap, icon: S } = cat;
              const IconWrap = S.wrap; const Icon = S.Icon;
              return (
                <div key={item._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setDrawerItem(item)}>
                  <div className="flex items-start gap-4">
                    <div className={`${wrap} ${IconWrap}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">{item.title}</span>
                        <Badge>{item.category || 'general'}</Badge>
                        <Badge color={item.status === 'success' ? 'green' : item.status === 'failed' ? 'red' : 'yellow'}>{item.status}</Badge>
                        <Badge color={item.userRole === 'superadmin' ? 'blue' : 'gray'}>{item.userRole}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{item.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>{item.userRole === 'superadmin' ? 'Superadmin' : 'Support'}: {item.userEmail}</span>
                        {item.branchName && <span>Branch: {item.branchName}</span>}
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer open={!!drawerItem} onClose={() => setDrawerItem(null)} item={drawerItem} />
    </div>
  );
};

export default SuperadminActivities;
