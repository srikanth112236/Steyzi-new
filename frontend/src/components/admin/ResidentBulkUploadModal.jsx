import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2, AlertTriangle, XCircle, BarChart3, User, Phone, Mail, Info, ChevronDown, ChevronUp, Edit, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getApiBaseUrl } from '../../utils/apiUrl';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ResidentBulkUploadModal = ({ isOpen, onClose, selectedBranch, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showColumnInfo, setShowColumnInfo] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editedRowData, setEditedRowData] = useState(null);
  const [allRowsData, setAllRowsData] = useState(null); // Store all rows for editing
  const [originalAllRowsData, setOriginalAllRowsData] = useState(null); // Store original rows before upload
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [duplicateRowsData, setDuplicateRowsData] = useState(null); // Store duplicate rows for editing
  const [isEditingDuplicates, setIsEditingDuplicates] = useState(false);
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
        // Store all rows for editing/deleting
        const allRows = jsonData.slice(1).map((row, index) => {
          const obj = { _originalRowIndex: index }; // Store original row index
          headers.forEach((header, colIndex) => {
            obj[header] = row[colIndex] || '';
          });
          return obj;
        });
        
        // Show all rows in preview for editing
        setAllRowsData(allRows);
        setOriginalAllRowsData(allRows); // Store original data
        setPreviewData({
          headers,
          preview: allRows, // Show all rows so they can all be edited
          totalRows: allRows.length
        });
        setEditingRowIndex(null);
        setEditedRowData(null);
        setIsEditingDuplicates(false);
        setDuplicateRowsData(null);
        setIsEditingDuplicates(false);
        setDuplicateRowsData(null);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Error reading file. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditRow = (previewRowIndex) => {
    if (!allRowsData || !previewData) return;
    
    // Preview rows are the first N rows of allRowsData
    const actualRowIndex = previewRowIndex;
    if (actualRowIndex >= allRowsData.length) return;
    
    setEditingRowIndex(actualRowIndex);
    setEditedRowData({ ...allRowsData[actualRowIndex] });
  };

  const handleSaveRow = (previewRowIndex) => {
    if (!allRowsData || !editedRowData || !previewData) return;
    
    const actualRowIndex = previewRowIndex;
    if (actualRowIndex >= allRowsData.length) return;
    
    const updatedRows = [...allRowsData];
    updatedRows[actualRowIndex] = { ...editedRowData };
    setAllRowsData(updatedRows);
    
    // Update preview
    const updatedPreview = [...previewData.preview];
    if (previewRowIndex < updatedPreview.length) {
      updatedPreview[previewRowIndex] = { ...editedRowData };
      setPreviewData({
        ...previewData,
        preview: updatedPreview
      });
    }
    
    setEditingRowIndex(null);
    setEditedRowData(null);
    toast.success('Row updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setEditedRowData(null);
  };

  const handleDeleteRow = (previewRowIndex) => {
    if (!allRowsData || !previewData) return;
    setRowToDelete(previewRowIndex);
    setShowDeleteModal(true);
  };

  const confirmDeleteRow = () => {
    if (rowToDelete === null || !allRowsData || !previewData) return;
    
    const actualRowIndex = rowToDelete;
    if (actualRowIndex >= allRowsData.length) {
      setShowDeleteModal(false);
      setRowToDelete(null);
      return;
    }
    
    const updatedRows = allRowsData.filter((_, index) => index !== actualRowIndex);
    setAllRowsData(updatedRows);
    
    // Update preview - show all remaining rows
    setPreviewData({
      ...previewData,
      preview: updatedRows, // Show all remaining rows
      totalRows: updatedRows.length
    });
    
    if (editingRowIndex === actualRowIndex) {
      setEditingRowIndex(null);
      setEditedRowData(null);
    } else if (editingRowIndex > actualRowIndex) {
      setEditingRowIndex(editingRowIndex - 1);
    }
    
    setShowDeleteModal(false);
    setRowToDelete(null);
    toast.success('Row deleted successfully');
  };

  const handleUpload = async () => {
    if (!allRowsData || allRowsData.length === 0) {
      toast.error('No data to upload');
      return;
    }
    
    // Store current data as original before upload (if not already stored or if editing duplicates)
    if (!originalAllRowsData || isEditingDuplicates) {
      setOriginalAllRowsData([...allRowsData]);
    }
    
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
      // Create a new workbook with modified data
      const headers = previewData.headers;
      const dataToUpload = allRowsData.map(row => {
        // Exclude internal properties like _originalRowIndex
        return headers.map(header => row[header] || '');
      });
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataToUpload]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Residents');
      
      // Convert to blob
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const formData = new FormData();
      const fileName = isEditingDuplicates ? 'residents_duplicates.xlsx' : (file ? file.name : 'residents.xlsx');
      formData.append('file', blob, fileName);
      formData.append('branchId', selectedBranch._id);
      
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/residents/bulk-upload`, {
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
        
        // Check if we should show results modal or auto-close
        const hasErrors = data.data.errors && data.data.errors.length > 0;
        const hasSkipped = data.data.skippedCount > 0;
        const allSuccessful = data.data.uploadedCount > 0 && !hasErrors && !hasSkipped;
        
        // If there are errors or skipped items, show results modal for review
        if (hasErrors || hasSkipped) {
          setShowResultsModal(true);
        } else if (allSuccessful) {
          // If all residents were successfully uploaded with no errors or skipped, auto-close after showing success messages
          setTimeout(() => {
            handleAutoClose();
          }, 3000); // Wait 3 seconds to show success toasts
        } else {
          // Fallback: show results modal
          setShowResultsModal(true);
        }
        
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

  const handleEditDuplicates = () => {
    if (!uploadResults || !uploadResults.duplicates || uploadResults.duplicates.length === 0) {
      toast.error('No duplicate data available');
      return;
    }
    
    if (!originalAllRowsData || !previewData) {
      toast.error('Original data not available. Please re-upload the file.');
      return;
    }
    
    // Get duplicate row numbers (convert from 1-based to 0-based index)
    const duplicateRowNumbers = uploadResults.duplicates.map(dup => dup.row - 1);
    
    // Extract duplicate rows from original data
    const duplicateRows = duplicateRowNumbers
      .filter(rowNum => rowNum >= 0 && rowNum < originalAllRowsData.length)
      .map(rowNum => {
        const row = { ...originalAllRowsData[rowNum] };
        // Remove internal properties
        delete row._originalRowIndex;
        return row;
      })
      .filter(Boolean);
    
    if (duplicateRows.length === 0) {
      toast.error('Could not find duplicate rows in original data');
      return;
    }
    
    // Close results modal and show duplicates in preview for editing
    setShowResultsModal(false);
    setIsEditingDuplicates(true);
    setAllRowsData(duplicateRows);
    setDuplicateRowsData(duplicateRows);
    setPreviewData({
      ...previewData,
      preview: duplicateRows,
      totalRows: duplicateRows.length
    });
    setEditingRowIndex(null);
    setEditedRowData(null);
    
    toast.info(`Please edit the ${duplicateRows.length} duplicate entries below. Update email or phone to make them unique, then click "Upload Residents" to resubmit.`, { duration: 5000 });
  };

  const handleClose = () => {
    setUploadResults(null);
    setShowColumnInfo(false);
    setIsEditingDuplicates(false);
    setDuplicateRowsData(null);
    resetForm();
    onClose();
  };

  const handleResultsModalClose = () => {
    setShowResultsModal(false);
    setUploadResults(null);
    setShowColumnInfo(false);
    setIsEditingDuplicates(false);
    setDuplicateRowsData(null);
    
    // Reset form
    resetForm();
    
    console.log('🔄 ResidentBulkUploadModal: Closing results modal and triggering refresh');
    
    // Close modal and refresh data
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const handleAutoClose = () => {
    // Close results modal if open
    setShowResultsModal(false);
    setUploadResults(null);
    setIsEditingDuplicates(false);
    setDuplicateRowsData(null);
    
    // Reset form
    resetForm();
    
    // Trigger refresh and close main modal
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setAllRowsData(null);
    setOriginalAllRowsData(null);
    setUploadResults(null);
    setUploadProgress(0);
    setEditingRowIndex(null);
    setEditedRowData(null);
    setShowDeleteModal(false);
    setRowToDelete(null);
    setIsEditingDuplicates(false);
    setDuplicateRowsData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Upload Residents</h2>
              <p className="text-xs text-gray-600">Upload multiple residents from Excel file</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Download Sample Template - Compact */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Sample Template</h3>
                <p className="text-xs text-gray-600">
                  Get a ready-to-use Excel file with the correct format. Simply fill in your resident information and upload.
                </p>
              </div>
              <button
                onClick={downloadSample}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm ml-4 flex-shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
            
            {/* Column Info - Collapsible */}
            <div className="border-t border-blue-200 pt-3 mt-3">
              <button
                onClick={() => setShowColumnInfo(!showColumnInfo)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                  <span className="text-sm font-medium text-gray-700">
                    What information do I need to include?
                  </span>
                </div>
                {showColumnInfo ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              
              {showColumnInfo && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 space-y-3 max-h-96 overflow-y-auto">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-3">
                    <p className="text-xs text-yellow-800 flex items-center space-x-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span><strong>Phone Number Format:</strong> Use exactly 10 digits without country code (e.g., "9876543210" not "+91-9876543210")</span>
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2 font-semibold">Your Excel file should include these columns:</p>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">First Name & Last Name</span>
                        <p className="text-xs text-gray-600">The resident's full name (both required)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Email Address</span>
                        <p className="text-xs text-gray-600">Must be unique and valid email format</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Phone Number</span>
                        <p className="text-xs text-gray-600">Exactly 10 digits, no country code or special characters</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Gender</span>
                        <p className="text-xs text-gray-600">Choose from: male, female, or other</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Date of Birth</span>
                        <p className="text-xs text-gray-600">Format: YYYY-MM-DD (e.g., 1995-05-15)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Permanent Address</span>
                        <p className="text-xs text-gray-600">Street, City, State, and Pincode (6 digits)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Emergency Contact</span>
                        <p className="text-xs text-gray-600">Name, relationship, phone (10 digits), and full address</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Work Details (Optional)</span>
                        <p className="text-xs text-gray-600">Company, designation, address, phone, email, salary, and joining date</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      <div>
                        <span className="text-xs font-semibold text-gray-900">Check-in & Contract Dates</span>
                        <p className="text-xs text-gray-600">Check-in date and contract start date (required), end date (optional)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-xs text-amber-800">
                      ⚠️ <strong>Note:</strong> Residents with existing email or phone number will be automatically skipped to prevent duplicates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Upload - Compact */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Upload Excel File</h3>
              <p className="text-xs text-gray-600 mb-3">
                Drag and drop your file here, or click to browse
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
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </button>
            </div>
            
            {file && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs font-medium text-green-900">{file.name}</p>
                      <p className="text-xs text-green-700">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Data - Compact with Edit/Delete */}
          {previewData && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900">
                  {isEditingDuplicates ? (
                    <span className="flex items-center space-x-2">
                      <span>Editing Duplicates ({previewData.totalRows} rows)</span>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Duplicates</span>
                    </span>
                  ) : (
                    `Data Preview (${previewData.totalRows} rows)`
                  )}
                </h3>
                <span className="text-xs text-gray-500">
                  {isEditingDuplicates 
                    ? 'Edit duplicate entries and click "Upload Residents" to resubmit'
                    : 'Edit or delete rows before uploading'}
                </span>
              </div>
              
              {isEditingDuplicates && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>Editing Mode:</strong> These are the duplicate entries. Please update the email or phone number to make them unique, then click "Upload Residents" to resubmit.
                </div>
              )}
              
              <div className="overflow-x-auto max-h-96 relative">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-gray-200 bg-white">
                      {previewData.headers.map((header, index) => (
                        <th key={index} className="text-left py-1.5 px-2 font-medium text-gray-700 bg-white">
                          {header}
                        </th>
                      ))}
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-28 bg-white sticky right-0 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className={`border-b border-gray-100 ${
                          editingRowIndex === rowIndex 
                            ? 'bg-blue-50' 
                            : isEditingDuplicates 
                              ? 'bg-yellow-50 hover:bg-yellow-100' 
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        {previewData.headers.map((header, colIndex) => (
                          <td key={colIndex} className="py-1.5 px-2">
                            {editingRowIndex === rowIndex ? (
                              <input
                                type="text"
                                value={editedRowData?.[header] || ''}
                                onChange={(e) => {
                                  setEditedRowData({
                                    ...editedRowData,
                                    [header]: e.target.value
                                  });
                                }}
                                className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                placeholder={header}
                              />
                            ) : (
                              <span className="text-gray-600">{row[header] || '-'}</span>
                            )}
                          </td>
                        ))}
                        <td className={`py-1.5 px-2 sticky right-0 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.1)] ${
                          editingRowIndex === rowIndex ? 'bg-blue-50' : 'bg-inherit'
                        }`}>
                          {editingRowIndex === rowIndex ? (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveRow(rowIndex)}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors relative z-40"
                                title="Save"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors relative z-40"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleEditRow(rowIndex)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-40"
                                title="Edit"
                                disabled={editingRowIndex !== null}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(rowIndex)}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-40"
                                title="Delete"
                                disabled={editingRowIndex !== null}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {editingRowIndex !== null && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                  <strong>Editing mode:</strong> Make your changes and click Save to update, or Cancel to discard.
                </div>
              )}
            </div>
          )}

          {/* Upload Progress - Compact */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-xs font-medium text-blue-900">Uploading...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-1.5">
                Please wait while we process your data...
              </p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={(!allRowsData || allRowsData.length === 0) || isUploading}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg text-sm font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditingDuplicates ? 'Resubmitting...' : 'Uploading...'}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{isEditingDuplicates ? 'Resubmit Residents' : 'Upload Residents'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Results Modal */}
      {showResultsModal && uploadResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Compact Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Upload Results</h2>
                  <p className="text-xs text-gray-600">Summary of your bulk upload operation</p>
                </div>
              </div>
              <button
                onClick={handleResultsModalClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Summary Statistics - Compact */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{uploadResults.totalRows}</div>
                  <div className="text-xs text-green-700">Total Rows</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{uploadResults.uploadedCount}</div>
                  <div className="text-xs text-blue-700">Uploaded</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-600">{uploadResults.skippedCount}</div>
                  <div className="text-xs text-yellow-700">Skipped</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{uploadResults.errors?.length || 0}</div>
                  <div className="text-xs text-red-700">Errors</div>
                </div>
              </div>

              {/* Duplicates Section */}
              {uploadResults.duplicates && uploadResults.duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-800">
                        Duplicates Found ({uploadResults.duplicates.length})
                      </h3>
                    </div>
                    <button
                      onClick={handleEditDuplicates}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit & Resubmit</span>
                    </button>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    The following residents were skipped because they already exist in the system. Click "Edit & Resubmit" to fix and upload them again.
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

            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleResultsModalClose}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRowToDelete(null);
        }}
        onConfirm={confirmDeleteRow}
        title="Delete Row"
        message="Are you sure you want to delete this row? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ResidentBulkUploadModal; 