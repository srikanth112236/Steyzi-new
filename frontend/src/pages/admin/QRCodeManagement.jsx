import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Download, 
  Copy, 
  RefreshCw, 
  Eye,
  BarChart3,
  Trash2,
  Plus,
  Building2,
  Users,
  Calendar,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { api } from '../../services/auth.service';
import QRCode from 'qrcode';
import { selectSelectedBranch } from '../../store/slices/branch.slice';

const QRCodeManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const selectedBranch = useSelector(selectSelectedBranch);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const canvasRef = useRef(null);

  const effectivePgId = selectedBranch?.pgId || user?.pgId;

  useEffect(() => {
    console.log('🔍 QRCodeManagement: User data:', user);
    if (effectivePgId) {
      console.log('✅ QRCodeManagement: Effective PG ID:', effectivePgId);
      fetchQRCode();
      fetchStats();
    } else {
      console.log('❌ QRCodeManagement: No PG ID found');
      toast.error('No PG associated with this account. Please contact support.');
    }
  }, [effectivePgId]);

  const fetchQRCode = async () => {
    if (!effectivePgId) {
      console.error('❌ QRCodeManagement: Cannot fetch QR code - no PG ID');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/qr/pg/${effectivePgId}`);
      
      if (response.data.success) {
        setQrCodeData(response.data.data);
        if (response.data.data?.fullUrl) {
          generateQRCodeImage(response.data.data.fullUrl);
        }
      } else {
        console.log('No QR code found for this PG');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!effectivePgId) {
      console.error('❌ QRCodeManagement: Cannot fetch stats - no PG ID');
      return;
    }

    try {
      const response = await api.get(`/qr/stats/${effectivePgId}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const generateQRCode = async () => {
    if (!effectivePgId) {
      toast.error('No PG associated with this account. Please contact support.');
      return;
    }

    try {
      setGenerating(true);
      console.log('🔍 QRCodeManagement: Generating QR code for PG:', effectivePgId);
      const response = await api.post(`/qr/generate/${effectivePgId}`);
      
      if (response.data.success) {
        setQrCodeData(response.data.data);
        if (response.data.data?.fullUrl) {
          generateQRCodeImage(response.data.data.fullUrl);
        }
        toast.success('QR code generated successfully!');
        fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const deactivateQRCode = async () => {
    if (!effectivePgId) {
      toast.error('No PG associated with this account. Please contact support.');
      return;
    }

    try {
      const response = await api.put(`/qr/deactivate/${effectivePgId}`);
      
      if (response.data.success) {
        setQrCodeData(null);
        toast.success('QR code deactivated successfully!');
      } else {
        toast.error(response.data.message || 'Failed to deactivate QR code');
      }
    } catch (error) {
      console.error('Error deactivating QR code:', error);
      toast.error('Failed to deactivate QR code');
    }
  };

  const generateQRCodeImage = async (url) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });

      const dataURL = canvas.toDataURL('image/png');
      setQrCodeImage(dataURL);
    } catch (error) {
      console.error('Error generating QR code image:', error);
      toast.error('Failed to generate QR code image');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadQRCode = async () => {
    if (!qrCodeImage) {
      toast.error('No QR code available to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `qr-code-${effectivePgId || 'pg'}-${Date.now()}.png`;
      link.href = qrCodeImage;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (!selectedBranch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Code Management</h1>
          <p className="text-gray-600">Please select a branch from the header to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-3">
      {/* Hidden canvas for QR code generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="max-w-full mx-auto px-2 sm:px-3">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2 shadow-md">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-0.5">QR Code Management</h1>
              <p className="text-xs text-gray-600">Generate and manage QR codes for your PG</p>
            </div>
          </div>
        </div>

        {/* Compact Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Compact QR Code Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <QrCode className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">QR Code</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-xs text-gray-600">Loading...</span>
              </div>
            ) : qrCodeData ? (
              <div className="space-y-3">
                {/* Compact QR Code Display */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg text-center border border-gray-200">
                  <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center shadow-sm overflow-hidden">
                    {qrCodeImage ? (
                      <img 
                        src={qrCodeImage} 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {qrCodeImage ? 'QR Code Generated' : 'Generating QR Code...'}
                  </p>
                </div>

                {/* Compact QR Code Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-md border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">Public URL:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-900 font-mono max-w-32 truncate">{qrCodeData.fullUrl}</span>
                      <button
                        onClick={() => copyToClipboard(qrCodeData.fullUrl)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-md border border-gray-200">
                    <span className="text-xs font-medium text-gray-600">QR Code:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-900 font-mono max-w-32 truncate">{qrCodeData.qrCode}</span>
                      <button
                        onClick={() => copyToClipboard(qrCodeData.qrCode)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compact Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={downloadQRCode}
                    disabled={!qrCodeImage}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 transition-all text-xs font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download QR</span>
                  </button>
                  <button
                    onClick={deactivateQRCode}
                    className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-md hover:from-red-600 hover:to-pink-700 transition-all text-xs font-medium shadow-sm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Deactivate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-3 text-sm">No QR code generated yet</p>
                <button
                  onClick={generateQRCode}
                  disabled={generating}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 text-xs font-medium shadow-sm"
                >
                  {generating ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>{generating ? 'Generating...' : 'Generate QR Code'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Compact Statistics Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900">QR Code Statistics</h3>
            </div>

            {stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-gray-600">Total Scans</span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 mt-1">{stats.usageCount || 0}</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-gray-600">Last Used</span>
                    </div>
                    <p className="text-xs font-medium text-green-600 mt-1">{formatDate(stats.lastUsed)}</p>
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-1.5 mb-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <span className="text-xs font-medium text-gray-600">PG Information</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        stats.isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {stats.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900 font-medium">{formatDate(stats.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No statistics available</p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Instructions */}
        <div className="mt-4 bg-white rounded-lg shadow-md border border-gray-100 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">How to Use QR Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Generate QR Code</h4>
                <p className="text-xs text-gray-600">Click "Generate QR Code" to create a unique QR code for your PG</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-green-600">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Display QR Code</h4>
                <p className="text-xs text-gray-600">Print and display the QR code at your PG entrance or common area</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-purple-600">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Scan & Register</h4>
                <p className="text-xs text-gray-600">Visitors can scan the QR code to register as new tenants</p>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>
  );
};

export default QRCodeManagement; 