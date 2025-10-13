import React from 'react';
import { Bed, X, Save, Home, DollarSign, Users, Hash } from 'lucide-react';

const RoomModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEdit, 
  floors, 
  sharingTypes, 
  handleSharingTypeChange, 
  handleRoomNumberChange, 
  handleNumberOfBedsChange, 
  handleBedNumberChange 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto max-h-[88vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-gray-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Bed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Edit Room' : 'Add New Room'}
              </h3>
              <p className="text-xs text-gray-600 flex items-center mt-0.5">
                <Home className="h-3 w-3 mr-1" />
                {isEdit ? 'Update room details' : 'Create a new room for your PG'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-110"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Floor Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Floor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.floorId}
                  onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white text-sm"
                  required
                >
                  <option value="">Select a floor</option>
                  {floors.map((floor) => (
                    <option key={floor._id} value={floor._id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Choose which floor this room belongs to
              </p>
            </div>

            {/* Room Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Room Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => handleRoomNumberChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  placeholder="e.g., 101, 102"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter a unique room number
              </p>
            </div>

            {/* Number of Beds */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Number of Beds <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfBeds}
                  onChange={(e) => handleNumberOfBedsChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  placeholder="Number of beds"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Specify the number of beds in this room
              </p>
            </div>

            {/* Sharing Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Sharing Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={formData.sharingType}
                  onChange={(e) => handleSharingTypeChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 appearance-none bg-white text-sm"
                  required
                >
                  <option value="">Select sharing type</option>
                  {sharingTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - ₹{type.cost}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Choose the sharing configuration for this room
              </p>
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Cost per Bed <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                  placeholder="Cost per bed"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the cost per bed in this room
              </p>
            </div>
          </div>

          {/* Bed Numbers Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Bed Numbers <span className="text-gray-500">(Optional)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: formData.numberOfBeds }, (_, index) => (
                <div key={index} className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-600">
                    Bed {index + 1}
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-2.5 top-2 h-3 w-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.bedNumbers[index] || ''}
                      onChange={(e) => handleBedNumberChange(index, e.target.value)}
                      className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-xs"
                      placeholder={`e.g., ${formData.roomNumber}-${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Customize bed numbers or leave empty for auto-generation
            </p>
          </div>

          {/* Right-side Preview Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bed className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900">Room {formData.roomNumber || '---'}</h4>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                {formData.numberOfBeds} Beds
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="block text-gray-500">Floor</span>
                <span className="font-semibold text-gray-900">{floors.find(f=>f._id===formData.floorId)?.name || 'Select'}</span>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="block text-gray-500">Sharing</span>
                <span className="font-semibold text-gray-900">{sharingTypes.find(t=>t.id===formData.sharingType)?.name || '—'}</span>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <span className="block text-gray-500">Cost</span>
                <span className="font-bold text-emerald-700">₹{formData.cost || 0}</span>
              </div>
              {formData.bedNumbers?.length > 0 && (
                <div className="col-span-2 p-2 bg-blue-50 rounded-lg">
                  <span className="block text-blue-600">Bed Numbers</span>
                  <span className="text-blue-800">{formData.bedNumbers.filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Compact Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
            >
              <Save className="h-3 w-3" />
              <span>{isEdit ? 'Update Room' : 'Create Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
