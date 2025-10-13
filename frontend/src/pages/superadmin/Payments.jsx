import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from "date-fns"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

import { Calendar } from "../../components/ui/calendar";

// Dummy data for payments
const generateDummyPayments = () => {
  const branches = ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield'];
  const statuses = ['Completed', 'Pending', 'Overdue', 'Partial'];
  
  return Array.from({ length: 50 }, (_, index) => ({
    id: `PAY-${1000 + index}`,
    residentName: `Resident ${index + 1}`,
    branch: branches[Math.floor(Math.random() * branches.length)],
    amount: Math.floor(Math.random() * 10000) + 1000,
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    paymentMethod: ['UPI', 'Bank Transfer', 'Cash', 'Cheque'][Math.floor(Math.random() * 4)]
  }));
};

const SuperadminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    branch: '',
    status: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Simulate API call
    const dummyData = generateDummyPayments();
    setPayments(dummyData);
    setFilteredPayments(dummyData);
    setLoading(false);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, payments]);

  const applyFilters = () => {
    let result = payments;

    if (filters.branch && filters.branch !== 'all') {
      result = result.filter(p => p.branch === filters.branch);
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.minAmount) {
      result = result.filter(p => p.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      result = result.filter(p => p.amount <= parseFloat(filters.maxAmount));
    }
    if (filters.startDate) {
      result = result.filter(p => new Date(p.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter(p => new Date(p.date) <= new Date(filters.endDate));
    }

    setFilteredPayments(result);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      branch: '',
      status: '',
      minAmount: '',
      maxAmount: '',
      startDate: '',
      endDate: ''
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const handleExport = () => {
    toast.success('Export functionality will be implemented');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <DollarSign className="mr-3 text-blue-600" />
          Payments Overview
        </h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
            <Select 
              onValueChange={(value) => handleFilterChange('branch', value)} 
              value={filters.branch || 'all'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield'].map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <Select 
              onValueChange={(value) => handleFilterChange('status', value)} 
              value={filters.status || 'all'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {['Completed', 'Pending', 'Overdue', 'Partial'].map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Amount</label>
            <input 
              type="number" 
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              placeholder="Min Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Amount</label>
            <input 
              type="number" 
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              placeholder="Max Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {filters.startDate 
                      ? format(new Date(filters.startDate), "MMM dd, yyyy") 
                      : "Select Start Date"}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => handleFilterChange('startDate', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                    {filters.endDate 
                      ? format(new Date(filters.endDate), "MMM dd, yyyy") 
                      : "Select End Date"}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => handleFilterChange('endDate', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-3">
          <button 
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resident Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.residentName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.branch}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{payment.amount.toLocaleString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.date.toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{payment.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{indexOfFirstItem + 1}</span>{' '}
                to{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, filteredPayments.length)}</span>{' '}
                of{' '}
                <span className="font-medium">{filteredPayments.length}</span>{' '}
                results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border border-gray-300 rounded-lg ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminPayments;