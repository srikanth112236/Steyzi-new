/**
 * Unique ID Generator Utility
 * Generates unique identifiers for various entities
 */

const crypto = require('crypto');

/**
 * Generate a unique ID for Sub Sales Staff
 * @returns {string} Generated unique ID
 */
const generateUniqueId = () => {
  // Generate a unique ID with prefix and timestamp
  const prefix = 'SS';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

  return `${prefix}${timestamp}${random}`.toUpperCase();
};

/**
 * Generate a unique ID for PGs
 * @returns {string} Generated unique PG ID
 */
const generatePGUniqueId = () => {
  const prefix = 'PG';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

  return `${prefix}${timestamp}${random}`.toUpperCase();
};

/**
 * Generate a unique ID for Residents
 * @returns {string} Generated unique Resident ID
 */
const generateResidentUniqueId = () => {
  const prefix = 'RES';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

  return `${prefix}${timestamp}${random}`.toUpperCase();
};

module.exports = {
  generateUniqueId,
  generatePGUniqueId,
  generateResidentUniqueId
};
