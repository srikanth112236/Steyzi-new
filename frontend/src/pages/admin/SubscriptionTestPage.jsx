import React from 'react';
import { useSelector } from 'react-redux';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';

const SubscriptionTestPage = () => {
  const { user, subscription } = useSelector((state) => state.auth);
  const {
    subscription: hookSubscription,
    isInitialized,
    subscriptionEvents,
    canPerformAction,
    canAddBed,
    canAddBranch,
    canAccessModule,
    getRemainingResources,
    getSubscriptionSummary,
    getSubscriptionHealth,
    forceRefresh
  } = useSubscriptionManager();

  const reduxSubscription = subscription;
  const hookSubscriptionData = hookSubscription;

  const testResults = [
    {
      name: 'Redux Auth Subscription',
      data: reduxSubscription,
      status: reduxSubscription ? 'success' : 'error'
    },
    {
      name: 'Hook Subscription',
      data: hookSubscriptionData,
      status: hookSubscriptionData ? 'success' : 'error'
    },
    {
      name: 'Subscription Summary',
      data: getSubscriptionSummary(),
      status: getSubscriptionSummary() ? 'success' : 'error'
    },
    {
      name: 'Subscription Health',
      data: getSubscriptionHealth(),
      status: getSubscriptionHealth() ? 'success' : 'error'
    },
    {
      name: 'Remaining Resources',
      data: getRemainingResources(),
      status: 'info'
    },
    {
      name: 'Permission Tests',
      data: {
        canAddBed: canAddBed(),
        canAddBranch: canAddBranch(),
        canAccessResidents: canAccessModule('resident_management', 'residents', 'read'),
        canAccessPayments: canAccessModule('payment_tracking', 'payments', 'create')
      },
      status: 'info'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Subscription Debug Page</h1>
        <p className="text-gray-600">Test and debug subscription system functionality</p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm text-gray-600">Initialized</div>
            <div className="font-semibold">{isInitialized ? '✅ Yes' : '❌ No'}</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm text-gray-600">Events Count</div>
            <div className="font-semibold">{subscriptionEvents.length}</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm text-gray-600">Redux Sub</div>
            <div className="font-semibold">{reduxSubscription ? '✅ Yes' : '❌ No'}</div>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <div className="text-sm text-gray-600">Hook Sub</div>
            <div className="font-semibold">{hookSubscriptionData ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testResults.map((test, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className={`font-semibold ${getStatusColor(test.status)}`}>
                {getStatusIcon(test.status)} {test.name}
              </h3>
            </div>
            <div className="p-4">
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-64">
                {JSON.stringify(test.data, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">📊 Recent Subscription Events</h3>
            <button
              onClick={forceRefresh}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Force Refresh
            </button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {subscriptionEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No subscription events yet. Events will appear here as the subscription manager runs checks.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {subscriptionEvents.slice(0, 20).map((event, index) => (
                <div key={`event-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="text-sm font-mono text-gray-500 min-w-0">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{event.type}</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raw Redux State */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold mb-4">🔄 Raw Redux Auth State</h3>
        <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto max-h-64">
          {JSON.stringify({ user, subscription }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SubscriptionTestPage;
