import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  CreditCard,
  TrendingUp,
  Activity,
  Calculator,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  Zap,
  Eye,
  Edit,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Self-Service API service
const selfServiceApi = {
  getPortalData: async () => {
    const response = await fetch('/api/advanced/subscription/self-service', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  upgradePlan: async (newPlanId) => {
    const response = await fetch('/api/users/select-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ planId: newPlanId })
    });
    return response.json();
  }
};

const SelfServicePortal = () => {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoading(true);
      const result = await selfServiceApi.getPortalData();

      if (result.success) {
        setPortalData(result.data);
      } else {
        toast.error(result.message || 'Failed to load portal data');
      }
    } catch (error) {
      console.error('Portal data error:', error);
      toast.error('Failed to load self-service portal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlanId) => {
    try {
      setUpgrading(true);
      const result = await selfServiceApi.upgradePlan(newPlanId);

      if (result.success) {
        toast.success('Plan upgrade initiated successfully!');
        // Reload portal data to reflect changes
        await loadPortalData();
      } else {
        toast.error(result.message || 'Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!portalData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Portal</h2>
          <p className="text-gray-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  const { currentSubscription, availablePlans, usageData, costBreakdown } = portalData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Self-Service Portal</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your subscription, monitor usage, and optimize costs
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadPortalData}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Subscription Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                Current Subscription
              </h3>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                currentSubscription.status === 'active' ? 'bg-green-100 text-green-800' :
                currentSubscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentSubscription.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {currentSubscription.plan?.planName}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Billing: <span className="font-medium capitalize">{currentSubscription.billingCycle}</span></div>
                  <div>Beds: <span className="font-medium">{currentSubscription.totalBeds}</span></div>
                  <div>Branches: <span className="font-medium">{currentSubscription.totalBranches}</span></div>
                  <div>Status: <span className="font-medium capitalize">{currentSubscription.status}</span></div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">
                  {currentSubscription.status === 'trial' ? 'Trial Ends' : 'Next Billing Date'}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">
                  {formatDate(currentSubscription.endDate)}
                </div>

                {currentSubscription.status === 'trial' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {Math.ceil((new Date(currentSubscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usage Dashboard Preview */}
          {usageData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Usage Overview
                </h3>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {usageData.currentUsage.residents.active}
                  </div>
                  <div className="text-sm text-gray-600">Active Residents</div>
                  <div className="text-xs text-gray-500">
                    of {usageData.limits.beds.allowed} beds
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {usageData.currentUsage.beds.utilizationRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Bed Utilization</div>
                  <div className="text-xs text-gray-500">
                    {usageData.currentUsage.beds.occupied}/{usageData.currentUsage.beds.total} occupied
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(usageData.currentUsage.payments.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-600">This Month</div>
                  <div className="text-xs text-gray-500">
                    {usageData.currentUsage.payments.transactionCount} transactions
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Available Plan Upgrades */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
              Available Upgrades
            </h3>

            <div className="space-y-4">
              {availablePlans.map((plan, index) => (
                <div key={plan._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{plan.planName}</h4>
                        {plan.isPopular && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Popular</span>}
                        {plan.isRecommended && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>}
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        {plan.planDescription}
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <span>Up to {plan.maxBedsAllowed || plan.baseBedCount} beds</span>
                        <span>{plan.modules?.length || 0} modules</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(plan.basePrice)}/{plan.billingCycle}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => handleUpgrade(plan._id)}
                        disabled={upgrading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {upgrading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                        <span>Upgrade</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Breakdown */}
          {costBreakdown && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Current Cost
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base Subscription</span>
                  <span className="text-sm font-medium">{formatCurrency(costBreakdown.baseSubscription)}</span>
                </div>

                {costBreakdown.extraBeds > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Extra Beds</span>
                    <span className="text-sm font-medium">{formatCurrency(costBreakdown.extraBedCost)}</span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Total Monthly</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(costBreakdown.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Cost Calculator</span>
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Usage Dashboard</span>
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Billing History</span>
              </button>

              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Account Settings</span>
              </button>
            </div>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our support team is here to help you with your subscription and usage questions.
            </p>

            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Settings className="h-4 w-4" />
              <span>Contact Support</span>
            </button>
          </div>

          {/* Usage Alerts */}
          {usageData?.alerts && usageData.alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Usage Alerts
              </h3>

              <div className="space-y-3">
                {usageData.alerts.slice(0, 2).map((alert, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">{alert.title}</p>
                        <p className="text-xs text-red-600">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfServicePortal;
