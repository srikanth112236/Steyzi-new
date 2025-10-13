import React from 'react';
import { useSelector } from 'react-redux';
import { selectSubscription, selectUser } from '../../store/slices/authSlice';
import { useSubscription } from '../../utils/subscriptionUtils';
import PermissionIndicator from '../common/PermissionIndicator';
import PermissionButton from '../common/PermissionButton';

// Mock navigation items for testing (similar to AdminLayout)
const mockNavigationItems = [
  { name: 'Dashboard', href: '/admin' },
  { name: 'My PG', href: '/admin/pg-management' },
  { name: 'Resident Management', hasDropdown: true, dropdownItems: [
    { name: 'All Residents', href: '/admin/residents' },
    { name: 'Offboarding', href: '/admin/offboarding' }
  ]},
  { name: 'Payments', href: '/admin/payments' },
  { name: 'Tickets', href: '/admin/tickets' },
  { name: 'Reports', href: '/admin/reports' },
  { name: 'QR Codes', href: '/admin/qr-management' },
  { name: 'Branch Activities', href: '/admin/branch-activities' }
];

const SubscriptionTest = () => {
  const subscription = useSelector(selectSubscription);
  const user = useSelector(selectUser);
  const subscriptionUtils = useSubscription();

  // Filter navigation items based on subscription
  const getFilteredNavItems = () => {
    return mockNavigationItems.filter(item => {
      if (['Dashboard', 'My PG'].includes(item.name)) return true;
      if (item.name === 'Resident Management') return subscriptionUtils.hasModule('resident_management');
      if (item.name === 'Payments') return subscriptionUtils.hasModule('payment_tracking');
      if (item.name === 'Tickets') return subscriptionUtils.hasModule('ticket_system');
      if (item.name === 'Reports') return subscriptionUtils.hasModule('analytics_reports');
      if (item.name === 'QR Codes') return subscriptionUtils.hasModule('qr_code_payments');
      if (item.name === 'Branch Activities') return subscriptionUtils.allowsMultipleBranches();
      return true;
    }).map(item => {
      if (item.name === 'Resident Management' && item.hasDropdown) {
        return {
          ...item,
          dropdownItems: item.dropdownItems.filter(subItem =>
            subscriptionUtils.hasModule('resident_management')
          )
        };
      }
      return item;
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Debug Info</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">User Info</h3>
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {user?._id || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Role:</strong> {user?.role || 'N/A'}</p>
            <p><strong>PG ID:</strong> {user?.pgId || 'N/A'}</p>
          </div>
        </div>

        {/* Subscription Data */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Subscription Data</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Status:</strong> {subscription?.status || 'No subscription'}</p>
            <p><strong>Plan:</strong> {subscription?.plan?.planName || 'Free Plan'}</p>
            <p><strong>Plan ID:</strong> {subscription?.planId || 'N/A'}</p>
            <p><strong>Max Beds:</strong> {subscription?.restrictions?.maxBeds || 'N/A'}</p>
            <p><strong>Max Branches:</strong> {subscription?.restrictions?.maxBranches || 'N/A'}</p>
          </div>
        </div>

        {/* Usage Data */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">Usage Data</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Beds Used:</strong> {subscription?.usage?.bedsUsed || 0}</p>
            <p><strong>Branches Used:</strong> {subscription?.usage?.branchesUsed || 0}</p>
            <p><strong>Remaining Beds:</strong> {subscriptionUtils.getRemainingBeds()}</p>
            <p><strong>Remaining Branches:</strong> {subscriptionUtils.getRemainingBranches()}</p>
          </div>
        </div>

        {/* Utility Tests */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Utility Tests</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Is Subscribed:</strong> {subscriptionUtils.isSubscribed() ? 'Yes' : 'No'}</p>
            <p><strong>Is Free Plan:</strong> {subscriptionUtils.isFreePlan() ? 'Yes' : 'No'}</p>
            <p><strong>Allows Multiple Branches:</strong> {subscriptionUtils.allowsMultipleBranches() ? 'Yes' : 'No'}</p>
            <p><strong>Can Add Bed:</strong> {subscriptionUtils.canAddBeds(subscription?.usage?.bedsUsed || 0, 1) ? 'Yes' : 'No'}</p>
            <p><strong>Can Add Branch:</strong> {subscriptionUtils.canAddBranches(subscription?.usage?.branchesUsed || 0, 1) ? 'Yes' : 'No'}</p>
            <p><strong>Has Analytics:</strong> {subscriptionUtils.hasModule('analytics_reports') ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Filtered Navigation */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Filtered Navigation Items</h3>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="space-y-2">
            {getFilteredNavItems().map((item, index) => (
              <div key={index} className="border-b border-blue-200 pb-2 last:border-b-0">
                <div className="font-medium text-blue-900">{item.name}</div>
                {item.href && <div className="text-sm text-blue-700">{item.href}</div>}
                {item.hasDropdown && item.dropdownItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.dropdownItems.map((subItem, subIndex) => (
                      <div key={subIndex} className="text-sm text-blue-600">
                        • {subItem.name} ({subItem.href})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Components Demo */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Permission Components Demo</h3>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-purple-900 mb-2">Residents Permission Indicator:</h4>
              <PermissionIndicator
                module="resident_management"
                submodule="residents"
                actions={['create', 'read', 'update', 'delete']}
                showLabels={true}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium text-purple-900 mb-2">Test Permission Buttons:</h4>
              <div className="flex flex-wrap gap-2">
                <PermissionButton
                  module="resident_management"
                  submodule="residents"
                  action="create"
                  variant="success"
                  size="sm"
                >
                  Create Resident
                </PermissionButton>
                <PermissionButton
                  module="resident_management"
                  submodule="residents"
                  action="update"
                  variant="warning"
                  size="sm"
                >
                  Edit Resident
                </PermissionButton>
                <PermissionButton
                  module="resident_management"
                  submodule="residents"
                  action="delete"
                  variant="danger"
                  size="sm"
                >
                  Delete Resident
                </PermissionButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Permissions */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Module Permissions Details</h3>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="space-y-4">
            {subscription?.restrictions?.modules?.map((module, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-900">{module.moduleName}</span>
                  <span className={`px-2 py-1 text-xs rounded ${module.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {module.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {module.permissions && Object.keys(module.permissions).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(module.permissions).map(([submodule, perms]) => (
                      <div key={submodule} className="bg-gray-50 rounded p-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">{submodule}:</div>
                        <div className="flex space-x-3 text-xs">
                          <span className={perms.create ? 'text-green-600' : 'text-red-600'}>
                            Create: {perms.create ? '✓' : '✗'}
                          </span>
                          <span className={perms.read ? 'text-green-600' : 'text-red-600'}>
                            Read: {perms.read ? '✓' : '✗'}
                          </span>
                          <span className={perms.update ? 'text-green-600' : 'text-red-600'}>
                            Update: {perms.update ? '✓' : '✗'}
                          </span>
                          <span className={perms.delete ? 'text-green-600' : 'text-red-600'}>
                            Delete: {perms.delete ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Raw Subscription Data</h3>
        <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-xs text-gray-800">
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTest;
