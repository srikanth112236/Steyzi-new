import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const RoleRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = () => {
      console.log('🔄 RoleRedirect: Starting redirect check...');
      console.log('👤 User:', user ? { id: user._id, email: user.email, role: user?.role } : 'No user');

      if (!user || !user?.role) {
        console.log('🚫 RoleRedirect: No user or role found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('🎯 RoleRedirect: User authenticated, checking role:', user?.role);

      // Redirect based on role - no onboarding checks
      switch (user?.role) {
        case 'admin':
          console.log('👨‍💼 RoleRedirect: Redirecting admin to dashboard');
          navigate('/admin/dashboard');
          break;
        case 'superadmin':
          console.log('👑 RoleRedirect: Redirecting superadmin to dashboard');
          navigate('/superadmin/dashboard');
          break;
        case 'support':
          console.log('🛠️ RoleRedirect: Redirecting support staff to dashboard');
          navigate('/support/dashboard');
          break;
        case 'user':
          console.log('👤 RoleRedirect: Redirecting user to dashboard');
          navigate('/user/dashboard'); // Future user dashboard
          break;
        default:
          console.warn('⚠️ RoleRedirect: Unknown user role:', user?.role);
          navigate('/login');
          break;
      }
    };

    checkAndRedirect();
  }, [user, navigate]);

  // Show loading while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
        {user && (
          <div className="mt-4 text-sm text-gray-500">
            <p>User Role: {user?.role}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleRedirect; 