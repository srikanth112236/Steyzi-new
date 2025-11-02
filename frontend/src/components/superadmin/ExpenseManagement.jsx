import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import ExpenseStatistics from './ExpenseStatistics';
import ExpenseSettings from './ExpenseSettings';
import api from '../../services/api';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1);
    // Optionally switch to list tab
    // setActiveTab('list');
  };

  const handleExpenseUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExpenseDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-600 mt-2">Track and manage all expenses for the organization</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Expense List</TabsTrigger>
          <TabsTrigger value="add">Add Expense</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <ExpenseList
            key={refreshKey}
            onExpenseUpdated={handleExpenseUpdated}
            onExpenseDeleted={handleExpenseDeleted}
          />
        </TabsContent>

        <TabsContent value="add" className="mt-6">
          <ExpenseForm
            onExpenseAdded={handleExpenseAdded}
            onCancel={() => setActiveTab('list')}
          />
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <ExpenseStatistics key={refreshKey} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ExpenseSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpenseManagement;

