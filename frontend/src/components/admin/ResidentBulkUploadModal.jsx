import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2, AlertTriangle, XCircle, BarChart3, User, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ResidentBulkUploadModal = ({ isOpen, onClose, selectedBranch, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const fileInputRef = useRef(null);

  // Sample data for residents
  const sampleResidentsData = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
      alternatePhone: '9876543211',
      gender: 'male',
      dateOfBirth: '1995-05-15',
      permanentStreet: '123 Main Street',
      permanentCity: 'Mumbai',
      permanentState: 'Maharashtra',
      permanentPincode: '400001',
      emergencyName: 'Jane Doe',
      emergencyRelationship: 'Father',
      emergencyPhone: '9876543212',
      emergencyAddress: '123 Main Street, Mumbai, Maharashtra 400001',
      workCompany: 'Tech Solutions Ltd',
      workDesignation: 'Software Engineer',
      workAddress: '456 Tech Park, Mumbai',
      workPhone: '9876543213',
      workEmail: 'john.doe@techsolutions.com',
      workSalary: '75000',
      workJoiningDate: '2023-01-15',
      checkInDate: '2024-01-15',
      contractStartDate: '2024-01-15',
      contractEndDate: '2024-12-31',
      status: 'active'
    },
    {
      firstName: 'Sarah',
      lastName: 'Smith',
      email: 'sarah.smith@example.com',
      phone: '9876543214',
      alternatePhone: '9876543215',
      gender: 'female',
      dateOfBirth: '1998-08-22',
      permanentStreet: '456 Oak Avenue',
      permanentCity: 'Delhi',
      permanentState: 'Delhi',
      permanentPincode: '110001',
      emergencyName: 'Robert Smith',
      emergencyRelationship: 'Father',
      emergencyPhone: '9876543216',
      emergencyAddress: '456 Oak Avenue, Delhi, Delhi 110001',
      workCompany: 'Marketing Pro',
      workDesignation: 'Marketing Manager',
      workAddress: '789 Business Center, Delhi',
      workPhone: '9876543217',
      workEmail: 'sarah.smith@marketingpro.com',
      workSalary: '65000',
      workJoiningDate: '2023-03-01',
      checkInDate: '2024-01-20',
      contractStartDate: '2024-01-20',
      contractEndDate: '2024-12-31',
      status: 'active'
    },
    {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@example.com',
      phone: '9876543218',
      alternatePhone: '9876543219',
      gender: 'male',
      dateOfBirth: '1993-12-10',
      permanentStreet: '789 Pine Road',
      permanentCity: 'Bangalore',
      permanentState: 'Karnataka',
      permanentPincode: '560001',
      emergencyName: 'Lisa Johnson',
      emergencyRelationship: 'Mother',
      emergencyPhone: '9876543220',
      emergencyAddress: '789 Pine Road, Bangalore, Karnataka 560001',
      workCompany: 'Data Analytics Co',
      workDesignation: 'Data Analyst',
      workAddress: '321 Tech Hub, Bangalore',
      workPhone: '9876543221',
      workEmail: 'mike.johnson@dataanalytics.com',
      workSalary: '55000',
      workJoiningDate: '2023-06-15',
      checkInDate: '2024-02-01',
      contractStartDate: '2024-02-01',
      contractEndDate: '2024-12-31',
      status: 'pending'
    },
    {
      firstName: 'Emily',
      lastName: 'Williams',
      email: 'emily.williams@example.com',
      phone: '9876543222',
      alternatePhone: '9876543223',
      gender: 'female',
      dateOfBirth: '1996-03-28',
      permanentStreet: '321 Elm Street',
      permanentCity: 'Chennai',
      permanentState: 'Tamil Nadu',
      permanentPincode: '600001',
      emergencyName: 'David Williams',
      emergencyRelationship: 'Father',
      emergencyPhone: '9876543224',
      emergencyAddress: '321 Elm Street, Chennai, Tamil Nadu 600001',
      workCompany: 'Creative Studio',
      workDesignation: 'Graphic Designer',
      workAddress: '654 Creative Plaza, Chennai',
      workPhone: '9876543225',
      workEmail: 'emily.williams@creativestudio.com',
      workSalary: '45000',
      workJoiningDate: '2023-09-01',
      checkInDate: '2024-02-05',
      contractStartDate: '2024-02-05',
      contractEndDate: '2024-12-31',
      status: 'active'
    },
    {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david.brown@example.com',
      phone: '9876543226',
      alternatePhone: '9876543227',
      gender: 'male',
      dateOfBirth: '1994-07-14',
      permanentStreet: '654 Maple Drive',
      permanentCity: 'Hyderabad',
      permanentState: 'Telangana',
      permanentPincode: '500001',
      emergencyName: 'Mary Brown',
      emergencyRelationship: 'Mother',
      emergencyPhone: '9876543228',
      emergencyAddress: '654 Maple Drive, Hyderabad, Telangana 500001',
      workCompany: 'Sales Pro',
      workDesignation: 'Sales Representative',
      workAddress: '987 Sales Tower, Hyderabad',
      workPhone: '9876543229',
      workEmail: 'david.brown@salespro.com',
      workSalary: '50000',
      workJoiningDate: '2023-12-01',
      checkInDate: '2024-02-10',
      contractStartDate: '2024-02-10',
      contractEndDate: '2024-12-31',
      status: 'active'
    }
  ];

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet(sampleResidentsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Residents');
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // firstName
      { wch: 12 }, // lastName
      { wch: 25 }, // email
      { wch: 12 }, // phone
      { wch: 12 }, // alternatePhone
      { wch: 8 },  // gender
      { wch: 12 }, // dateOfBirth
      { wch: 20 }, // permanentStreet
      { wch: 12 }, // permanentCity
      { wch: 12 }, // permanentState
      { wch: 10 }, // permanentPincode
      { wch: 15 }, // emergencyName
      { wch: 12 }, // emergencyRelationship
      { wch: 12 }, // emergencyPhone
      { wch: 30 }, // emergencyAddress
      { wch: 20 }, // workCompany
      { wch: 15 }, // workDesignation
      { wch: 25 }, // workAddress
      { wch: 12 }, // workPhone
      { wch: 25 }, // workEmail
      { wch: 10 }, // workSalary
      { wch: 12 }, // workJoiningDate
      { wch: 12 }, // checkInDate
      { wch: 12 }, // contractStartDate
      { wch: 12 }, // contractEndDate
      { wch: 12 }, // checkOutDate
      { wch: 10 }  // status
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'residents_sample.xlsx');
    toast.success('Sample file downloaded successfully!');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewExcelData(selectedFile);
    }
  };

  const previewExcelData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          toast.error('File must contain at least a header row and one data row');
          return;
        }
        
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1, 6); // Show first 5 rows
        
        setPreviewData({
          headers,
          preview: dataRows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          }),
          totalRows: jsonData.length - 1
        });
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Error reading file. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const formData = new FormData();
      formData.append('file', new Blob([arrayBuffer], { type: file.type }), file.name);
      formData.append('branchId', selectedBranch._id);
      
      const response = await fetch('/api/residents/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const data = await response.json();
      
      if (data.success) {
        setUploadResults(data.data);
        
        // Show success message
        toast.success(`✅ Successfully processed ${data.data.totalRows} rows!`);
        
        // Show detailed results
        if (data.data.uploadedCount > 0) {
          toast.success(`📤 Uploaded: ${data.data.uploadedCount} residents`, { duration: 3000 });
        }
        
        if (data.data.skippedCount > 0) {
          toast.error(`⏭️ Skipped: ${data.data.skippedCount} duplicates`, { duration: 4000 });
        }
        
        if (data.data.errors && data.data.errors.length > 0) {
          toast.error(`❌ Errors: ${data.data.errors.length} rows had issues`, { duration: 5000 });
        }
        
        // Show verification info if available
        if (data.data.verification) {
          const { verifiedCount, expectedCount, verificationPassed } = data.data.verification;
          if (!verificationPassed) {
            toast.error(`⚠️ Verification: ${verifiedCount}/${expectedCount} residents found in database`, { duration: 5000 });
          } else {
            toast.success(`✅ Verification: All ${verifiedCount} residents confirmed in database`, { duration: 3000 });
          }
        }
        
        setUploadProgress(100);
        
        // Show results modal
        setShowResultsModal(true);
        
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error uploading file:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setUploadResults(null);
    onClose();
  };

  const handleResultsModalClose = () => {
    setShowResultsModal(false);
    setUploadResults(null);
    
    // Reset form
    setFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('🔄 ResidentBulkUploadModal: Closing results modal and triggering refresh');
    
    // Close modal and refresh data
    onSuccess();
    onClose();
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setUploadResults(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Residents</h2>
              <p className="text-sm text-gray-600">Upload multiple residents from Excel file</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">📋 Upload Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Upload an Excel file (.xlsx, .xls) or CSV file</p>
              <p>• File should contain the following columns:</p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  📞 <strong>Phone Number Format:</strong> Use exactly 10 digits without country code (e.g., "9876543210" not "+91-9876543210")
                </p>
              </div>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>firstName:</strong> Resident's first name (required)</li>
                <li><strong>lastName:</strong> Resident's last name (required)</li>
                <li><strong>email:</strong> Email address (required, must be unique)</li>
                <li><strong>phone:</strong> Phone number (required, exactly 10 digits, no country code)</li>
                <li><strong>alternatePhone:</strong> Alternate phone (optional, exactly 10 digits, no country code)</li>
                <li><strong>gender:</strong> Gender (required: male, female, other)</li>
                <li><strong>dateOfBirth:</strong> Date of birth (required, YYYY-MM-DD)</li>
                <li><strong>permanentStreet:</strong> Permanent address street (required)</li>
                <li><strong>permanentCity:</strong> Permanent address city (required)</li>
                <li><strong>permanentState:</strong> Permanent address state (required)</li>
                <li><strong>permanentPincode:</strong> Permanent address pincode (required, exactly 6 digits)</li>
                <li><strong>emergencyName:</strong> Emergency contact name (required)</li>
                <li><strong>emergencyRelationship:</strong> Relationship with emergency contact (required)</li>
                <li><strong>emergencyPhone:</strong> Emergency contact phone (required, exactly 10 digits, no country code)</li>
                <li><strong>emergencyAddress:</strong> Emergency contact address (required)</li>
                <li><strong>workCompany:</strong> Work company name (optional)</li>
                <li><strong>workDesignation:</strong> Work designation (optional)</li>
                <li><strong>workAddress:</strong> Work address (optional)</li>
                <li><strong>workPhone:</strong> Work phone (optional, exactly 10 digits, no country code)</li>
                <li><strong>workEmail:</strong> Work email (optional)</li>
                <li><strong>workSalary:</strong> Work salary (optional, positive number)</li>
                <li><strong>workJoiningDate:</strong> Work joining date (optional, YYYY-MM-DD)</li>
                <li><strong>checkInDate:</strong> Check-in date (required, YYYY-MM-DD)</li>
                <li><strong>contractStartDate:</strong> Contract start date (required, YYYY-MM-DD)</li>
                <li><strong>contractEndDate:</strong> Contract end date (optional, YYYY-MM-DD)</li>
                <li><strong>checkOutDate:</strong> Check-out date (optional, YYYY-MM-DD)</li>
                <li><strong>status:</strong> Status (optional: active, inactive, moved_out, pending, notice_period)</li>
              </ul>
            </div>
            
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Duplicate Check:</strong> Residents with existing email or phone number will be skipped
              </p>
            </div>
          </div>

          {/* Download Sample */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">📥 Download Sample File</h3>
                <p className="text-sm text-gray-600">Get a sample Excel file with the correct format</p>
              </div>
              <button
                onClick={downloadSample}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your Excel file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </button>
            </div>
            
            {file && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{file.name}</p>
                      <p className="text-xs text-green-700">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Data */}
          {previewData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Data Preview</h3>
                <span className="text-sm text-gray-500">
                  Showing first 5 rows of {previewData.totalRows} total rows
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {previewData.headers.map((header, index) => (
                        <th key={index} className="text-left py-2 px-3 font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {previewData.headers.map((header, colIndex) => (
                          <td key={colIndex} className="py-2 px-3 text-gray-600">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-900">Uploading...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Please wait while we process your data...
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Residents</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Results Modal */}
      {showResultsModal && uploadResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Results</h2>
                  <p className="text-sm text-gray-600">Summary of your bulk upload operation</p>
                </div>
              </div>
              <button
                onClick={handleResultsModalClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResults.totalRows}</div>
                  <div className="text-sm text-green-700">Total Rows</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResults.uploadedCount}</div>
                  <div className="text-sm text-blue-700">Successfully Uploaded</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{uploadResults.skippedCount}</div>
                  <div className="text-sm text-yellow-700">Skipped (Duplicates)</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResults.errors?.length || 0}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              </div>

              {/* Duplicates Section */}
              {uploadResults.duplicates && uploadResults.duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-800">
                      Duplicates Found ({uploadResults.duplicates.length})
                    </h3>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    The following residents were skipped because they already exist in the system:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadResults.duplicates.map((dup, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border border-yellow-200">
                        <div className="w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-xs font-semibold">
                          {dup.row}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{dup.name}</div>
                          <div className="text-xs text-yellow-600">{dup.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors Section */}
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-800">
                      Errors ({uploadResults.errors.length})
                    </h3>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    The following rows had issues and could not be processed:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {uploadResults.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-red-200">
                        <div className="text-sm text-red-800">{error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resident Statistics */}
              {uploadResults.residentStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">Resident Statistics</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.residentStats.totalResidents}</div>
                      <div className="text-xs text-blue-700">Total Residents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.residentStats.activeCount}</div>
                      <div className="text-xs text-blue-700">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.residentStats.pendingCount}</div>
                      <div className="text-xs text-blue-700">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.residentStats.maleCount + uploadResults.residentStats.femaleCount}</div>
                      <div className="text-xs text-blue-700">By Gender</div>
                    </div>
                  </div>
                  
                  {uploadResults.residentStats.genderBreakdown && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Gender Breakdown:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(uploadResults.residentStats.genderBreakdown).map(([gender, count]) => (
                          <span key={gender} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {gender}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Success Message */}
              {uploadResults.uploadedCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">
                        Successfully uploaded {uploadResults.uploadedCount} residents!
                      </h3>
                      <p className="text-sm text-green-700">
                        Your data has been processed and added to the system.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleResultsModalClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentBulkUploadModal; 