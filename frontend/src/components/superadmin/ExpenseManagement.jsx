import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseStatistics from './ExpenseStatistics';
import ExpenseSettings from './ExpenseSettings';
import { Plus, Settings, BarChart3, List, X } from 'lucide-react';
import { Button } from '../ui/button';

const ExpenseManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1);
    setShowAddModal(false);
    setEditingExpense(null);
  };

  const handleExpenseUpdated = () => {
    setRefreshKey(prev => prev + 1);
    setEditingExpense(null);
  };

  const handleExpenseDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with Title and Action Buttons */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Expense Management
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage all expenses for the organization
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setShowStatistics(!showStatistics)}
                variant={showStatistics ? "default" : "outline"}
                className="h-9 px-3 text-xs sm:text-sm flex items-center gap-1.5"
              >
                {showStatistics ? <List className="h-3.5 w-3.5" /> : <BarChart3 className="h-3.5 w-3.5" />}
                {showStatistics ? 'List View' : 'Statistics'}
              </Button>
              <Button
                onClick={() => setShowSettingsModal(true)}
                variant="outline"
                className="h-9 px-3 text-xs sm:text-sm flex items-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Button>
              <Button
                onClick={() => {
                  setEditingExpense(null);
                  setShowAddModal(true);
                }}
                className="h-9 px-3 text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Toggle between List and Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {showStatistics ? (
            <ExpenseStatistics key={refreshKey} />
          ) : (
            <ExpenseList
              key={refreshKey}
              onExpenseUpdated={handleExpenseUpdated}
              onExpenseDeleted={handleExpenseDeleted}
              onEditExpense={handleEditExpense}
            />
          )}
        </motion.div>

        {/* Add/Edit Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-t-xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <ExpenseForm
                  expense={editingExpense}
                  onExpenseAdded={handleExpenseAdded}
                  onCancel={handleCloseModal}
                  isModal={true}
                />
              </div>

              {/* Sticky Footer with Action Buttons */}
              <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl flex-shrink-0">
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="expense-form"
                    className="h-8 px-3 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]"
            >
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 rounded-t-xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Expense Settings</h2>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <ExpenseSettings />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManagement;
