const Joi = require('joi');

/**
 * Validation middleware for Sales Manager operations
 */

// General validation request handler
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.details.map(detail => detail.message).join(', ')
      });
    }

    req.body = value;
    next();
  };
};

// Schema definitions
const schemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      }),
    language: Joi.string().valid('en', 'hi').optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional()
  }).min(1), // At least one field must be provided
  changePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'string.empty': 'Current password is required'
      }),
    newPassword: Joi.string().min(8).required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.empty': 'New password is required'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
      })
  })
};

// Validate Sales Manager creation
const validateSalesManagerCreation = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits',
        'string.empty': 'Phone number is required'
      }),
    status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
    commissionRate: Joi.number().min(0).max(100).default(10)
      .messages({
        'number.min': 'Commission rate cannot be negative',
        'number.max': 'Commission rate cannot exceed 100%'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate Sales Manager update
const validateSalesManagerUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      }),
    commissionRate: Joi.number().min(0).max(100)
      .messages({
        'number.min': 'Commission rate cannot be negative',
        'number.max': 'Commission rate cannot exceed 100%'
      }),
    assignedRegions: Joi.array().items(Joi.string().valid('North', 'South', 'East', 'West', 'Central')),
    status: Joi.string().valid('active', 'inactive', 'suspended')
  }).min(1); // At least one field must be provided

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate Sub Sales creation
const validateSubSalesCreation = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits',
        'any.required': 'Phone number is required'
      }),
    address: Joi.object({
      street: Joi.string().trim().allow(''),
      city: Joi.string().trim().allow(''),
      state: Joi.string().trim().allow(''),
      pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).allow('')
        .messages({
          'string.pattern.base': 'Pincode must be 6 digits'
        }),
      country: Joi.string().trim().default('India')
    }).default({}),
    commissionRate: Joi.number().min(0).max(100).default(10)
      .messages({
        'number.min': 'Commission rate cannot be negative',
        'number.max': 'Commission rate cannot exceed 100%'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate Sub Sales update
const validateSubSalesUpdate = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      }),
    commissionRate: Joi.number().min(0).max(100)
      .messages({
        'number.min': 'Commission rate cannot be negative',
        'number.max': 'Commission rate cannot exceed 100%'
      }),
    status: Joi.string().valid('active', 'inactive', 'suspended')
  }).min(1); // At least one field must be provided

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate user registration
const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      }),
    password: Joi.string().min(8).required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.empty': 'Password is required'
      }),
    role: Joi.string().valid('superadmin', 'admin', 'support', 'user').default('user'),
    branchId: Joi.string().when('role', {
      is: Joi.valid('admin', 'support'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate user login
const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Password is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate forgot password
const validateForgotPassword = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate reset password
const validateResetPassword = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required()
      .messages({
        'string.empty': 'Reset token is required'
      }),
    password: Joi.string().min(8).required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.empty': 'Password is required'
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Passwords do not match',
        'string.empty': 'Confirm password is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate email verification
const validateVerifyEmail = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required()
      .messages({
        'string.empty': 'Verification token is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate resend verification
const validateResendVerification = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate profile update
const validateUpdateProfile = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50)
      .messages({
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      }),
    language: Joi.string().valid('en', 'hi').optional(),
    theme: Joi.string().valid('light', 'dark', 'auto').optional()
  }).min(1); // At least one field must be provided

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate email verification query
const validateEmailVerificationQuery = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required()
      .messages({
        'string.empty': 'Verification token is required'
      })
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.query = value;
  next();
};

// Validate password reset query
const validatePasswordResetQuery = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required()
      .messages({
        'string.empty': 'Reset token is required'
      })
  });

  const { error, value } = schema.validate(req.query, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.query = value;
  next();
};

// Validate floor creation/update
const validateFloor = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Floor name is required',
        'string.max': 'Floor name cannot exceed 50 characters'
      }),
    floorNumber: Joi.number().integer().min(0).max(100).required()
      .messages({
        'number.base': 'Floor number must be a number',
        'number.min': 'Floor number cannot be negative',
        'number.max': 'Floor number cannot exceed 100'
      }),
    branchId: Joi.string().required()
      .messages({
        'string.empty': 'Branch ID is required'
      }),
    description: Joi.string().trim().max(200).optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate room creation/update
