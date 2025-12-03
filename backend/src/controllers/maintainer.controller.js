const User = require('../models/user.model');
const Maintainer = require('../models/maintainer.model');
const Branch = require('../models/branch.model');
const bcrypt = require('bcryptjs');

class MaintainerController {
  /**
   * Create a new maintainer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createMaintainer(req, res) {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        password,
        specialization,
        status,
        pgId
      } = req.body;

      // Input validation
      if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          errors: {
            firstName: !firstName ? 'First name is required' : null,
            lastName: !lastName ? 'Last name is required' : null,
            email: !email ? 'Email is required' : null,
            phone: !phone ? 'Phone number is required' : null
          }
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
          errors: {
            email: 'Please enter a valid email address'
          }
        });
      }

      // Phone validation (10 digits)
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          errors: {
            phone: 'Phone number must be exactly 10 digits'
          }
        });
      }

      // Name validation
      if (firstName.trim().length < 2 || firstName.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'First name must be between 2 and 50 characters',
          errors: {
            firstName: 'First name must be between 2 and 50 characters'
          }
        });
      }

      if (lastName.trim().length < 2 || lastName.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Last name must be between 2 and 50 characters',
          errors: {
            lastName: 'Last name must be between 2 and 50 characters'
          }
        });
      }

      // Set default password as firstName#2025 if no password provided
      const defaultPassword = password || `${firstName}#2025`;

      console.log('🔍 Maintainer Creation Request:', {
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pgId: pgId || req.user.pgId,
        passwordSet: password ? 'provided' : `default: ${defaultPassword}`
      });

      // Check if email already exists in the entire system (not just within PG)
      const existingEmail = await User.findOne({ 
        email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
      });

      // Check if phone already exists in the entire system (not just within PG)
      const existingPhone = await User.findOne({ 
        phone: phone.trim()
      });

      console.log('🕵️ Existing User Check (System-wide):', {
        existingEmail: !!existingEmail,
        existingPhone: !!existingPhone,
        emailMatch: existingEmail?.email,
        phoneMatch: existingPhone?.phone
      });

      // Return specific error messages
      if (existingEmail && existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Email and phone number already exist in the system',
          errors: {
            email: 'This email is already registered',
            phone: 'This phone number is already registered'
          }
        });
      }

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists in the system',
          errors: {
            email: 'This email is already registered. Please use a different email address.'
          }
        });
      }

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists in the system',
          errors: {
            phone: 'This phone number is already registered. Please use a different phone number.'
          }
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      // Create user with trimmed and normalized data
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        role: 'maintainer',
        password: hashedPassword,
        pgId: pgId || req.user.pgId  // Use provided PG ID or user's PG ID
      });

      // Create maintainer profile
      const maintainer = new Maintainer({
        user: user._id,
        pgId: pgId || req.user.pgId,  // Add pgId to the Maintainer model
        specialization: specialization || ['general'],
        status: status || 'active',
        branches: []
      });

      // Link maintainer to user
      user.maintainerProfile = maintainer._id;

      // Save both user and maintainer
      await user.save();
      await maintainer.save();

      res.status(201).json({
        success: true,
        message: `Maintainer created successfully. ${!password ? `Default password set: ${defaultPassword}` : 'Password set as provided.'}`,
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            role: user.role
          },
          maintainer: {
            _id: maintainer._id,
            specialization: maintainer.specialization,
            status: maintainer.status
          },
          loginCredentials: {
            email: user.email,
            password: !password ? defaultPassword : 'Password set as provided',
            passwordType: password ? 'custom' : 'default'
          }
        }
      });
    } catch (error) {
      console.error('Error creating maintainer:', error);
      
      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const fieldName = field === 'email' ? 'email' : field === 'phone' ? 'phone' : field;
        return res.status(400).json({
          success: false,
          message: `${fieldName === 'email' ? 'Email' : 'Phone number'} already exists in the system`,
          errors: {
            [fieldName]: `This ${fieldName === 'email' ? 'email' : 'phone number'} is already registered`
          }
        });
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create maintainer',
        error: error.message
      });
    }
  }

  /**
   * Get all maintainers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllMaintainers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        specialization 
      } = req.query;

      // Build filter
      const filter = { pgId: req.user.pgId };
      if (status) filter.status = status;
      if (specialization) {
        filter.specialization = { $in: [specialization] };
      }

      // Pagination
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        populate: {
          path: 'user',
          select: 'firstName lastName email phone'
        },
        select: '-__v'
      };

      // Fetch maintainers with pagination
      const result = await Maintainer.paginate(filter, options);

      res.status(200).json({
        success: true,
        data: {
          maintainers: result.docs,
          totalMaintainers: result.totalDocs,
          totalPages: result.totalPages,
          currentPage: result.page
        }
      });
    } catch (error) {
      console.error('Error fetching maintainers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintainers',
        error: error.message
      });
    }
  }

  /**
   * Get a single maintainer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMaintainerById(req, res) {
    try {
      const { id } = req.params;

      const maintainer = await Maintainer.findOne({ 
        _id: id, 
        pgId: req.user.pgId 
      })
        .populate({
          path: 'user',
          select: 'firstName lastName email phone'
        })
        .populate('branches');

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          maintainer: {
            ...maintainer.toObject(),
            assignedBranchCount: maintainer.branches.length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching maintainer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch maintainer',
        error: error.message
      });
    }
  }

  /**
   * Update a maintainer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateMaintainer(req, res) {
    try {
      const { id } = req.params;
      const { 
        firstName, 
        lastName, 
        email, 
        phone,
        specialization, 
        status, 
        branches 
      } = req.body;

      // Find the maintainer
      const maintainer = await Maintainer.findOne({ 
        _id: id, 
        pgId: req.user.pgId 
      });

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      // Update user details
      const user = await User.findById(maintainer.user);
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      await user.save();

      // Update maintainer details
      if (specialization) maintainer.specialization = specialization;
      if (status) maintainer.status = status;
      if (branches) maintainer.branches = branches;

      await maintainer.save();

      // Populate and return updated maintainer
      const updatedMaintainer = await Maintainer.findById(id)
        .populate({
          path: 'user',
          select: 'firstName lastName email phone'
        })
        .populate('branches');

      res.status(200).json({
        success: true,
        data: { maintainer: updatedMaintainer }
      });
    } catch (error) {
      console.error('Error updating maintainer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update maintainer',
        error: error.message
      });
    }
  }

  /**
   * Delete a maintainer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteMaintainer(req, res) {
    try {
      const { id } = req.params;

      // Find the maintainer
      const maintainer = await Maintainer.findOne({ 
        _id: id, 
        pgId: req.user.pgId 
      });

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      // Remove associated user
      await User.findByIdAndDelete(maintainer.user);

      // Remove maintainer
      await Maintainer.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Maintainer deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting maintainer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete maintainer',
        error: error.message
      });
    }
  }

  /**
   * Assign branches to a maintainer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async assignBranches(req, res) {
    try {
      const { maintainerId, branchIds } = req.body;

      // Validate branches exist and belong to the PG
      const branches = await Branch.find({ 
        _id: { $in: branchIds },
        pgId: req.user.pgId
      });

      if (branches.length !== branchIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more branches do not exist or do not belong to your PG'
        });
      }

      // Update maintainer with branches
      const maintainer = await Maintainer.findOneAndUpdate(
        { 
          _id: maintainerId, 
          pgId: req.user.pgId 
        },
        { 
          $addToSet: { 
            branches: { $each: branchIds } 
          } 
        },
        { new: true }
      ).populate('branches');

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          maintainer: {
            _id: maintainer._id,
            branches: maintainer.branches,
            assignedBranchCount: maintainer.branches.length
          }
        }
      });
    } catch (error) {
      console.error('Error assigning branches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign branches',
        error: error.message
      });
    }
  }

  /**
   * Remove branches from a maintainer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeBranches(req, res) {
    try {
      const { maintainerId, branchIds } = req.body;

      // Update maintainer by removing specific branches
      const maintainer = await Maintainer.findOneAndUpdate(
        { 
          _id: maintainerId, 
          pgId: req.user.pgId 
        },
        { 
          $pull: { 
            branches: { $in: branchIds } 
          } 
        },
        { new: true }
      ).populate('branches');

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          maintainer: {
            _id: maintainer._id,
            branches: maintainer.branches,
            assignedBranchCount: maintainer.branches.length
          }
        }
      });
    } catch (error) {
      console.error('Error removing branches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove branches',
        error: error.message
      });
    }
  }

  /**
   * Get maintainer's assigned branches
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAssignedBranches(req, res) {
    try {
      const maintainerId = req.user.maintainerProfile;

      const maintainer = await Maintainer.findById(maintainerId)
        .populate({
          path: 'branches',
          select: 'name address capacity status'
        });

      if (!maintainer) {
        return res.status(404).json({
          success: false,
          message: 'Maintainer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          branches: maintainer.branches,
          branchCount: maintainer.branches.length
        }
      });
    } catch (error) {
      console.error('Error fetching assigned branches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch assigned branches',
        error: error.message
      });
    }
  }
}

module.exports = new MaintainerController();
