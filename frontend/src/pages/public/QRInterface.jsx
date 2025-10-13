import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  User,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/auth.service';
import paymentInfoService from '../../services/paymentInfo.service';
import toast from 'react-hot-toast';

const QRInterface = () => {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    workDetails: {
      company: '',
      designation: '',
      workAddress: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      address: ''
    },
    checkInDate: '',
    contractStartDate: '',
    status: 'pending'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQRData();
  }, [qrCode]);

  useEffect(() => {
    if (showPayment && qrCode) {
      fetchPaymentInfo();
    }
  }, [showPayment, qrCode]);

  const fetchQRData = async () => {
    try {
      setLoading(true);
      console.log('🔍 QRInterface: Fetching QR data for code:', qrCode);
      const response = await api.get(`/public/qr/${qrCode}`);
      
      console.log('🔍 QRInterface: Full QR response:', response.data);
      
      if (response.data.success) {
        console.log('✅ QRInterface: QR data fetched successfully:', response.data.data);
        setQrData(response.data.data);
      } else {
        console.log('❌ QRInterface: Invalid QR code response:', response.data);
        toast.error(response.data.message || 'Invalid QR code');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ QRInterface: Error fetching QR data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // More specific error messages
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        
        if (status === 404) {
          console.log('❌ QR Code not found - this could mean:');
          console.log('1. QR code does not exist in database');
          console.log('2. QR code is inactive');
          console.log('3. QR code format is incorrect');
          toast.error('QR code not found. Please check the URL or contact the PG admin.');
        } else if (status === 400) {
          toast.error('Invalid QR code format.');
        } else if (status === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Error: ${message}`);
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
      
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentInfo = async () => {
    try {
      setLoadingPaymentInfo(true);
      console.log('🔍 QRInterface: Fetching payment info for QR code:', qrCode);
      console.log('🌐 Current hostname:', window.location.hostname);
      console.log('🌐 Full URL:', window.location.href);
      
      const response = await paymentInfoService.getPaymentInfoByQRCode(qrCode);
      
      console.log('🔍 QRInterface: Full payment info response:', response);
      
      if (response.success && response.data) {
        // Handle both nested and direct data structure
        const paymentData = response.data.paymentInfo || response.data;
        if (paymentData && (paymentData.upiId || paymentData.accountNumber)) {
          console.log('✅ QRInterface: Payment info fetched successfully:', paymentData);
          setPaymentInfo(paymentData);
        } else {
          console.log('⚠️ QRInterface: No payment info configured');
          setPaymentInfo(null);
        }
      } else {
        console.log('⚠️ QRInterface: No payment info configured - response not successful');
        setPaymentInfo(null);
      }
    } catch (error) {
      console.error('❌ QRInterface: Error fetching payment info:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      setPaymentInfo(null);
    } finally {
      setLoadingPaymentInfo(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      console.log('🔍 QRInterface: Submitting resident data for QR code:', qrCode);
      
      // Clean the form data - remove empty strings for optional fields
      const cleanedData = {
        ...formData,
        workDetails: {
          company: formData.workDetails.company || undefined,
          designation: formData.workDetails.designation || undefined,
          workAddress: formData.workDetails.workAddress || undefined
        },
        emergencyContact: {
          name: formData.emergencyContact.name,
          relationship: formData.emergencyContact.relationship,
          phone: formData.emergencyContact.phone,
          address: formData.emergencyContact.address || undefined
        }
      };
      
      // Remove undefined values
      Object.keys(cleanedData.workDetails).forEach(key => {
        if (cleanedData.workDetails[key] === undefined) {
          delete cleanedData.workDetails[key];
        }
      });
      
      Object.keys(cleanedData.emergencyContact).forEach(key => {
        if (cleanedData.emergencyContact[key] === undefined) {
          delete cleanedData.emergencyContact[key];
        }
      });
      
      console.log('📝 Cleaned form data:', cleanedData);
      
      const response = await api.post(`/public/qr/${qrCode}/resident`, cleanedData);
      
      if (response.data.success) {
        console.log('✅ QRInterface: Resident registration successful:', response.data.data);
        toast.success('Registration successful! Please contact the PG admin for room assignment.');
        setShowAddTenant(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          // alternatePhone: '',
          dateOfBirth: '',
          gender: '',
          permanentAddress: {
            street: '',
            city: '',
            state: '',
            pincode: ''
          },
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          },
          workDetails: {
            company: '',
            designation: '',
            workAddress: '',
            workPhone: '',
            workEmail: '',
            salary: ''
          }
        });
      } else {
        console.log('❌ QRInterface: Registration failed:', response.data);
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ QRInterface: Error submitting form:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Payment app redirection functions
  const openGPay = (upiId, upiName) => {
    try {
      // Multiple Google Pay URL schemes to try (without amount to avoid transaction limit errors)
      const gpayUrls = [
        // Google Pay specific URL (tez is the internal name for Google Pay)
        `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR`,
        // Alternative Google Pay URL
        `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`,
        // Standard UPI intent that Google Pay handles well
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR&mode=02&purpose=00`,
        // Basic UPI intent without extra parameters
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`
      ];
      
      // Try each URL scheme
      const tryNextUrl = (index = 0) => {
        if (index >= gpayUrls.length) {
          // If all URL schemes fail, show install prompt
          const confirmed = confirm('Google Pay app not found or unable to pre-fill payment details. Would you like to install Google Pay from Play Store?');
          if (confirmed) {
            window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.nfc.payment', '_blank');
          }
          return;
        }
        
        console.log(`Trying Google Pay URL ${index + 1}:`, gpayUrls[index]);
        
        // Try to open the current URL
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = gpayUrls[index];
        document.body.appendChild(iframe);
        
        // Check if it worked after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          // If the page is still visible, try the next URL
          if (document.visibilityState === 'visible') {
            tryNextUrl(index + 1);
          }
        }, 1000);
      };
      
      // Start trying URLs
      tryNextUrl();
      
      toast.success('Opening Google Pay with payment details...');
    } catch (error) {
      console.error('Error opening Google Pay:', error);
      toast.error('Failed to open Google Pay');
    }
  };

  const openGPayWithNumber = (phoneNumber) => {
    try {
      // Clean phone number (remove +91 if present)
      const cleanNumber = phoneNumber.replace(/^\+91-?/, '');
      
      // Google Pay URL for phone number
      const gpayUrl = `tez://upi/pay?pa=${cleanNumber}@paytm&pn=${encodeURIComponent('PG Payment')}`;
      
      window.location.href = gpayUrl;
      toast.success('Opening Google Pay with number...');
    } catch (error) {
      console.error('Error opening Google Pay with number:', error);
      toast.error('Failed to open Google Pay');
    }
  };

  const openPaytm = (upiId, upiName) => {
    try {
      // Multiple Paytm URL schemes to try (without amount to avoid transaction limit errors)
      const paytmUrls = [
        // Standard UPI intent that works with Paytm
        `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR`,
        // Alternative Paytm specific URL
        `paytmmp://upi/pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`,
        // Generic UPI intent that Paytm should handle
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR&mode=02&purpose=00`,
        // Basic UPI intent without extra parameters
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`
      ];
      
      // Try each URL scheme
      const tryNextUrl = (index = 0) => {
        if (index >= paytmUrls.length) {
          // If all URL schemes fail, show install prompt
          const confirmed = confirm('Paytm app not found or unable to pre-fill payment details. Would you like to install Paytm from Play Store?');
          if (confirmed) {
            window.open('https://play.google.com/store/apps/details?id=net.one97.paytm', '_blank');
          }
          return;
        }
        
        console.log(`Trying Paytm URL ${index + 1}:`, paytmUrls[index]);
        
        // Try to open the current URL
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = paytmUrls[index];
        document.body.appendChild(iframe);
        
        // Check if it worked after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          // If the page is still visible, try the next URL
          if (document.visibilityState === 'visible') {
            tryNextUrl(index + 1);
          }
        }, 1000);
      };
      
      // Start trying URLs
      tryNextUrl();
      
      toast.success('Opening Paytm with payment details...');
    } catch (error) {
      console.error('Error opening Paytm:', error);
      toast.error('Failed to open Paytm');
    }
  };

  const openPaytmWithNumber = (phoneNumber) => {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91-?/, '');
      const paytmUrl = `paytmmp://upi/pay?pa=${cleanNumber}@paytm&pn=${encodeURIComponent('PG Payment')}`;
      
      window.location.href = paytmUrl;
      toast.success('Opening Paytm with number...');
    } catch (error) {
      console.error('Error opening Paytm with number:', error);
      toast.error('Failed to open Paytm');
    }
  };

  const openPhonePe = (upiId, upiName) => {
    try {
      // Multiple PhonePe URL schemes to try (without amount to avoid transaction limit errors)
      const phonepeUrls = [
        // PhonePe specific UPI URL with all parameters
        `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR&mode=02`,
        // Alternative PhonePe URL
        `phonepe://upi/pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`,
        // Standard UPI intent that PhonePe should handle
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR&mode=02&purpose=00`,
        // PhonePe deep link format
        `phonepe://transaction?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR`,
        // Generic phonepe scheme
        `phonepe://upi?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`
      ];
      
      // Try each URL scheme
      const tryNextUrl = (index = 0) => {
        if (index >= phonepeUrls.length) {
          // If all URL schemes fail, show install prompt
          const confirmed = confirm('PhonePe app not found or unable to pre-fill payment details. Would you like to install PhonePe from Play Store?');
          if (confirmed) {
            window.open('https://play.google.com/store/apps/details?id=com.phonepe.app', '_blank');
          }
          return;
        }
        
        console.log(`Trying PhonePe URL ${index + 1}:`, phonepeUrls[index]);
        
        // Try to open the current URL
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = phonepeUrls[index];
        document.body.appendChild(iframe);
        
        // Check if it worked after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          // If the page is still visible, try the next URL
          if (document.visibilityState === 'visible') {
            tryNextUrl(index + 1);
          }
        }, 1000);
      };
      
      // Start trying URLs
      tryNextUrl();
      
      toast.success('Opening PhonePe with payment details...');
    } catch (error) {
      console.error('Error opening PhonePe:', error);
      toast.error('Failed to open PhonePe');
    }
  };

  const openPhonePeWithNumber = (phoneNumber) => {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91-?/, '');
      const phonepeUrl = `phonepe://upi/pay?pa=${cleanNumber}@ybl&pn=${encodeURIComponent('PG Payment')}`;
      
      window.location.href = phonepeUrl;
      toast.success('Opening PhonePe with number...');
    } catch (error) {
      console.error('Error opening PhonePe with number:', error);
      toast.error('Failed to open PhonePe');
    }
  };

  // Generic UPI app opener for any UPI app
  const openUPIApp = (upiId, upiName, amount = '') => {
    try {
      // Multiple UPI URL schemes to ensure maximum compatibility (without amount to avoid transaction limit errors)
      const upiUrls = [
        // UPI intent without amount (user can enter manually) - Most compatible
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR`,
        // Standard UPI intent with mode and purpose
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}&cu=INR&mode=02&purpose=00`,
        // Basic UPI intent
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&tn=${encodeURIComponent(`Payment to ${upiName}`)}`,
        // Minimal UPI intent
        `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}`
      ];
      
      // Try each URL scheme
      const tryNextUrl = (index = 0) => {
        if (index >= upiUrls.length) {
          // If all fail, show helpful message
          toast.error('Unable to open UPI app. Please ensure you have a UPI app installed (Google Pay, PhonePe, Paytm, etc.)');
          return;
        }
        
        console.log(`Trying UPI URL ${index + 1}:`, upiUrls[index]);
        
        // Create an iframe to test the URL
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = upiUrls[index];
        document.body.appendChild(iframe);
        
        // Check if it worked after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          // If the page is still visible, try the next URL
          if (document.visibilityState === 'visible') {
            tryNextUrl(index + 1);
          } else {
            // Page became hidden, likely app opened successfully
            toast.success('UPI app opened successfully!');
          }
        }, 1000);
      };
      
      // Start trying URLs
      tryNextUrl();
      
      toast.success('Opening UPI app...');
    } catch (error) {
      console.error('Error opening UPI app:', error);
      toast.error('Failed to open UPI app');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Invalid QR code</p>
          <p className="text-sm text-gray-500">Please check the QR code and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header - Compact */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{qrData.pgName || 'PG Name'}</h1>
              <p className="text-xs text-gray-600">Welcome to our PG</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {!showAddTenant && !showPayment ? (
          /* Main Options */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* PG Information - Compact */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{qrData.pgName || 'PG Name'}</h2>
                  <p className="text-sm text-gray-600">{qrData.pgAddress || 'PG Address'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Contact</p>
                    <p className="text-sm text-gray-900">{qrData.pgAddress || 'Contact PG admin'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">Address</p>
                    <p className="text-sm text-gray-900">{qrData.pgAddress || 'PG Address'}</p>
                  </div>
                </div>
              </div>

              {/* Compact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {qrData.createdBy && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-800">Admin</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {qrData.createdBy.firstName} {qrData.createdBy.lastName}
                    </p>
                  </div>
                )}

                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-800">Usage</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {qrData.usageCount || 0} scans
                  </p>
                </div>
              </div>
            </div>

            {/* Action Options - Compact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddTenant(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Add New Tenant</h3>
                  <p className="text-xs opacity-90">Register as a new tenant</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPayment(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold mb-1">Update Payment</h3>
                  <p className="text-xs opacity-90">Mark payment as completed</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : showAddTenant ? (
          /* Add Tenant Form - Compact */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={() => setShowAddTenant(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New Tenant</h2>
                <p className="text-sm text-gray-600">Register as a new tenant</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <User className="h-4 w-4 mr-2 text-sky-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information - Compact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-sky-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.permanentAddress.street}
                      onChange={(e) => handleInputChange('permanentAddress.street', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.permanentAddress.city}
                      onChange={(e) => handleInputChange('permanentAddress.city', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={formData.permanentAddress.state}
                      onChange={(e) => handleInputChange('permanentAddress.state', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      value={formData.permanentAddress.pincode}
                      onChange={(e) => handleInputChange('permanentAddress.pincode', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact - Compact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-sky-600" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Relationship *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.emergencyContact.address}
                      onChange={(e) => handleInputChange('emergencyContact.address', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Dates - Compact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-sky-600" />
                  Contract Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.checkInDate}
                      onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contract Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.contractStartDate}
                      onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Work Details - Compact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-sky-600" />
                  Work Details (Optional)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.workDetails.company}
                      onChange={(e) => handleInputChange('workDetails.company', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.workDetails.designation}
                      onChange={(e) => handleInputChange('workDetails.designation', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Work Address</label>
                    <input
                      type="text"
                      value={formData.workDetails.workAddress}
                      onChange={(e) => handleInputChange('workDetails.workAddress', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button - Compact */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTenant(false)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center space-x-2 text-sm"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{submitting ? 'Submitting...' : 'Submit Registration'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        ) : !showPaymentForm ? (
          /* Payment Methods Selection */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Choose Payment Method</h2>
                <p className="text-sm text-gray-600">Select your preferred payment option</p>
              </div>
            </div>

            {loadingPaymentInfo ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-sm text-gray-600">Loading payment options...</span>
              </div>
            ) : paymentInfo ? (
              <div className="space-y-3">
                {/* UPI Payment Option */}
                {paymentInfo.upiId && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPaymentMethod('upi')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'upi'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">UPI Payment</h3>
                        <p className="text-sm text-gray-600">Pay using UPI ID or QR scan</p>
                      </div>
                      {selectedPaymentMethod === 'upi' && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </motion.button>
                )}

                {/* Bank Account Option */}
                {(paymentInfo.accountNumber && paymentInfo.bankName) && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPaymentMethod('bank')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'bank'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">Bank Transfer</h3>
                        <p className="text-sm text-gray-600">Direct bank account transfer</p>
                      </div>
                      {selectedPaymentMethod === 'bank' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </motion.button>
                )}

                {/* Payment Apps Option */}
                {(paymentInfo.gpayNumber || paymentInfo.paytmNumber || paymentInfo.phonepeNumber) && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedPaymentMethod('apps')}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === 'apps'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">Payment Apps</h3>
                        <p className="text-sm text-gray-600">GPay, Paytm, PhonePe numbers</p>
                      </div>
                      {selectedPaymentMethod === 'apps' && (
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                  </motion.button>
                )}

                {/* Continue Button */}
                {selectedPaymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4"
                  >
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Continue with {selectedPaymentMethod === 'upi' ? 'UPI' : selectedPaymentMethod === 'bank' ? 'Bank Transfer' : 'Payment Apps'}</span>
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Info Not Available</h3>
                <p className="text-sm text-gray-500 mb-4">Payment information is not configured for this PG.</p>
                <p className="text-xs text-gray-400 mb-4">Please contact the PG admin to set up payment details.</p>
                
                {/* Contact Admin Button */}
                <button
                  onClick={() => {
                    toast.success('Contact PG admin to configure payment information for this branch.');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                >
                  Contact Admin
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Payment Details & Update Form */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-4"
          >
            <div className="flex items-center space-x-3 mb-4">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Payment Details</h2>
                <p className="text-sm text-gray-600">
                  {selectedPaymentMethod === 'upi' ? 'UPI Payment Information' : 
                   selectedPaymentMethod === 'bank' ? 'Bank Account Details' : 
                   'Payment App Numbers'}
                </p>
              </div>
            </div>

            {/* Payment Details based on selected method */}
            <div className="space-y-4">
              {selectedPaymentMethod === 'upi' && paymentInfo.upiId && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    UPI Payment Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">UPI ID</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-900">{paymentInfo.upiId}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paymentInfo.upiId);
                            toast.success('UPI ID copied to clipboard!');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Name</label>
                      <span className="text-sm text-gray-900">{paymentInfo.upiName}</span>
                    </div>
                  </div>
                  
                  {/* Universal UPI Button */}
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <button
                      onClick={() => openUPIApp(paymentInfo.upiId, paymentInfo.upiName)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all text-sm font-medium"
                    >
                      <span>🚀</span>
                      <span>Open Any UPI App</span>
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Works with any UPI app installed on your device
                    </p>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'bank' && paymentInfo.accountNumber && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Bank Account Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder</label>
                      <span className="text-sm text-gray-900">{paymentInfo.accountHolderName}</span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                      <span className="text-sm text-gray-900">{paymentInfo.bankName}</span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-900">{paymentInfo.accountNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paymentInfo.accountNumber);
                            toast.success('Account number copied to clipboard!');
                          }}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-1 bg-green-50 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-900">{paymentInfo.ifscCode}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paymentInfo.ifscCode);
                            toast.success('IFSC code copied to clipboard!');
                          }}
                          className="text-xs text-green-600 hover:text-green-700 px-2 py-1 bg-green-50 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'apps' && (paymentInfo.gpayNumber || paymentInfo.paytmNumber || paymentInfo.phonepeNumber) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Choose Payment App
                  </h3>
                  
                  <div className="space-y-3">
                    {paymentInfo.gpayNumber && (
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">G</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Google Pay</h4>
                              <p className="text-xs text-gray-600">{paymentInfo.gpayNumber}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentInfo.gpayNumber);
                              toast.success('GPay number copied!');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 bg-gray-50 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openGPay(paymentInfo.upiId, paymentInfo.upiName)}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm font-medium"
                          >
                            <span>📱</span>
                            <span>Open Google Pay</span>
                          </button>
                          <button
                            onClick={() => openGPayWithNumber(paymentInfo.gpayNumber)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm"
                          >
                            Pay to Number
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {paymentInfo.paytmNumber && (
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">P</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">Paytm</h4>
                              <p className="text-xs text-gray-600">{paymentInfo.paytmNumber}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentInfo.paytmNumber);
                              toast.success('Paytm number copied!');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 bg-gray-50 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openPaytm(paymentInfo.upiId, paymentInfo.upiName)}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all text-sm font-medium"
                          >
                            <span>📱</span>
                            <span>Open Paytm</span>
                          </button>
                          <button
                            onClick={() => openPaytmWithNumber(paymentInfo.paytmNumber)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm"
                          >
                            Pay to Number
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {paymentInfo.phonepeNumber && (
                      <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">Pe</span>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">PhonePe</h4>
                              <p className="text-xs text-gray-600">{paymentInfo.phonepeNumber}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentInfo.phonepeNumber);
                              toast.success('PhonePe number copied!');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 bg-gray-50 rounded"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openPhonePe(paymentInfo.upiId, paymentInfo.upiName)}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-medium"
                          >
                            <span>📱</span>
                            <span>Open PhonePe</span>
                          </button>
                          <button
                            onClick={() => openPhonePeWithNumber(paymentInfo.phonepeNumber)}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm"
                          >
                            Pay to Number
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              {paymentInfo.paymentInstructions && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                  <h3 className="text-sm font-semibold text-orange-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Payment Instructions
                  </h3>
                  <p className="text-sm text-orange-800">{paymentInfo.paymentInstructions}</p>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                  How to Pay
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Click on your preferred payment app button above</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>The app will open with UPI ID and name pre-filled</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span><strong>Enter the payment amount</strong> and complete the transaction</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <span>Take a screenshot and click "Update Status" below</span>
                  </div>
                </div>
                
                {/* Important Note */}
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 flex items-center">
                    <span className="font-bold mr-1">💡</span>
                    <span><strong>Note:</strong> You'll need to enter the payment amount manually in the app to avoid transaction limit errors.</span>
                  </p>
                </div>
              </div>

              {/* Update Payment Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    // Here you'll implement the payment update form
                    toast.success('Payment update feature will be implemented next!');
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-medium text-sm hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>I Made This Payment - Update Status</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QRInterface; 