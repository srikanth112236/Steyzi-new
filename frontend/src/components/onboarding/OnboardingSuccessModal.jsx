import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { resetOnboarding } from '../../store/slices/onboardingSlice';

// Icons
import CheckCircleIcon from '../ui/icons/CheckCircleIcon';
import RocketIcon from '../ui/icons/RocketIcon';

const OnboardingSuccessModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleContinueToDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = async () => {
    try {
      // Dispatch logout action
      await dispatch(logout());
      
      // Reset onboarding state
      dispatch(resetOnboarding());
      
      // Redirect to login
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center relative">
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="w-24 h-24 text-green-500" />
          <RocketIcon className="w-16 h-16 text-blue-500 -ml-8 mt-4" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Congratulations! 🎉
        </h2>
        
        <p className="text-gray-600 mb-6">
          You have successfully set up your Paying Guest (PG) management system. 
          Your PG configuration and default branch are now in place.
        </p>
        
        <div className="flex justify-center space-x-4">
          <button 
            onClick={handleContinueToDashboard}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Dashboard
          </button>
          
          <button 
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Need help? Contact our support team at support@steyzi.com
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccessModal;
