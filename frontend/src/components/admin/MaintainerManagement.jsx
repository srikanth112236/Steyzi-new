import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Settings,
  Check,
  X,
  MapPin,
  Shield,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

import maintainerService from '../../services/maintainer.service';
import branchService from '../../services/branch.service';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Textarea
} from '../ui';

// Specialization options with icons and colors
const specializationOptions = [
  { name: 'maintenance', icon: Settings, color: 'blue' },
  { name: 'housekeeping', icon: Shield, color: 'green' },
  { name: 'security', icon: Shield, color: 'red' },
  { name: 'general', icon: Users, color: 'gray' }
];

// Enhanced maintainer card component
const MaintainerCard = ({ 
  maintainer, 
  onEdit, 
  onDelete, 
  onAssignBranch, 
  availableBranches,
  onViewDetails  // New prop for viewing details
}) => {
  const [showActions, setShowActions] = useState(false);

  // Extract user details safely
  const firstName = maintainer.user?.firstName || maintainer.firstName || 'Unknown';
  const lastName = maintainer.user?.lastName || maintainer.lastName || '';
  const email = maintainer.user?.email || maintainer.email || 'N/A';
  const phone = maintainer.user?.phone || maintainer.mobile || maintainer.phone || 'N/A';

  // Safely get branches
  const assignedBranches = Array.isArray(maintainer.branches) 
    ? maintainer.branches 
    : (maintainer.branches ? [maintainer.branches] : []);

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-200 hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 ${
              maintainer.status === 'active'
                ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-600 group-hover:scale-110'
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400'
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {`${firstName} ${lastName}`.trim()}
              </CardTitle>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                maintainer.status === 'active'
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-300'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  maintainer.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {maintainer.status || 'inactive'}
              </div>
            </div>
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onEdit(maintainer); setShowActions(false); }}
                  className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { onDelete(maintainer._id); setShowActions(false); }}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Enhanced Contact info */}
        <div className="space-y-2 p-3 bg-gray-50/50 rounded-lg">
          <div className="flex items-center text-sm text-gray-700">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <span className="truncate font-medium">{email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <span className="font-medium">{phone}</span>
          </div>
        </div>

        {/* Enhanced Specializations */}
        {maintainer.specialization?.length > 0 && (
          <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100/50">
            <div className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <Settings className="h-4 w-4 mr-2 text-blue-600" />
              Specializations
            </div>
            <div className="flex flex-wrap gap-2">
              {maintainer.specialization.slice(0, 3).map(spec => {
                const specOption = specializationOptions.find(o => o.name === spec);
                return specOption ? (
                  <span key={spec} className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-lg ${
                    specOption.color === 'blue' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    specOption.color === 'green' ? 'bg-green-100 text-green-700 border border-green-200' :
                    specOption.color === 'red' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    <specOption.icon className="h-3 w-3 mr-1.5" />
                    {spec.charAt(0).toUpperCase() + spec.slice(1)}
                  </span>
                ) : null;
              })}
              {maintainer.specialization.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-lg">
                  +{maintainer.specialization.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Branches */}
        <div className="p-3 bg-purple-50/30 rounded-lg border border-purple-100/50">
          <div className="text-sm font-semibold text-purple-900 mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-purple-600" />
              Assigned Branches
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(maintainer)}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              View Details
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 flex-1">
              {assignedBranches.length > 0 ? (
                <>
                  {assignedBranches.slice(0, 2).map(branch => (
                    <span 
                      key={typeof branch === 'string' ? branch : branch._id} 
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-lg"
                    >
                      <MapPin className="h-3 w-3 mr-1.5" />
                      {typeof branch === 'string' ? 'Branch' : branch.name}
                    </span>
                  ))}
                  {assignedBranches.length > 2 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 rounded-lg">
                      +{assignedBranches.length - 2} more
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-purple-600 italic">No branches assigned</span>
              )}
            </div>
            {availableBranches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignBranch(maintainer._id, availableBranches[0]._id)}
                className="ml-3 h-8 px-2 bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-xs"
              >
                <UserCheck className="h-3 w-3 mr-1" />
                Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Compact form component (can be used inline or as modal)
const MaintainerForm = ({ isModal = true, isOpen = true, onClose, maintainer, onSubmit, loading, branches = [] }) => {
  const [formData, setFormData] = useState({
    firstName: maintainer?.firstName || maintainer?.user?.firstName || '',
    lastName: maintainer?.lastName || maintainer?.user?.lastName || '',
    email: maintainer?.email || maintainer?.user?.email || '',
    phone: maintainer?.mobile || maintainer?.phone || maintainer?.user?.phone || '',
    specialization: maintainer?.specialization || [],
    status: maintainer?.status || 'active',
    branchId: maintainer?.branches?.[0]?._id || 'null' // Use 'null' as default
  });

  useEffect(() => {
    if (maintainer) {
      setFormData({
        firstName: maintainer.firstName || maintainer.user?.firstName || '',
        lastName: maintainer.lastName || maintainer.user?.lastName || '',
        email: maintainer.email || maintainer.user?.email || '',
        phone: maintainer.mobile || maintainer.phone || maintainer.user?.phone || '',
        specialization: maintainer.specialization || [],
        status: maintainer.status || 'active',
        branchId: maintainer.branches?.[0]?._id || 'null'
      });
    } else {
      setFormData({
        firstName: '', 
        lastName: '', 
        email: '', 
        phone: '',
        specialization: [], 
        status: 'active',
        branchId: 'null'
      });
    }
  }, [maintainer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isModal && !isOpen) return null;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name *</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
            className="h-10 bg-white/90 border-white/30 focus:border-blue-300 focus:ring-blue-200"
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name *</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
            className="h-10 bg-white/90 border-white/30 focus:border-blue-300 focus:ring-blue-200"
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          className="h-10 bg-white/90 border-white/30 focus:border-blue-300 focus:ring-blue-200"
          placeholder="Enter email address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          pattern="[0-9]{10}"
          required
          className="h-10 bg-white/90 border-white/30 focus:border-blue-300 focus:ring-blue-200"
          placeholder="Enter 10-digit phone number"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Specializations</Label>
        <div className="grid grid-cols-2 gap-3">
          {specializationOptions.map(spec => (
            <Button
              key={spec.name}
              type="button"
              variant={formData.specialization.includes(spec.name) ? "default" : "outline"}
              size="sm"
              onClick={() => setFormData(prev => ({
                ...prev,
                specialization: prev.specialization.includes(spec.name)
                  ? prev.specialization.filter(s => s !== spec.name)
                  : [...prev.specialization, spec.name]
              }))}
              className={`justify-start h-10 text-sm transition-all duration-200 ${
                formData.specialization.includes(spec.name)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'bg-white/90 border-white/30 hover:bg-white hover:border-gray-300'
              }`}
            >
              <spec.icon className="h-4 w-4 mr-2" />
              {spec.name.charAt(0).toUpperCase() + spec.name.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="h-10 bg-white/90 border-white/30 focus:border-blue-300">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Branch Selection */}
      <div className="space-y-2">
        <Label htmlFor="branchId" className="text-sm font-medium text-gray-700">Assign Branch</Label>
        <Select
          value={formData.branchId || 'null'}
          onValueChange={(value) => setFormData(prev => ({ 
            ...prev, 
            branchId: value === 'null' ? null : value 
          }))}
        >
          <SelectTrigger className="h-10 bg-white/90 border-white/30 focus:border-blue-300">
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">No Branch</SelectItem>
            {branches.filter(branch => !branch.maintainerId).map(branch => (
              <SelectItem key={branch._id} value={branch._id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">Optional: Assign a branch to this maintainer</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {isModal && onClose && (
          <Button type="button" variant="outline" onClick={onClose} className="bg-white/90 border-white/30 hover:bg-white hover:border-gray-300">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {loading ? 'Saving...' : maintainer ? 'Update Maintainer' : 'Create Maintainer'}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                {maintainer ? <Edit className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
              </div>
              {maintainer ? 'Edit Maintainer' : 'Add New Maintainer'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {formContent}
          </CardContent>
        </Card>
      </div>
    );
  }

  return formContent;
};

// Maintainer Details Modal for compact preview
const MaintainerDetailsModal = ({ 
  isOpen, 
  onClose, 
  maintainer, 
  branches = [] // Add default empty array
}) => {
  if (!isOpen || !maintainer) return null;

  // Robust user details extraction
  const extractUserDetail = (paths, fallback = 'N/A') => {
    for (const path of paths) {
      const value = path.split('.').reduce((obj, key) => 
        obj && obj[key] !== undefined ? obj[key] : undefined, 
        maintainer
      );
      if (value) return value;
    }
    return fallback;
  };

  // Extract details with multiple possible paths
  const firstName = extractUserDetail([
    'user.firstName', 
    'firstName', 
    'name'
  ], 'Unknown');
  
  const lastName = extractUserDetail([
    'user.lastName', 
    'lastName'
  ], '');
  
  const email = extractUserDetail([
    'user.email', 
    'email'
  ]);
  
  const phone = extractUserDetail([
    'user.phone', 
    'mobile', 
    'phone'
  ]);

  // Extract specializations
  const specializations = Array.isArray(maintainer.specialization) 
    ? maintainer.specialization 
    : (maintainer.specialization ? [maintainer.specialization] : []);

  // Extract branches
  const extractBranches = () => {
    if (!maintainer.branches) return [];
    
    // Handle different possible branch formats
    if (typeof maintainer.branches === 'string') {
      return [maintainer.branches];
    }
    
    if (Array.isArray(maintainer.branches)) {
      // If it's an array of strings or branch objects
      return maintainer.branches.map(branch => {
        // If branch is a string ID
        if (typeof branch === 'string') return branch;
        
        // If branch is an object, return the full branch object
        return branch;
      });
    }
    
    // If branches is an object, try to convert to array
    return Object.values(maintainer.branches).filter(Boolean);
  };

  const assignedBranches = extractBranches();

  // Enhanced branch name extraction
  const getBranchName = (branch) => {
    // If branch is a string, try to find the full branch details
    if (typeof branch === 'string') {
      const fullBranch = branches.find(b => b._id === branch || b.id === branch);
      return fullBranch ? fullBranch.name : 'Unnamed Branch';
    }
    
    // If branch is an object, use its name
    return branch.name || branch.branchName || 'Unnamed Branch';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold 
              ${maintainer.status === 'active' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
              {(firstName?.[0] || '') + (lastName?.[0] || '')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {`${firstName} ${lastName}`.trim()}
              </h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                maintainer.status === 'active'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}>
                {maintainer.status || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-800">{email}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-800">{phone}</span>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {specializations.length > 0 ? (
                specializations.map(spec => {
                  const specOption = specializationOptions.find(o => o.name === spec);
                  return specOption ? (
                    <span 
                      key={spec} 
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        specOption.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        specOption.color === 'green' ? 'bg-green-100 text-green-700' :
                        specOption.color === 'red' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <specOption.icon className="h-3 w-3 mr-1.5" />
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-gray-500 italic">No specializations</span>
              )}
            </div>
          </div>

          {/* Assigned Branches */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Assigned Branches</p>
            {assignedBranches.length > 0 ? (
              <div className="space-y-2">
                {assignedBranches.map((branch, index) => {
                  // Handle different branch data formats
                  const branchName = typeof branch === 'string' 
                    ? getBranchName(branch)
                    : (branch.name || branch.branchName || 'Unnamed Branch');
                  
                  const branchAddress = typeof branch === 'object' && branch.address 
                    ? `${branch.address.city || ''}, ${branch.address.state || ''}`.trim()
                    : '';

                  return (
                    <div 
                      key={typeof branch === 'string' ? branch : (branch._id || index)} 
                      className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-center space-x-3"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{branchName}</p>
                        {branchAddress && (
                          <p className="text-xs text-gray-600">{branchAddress}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600 italic">No branches assigned</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const MaintainerManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [maintainers, setMaintainers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaintainer, setEditingMaintainer] = useState(null);
  const [selectedMaintainer, setSelectedMaintainer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('current');

  // Fetch maintainers and branches on component mount
  useEffect(() => {
    fetchMaintainersAndBranches();
  }, []);

  // Filter maintainers based on search and filters
  const filteredMaintainers = useMemo(() => {
    return maintainers.filter(maintainer => {
      const matchesSearch = searchTerm === '' ||
        `${maintainer.user.firstName} ${maintainer.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        maintainer.user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || maintainer.status === statusFilter;

      const matchesSpecialization = specializationFilter === 'all' ||
        maintainer.specialization?.includes(specializationFilter);

      return matchesSearch && matchesStatus && matchesSpecialization;
    });
  }, [maintainers, searchTerm, statusFilter, specializationFilter]);

  // Get available branches (unassigned)
  const availableBranches = useMemo(() => {
    return branches.filter(branch => !branch.maintainerId);
  }, [branches]);

  // Fetch maintainers and branches
  const fetchMaintainersAndBranches = async () => {
    try {
      setLoading(true);
      
      const [maintainersResponse, branchesResponse] = await Promise.all([
        maintainerService.getAllMaintainers(),
        branchService.getBranchesWithMaintainers()
      ]);
      
      if (maintainersResponse.success && branchesResponse.success) {
        setMaintainers(maintainersResponse.data.maintainers || []);
        setBranches(branchesResponse.data.branches || []);
      } else {
        toast.error('Failed to fetch maintainers or branches');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      toast.error('First and last name are required');
      return;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    try {
      setLoading(true);
      
      const maintainerData = {
        ...formData,
        pgId: user.pgId
      };
      
      const apiCall = editingMaintainer 
        ? () => maintainerService.updateMaintainer(editingMaintainer._id, maintainerData)
        : () => maintainerService.createMaintainer(maintainerData);
      
      const response = await apiCall();
      
      if (response.success) {
        const maintainerId = response.data._id || response.data.maintainer._id;
        
        // If a branch is selected, assign it
        if (formData.branchId && formData.branchId !== 'null') {
          try {
            await branchService.assignMaintainerToBranch({
              branchId: formData.branchId,
              maintainerId: maintainerId
            });
          } catch (assignError) {
            console.warn('Branch assignment failed:', assignError);
            toast.warning('Maintainer created, but branch assignment failed');
          }
        }
        
        toast.success(
          editingMaintainer 
            ? 'Maintainer updated successfully!' 
            : 'Maintainer created successfully!'
        );
        
        setShowForm(false);
        setEditingMaintainer(null);
        fetchMaintainersAndBranches();
      } else {
        toast.error(response.message || 'Failed to save maintainer');
      }
    } catch (error) {
      console.error('Error saving maintainer:', error);
      toast.error('An error occurred while saving the maintainer');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (maintainerId) => {
    if (!window.confirm('Are you sure you want to deactivate this maintainer?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await maintainerService.softDeleteMaintainer(maintainerId);
      
      if (response.success) {
        toast.success('Maintainer deactivated successfully');
        fetchMaintainersAndBranches();
      } else {
        toast.error(response.message || 'Failed to deactivate maintainer');
      }
    } catch (error) {
      console.error('Error deactivating maintainer:', error);
      toast.error('An error occurred while deactivating the maintainer');
    } finally {
      setLoading(false);
    }
  };

  // Handle branch assignment
  const handleBranchAssignment = async (maintainerId, branchId) => {
    try {
      setLoading(true);
      const response = await branchService.assignMaintainerToBranch({
        branchId,
        maintainerId
      });
      
      if (response.success) {
        toast.success('Branch assigned successfully');
        fetchMaintainersAndBranches();
      } else {
        toast.error(response.message || 'Failed to assign branch');
      }
    } catch (error) {
      console.error('Error assigning branch:', error);
      toast.error('An error occurred while assigning the branch');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (maintainer) => {
    setEditingMaintainer(maintainer);
    setShowForm(true);
  };

  // Handle view details
  const handleViewDetails = (maintainer) => {
    setSelectedMaintainer(maintainer);
  };

  // Loading state
  if (loading && maintainers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="space-y-6 p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Maintainers
              </h1>
              <p className="text-gray-600 text-sm">Manage your PG maintainers and their assignments</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm">
            <TabsTrigger value="current" className="flex items-center space-x-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200">
              <Users className="h-4 w-4" />
              <span>Current Maintainers</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center space-x-2 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200">
              <Plus className="h-4 w-4" />
              <span>Add New Maintainer</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Enhanced Search and Filters */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search maintainers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px] text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={specializationFilter}
                  onValueChange={setSpecializationFilter}
                >
                  <SelectTrigger className="w-full md:w-[180px] text-sm">
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {specializationOptions.map(spec => (
                      <SelectItem key={spec.name} value={spec.name}>
                        {spec.name.charAt(0).toUpperCase() + spec.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Results count */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Current Maintainers</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredMaintainers.length} of {maintainers.length} maintainers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Maintainers Grid */}
          {filteredMaintainers.length === 0 ? (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {maintainers.length === 0 ? 'No maintainers found' : 'No maintainers match your filters'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {maintainers.length === 0
                    ? 'Get started by adding your first maintainer to manage your PG operations.'
                    : 'Try adjusting your search terms or filters to find the maintainers you\'re looking for.'}
                </p>
                {maintainers.length === 0 && (
                  <Button
                    onClick={() => {
                      setShowForm(true);
                      setEditingMaintainer(null);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Maintainer
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMaintainers.map((maintainer) => (
                <MaintainerCard
                  key={maintainer._id}
                  maintainer={maintainer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAssignBranch={handleBranchAssignment}
                  availableBranches={availableBranches}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                Add New Maintainer
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Create a new maintainer account for your PG management team
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <MaintainerForm
                isModal={false}
                maintainer={null}
                onSubmit={handleSubmit}
                loading={loading}
                branches={branches}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Modal for editing */}
      <MaintainerForm
        isOpen={showForm && editingMaintainer}
        onClose={() => {
          setShowForm(false);
          setEditingMaintainer(null);
        }}
        maintainer={editingMaintainer}
        onSubmit={handleSubmit}
        loading={loading}
        branches={branches}
      />

      {/* Maintainer Details Modal */}
      <MaintainerDetailsModal
        isOpen={!!selectedMaintainer}
        onClose={() => setSelectedMaintainer(null)}
        maintainer={selectedMaintainer}
        branches={branches} // Pass branches to the modal
      />
      </div>
    </div>
  );
};

export default MaintainerManagement;
