import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'expo-router';
import { ROLES } from '@/constants/roles';

import SuperAdminDashboardScreen from '@/screens/superadmin/SuperAdminDashboardScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import SupportDashboardScreen from '@/screens/support/SupportDashboardScreen';
import SalesDashboardScreen from '@/screens/sales/SalesDashboardScreen';
import SubSalesDashboardScreen from '@/screens/sub_sales/SubSalesDashboardScreen';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Redirect href="/login" />;
  }

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return <SuperAdminDashboardScreen />;
    case ROLES.ADMIN:
      return <AdminDashboardScreen />;
    case ROLES.SUPPORT:
      return <SupportDashboardScreen />;
    case ROLES.SALES:
      return <SalesDashboardScreen />;
    case ROLES.SUB_SALES:
      return <SubSalesDashboardScreen />;
    default:
      return <Redirect href="/login" />;
  }
}