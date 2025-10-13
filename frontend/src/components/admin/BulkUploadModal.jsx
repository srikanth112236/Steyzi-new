import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const BulkUploadModal = ({ isOpen, onClose, selectedBranch, onSuccess }) => {
  const [uploadType, setUploadType] = useState('floors'); // 'floors' or 'rooms'
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const fileInputRef = useRef(null);

  // Sample data for floors
  const sampleFloorsData = [
    {
      floorName: 'Ground Floor',
      totalRooms: 8
    },
    {
      floorName: 'First Floor',
      totalRooms: 10
    },
    {
      floorName: 'Second Floor',
      totalRooms: 12
    },
    {
      floorName: 'Third Floor',
      totalRooms: 8
    },
    {
      floorName: 'Fourth Floor',
      totalRooms: 6
    }
  ];

  // Sample data for rooms (220 records as requested)
  const generateSampleRoomsData = () => {
    const rooms = [];
    const floors = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor'];
    const sharingTypes = ['1-sharing', '2-sharing', '3-sharing', '4-sharing'];
    const costs = [8000, 6000, 5000, 4000]; // Costs for each sharing type

    let roomNumber = 101;
    floors.forEach((floor, floorIndex) => {
      const roomsPerFloor = floorIndex === 0 ? 8 : floorIndex === 1 ? 10 : floorIndex === 2 ? 12 : floorIndex === 3 ? 8 : 6;
      
      for (let i = 0; i < roomsPerFloor; i++) {
        const sharingTypeIndex = Math.floor(Math.random() * sharingTypes.length);
        const sharingType = sharingTypes[sharingTypeIndex];
        const cost = costs[sharingTypeIndex];
        
        rooms.push({
          floorName: floor,
          roomNumber: roomNumber.toString(),
          sharingType: sharingType,
          cost: cost
        });
        roomNumber++;
      }
    });
    
    return rooms;
  };

  const downloadSample = () => {
    const sampleData = uploadType === 'floors' ? sampleFloorsData : generateSampleRoomsData();
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    
    // Set column widths
    const colWidths = uploadType === 'floors' 
      ? [{ wch: 15 }, { wch: 12 }] 
      : [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 10 }];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, uploadType === 'floors' ? 'Floors' : 'Rooms');
    
    // Generate filename
    const fileName = uploadType === 'floors' 
      ? 'sample_floors_template.xlsx' 
      : 'sample_rooms_template.xlsx';
    
    // Download file
    XLSX.writeFile(wb, fileName);
    
    toast.success(`Sample ${uploadType} template downloaded successfully!`);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    previewExcelData(selectedFile);
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
          toast.error('Excel file must have at least a header row and one data row');
          return;
        }

        // Convert to objects using first row as headers
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        const preview = rows.slice(0, 5).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        setPreviewData({
          headers,
          preview,
          totalRows: rows.length
        });

        toast.success(`Preview loaded: ${rows.length} rows found`);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error('Error reading Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (!file || !selectedBranch) {
      toast.error('Please select a file and ensure branch is selected');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);
      formData.append('branchId', selectedBranch._id);

      const response = await fetch('/api/pg/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadResults(data.data);

        // Show success message
        toast.success(`✅ Successfully processed ${data.data.totalRows} rows!`);

        // Show detailed results
        if (data.data.uploadedCount > 0) {
          toast.success(`📤 Uploaded: ${data.data.uploadedCount} ${uploadType}`, { duration: 3000 });
        }

        if (data.data.skippedCount > 0) {
          toast.error(`⏭️ Skipped: ${data.data.skippedCount} duplicates`, { duration: 4000 });
        }

        if (data.data.errors && data.data.errors.length > 0) {
          toast.error(`❌ Errors: ${data.data.errors.length} rows had issues`, { duration: 5000 });
        }

        setUploadProgress(100);

        // Show results modal
        setShowResultsModal(true);

      } else {
        // Handle subscription errors
        if (data.subscriptionError) {
          // Close the modal and let parent component handle the subscription error
          onClose();

          // Trigger subscription error handling in parent
          if (onSuccess) {
            onSuccess({ subscriptionError: true, upgradeRequired: data.upgradeRequired, message: data.message });
          }

          toast.error(data.message, { duration: 6000 });
        } else {
          toast.error(data.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
    
    // Close modal and refresh data
    onSuccess();
    onClose();
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setUploadResults(null);
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
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}</h2>
              <p className="text-sm text-gray-600">Import {uploadType} data from Excel file</p>
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
          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="floors"
                  checked={uploadType === 'floors'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Floors</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="rooms"
                  checked={uploadType === 'rooms'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Rooms</span>
              </label>
            </div>
          </div>

          {/* Download Sample */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Download Sample Template</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download a sample Excel file with the correct format for {uploadType} data
                </p>
              </div>
              <button
                onClick={downloadSample}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <Download className="h-4 w-4" />
                <span>Download Sample</span>
              </button>
            </div>
            
            {/* Expected columns info */}
            <div className="mt-3 text-sm text-blue-700">
              <p className="font-medium">Expected columns for {uploadType}:</p>
              {uploadType === 'floors' ? (
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>floorName:</strong> Name of the floor (e.g., "Ground Floor")</li>
                  <li><strong>totalRooms:</strong> Total number of rooms on this floor</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>floorName:</strong> Name of the floor (must match existing floor)</li>
                  <li><strong>roomNumber:</strong> Room number (e.g., "101", "102")</li>
                  <li><strong>sharingType:</strong> Sharing type ("1-sharing", "2-sharing", "3-sharing", "4-sharing")</li>
                  <li><strong>cost:</strong> Cost per bed (optional - will auto-assign based on sharing type)</li>
                </ul>
              )}
              {uploadType === 'rooms' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    💡 <strong>Auto-allocation:</strong> Beds will be automatically created based on sharing type:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                    <li>• 1-sharing: 1 bed (101-A)</li>
                    <li>• 2-sharing: 2 beds (101-A, 101-B)</li>
                    <li>• 3-sharing: 3 beds (101-A, 101-B, 101-C)</li>
                    <li>• 4-sharing: 4 beds (101-A, 101-B, 101-C, 101-D)</li>
                  </ul>
                  <p className="text-xs text-yellow-800 mt-1">
                    💰 <strong>Default costs:</strong> 1-sharing: ₹8000, 2-sharing: ₹6000, 3-sharing: ₹5000, 4-sharing: ₹4000
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</p>
                <p className="text-gray-600 mb-4">
                  Drag and drop your Excel file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Choose File
                </button>
              </div>
            ) : (
              <div>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">File Selected</p>
                <p className="text-gray-600 mb-2">{file.name}</p>
                <p className="text-sm text-gray-500 mb-4">
                  File size: {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-200"
                  >
                    Change File
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition duration-200"
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
                  <span>Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}</span>
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
                    The following items were skipped because they already exist in the system:
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

              {/* Room Statistics */}
              {uploadType === 'rooms' && uploadResults.roomStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">Room Statistics</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.roomStats.totalBeds}</div>
                      <div className="text-xs text-blue-700">Total Beds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">₹{Math.round(uploadResults.roomStats.averageCost)}</div>
                      <div className="text-xs text-blue-700">Average Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{uploadResults.roomStats.totalRooms}</div>
                      <div className="text-xs text-blue-700">Total Rooms</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{Object.keys(uploadResults.roomStats.sharingTypeBreakdown || {}).length}</div>
                      <div className="text-xs text-blue-700">Sharing Types</div>
                    </div>
                  </div>
                  
                  {uploadResults.roomStats.sharingTypeBreakdown && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Sharing Type Breakdown:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(uploadResults.roomStats.sharingTypeBreakdown).map(([type, count]) => (
                          <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {type}: {count}
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
                        Successfully uploaded {uploadResults.uploadedCount} {uploadType}!
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

export default BulkUploadModal; 