import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword, clearError, clearSuccess } from '../../store/slices/authSlice';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Redux state
  const { isResettingPassword, error, resetPasswordSuccess } = useSelector(
    (state) => state.auth
  );

  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({});

  // Get token from URL
  const token = searchParams.get('token');

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  // Handle success message
  useEffect(() => {
    if (resetPasswordSuccess) {
      toast.success(resetPasswordSuccess);
      dispatch(clearSuccess());
      navigate('/login');
    }
  }, [resetPasswordSuccess, dispatch, navigate]);

  // Handle error message
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update password strength when password changes
    if (name === 'password') {
      setPasswordStrength(authService.validatePassword(value));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.isValid) {
      newErrors.password = 'Password does not meet requirements';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(resetPassword({ token, password: formData.password })).unwrap();
    } catch (error) {
      // Error is handled by the Redux slice
      console.error('Password reset failed:', error);
    }
  };

  // Password strength indicator component
  const PasswordStrengthIndicator = () => {
    if (!formData.password) return null;

    const { isValid, errors } = passwordStrength;
    const requirements = [
      { key: 'minLength', label: 'At least 8 characters', met: !errors.minLength },
      { key: 'hasUpperCase', label: 'One uppercase letter', met: !errors.hasUpperCase },
      { key: 'hasLowerCase', label: 'One lowercase letter', met: !errors.hasLowerCase },
      { key: 'hasNumbers', label: 'One number', met: !errors.hasNumbers },
      { key: 'hasSpecialChar', label: 'One special character', met: !errors.hasSpecialChar },
    ];

    return (
      <div className="mt-2 sm:mt-3 space-y-1">
        <p className="text-xs sm:text-sm text-gray-600 font-medium">Password requirements:</p>
        {requirements.map((req) => (
          <div key={req.key} className="flex items-center text-xs sm:text-sm">
            {req.met ? (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-2 flex-shrink-0" />
            )}
            <span className={req.met ? 'text-green-600' : 'text-red-600'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm sm:text-base text-blue-600 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Back to login
          </Link>
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <span className="text-white font-bold text-lg sm:text-xl">PG</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Reset Password
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 border rounded-xl text-sm sm:text-base placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator />
              {errors.password && (
                <div className="flex items-center mt-2 text-xs sm:text-sm text-red-600">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-4 border rounded-xl text-sm sm:text-base placeholder-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center mt-2 text-xs sm:text-sm text-red-600">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={isResettingPassword}
              className="group relative w-full flex justify-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isResettingPassword ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                  <span className="text-sm sm:text-base">Resetting password...</span>
                </div>
              ) : (
                <span className="text-sm sm:text-base">Reset Password</span>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-semibold text-yellow-900 mb-2">
                Security Notice
              </h3>
              <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
                <li>• This link will expire in 15 minutes</li>
                <li>• Use a strong, unique password</li>
                <li>• Don't share your password with anyone</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-gray-500">
          © 2025 PG Maintenance System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword; 