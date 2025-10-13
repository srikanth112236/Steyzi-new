import React, { useState, useEffect } from 'react';
import { 
  FileText, 
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

// Dummy data for reports
const generateDummyReports = () => {
  const reportTypes = [
    'Resident Summary', 
    'Payment Collection', 
    'Occupancy', 
    'Financial Overview', 
    'Branch Performance'
  ];
  const statuses = ['Generated', 'Pending', 'In Progress', 'Error'];
  const formats = ['PDF', 'Excel', 'CSV'];
  
  return Array.from({ length: 50 }, (_, index) => ({
    id: `RPT-${1000 + index}`,
    type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
    dateGenerated: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    format: formats[Math.floor(Math.random() * formats.length)],
    fileSize: Math.floor(Math.random() * 5) + 1, // MB
    generatedBy: `Admin ${Math.floor(Math.random() * 10) + 1}`
  }));
};

const SuperadminReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    format: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Simulate API call
    const dummyData = generateDummyReports();
    setReports(dummyData);
    setFilteredReports(dummyData);
    setLoading(false);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, reports]);

  const applyFilters = () => {
    let result = reports;

    if (filters.type && filters.type !== 'all') {
      result = result.filter(r => r.type === filters.type);
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }
    if (filters.format && filters.format !== 'all') {
      result = result.filter(r => r.format === filters.format);
    }
    if (filters.startDate) {
      result = result.filter(r => new Date(r.dateGenerated) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      result = result.filter(r => new Date(r.dateGenerated) <= new Date(filters.endDate));
    }

    setFilteredReports(result);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      format: '',
      startDate: '',
      endDate: ''
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handleDownload = (report) => {
    toast.success(`Downloading ${report.type} report`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Generated': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="mr-3 text-blue-600" />
          Reports Management
        </h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => toast.success('Generate New Report functionality will be implemented')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Report Type</label>
            <Select 
              onValueChange={(value) => handleFilterChange('type', value)} 
              value={filters.type || 'all'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Report Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Types</SelectItem>
                {['Resident Summary', 'Payment Collection', 'Occupancy', 'Financial Overview', 'Branch Performance'].map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
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
                {['Generated', 'Pending', 'In Progress', 'Error'].map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
            <Select 
              onValueChange={(value) => handleFilterChange('format', value)} 
              value={filters.format || 'all'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {['PDF', 'Excel', 'CSV'].map(format => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.dateGenerated.toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.format}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.fileSize} MB</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.generatedBy}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <button 
                    onClick={() => handleDownload(report)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </td>
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
                <span className="font-medium">{Math.min(indexOfLastItem, filteredReports.length)}</span>{' '}
                of{' '}
                <span className="font-medium">{filteredReports.length}</span>{' '}
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

export default SuperadminReports;
