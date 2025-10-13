import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Filter, RefreshCw, Search, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import activityService from '../../services/activity.service';
import { selectSelectedBranch } from '../../store/slices/branch.slice';
import toast from 'react-hot-toast';

const BranchActivities = () => {
  const selectedBranch = useSelector(selectSelectedBranch);
  const branchId = selectedBranch?._id || selectedBranch?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 20, sort: '-timestamp', category: 'branch' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    if (branchId) load();
  }, [branchId, filters]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await activityService.getAdminActivities({
        ...filters,
        q: search,
        type,
        status,
        branchId
      });
      if (res.success) {
        setItems(res.data);
        setPagination(res.pagination);
      } else {
        toast.error(res.message || 'Failed to load branch activities');
      }
    } catch (e) {
      toast.error('Failed to load branch activities');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-IN');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Branch Activities</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={load} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {!branchId && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100">
          Please select a branch to view its activities.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search branch activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setFilters(f => ({ ...f, page: 1 })); }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={type} onChange={(e) => { setType(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Branch Types</option>
              <option value="branch_create">Created</option>
              <option value="branch_update">Updated</option>
              <option value="branch_delete">Deleted</option>
              <option value="branch_set_default">Set Default</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={status} onChange={(e) => { setStatus(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="info">Info</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={role} onChange={(e) => { setRole(e.target.value); setFilters(f => ({ ...f, page: 1 })); }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
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
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="text-gray-500 mt-2">Loading branch activities...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No branch activities found</div>
          ) : (
            items.map(item => (
              <div key={item._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Branch</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${item.status === 'success' ? 'bg-green-100 text-green-700' : item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>User: {item.userEmail} ({item.userRole})</span>
                      {item.branchName && <span>Branch: {item.branchName}</span>}
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
    </div>
  );
};

export default BranchActivities; 