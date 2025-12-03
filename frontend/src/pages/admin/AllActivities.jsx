import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, RefreshCw, Search, ChevronLeft, ChevronRight, Download, Info, Activity, Shield, HeadphonesIcon, DollarSign, FileText, Building2, Users, Clipboard, X, Clock, User, MapPin, Globe, Monitor, Eye } from 'lucide-react';
import activityService from '../../services/activity.service';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const categoryStyles = (cat) => ({
  wrap: 'p-1.5 rounded-lg',
  icon: (
    cat === 'payment' ? { wrap: 'bg-emerald-100 text-emerald-600', Icon: DollarSign } :
    cat === 'support' ? { wrap: 'bg-orange-100 text-orange-600', Icon: HeadphonesIcon } :
    cat === 'authentication' ? { wrap: 'bg-purple-100 text-purple-600', Icon: Shield } :
    cat === 'branch' ? { wrap: 'bg-blue-100 text-blue-600', Icon: Building2 } :
    cat === 'resident' ? { wrap: 'bg-teal-100 text-teal-600', Icon: Users } :
    cat === 'document' ? { wrap: 'bg-amber-100 text-amber-600', Icon: FileText } :
    { wrap: 'bg-gray-100 text-gray-600', Icon: Activity }
  )
});

const Badge = ({ children, color = 'gray' }) => (
  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
    color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
    color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
    color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
    'bg-gray-50 text-gray-700 border border-gray-200'
  }`}>{children}</span>
);

const InfoChip = ({ icon: Icon, text }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600 border border-gray-200">
    {Icon && <Icon className="h-3 w-3 text-gray-500" />}
    <span className="truncate max-w-[120px]">{text}</span>
  </span>
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

  const formatMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return null;
    
    const formatValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      return String(value);
    };

    const importantFields = ['method', 'path', 'reportType', 'branchId', 'status', 'action'];
    const formatted = [];
    
    importantFields.forEach(field => {
      if (metadata[field]) {
        formatted.push({ label: field.charAt(0).toUpperCase() + field.slice(1), value: formatValue(metadata[field]) });
      }
    });

    return formatted.length > 0 ? formatted : null;
  };

  const formattedMetadata = item?.metadata ? formatMetadata(item.metadata) : null;

  if (!open) return null;
  
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
          >
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                    <p className="text-sm text-gray-500 mt-0.5">View complete activity information</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Title & Description */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{item?.title}</h4>
                    <p className="text-sm text-gray-600">{item?.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{item?.category || 'general'}</Badge>
                    <Badge color={item?.status === 'success' ? 'green' : item?.status === 'failed' ? 'red' : 'yellow'}>
                      {item?.status || 'info'}
                    </Badge>
                    {item?.type && (
                      <Badge>{item.type}</Badge>
                    )}
                  </div>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase">User</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{item?.userEmail}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item?.userRole}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Time</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(item?.timestamp).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(item?.timestamp).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {item?.branchName && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Branch</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{item.branchName}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Priority</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{item?.priority || 'Normal'}</p>
                  </div>
                </div>

                {(item?.ipAddress || item?.userAgent) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item?.ipAddress && <InfoChip icon={Globe} text={`IP ${item.ipAddress}`} />}
                    {item?.userAgent && (
                      <InfoChip
                        icon={Monitor}
                        text={`${item.userAgent.slice(0, 60)}${item.userAgent.length > 60 ? '…' : ''}`}
                      />
                    )}
                  </div>
                )}

                {/* Formatted Metadata */}
                {formattedMetadata && formattedMetadata.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Activity Information
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {formattedMetadata.map((field, idx) => (
                        <InfoChip key={idx} text={`${field.label}: ${field.value}`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Entity Information */}
                {item?.entityType && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-xs font-semibold text-indigo-900 tracking-wide uppercase flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-indigo-600" />
                        Related Entity
                      </h5>
                      <span className="text-[10px] px-2 py-0.5 bg-white text-indigo-600 rounded-full font-semibold">
                        {item.entityType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">{item.entityName || item.entityId}</p>
                  </div>
                )}

                {/* Timeline */}
                {(item?.entityType && item?.entityId) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                      <Clock className="h-4 w-4 text-gray-400" />
                      Related Activities
                    </h5>
                    {loadingTimeline ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : timeline.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-500 bg-gray-50 rounded-lg">
                        No related activities found
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {timeline.slice(0, 5).map((t, idx) => (
                          <motion.div
                            key={t._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                          >
                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 line-clamp-1">{t.title}</p>
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{t.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span>{new Date(t.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                <span>•</span>
                                <span>{t.userEmail}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AllActivities = () => {
  const selectedBranch = useSelector(selectSelectedBranch);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 20, sort: '-timestamp' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [drawerItem, setDrawerItem] = useState(null);

  useEffect(() => { 
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, search, type, category, status, role]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAdminActivities({ 
        ...filters, 
        q: search, 
        type, 
        category, 
        status,
        role,
        branchId: selectedBranch?._id 
      });
      if (res.success) {
        setItems(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res.message || 'Failed to load activities');
      }
    } catch (e) {
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const onExportCSV = async () => {
    try {
      const params = new URLSearchParams({ ...filters, q: search, type, category, status, branchId: selectedBranch?._id });
      const base = import.meta.env.VITE_API_BASE_URL 
        || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://api.steyzi.com/api');
      const url = `${base.replace(/\/$/, '')}/activities/admin/export/csv?${params.toString()}`;
      window.open(url, '_blank');
      toast.success('Exporting CSV...');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">All Activities</h1>
            <p className="text-xs text-gray-500">Compact snapshot of every action</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onExportCSV}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-medium shadow-sm transition-all hover:shadow-md flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex justify-center w-10"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-3">
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              placeholder="Search by user, action, entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 text-xs">
            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            >
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="pg">PG</option>
              <option value="branch">Branch</option>
              <option value="resident">Resident</option>
              <option value="payment">Payment</option>
              <option value="support">Support</option>
              <option value="report">Report</option>
              <option value="document">Document</option>
              <option value="system">System</option>
            </select>

            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={type}
              onChange={(e) => { setType(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            >
              <option value="">All Types</option>
              <option value="user_login">User Login</option>
              <option value="pg_create">PG Created</option>
              <option value="branch_update">Branch Updated</option>
              <option value="resident_create">Resident Created</option>
              <option value="payment_update">Payment Updated</option>
              <option value="ticket_update">Ticket Updated</option>
              <option value="report_generate">Report Generated</option>
              <option value="document_upload">Document Uploaded</option>
            </select>

            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="info">Info</option>
            </select>

            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={role}
              onChange={(e) => { setRole(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="support">Support</option>
            </select>

            <select
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.sort}
              onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
            >
              <option value="-timestamp">Newest first</option>
              <option value="timestamp">Oldest first</option>
            </select>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <div className="text-gray-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>Page {pagination.page} of {pagination.pages || 1}</span>
            </div>
            <div className="text-gray-500">
              {pagination.total} total activities
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading activities...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">No activities found</p>
            <p className="text-xs text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const cat = categoryStyles(item.category);
              const { wrap, icon: S } = cat;
              const IconWrap = S.wrap;
              const Icon = S.Icon;
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3.5 hover:bg-gray-50 cursor-pointer transition-colors group"
                  onClick={() => setDrawerItem(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${wrap} ${IconWrap} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-gray-900 truncate">{item.title}</h3>
                          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                        <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <Badge>{item.category || 'general'}</Badge>
                        <Badge color={item.status === 'success' ? 'green' : item.status === 'failed' ? 'red' : 'yellow'}>
                          {item.status}
                        </Badge>
                        <InfoChip icon={User} text={item.userEmail} />
                        {item.branchName && <InfoChip icon={MapPin} text={item.branchName} />}
                        <InfoChip icon={Clock} text={formatDate(item.timestamp)} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={pagination.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default AllActivities;
