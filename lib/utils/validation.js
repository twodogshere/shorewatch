import { badRequest } from './errors.js';

/**
 * Email regex pattern
 * @type {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password strength
 * Requires minimum 8 characters
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
export function validatePassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 8;
}

/**
 * Validate required fields in object
 * @param {string[]} fields - Required field names
 * @param {Object} body - Object to validate
 * @throws {AppError} If any required field is missing or empty
 */
export function validateRequired(fields, body) {
  if (!Array.isArray(fields) || typeof body !== 'object' || body === null) {
    throw badRequest('Invalid validation parameters');
  }

  const missing = [];

  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw badRequest('Missing required fields', {
      missing,
    });
  }
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid v4 UUID
 */
export function validateUUID(uuid) {
  if (typeof uuid !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function validateURL(url) {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input (basic XSS prevention)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validate pagination parameters
 * @param {number} limit - Items per page
 * @param {number} offset - Pagination offset
 * @returns {boolean} True if valid
 */
export function validatePagination(limit, offset) {
  const limitNum = Number(limit);
  const offsetNum = Number(offset);

  return (
    Number.isInteger(limitNum) &&
    Number.isInteger(offsetNum) &&
    limitNum >= 1 &&
    limitNum <= 100 &&
    offsetNum >= 0
  );
}
