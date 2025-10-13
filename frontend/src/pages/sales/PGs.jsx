import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Building2,
  Plus,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import salesService from '../../services/sales.service';
import pgService from '../../services/pg.service';
import PgFormModal from '../../components/superadmin/PgFormModal';
import toast from 'react-hot-toast';

const SalesPGs = () => {
  const { user } = useSelector(state => state.auth);
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPgFormModal, setShowPgFormModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    salesManager: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPGs();
  }, [user]);

  const fetchPGs = async () => {
    try {
      let response;

      // Call appropriate endpoint based on user role
      if (user?.role === 'sales_manager') {
        response = await salesService.getTeamPGs();
      } else if (user?.salesRole === 'sub_sales') {
        response = await salesService.getMyPGs();
      } else {
        throw new Error('Unauthorized access');
      }

      setPGs(response.data.data || response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch PGs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch PGs');
      setLoading(false);
    }
  };

  const filteredPGs = (pgs || []).filter(pg => {
    const matchesSearch = pg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || pg.status === filters.status;
    const cityValue = pg.address?.city || (typeof pg.address === 'string' ? pg.address.split(',')[1]?.trim() : '');
    const matchesCity = !filters.city || cityValue === filters.city;
    const matchesSalesManager = !filters.salesManager || pg.salesManager === filters.salesManager;

    return matchesSearch && matchesStatus && matchesCity && matchesSalesManager;
  });

  const resetFilters = () => {
    setFilters({
      status: '',
      city: '',
      salesManager: ''
    });
    setSearchTerm('');
  };

  const handlePgCreate = async (pgData) => {
    try {
      await pgService.createPGSales(pgData);
      toast.success('PG created successfully!');
      setShowPgFormModal(false);

      // Refresh the PG list
      fetchTeamPGs();
    } catch (error) {
      console.error('Failed to create PG:', error);
      toast.error(error.response?.data?.message || 'Failed to create PG');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            PG Management
          </h1>
          <p className="text-gray-600 mt-2">View and manage PGs added by your team</p>
        </div>
        <button
          onClick={() => setShowPgFormModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add PG</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search PGs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          {/* Status Filter */}
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* City Filter */}
          <select 
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          >
            <option value="">All Cities</option>
            {/* Dynamically populate from PGs */}
            {[...new Set(pgs.map(pg => pg.address.city))].map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Sales Manager Filter */}
          <select
            value={filters.salesManager}
            onChange={(e) => setFilters(prev => ({ ...prev, salesManager: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg"
          >
            <option value="">All Sales Managers</option>
            {/* Dynamically populate from PGs */}
            {[...new Set(pgs.map(pg => pg.salesManager).filter(Boolean))].map(manager => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
        </div>

        {/* Reset Filters */}
        <div className="mt-4 flex justify-end">
          <button 
            onClick={resetFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* PGs List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Manager</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
              </tr>
            </thead>
            <tbody>
              {filteredPGs.map(pg => (
                <tr key={pg._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{pg.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pg.address?.city || (typeof pg.address === 'string' ? pg.address.split(',')[1]?.trim() || 'N/A' : 'N/A')}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600">
                    {pg.salesManager || 'Direct'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pg.status === 'active' ? 'bg-green-100 text-green-800' :
                      pg.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      pg.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      pg.status === 'full' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pg.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {pg.addedBy?.name || `${user?.firstName} ${user?.lastName}` || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PG Form Modal */}
      <PgFormModal
        isOpen={showPgFormModal}
        onClose={() => setShowPgFormModal(false)}
        onSuccess={handlePgCreate}
        isSalesMode={true}
      />
    </div>
  );
};

export default SalesPGs;