const validateRoom = (req, res, next) => {
  const schema = Joi.object({
    roomNumber: Joi.string().trim().min(1).max(20).required()
      .messages({
        'string.empty': 'Room number is required',
        'string.max': 'Room number cannot exceed 20 characters'
      }),
    floorId: Joi.string().required()
      .messages({
        'string.empty': 'Floor ID is required'
      }),
    type: Joi.string().valid('single', 'double', 'triple', 'dormitory').required()
      .messages({
        'any.only': 'Room type must be single, double, triple, or dormitory'
      }),
    capacity: Joi.number().integer().min(1).max(20).required()
      .messages({
        'number.base': 'Capacity must be a number',
        'number.min': 'Capacity must be at least 1',
        'number.max': 'Capacity cannot exceed 20'
      }),
    rent: Joi.number().min(0).required()
      .messages({
        'number.base': 'Rent must be a number',
        'number.min': 'Rent cannot be negative'
      }),
    securityDeposit: Joi.number().min(0).optional()
      .messages({
        'number.base': 'Security deposit must be a number',
        'number.min': 'Security deposit cannot be negative'
      }),
    amenities: Joi.array().items(Joi.string()).optional(),
    description: Joi.string().trim().max(300).optional()
      .messages({
        'string.max': 'Description cannot exceed 300 characters'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate PG creation/update
const validatePG = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'PG name is required',
        'string.max': 'PG name cannot exceed 100 characters'
      }),
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
      landmark: Joi.string().trim().optional(), // Allow landmark field
      country: Joi.string().trim().default('India')
    }).required(),
    contact: Joi.object({
      phone: Joi.string().pattern(/^[0-9]{10}$/).required()
        .messages({
          'string.pattern.base': 'Contact number must be 10 digits'
        }),
      email: Joi.string().email().lowercase().trim().optional(),
      alternatePhone: Joi.string().pattern(/^[0-9]{10}$/).optional()
        .messages({
          'string.pattern.base': 'Alternate phone number must be 10 digits'
        })
    }).optional(),
    property: Joi.object({
      type: Joi.string().valid('Gents PG', 'Ladies PG', 'Coliving PG', 'PG', 'Hostel', 'Apartment', 'Independent').optional()
    }).optional(),
    description: Joi.string().trim().max(500).optional()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    // Sales-specific fields (optional)
    salesManager: Joi.string().trim().optional(),
    salesStaff: Joi.string().trim().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    policies: Joi.object({
      checkInTime: Joi.string().optional(),
      checkOutTime: Joi.string().optional(),
      smokingAllowed: Joi.boolean().optional(),
      alcoholAllowed: Joi.boolean().optional(),
      guestsAllowed: Joi.boolean().optional()
    }).optional(),
    status: Joi.string().valid('active', 'inactive', 'under_maintenance').default('active')
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate onboarding step
const validateOnboardingStep = (req, res, next) => {
  const schema = Joi.object({
    step: Joi.string().required()
      .messages({
        'string.empty': 'Step is required'
      }),
    data: Joi.object().required()
      .messages({
        'object.base': 'Data must be an object'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate PG configuration
const validatePGConfiguration = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    sharingTypes: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().optional(),
        cost: Joi.number().min(0).required()
      })
    ).min(1).required()
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate branch creation/update
const validateBranch = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Branch name is required',
        'string.max': 'Branch name cannot exceed 100 characters'
      }),
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
      country: Joi.string().trim().default('India')
    }).required(),
    contactNumber: Joi.string().pattern(/^[0-9]{10}$/).required()
      .messages({
        'string.pattern.base': 'Contact number must be 10 digits'
      }),
    email: Joi.string().email().lowercase().trim().optional(),
    isDefault: Joi.boolean().default(false),
    description: Joi.string().trim().max(300).optional()
      .messages({
        'string.max': 'Description cannot exceed 300 characters'
      }),
    facilities: Joi.array().items(Joi.string()).optional()
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate resident creation/update
const validateResident = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string().trim().min(1).max(50).required()
      .messages({
        'string.empty': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string().email().lowercase().trim().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required'
      }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits',
        'string.empty': 'Phone number is required'
      }),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    address: Joi.object({
      street: Joi.string().trim().max(200).optional(),
      city: Joi.string().trim().max(50).optional(),
      state: Joi.string().trim().max(50).optional(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
      country: Joi.string().trim().default('India')
    }).optional(),
    permanentAddress: Joi.object({
      street: Joi.string().trim().max(200).optional(),
      city: Joi.string().trim().max(50).optional(),
      state: Joi.string().trim().max(50).optional(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
      country: Joi.string().trim().default('India')
    }).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().trim().max(100).optional(),
      relationship: Joi.string().trim().max(50).optional(),
      phone: Joi.alternatives().try(
        Joi.string().pattern(/^[0-9]{10}$/).messages({
          'string.pattern.base': 'Emergency contact phone must be 10 digits'
        }),
        Joi.string().allow('').optional()
      ).optional(),
      address: Joi.alternatives().try(
        Joi.object({
          street: Joi.string().trim().max(200).optional(),
          city: Joi.string().trim().max(50).optional(),
          state: Joi.string().trim().max(50).optional(),
          pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
          country: Joi.string().trim().default('India')
        }),
        Joi.object().allow(null),
        Joi.string().allow('').allow(null),
        Joi.string().trim().max(500).allow('').allow(null)
      ).optional()
    }).optional(),
    workDetails: Joi.object({
      company: Joi.string().trim().max(100).optional(),
      companyName: Joi.string().trim().max(100).optional(),
      designation: Joi.string().trim().max(50).optional(),
      workAddress: Joi.alternatives().try(
        Joi.object({
          street: Joi.string().trim().max(200).optional(),
          city: Joi.string().trim().max(50).optional(),
          state: Joi.string().trim().max(50).optional(),
          pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
          country: Joi.string().trim().default('India')
        }),
        Joi.object().allow(null),
        Joi.string().allow('').allow(null),
        Joi.string().trim().max(500).allow('').allow(null)
      ).optional(),
      officeAddress: Joi.object({
        street: Joi.string().trim().max(200).optional(),
        city: Joi.string().trim().max(50).optional(),
        state: Joi.string().trim().max(50).optional(),
        pincode: Joi.string().pattern(/^[0-9]{6}$/).optional(),
        country: Joi.string().trim().default('India')
      }).optional()
    }).optional(),
    roomId: Joi.string().optional()
      .messages({
        'string.empty': 'Room ID is required when assigning a room'
      }),
    branchId: Joi.string().optional(),
    checkInDate: Joi.date().optional()
      .messages({
        'date.base': 'Check-in date must be a valid date'
      }),
    contractStartDate: Joi.date().optional()
      .messages({
        'date.base': 'Contract start date must be a valid date'
      }),
    checkOutDate: Joi.date().optional(),
    documents: Joi.array().items(Joi.object({
      type: Joi.string().required(),
      url: Joi.string().uri().required(),
      name: Joi.string().required()
    })).optional(),
    status: Joi.string().valid('active', 'inactive', 'checked_out').default('active')
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate document upload
const validateDocumentUpload = (req, res, next) => {
  // This validation is handled by multer middleware in fileUpload.middleware.js
  // But we can add additional validation here
  const schema = Joi.object({
    documentType: Joi.string().valid('id_proof', 'address_proof', 'income_proof', 'photo', 'contract', 'other').required()
      .messages({
        'any.only': 'Invalid document type',
        'string.empty': 'Document type is required'
      }),
    residentId: Joi.string().optional(),
    description: Joi.string().trim().max(200).optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate document metadata update
const validateDocumentMetadata = (req, res, next) => {
  const schema = Joi.object({
    documentType: Joi.string().valid('id_proof', 'address_proof', 'income_proof', 'photo', 'contract', 'other').optional()
      .messages({
        'any.only': 'Invalid document type'
      }),
    residentId: Joi.string().optional(),
    description: Joi.string().trim().max(200).optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      }),
    status: Joi.string().valid('pending', 'approved', 'rejected').optional()
  }).min(1); // At least one field must be provided

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  req.body = value;
  next();
};

// Validate branch creation/update
const validateBranchCreation = (req, res, next) => {
  const schema = Joi.object({
    pgId: Joi.string().required()
      .messages({
        'string.empty': 'PG ID is required'
      }),
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Branch name is required',
        'string.max': 'Branch name cannot exceed 100 characters'
      }),
    address: Joi.object({
      street: Joi.string().trim().max(200).required(),
      city: Joi.string().trim().max(50).required(),
      state: Joi.string().trim().max(50).required(),
      pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
      landmark: Joi.string().trim().optional(),
      country: Joi.string().trim().default('India')
    }).required(),
    maintainerId: Joi.string().optional()
      .messages({
        'string.empty': 'Maintainer ID cannot be empty'
      }),
    maintainer: Joi.object({
      name: Joi.string().trim().min(1).max(100).required(),
      mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().lowercase().trim().optional()
    }).optional(),
    contact: Joi.object({
      phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
      email: Joi.string().email().lowercase().trim().optional(),
      alternatePhone: Joi.string().pattern(/^[0-9]{10}$/).optional()
    }).required(),
    capacity: Joi.object({
      totalRooms: Joi.number().integer().min(0).optional(),
      totalBeds: Joi.number().integer().min(0).optional(),
      availableRooms: Joi.number().integer().min(0).optional()
    }).optional(),
    amenities: Joi.array().items(
      Joi.string().valid('WiFi', 'AC', 'Food', 'Cleaning', 'Security', 'Parking', 'Gym', 'TV', 'Refrigerator', 'Geyser', 'Furnished')
    ).optional(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    isDefault: Joi.boolean().default(false)
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.details.map(detail => detail.message).join(', ')
    });
  }

  // Custom validation: ensure either maintainerId or maintainer is provided
  if (!value.maintainerId && !value.maintainer) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Either maintainerId or maintainer information is required'
    });
  }

  // Custom validation: ensure only one maintainer field is provided
  if (value.maintainerId && value.maintainer) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Cannot provide both maintainerId and maintainer. Please use only one.'
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateRequest,
  schemas,
  validateSalesManagerCreation,
  validateSalesManagerUpdate,
  validateSubSalesCreation,
  validateSubSalesUpdate,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateResendVerification,
  validateUpdateProfile,
  validateEmailVerificationQuery,
  validatePasswordResetQuery,
  validateFloor,
  validateRoom,
  validatePG,
  validateBranch,
  validateBranchCreation,
  validateResident,
  validateDocumentUpload,
  validateDocumentMetadata,
  validateOnboardingStep,
  validatePGConfiguration
};
