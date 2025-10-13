import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Mail, User, Lock } from 'lucide-react';
import { verifyEmail, clearError, clearSuccess } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const EmailVerification = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Redux state
  const { isVerifyingEmail, error, verifyEmailSuccess } = useSelector(
    (state) => state.auth
  );

  // Get credentials from URL
  const email = searchParams.get('email');
  const password = searchParams.get('password');
  const firstName = searchParams.get('firstName');
  const lastName = searchParams.get('lastName');

  // UI state
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if no credentials
  useEffect(() => {
    if (!email || !password || !firstName || !lastName) {
      toast.error('Invalid verification link. Please check your email for the correct link.');
      navigate('/login');
    }
  }, [email, password, firstName, lastName, navigate]);

  // Handle success message
  useEffect(() => {
    if (verifyEmailSuccess) {
      toast.success(verifyEmailSuccess);
      dispatch(clearSuccess());
      setVerificationStatus('success');
    }
  }, [verifyEmailSuccess, dispatch]);

  // Handle error message
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
      setVerificationStatus('error');
    }
  }, [error, dispatch]);

  // Handle email verification
  const handleVerification = async () => {
    if (!email || !password || !firstName || !lastName) {
      setVerificationStatus('error');
      return;
    }

    setIsProcessing(true);
    try {
      await dispatch(verifyEmail({ email, password, firstName, lastName })).unwrap();
      setVerificationStatus('success');
    } catch (error) {
      console.error('Email verification failed:', error);
      setVerificationStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-verify on component mount
  useEffect(() => {
    if (email && password && firstName && lastName && !isProcessing && verificationStatus === 'pending') {
      handleVerification();
    }
  }, [email, password, firstName, lastName]);

  // Render different states
  const renderContent = () => {
    switch (verificationStatus) {
      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Email Verified Successfully!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              Your email has been verified successfully. You can now log in to your account and access all features.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Continue to Login
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't verify your email. This could be because the credentials are incorrect or the account doesn't exist.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
              >
                Back to Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Register New Account
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Verifying Your Email
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              Please wait while we verify your email address...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        );
    }
  };

  if (!email || !password || !firstName || !lastName) {
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Email Verification
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
            {verificationStatus === 'pending' && 'Verifying your email address...'}
            {verificationStatus === 'success' && 'Your email has been verified successfully!'}
            {verificationStatus === 'error' && 'Email verification failed. Please try again.'}
          </p>
        </div>

        {/* Verification Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {renderContent()}
        </div>

        {/* Additional Info */}
        {verificationStatus === 'success' && (
          <div className="mt-6 sm:mt-8 text-center">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-2">
                What's Next?
              </h3>
              <ul className="text-xs sm:text-sm text-green-800 space-y-1">
                <li>• You can now log in to your account</li>
                <li>• Access all PG Maintenance features</li>
                <li>• Manage your profile and settings</li>
                <li>• Start using the system immediately</li>
              </ul>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="mt-6 sm:mt-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-5">
              <h3 className="text-sm sm:text-base font-semibold text-yellow-900 mb-2">
                Need Help?
              </h3>
              <ul className="text-xs sm:text-sm text-yellow-800 space-y-1">
                <li>• Check if the credentials are correct</li>
                <li>• Make sure you're using the link from your email</li>
                <li>• Contact support if issues persist</li>
                <li>• Register a new account if needed</li>
              </ul>
            </div>
          </div>
        )}
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

export default EmailVerification; 