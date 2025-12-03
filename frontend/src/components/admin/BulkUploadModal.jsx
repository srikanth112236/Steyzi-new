import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2, AlertTriangle, XCircle, BarChart3, Info, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getApiBaseUrl } from '../../utils/apiUrl';

const BulkUploadModal = ({ isOpen, onClose, selectedBranch, onSuccess }) => {
  const [uploadType, setUploadType] = useState('floors'); // 'floors' or 'rooms'
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showColumnInfo, setShowColumnInfo] = useState(false);
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

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/pg/bulk-upload`, {
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
    setShowColumnInfo(false);
    onClose();
  };

  const handleResultsModalClose = () => {
    setShowResultsModal(false);
    setUploadResults(null);
    
    // Reset form
    setFile(null);
    setPreviewData(null);
    setShowColumnInfo(false);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}</h2>
              <p className="text-xs text-gray-600">Import {uploadType} data from Excel file</p>
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
          {/* Upload Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="floors"
                  checked={uploadType === 'floors'}
                  onChange={(e) => {
                    setUploadType(e.target.value);
                    setShowColumnInfo(false);
                    resetForm();
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Floors</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="rooms"
                  checked={uploadType === 'rooms'}
                  onChange={(e) => {
                    setUploadType(e.target.value);
                    setShowColumnInfo(false);
                    resetForm();
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Rooms</span>
              </label>
            </div>
          </div>

          {/* Download Sample Template - Compact */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Download Sample Template</h3>
                <p className="text-xs text-gray-600">
                  Get a ready-to-use Excel file with the correct format. Simply fill in your {uploadType} information and upload.
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
                <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-2">Your Excel file should include these columns:</p>
                  {uploadType === 'floors' ? (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Floor Name</span>
                          <p className="text-xs text-gray-600">The name of your floor, like "Ground Floor" or "First Floor"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Total Rooms</span>
                          <p className="text-xs text-gray-600">How many rooms are on this floor (e.g., 8, 10, 12)</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Floor Name</span>
                          <p className="text-xs text-gray-600">The floor where this room is located (must match an existing floor)</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Room Number</span>
                          <p className="text-xs text-gray-600">The room number, like "101", "102", or "201"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Sharing Type</span>
                          <p className="text-xs text-gray-600">How many people share the room: "1-sharing", "2-sharing", "3-sharing", or "4-sharing"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <span className="text-xs font-semibold text-gray-900">Cost (Optional)</span>
                          <p className="text-xs text-gray-600">The price per bed. If left empty, we'll use standard pricing based on sharing type</p>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                        <p className="text-xs text-blue-800 font-medium mb-1">💡 Quick Tip:</p>
                        <p className="text-xs text-blue-700">
                          Beds are automatically created based on sharing type. For example, a "2-sharing" room will create 2 beds (Room 101-A and 101-B).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* File Upload - Compact */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!file ? (
              <div>
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">Upload Excel File</p>
                <p className="text-xs text-gray-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                >
                  Choose File
                </button>
              </div>
            ) : (
              <div>
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">File Selected</p>
                <p className="text-xs text-gray-600 mb-2">{file.name}</p>
                <p className="text-xs text-gray-500 mb-4">
                  File size: {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-200"
                  >
                    Change
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Data - Compact */}
          {previewData && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900">Data Preview</h3>
                <span className="text-xs text-gray-500">
                  {previewData.totalRows} rows found
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {previewData.headers.map((header, index) => (
                        <th key={index} className="text-left py-1.5 px-2 font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100">
                        {previewData.headers.map((header, colIndex) => (
                          <td key={colIndex} className="py-1.5 px-2 text-gray-600">
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
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Upload Results Modal - Keep existing */}
      {showResultsModal && uploadResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
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
              {/* Summary Statistics */}
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Duplicates Found ({uploadResults.duplicates.length})
                    </h3>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2">
                    These items were skipped because they already exist:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {uploadResults.duplicates.map((dup, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border border-yellow-200">
                        <div className="w-5 h-5 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-xs font-semibold">
                          {dup.row}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">{dup.name}</div>
                          <div className="text-xs text-yellow-600 truncate">{dup.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors Section */}
              {uploadResults.errors && uploadResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h3 className="text-sm font-semibold text-red-800">
                      Errors ({uploadResults.errors.length})
                    </h3>
                  </div>
                  <p className="text-xs text-red-700 mb-2">
                    These rows had issues and could not be processed:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {uploadResults.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-white rounded border border-red-200">
                        <div className="text-xs text-red-800">{error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadResults.uploadedCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-800">
                        Successfully uploaded {uploadResults.uploadedCount} {uploadType}!
                      </h3>
                      <p className="text-xs text-green-700">
                        Your data has been processed and added to the system.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={handleResultsModalClose}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition duration-200 shadow-md hover:shadow-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUploadModal;
