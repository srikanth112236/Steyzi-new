import React from 'react';
import { Building2, X, Save, Layers } from 'lucide-react';

const FloorModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEdit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-auto transform transition-all duration-300 scale-100">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEdit ? 'Edit Floor' : 'Add New Floor'}
              </h3>
              <p className="text-xs text-gray-600 flex items-center mt-0.5">
                <Layers className="h-3 w-3 mr-1" />
                {isEdit ? 'Update floor details' : 'Create a new floor for your PG'}
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
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {/* Floor Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Floor Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                placeholder="e.g., Ground Floor, First Floor"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter a descriptive name for the floor
            </p>
          </div>

          {/* Total Rooms */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Total Rooms <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm"
                placeholder="Number of rooms on this floor"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Specify the total number of rooms available on this floor
            </p>
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
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
            >
              <Save className="h-3 w-3" />
              <span>{isEdit ? 'Update Floor' : 'Create Floor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FloorModal;
