import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Shield, Building2, CheckCircle, Sparkles } from 'lucide-react';
import { forgotPassword } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send plain string email to API to satisfy Joi schema
      await dispatch(forgotPassword(email)).unwrap();
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
        {/* Animated gradient circles */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-300/30 to-indigo-400/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="w-full max-w-md sm:max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xl border border-cyan-200/50 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)] text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6"
            >
              <CheckCircle className="h-8 w-8 text-green-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Check Your Email
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 ring-1 ring-inset ring-cyan-200 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Instructions sent
            </div>
            
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to{' '}
              <span className="font-medium text-gray-900">{email}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the reset link in the email</li>
                <li>• Create a new secure password</li>
                <li>• Login with your new password</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                to="/admin/login"
                className="inline-flex items-center justify-center w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Login
              </Link>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Try different email address
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
        {/* Animated gradient circles */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-300/30 to-indigo-400/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-md sm:max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xl border border-cyan-200/50 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)]"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 mb-4"
              >
                <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
                Reset Admin Password
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Enter your admin email to receive reset instructions
              </p>
            </div>

            {/* Admin Badge */}
            <div className="mb-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-200/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-5 w-5 text-cyan-600" />
                <span className="font-medium text-cyan-800">PG Administrator Password Reset</span>
              </div>
            </div>

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                  Admin Email Address
                </label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full rounded-xl border-0 bg-gray-50 text-gray-900 placeholder-gray-500 pl-10 pr-3 py-3 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-cyan-400 focus:bg-white transition-all"
                    placeholder="Enter your admin email"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || loading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white py-3 px-4 font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading || loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-transparent" />
                    <span>Sending Reset Email…</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </motion.button>
            </form>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <Link
                to="/admin/login"
                className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Admin Login
              </Link>
            </div>

            {/* Info Box */}
            <div className="mt-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-200/50 p-4">
              <h3 className="font-medium text-cyan-900 mb-2">Security Information</h3>
              <ul className="text-sm text-cyan-800 space-y-1">
                <li>• Only registered PG admins can reset passwords</li>
                <li>• Reset links expire after 1 hour for security</li>
                <li>• Contact support if you don't receive the email</li>
              </ul>
            </div>

            {/* Support */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <a href="mailto:support@pgmaintenance.com" className="text-cyan-600 hover:text-cyan-700">
                  Contact Support
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
  );
};

export default AdminForgotPassword; 