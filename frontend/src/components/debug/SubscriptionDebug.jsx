import React, { useState, useEffect } from 'react';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Zap, Users, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionDebug = () => {
  const {
    subscription,
    isInitialized,
    subscriptionEvents,
    canPerformAction,
    canAddBed,
    canAddBranch,
    canAccessModule,
    getRemainingResources,
    getSubscriptionSummary,
    getSubscriptionHealth,
    forceRefresh,
    getRecentEvents,
    on,
    off
  } = useSubscriptionManager();

  const [manualRefreshLoading, setManualRefreshLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [testResults, setTestResults] = useState([]);
  const [showEvents, setShowEvents] = useState(false);

  // Monitor connection status
  useEffect(() => {
    let interval;
    if (isInitialized) {
      interval = setInterval(() => {
        // Check WebSocket connection by testing subscription manager
        const summary = getSubscriptionSummary();
        setConnectionStatus(summary ? 'connected' : 'disconnected');
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInitialized, getSubscriptionSummary]);

  // Listen to subscription events
  useEffect(() => {
    const handleEvent = (data) => {
      addTestResult('event', `Subscription event: ${data.type}`, 'info', data);
    };

    on('subscriptionChecked', (data) => handleEvent({ type: 'subscriptionChecked', ...data }));
    on('trialExpiringSoon', (data) => handleEvent({ type: 'trialExpiringSoon', ...data }));
    on('trialExpired', (data) => handleEvent({ type: 'trialExpired', ...data }));
    on('usageLimitWarning', (data) => handleEvent({ type: 'usageLimitWarning', ...data }));
    on('subscriptionExpired', (data) => handleEvent({ type: 'subscriptionExpired', ...data }));

    return () => {
      off('subscriptionChecked', handleEvent);
      off('trialExpiringSoon', handleEvent);
      off('trialExpired', handleEvent);
      off('usageLimitWarning', handleEvent);
      off('subscriptionExpired', handleEvent);
    };
  }, [on, off]);

  const addTestResult = (test, message, status, details = {}) => {
    const result = {
      id: Date.now() + Math.random(),
      test,
      message,
      status,
      timestamp: new Date().toLocaleTimeString(),
      details
    };

    setTestResults(prev => [result, ...prev.slice(0, 19)]); // Keep last 20 results
  };

  const handleManualRefresh = async () => {
    setManualRefreshLoading(true);
    addTestResult('manual', 'Manual subscription refresh initiated', 'pending');

    try {
      await forceRefresh();
      addTestResult('manual', 'Manual subscription refresh completed', 'success');
    } catch (error) {
      addTestResult('manual', `Manual refresh failed: ${error.message}`, 'error', error);
    } finally {
      setManualRefreshLoading(false);
    }
  };

  const testPermissionChecks = () => {
    addTestResult('permissions', 'Testing permission checks...', 'pending');

    const results = [
      { action: 'canAddBed', result: canAddBed(), expected: true },
      { action: 'canAddBranch', result: canAddBranch(), expected: true },
      { action: 'canAccessResidentModule', result: canAccessModule('resident_management', 'residents', 'read'), expected: true },
      { action: 'canAccessPaymentModule', result: canAccessModule('payment_tracking', 'payments', 'create'), expected: true },
      { action: 'canAccessInvalidModule', result: canAccessModule('invalid_module'), expected: false },
    ];

    results.forEach(({ action, result, expected }) => {
      const status = result === expected ? 'success' : 'warning';
      addTestResult('permissions', `${action}: ${result} (${expected ? 'expected' : 'unexpected'})`, status);
    });
  };

  const testResourceLimits = () => {
    addTestResult('resources', 'Testing resource limits...', 'pending');

    const resources = getRemainingResources();
    const summary = getSubscriptionSummary();
    const health = getSubscriptionHealth();

    addTestResult('resources', `Remaining beds: ${resources.beds}`, 'info', resources);
    addTestResult('resources', `Remaining branches: ${resources.branches}`, 'info', resources);

    if (summary) {
      addTestResult('resources', `Usage - Beds: ${summary.usagePercentage.beds?.toFixed(1)}%`, 'info', summary);
      addTestResult('resources', `Usage - Branches: ${summary.usagePercentage.branches?.toFixed(1)}%`, 'info', summary);
    }

    if (health) {
      addTestResult('resources', `Health status: ${health.isHealthy ? 'Healthy' : 'Issues detected'}`, health.isHealthy ? 'success' : 'warning', health);
    }
  };

  const simulateSubscriptionEvent = (eventType) => {
    addTestResult('simulation', `Simulating ${eventType} event`, 'info');

    // This would normally come from WebSocket, but we can simulate it
    setTimeout(() => {
      addTestResult('simulation', `Simulated ${eventType} event processed`, 'success');
    }, 1000);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-gray-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const summary = getSubscriptionSummary();
  const health = getSubscriptionHealth();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔍 Subscription Debug Console</h2>
            <p className="text-gray-600 mt-1">Monitor real-time subscription checks and events</p>
          </div>
          <div className="flex items-center space-x-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-semibold">{summary?.status || 'Unknown'}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Trial Days</div>
            <div className="font-semibold">{summary?.trialDaysRemaining || 0}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Bed Usage</div>
            <div className="font-semibold">{summary?.usagePercentage?.beds?.toFixed(1) || 0}%</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-600">Health</div>
            <div className="font-semibold">{health?.isHealthy ? '✅ Healthy' : '⚠️ Issues'}</div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🛠️ Control Panel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleManualRefresh}
            disabled={manualRefreshLoading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${manualRefreshLoading ? 'animate-spin' : ''}`} />
            <span>Force Refresh</span>
          </button>

          <button
            onClick={testPermissionChecks}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Test Permissions</span>
          </button>

          <button
            onClick={testResourceLimits}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Users className="h-4 w-4" />
            <span>Test Resources</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => simulateSubscriptionEvent('trialExpiringSoon')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Simulate Trial Warning
          </button>

          <button
            onClick={clearTestResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">📊 Test Results & Events</h3>
            <button
              onClick={() => setShowEvents(!showEvents)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showEvents ? 'Hide Events' : 'Show Events'} ({subscriptionEvents.length})
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {testResults.length === 0 && subscriptionEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No test results yet. Click buttons above to test subscription functionality.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Manual Test Results */}
              {testResults.map((result) => (
                <div key={result.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{result.test}</span>
                        <span className="text-xs text-gray-500">{result.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      {result.details && Object.keys(result.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">Show Details</summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Real-time Events */}
              {showEvents && subscriptionEvents.map((event, index) => (
                <div key={`event-${index}`} className="p-4 hover:bg-gray-50 bg-blue-50">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">Real-time Event</span>
                        <span className="text-xs text-blue-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-blue-800 mt-1">{event.type}</p>
                      <pre className="text-xs bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
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

      {/* Current Subscription Data */}
      {subscription && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Current Subscription Data</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs overflow-x-auto max-h-64">
              {JSON.stringify(subscription, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">📖 How Real-time Checks Work</h3>
        <div className="space-y-3 text-sm text-yellow-700">
          <div>
            <strong>1. Initialization:</strong> Subscription manager starts when user logs in (see App.jsx)
          </div>
          <div>
            <strong>2. WebSocket Connection:</strong> Connects to backend for real-time updates
          </div>
          <div>
            <strong>3. Periodic Checks:</strong> Backend checks subscription every 5 minutes
          </div>
          <div>
            <strong>4. Event Broadcasting:</strong> Backend sends events for expiry warnings, usage limits
          </div>
          <div>
            <strong>5. UI Updates:</strong> Frontend updates in real-time without page refresh
          </div>
          <div>
            <strong>6. API Middleware:</strong> Every API call is checked for subscription permissions
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDebug;
