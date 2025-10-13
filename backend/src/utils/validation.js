const Joi = require('joi');

// Existing schemas...

// Profile update validation schema
const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces'
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .messages({
      'string.email': 'Please enter a valid email address'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit phone number'
    }),
  language: Joi.string()
    .valid('en', 'hi')
    .messages({
      'any.only': 'Language must be either English (en) or Hindi (hi)'
    }),
  theme: Joi.string()
    .valid('light', 'dark')
    .messages({
      'any.only': 'Theme must be either light or dark'
    })
});

// Password change validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

// PG information update validation schema
const updatePGSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'PG name must be at least 2 characters long',
      'string.max': 'PG name cannot exceed 100 characters'
    }),
  description: Joi.string()
    .max(500)
    .trim()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  address: Joi.string()
    .min(10)
    .max(200)
    .trim()
    .messages({
      'string.min': 'Address must be at least 10 characters long',
      'string.max': 'Address cannot exceed 200 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      'string.pattern.base': 'Please enter a valid 10-digit phone number'
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .messages({
      'string.email': 'Please enter a valid email address'
    })
});

// Notification preferences validation schema
const notificationPreferencesSchema = Joi.object({
  emailNotifications: Joi.boolean().default(true),
  smsNotifications: Joi.boolean().default(false),
  pushNotifications: Joi.boolean().default(true),
  paymentReminders: Joi.boolean().default(true),
  maintenanceUpdates: Joi.boolean().default(true),
  newResidentAlerts: Joi.boolean().default(true),
  systemUpdates: Joi.boolean().default(true)
});

module.exports = {
  // Existing exports...
  updateProfileSchema,
  changePasswordSchema,
  updatePGSchema,
  notificationPreferencesSchema
}; 