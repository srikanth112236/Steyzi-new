import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  List, 
  Grid, 
  Search, 
  X, 
  RefreshCw, 
  Download, 
  FileText,
  Eye,
  Clock,
  DownloadCloud
} from 'lucide-react';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';

import { motion, AnimatePresence } from 'framer-motion';

// Dummy data for billing records
const dummyBillingData = Array.from({ length: 50 }, (_, index) => ({
  id: `BILL-${1000 + index}`,
  date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
  amount: parseFloat((Math.random() * 10000).toFixed(2)),
  status: ['Paid', 'Pending', 'Overdue'][Math.floor(Math.random() * 3)],
  type: ['Subscription', 'Bed Top-up', 'Branch Extension'][Math.floor(Math.random() * 3)],
  branch: `Branch ${Math.floor(Math.random() * 5) + 1}`,
  plan: ['Basic', 'Pro', 'Enterprise'][Math.floor(Math.random() * 3)],
  description: `Sample billing record for ${['Subscription', 'Bed Top-up', 'Branch Extension'][Math.floor(Math.random() * 3)]}`
}));

// Preview Modal Component
const BillingPreviewModal = ({ bill, onClose }) => {
  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bill Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Bill ID</p>
              <p className="font-medium text-gray-900">{bill.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{bill.date.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-bold text-green-600">₹{bill.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {bill.status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-900">{bill.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Branch</p>
              <p className="font-medium text-gray-900">{bill.branch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium text-gray-900">{bill.plan}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Download className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Billing History Modal Component
const BillingHistoryModal = ({ bill, onClose }) => {
  if (!bill) return null;

  // Simulated history data
  const historyData = [
    { 
      date: new Date(bill.date.getTime() - 86400000), 
      action: 'Bill Generated', 
      details: `Initial bill created for ${bill.type}` 
    },
    { 
      date: new Date(bill.date.getTime() - 43200000), 
      action: 'Payment Processing', 
      details: 'Payment is being processed' 
    },
    { 
      date: bill.date, 
      action: 'Payment Completed', 
      details: `Successful payment of ₹${bill.amount.toLocaleString()}` 
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            {historyData.map((entry, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 text-center">
                  <p className="text-sm text-gray-500">{entry.date.toLocaleDateString()}</p>
                </div>
                <div className="flex-1 border-l-2 border-gray-200 pl-4">
                  <p className="font-medium text-gray-900">{entry.action}</p>
                  <p className="text-sm text-gray-600">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Billing = () => {
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    branch: '',
    plan: '',
    dateRange: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewBill, setPreviewBill] = useState(null);
  const [historyBill, setHistoryBill] = useState(null);
  const itemsPerPage = 10;

  // Filtering and searching logic
  const filteredBillingData = useMemo(() => {
    return dummyBillingData.filter(bill => {
      const matchesStatus = !filters.status || bill.status === filters.status;
      const matchesType = !filters.type || bill.type === filters.type;
      const matchesBranch = !filters.branch || bill.branch === filters.branch;
      const matchesPlan = !filters.plan || bill.plan === filters.plan;
      const matchesSearch = bill.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesType && matchesBranch && matchesPlan && matchesSearch;
    });
  }, [filters, searchTerm]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBillingData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBillingData, currentPage]);

  const totalPages = Math.ceil(filteredBillingData.length / itemsPerPage);

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      branch: '',
      plan: '',
      dateRange: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Render Pagination Controls
  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Render Table View
  const renderBillingTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map(bill => (
            <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-900">{bill.id}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{bill.date.toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm font-medium text-green-600">₹{bill.amount.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {bill.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{bill.type}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{bill.branch}</td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setPreviewBill(bill)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Preview Bill"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setHistoryBill(bill)}
                    className="text-green-600 hover:text-green-800"
                    title="Billing History"
                  >
                    <Clock className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );

  // Render Grid View
  const renderBillingGrid = () => (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedData.map(bill => (
          <motion.div 
            key={bill.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">{bill.id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {bill.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">₹{bill.amount.toLocaleString()}</div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{bill.type}</span>
              <span>{bill.date.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{bill.branch}</span>
              <span className="font-medium">{bill.plan}</span>
            </div>
            <div className="flex justify-between mt-2">
              <button 
                onClick={() => setPreviewBill(bill)}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <Eye className="h-4 w-4" />
                <span className="text-xs">Preview</span>
              </button>
              <button 
                onClick={() => setHistoryBill(bill)}
                className="text-green-600 hover:text-green-800 flex items-center space-x-1"
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs">History</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {renderPagination()}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-blue-600" />
            Billing History
          </h2>
          <p className="text-gray-600 mt-2">View and manage your billing records</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
          >
            {viewMode === 'list' ? <Grid className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search bills..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          {/* Status Filter */}
          <Select 
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select 
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Subscription">Subscription</SelectItem>
              <SelectItem value="Bed Top-up">Bed Top-up</SelectItem>
              <SelectItem value="Branch Extension">Branch Extension</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch Filter */}
          <Select 
            value={filters.branch}
            onValueChange={(value) => setFilters(prev => ({ ...prev, branch: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {['Branch 1', 'Branch 2', 'Branch 3', 'Branch 4', 'Branch 5'].map(branch => (
                <SelectItem key={branch} value={branch}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Billing Records */}
      <AnimatePresence>
        {viewMode === 'list' ? renderBillingTable() : renderBillingGrid()}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewBill && (
        <BillingPreviewModal 
          bill={previewBill} 
          onClose={() => setPreviewBill(null)} 
        />
      )}

      {/* History Modal */}
      {historyBill && (
        <BillingHistoryModal 
          bill={historyBill} 
          onClose={() => setHistoryBill(null)} 
        />
      )}
    </div>
  );
};

export default Billing;
