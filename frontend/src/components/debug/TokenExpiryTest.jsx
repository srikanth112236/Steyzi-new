import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Shield, RefreshCw, LogOut, CheckCircle, XCircle } from 'lucide-react';
import TokenExpiryModal from '../common/TokenExpiryModal';
import { useTokenExpiry } from '../../hooks/useTokenExpiry';
import authService from '../../services/auth.service';

/**
 * Token Expiry Test Component
 * Provides a comprehensive test interface for token expiry functionality
 */
const TokenExpiryTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  
  const {
    showExpiryModal,
    closeExpiryModal,
    handleRefreshToken,
    checkTokenExpiry,
    isTokenExpired
  } = useTokenExpiry();

  const addTestResult = (test, status, message, details = {}) => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const simulateTokenExpiry = () => {
    addTestResult(
      'Simulate Token Expiry',
      'info',
      'Simulating token expiry event...',
      { action: 'manual_simulation' }
    );
    
    // Dispatch token expiry event
    const tokenExpiryEvent = new CustomEvent('tokenExpired', {
      detail: {
        message: 'Test: Your session has expired. Please log in again.',
        reason: 'test_simulation',
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(tokenExpiryEvent);
    
    setShowModal(true);
  };

  const simulateApiError = () => {
    addTestResult(
      'Simulate API Error',
      'info',
      'Simulating 401 API error...',
      { action: 'api_error_simulation' }
    );
    
    // Dispatch API error event
    const apiErrorEvent = new CustomEvent('apiError', {
      detail: {
        status: 401,
        message: 'Invalid token',
        error: { message: 'Invalid token.' },
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(apiErrorEvent);
  };

  const testTokenValidation = () => {
    addTestResult(
      'Token Validation Test',
      'info',
      'Testing token validation...',
      { action: 'token_validation' }
    );
    
    try {
      const isValid = authService.isAuthenticated();
      const token = authService.getAccessToken();
      
      if (token) {
        // Decode token to check expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const isExpired = payload.exp < (currentTime - 30);
        
        addTestResult(
          'Token Validation Test',
          isExpired ? 'error' : 'success',
          `Token is ${isExpired ? 'expired' : 'valid'}`,
          {
            tokenExists: !!token,
            isValid,
            isExpired,
            expiresAt: new Date(payload.exp * 1000).toISOString(),
            currentTime: new Date(currentTime * 1000).toISOString()
          }
        );
      } else {
        addTestResult(
          'Token Validation Test',
          'warning',
          'No token found',
          { tokenExists: false }
        );
      }
    } catch (error) {
      addTestResult(
        'Token Validation Test',
        'error',
        `Token validation failed: ${error.message}`,
        { error: error.message }
      );
    }
  };

  const testRefreshToken = async () => {
    setIsRunningTest(true);
    addTestResult(
      'Refresh Token Test',
      'info',
      'Testing token refresh...',
      { action: 'refresh_test' }
    );
    
    try {
      const success = await handleRefreshToken();
      addTestResult(
        'Refresh Token Test',
        success ? 'success' : 'error',
        success ? 'Token refreshed successfully' : 'Token refresh failed',
        { success }
      );
    } catch (error) {
      addTestResult(
        'Refresh Token Test',
        'error',
        `Token refresh failed: ${error.message}`,
        { error: error.message }
      );
    } finally {
      setIsRunningTest(false);
    }
  };

  const testManualTokenExpiry = () => {
    addTestResult(
      'Manual Token Expiry Test',
      'info',
      'Manually triggering token expiry check...',
      { action: 'manual_check' }
    );
    
    try {
      const isExpired = checkTokenExpiry();
      addTestResult(
        'Manual Token Expiry Test',
        isExpired ? 'error' : 'success',
        `Token expiry check: ${isExpired ? 'expired' : 'valid'}`,
        { isExpired }
      );
    } catch (error) {
      addTestResult(
        'Manual Token Expiry Test',
        'error',
        `Token expiry check failed: ${error.message}`,
        { error: error.message }
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningTest(true);
    clearResults();
    
    addTestResult(
      'Test Suite',
      'info',
      'Starting comprehensive token expiry tests...',
      { action: 'test_suite_start' }
    );
    
    // Test 1: Token Validation
    testTokenValidation();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Manual Token Expiry Check
    testManualTokenExpiry();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Token Refresh (if token exists)
    if (authService.getAccessToken()) {
      await testRefreshToken();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test 4: Simulate Token Expiry Event
    simulateTokenExpiry();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 5: Simulate API Error
    simulateApiError();
    
    addTestResult(
      'Test Suite',
      'success',
      'All tests completed!',
      { action: 'test_suite_complete' }
    );
    
    setIsRunningTest(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Token Expiry Test Suite</h1>
              <p className="text-gray-600">Comprehensive testing for token expiry functionality</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
              <div className="text-sm text-blue-700">Total Tests</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {testResults.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {testResults.filter(r => r.status === 'warning').length}
              </div>
              <div className="text-sm text-yellow-700">Warnings</div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={runAllTests}
              disabled={isRunningTest}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTest ? 'animate-spin' : ''}`} />
              <span>{isRunningTest ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
            
            <button
              onClick={testTokenValidation}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <Shield className="w-4 h-4" />
              <span>Test Token Validation</span>
            </button>
            
            <button
              onClick={testManualTokenExpiry}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <Clock className="w-4 h-4" />
              <span>Test Manual Check</span>
            </button>
            
            <button
              onClick={testRefreshToken}
              disabled={isRunningTest}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Test Token Refresh</span>
            </button>
            
            <button
              onClick={simulateTokenExpiry}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors border border-orange-200"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Token Expiry</span>
            </button>
            
            <button
              onClick={simulateApiError}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border border-red-200"
            >
              <XCircle className="w-4 h-4" />
              <span>Simulate API Error</span>
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={clearResults}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Results
            </button>
            
            <div className="text-sm text-gray-500">
              Current Token Status: {isTokenExpired ? 'Expired' : 'Valid'}
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tests run yet. Click "Run All Tests" to start testing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{result.test}</h3>
                        <span className="text-xs opacity-75">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{result.message}</p>
                      {Object.keys(result.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer opacity-75">
                            View Details
                          </summary>
                          <pre className="text-xs mt-2 bg-black/10 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Test Modal */}
      {showModal && (
        <TokenExpiryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRefresh={handleRefreshToken}
        />
      )}

      {/* Actual Token Expiry Modal */}
      <TokenExpiryModal
        isOpen={showExpiryModal}
        onClose={closeExpiryModal}
        onRefresh={handleRefreshToken}
      />
    </div>
  );
};

export default TokenExpiryTest;
