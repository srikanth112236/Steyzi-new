import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, TrendingUp, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import salaryService from '../../services/salary.service';
import toast from 'react-hot-toast';

const SalaryHistoryModal = ({ isOpen, onClose, maintainer }) => {
  const [loading, setLoading] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (isOpen && maintainer) {
      loadSalaryHistory();
    }
  }, [isOpen, maintainer]);

  const loadSalaryHistory = async () => {
    try {
      setLoading(true);

      // Get salary summary
      const summaryResponse = await salaryService.getMaintainerSalarySummary(maintainer._id);
      setSummary(summaryResponse.data.summary);

      // Get all salaries for this maintainer (we'll need to modify the service to support this)
      // For now, we'll get salaries and filter by maintainer
      const salariesResponse = await salaryService.getAllSalaries({
        maintainerId: maintainer._id,
        sortBy: 'year',
        sortOrder: 'desc'
      });

      // Process salaries and extract individual payments
      const paymentHistory = [];

      salariesResponse.data.salaries.forEach(salary => {
        const period = `${salary.month} ${salary.year}`;

        // Add salary definition entry
        paymentHistory.push({
          id: `${salary._id}_definition`,
          type: 'salary_definition',
          period: period,
          month: salary.month,
          year: salary.year,
          amount: salary.netSalary,
          status: salary.status,
          date: salary.createdAt,
          description: `Salary defined: ${salaryService.formatCurrency(salary.netSalary)}`,
          details: {
            baseSalary: salary.baseSalary,
            bonus: salary.bonus,
            overtime: salary.overtime?.amount || 0,
            deductions: salary.totalDeductions
          }
        });

        // Add individual payment entries
        if (salary.payments && salary.payments.length > 0) {
          salary.payments.forEach((payment, index) => {
            paymentHistory.push({
              id: `${salary._id}_payment_${index}`,
              type: 'payment',
              period: period,
              month: salary.month,
              year: salary.year,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod,
              transactionId: payment.transactionId,
              paymentDate: payment.paymentDate,
              notes: payment.notes,
              date: payment.paidAt,
              description: `Payment: ${salaryService.formatCurrency(payment.amount)} (${payment.paymentMethod})`,
              status: 'completed'
            });
          });
        }
      });

      // Group by year and sort by date within each year
      const groupedByYear = paymentHistory.reduce((acc, item) => {
        if (!acc[item.year]) {
          acc[item.year] = [];
        }
        acc[item.year].push(item);
        return acc;
      }, {});

      // Sort items within each year by date (most recent first)
      Object.keys(groupedByYear).forEach(year => {
        groupedByYear[year].sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      // Convert to array format for display
      const historyArray = Object.keys(groupedByYear)
        .sort((a, b) => parseInt(b) - parseInt(a))
        .map(year => ({
          year: parseInt(year),
          items: groupedByYear[year]
        }));

      setSalaryHistory(historyArray);
    } catch (error) {
      console.error('Error loading salary history:', error);
      toast.error('Failed to load salary history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially_paid':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Salary History
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {maintainer?.firstName} {maintainer?.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Summary Stats */}
          {summary && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {summary.totalSalaries}
                  </div>
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {salaryService.formatCurrency(summary.totalPaidAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {salaryService.formatCurrency(summary.totalNetSalary)}
                  </div>
                  <div className="text-sm text-gray-600">Total Salary</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {salaryService.formatCurrency(summary.avgNetSalary)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Salary</div>
                </div>
              </div>
            </div>
          )}

          {/* History Content */}
          <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading salary history...</span>
            </div>
          ) : salaryHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Records</h3>
              <p className="text-gray-600">No salary records found for this maintainer.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {salaryHistory.map((yearData) => (
                <div key={yearData.year} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                      {yearData.year}
                    </h4>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {yearData.items.map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {item.type === 'salary_definition' ? (
                                <Calendar className="h-4 w-4 text-blue-500" />
                              ) : (
                                <DollarSign className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {item.period}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.type === 'salary_definition'
                                  ? getStatusColor(item.status)
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {item.type === 'salary_definition'
                                  ? item.status.replace('_', ' ').toUpperCase()
                                  : 'PAYMENT'
                                }
                              </span>
                              {item.type === 'payment' && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {item.paymentMethod}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {salaryService.formatCurrency(item.amount)}
                              </div>
                              <div className="text-xs text-gray-600">
                                {item.description}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                // Could open details modal
                                toast.info('Details view coming soon');
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Additional details */}
                        {item.type === 'salary_definition' && item.details && (
                          <div className="mt-3 grid grid-cols-4 gap-4 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Base:</span> {salaryService.formatCurrency(item.details.baseSalary)}
                            </div>
                            <div>
                              <span className="font-medium">Bonus:</span> {salaryService.formatCurrency(item.details.bonus)}
                            </div>
                            <div>
                              <span className="font-medium">OT:</span> {salaryService.formatCurrency(item.details.overtime)}
                            </div>
                            <div>
                              <span className="font-medium">Deduct:</span> {salaryService.formatCurrency(item.details.deductions)}
                            </div>
                          </div>
                        )}

                        {item.type === 'payment' && (
                          <div className="mt-3 text-xs text-gray-600">
                            {item.transactionId && (
                              <div><span className="font-medium">Txn ID:</span> {item.transactionId}</div>
                            )}
                            {item.notes && (
                              <div><span className="font-medium">Notes:</span> {item.notes}</div>
                            )}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          {item.type === 'salary_definition' ? 'Created' : 'Paid'} on: {new Date(item.date).toLocaleDateString('en-IN')} at {new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryHistoryModal;
