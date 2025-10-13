import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Shield, Building2, Sparkles } from 'lucide-react';
import { login } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // Show welcome message if present
    if (location.state?.message) {
      setShowWelcomeMessage(true);
      toast.success(location.state.message);
    }

    // Clear the navigation state
    window.history.replaceState({}, document.title);

    // Redirect if already logged in as admin
    if (user && user?.role === 'admin') {
      // Check if user needs trial activation and store flag for AdminLayout
      const needsTrial = user.subscription &&
        (!user.subscription.planId ||
         (user.subscription.billingCycle === 'trial' && new Date() > new Date(user.subscription.trialEndDate)));

      if (needsTrial) {
        // Store flag in sessionStorage for AdminLayout to check
        sessionStorage.setItem('showTrialModal', 'true');
      } else {
        // Clear any existing flag
        sessionStorage.removeItem('showTrialModal');
      }

      navigate('/'); // Let RoleRedirect handle the onboarding check
    } else if (user && user?.role !== 'admin') {
      toast.error('This login is for PG Admins only');
      navigate('/login');
    }
  }, [user, navigate, location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await dispatch(login(formData)).unwrap();

      // Check if user is admin
      if (result.user?.role !== 'admin') {
        toast.error('Access denied. This login is for PG Admins only.');
        return;
      }

      toast.success('Welcome back, Admin!');

      // Check if user needs trial activation and store flag for AdminLayout
      const needsTrial = result.user.subscription &&
        (!result.user.subscription.planId ||
         (result.user.subscription.billingCycle === 'trial' && new Date() > new Date(result.user.subscription.trialEndDate)));

      if (needsTrial) {
        // Store flag in sessionStorage for AdminLayout to check
        sessionStorage.setItem('showTrialModal', 'true');
      } else {
        // Clear any existing flag
        sessionStorage.removeItem('showTrialModal');
      }

      // Redirect directly to dashboard (onboarding removed)
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
      {/* Animated gradient circles */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-300/30 to-indigo-400/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-200/20 to-blue-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating waves animation */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-300/20 to-transparent blur-2xl animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-blue-300/20 to-transparent blur-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-200/15 to-transparent blur-2xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md sm:max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative rounded-3xl p-6 sm:p-8 bg-white/80 backdrop-blur-xl border border-cyan-200/50 shadow-[0_20px_60px_-15px_rgba(6,182,212,0.3)]"
        >
          {/* Glow top border */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring' }}
              className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 mb-4"
            >
              <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
              Admin Portal
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Sign in to manage your PG operations securely
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 ring-1 ring-inset ring-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Modern • Compact • Responsive
            </div>
          </div>

          {/* Admin Badge */}
          <div className="mb-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-200/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-5 w-5 text-cyan-600" />
              <span className="font-medium text-cyan-800">PG Administrator Access</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Admin Email
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  className="block w-full rounded-xl border-0 bg-gray-50 text-gray-900 placeholder-gray-500 pl-10 pr-3 py-3 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-cyan-400 focus:bg-white transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border-0 bg-gray-50 text-gray-900 placeholder-gray-500 pl-10 pr-12 py-3 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-cyan-400 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-cyan-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
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
                  <span>Signing in…</span>
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <Link
                to="/admin/forgot-password"
                className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
              <span className="text-gray-400">•</span>
              <div className="text-gray-600">
                Not an admin?{' '}
                <Link
                  to="/login"
                  className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  User Login
                </Link>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-3">
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <strong>Security Notice:</strong> Ensure you are on the correct site and never share credentials.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default AdminLogin; 