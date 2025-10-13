/**
 * Password Generator Utility
 * Generates secure temporary passwords for new users
 */

const crypto = require('crypto');

/**
 * Generate a unique, secure temporary password
 * @returns {string} Generated password
 */
const generateUniquePassword = () => {
  // Generate a random password with mixed characters
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Generate a password reset token
 * @returns {string} Reset token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateUniquePassword,
  generatePasswordResetToken
};
