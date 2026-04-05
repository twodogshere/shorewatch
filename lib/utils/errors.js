/**
 * Application error class
 * Extends Error with additional context for API responses
 */
export class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {string} code - Error code (NOT_FOUND, UNAUTHORIZED, etc.)
   * @param {number} statusCode - HTTP status code
   * @param {Object} [details] - Additional error context
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * Convert error to JSON for API response
   * @returns {Object} Serializable error object
   */
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        ...(Object.keys(this.details).length > 0 && { details: this.details }),
      },
    };
  }
}

/**
 * Bad request error (400)
 * @param {string} message - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function badRequest(message, details) {
  return new AppError(message, 'BAD_REQUEST', 400, details);
}

/**
 * Unauthorized error (401)
 * @param {string} [message] - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function unauthorized(message = 'Unauthorized', details) {
  return new AppError(message, 'UNAUTHORIZED', 401, details);
}

/**
 * Forbidden error (403)
 * @param {string} [message] - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function forbidden(message = 'Forbidden', details) {
  return new AppError(message, 'FORBIDDEN', 403, details);
}

/**
 * Not found error (404)
 * @param {string} [message] - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function notFound(message = 'Not found', details) {
  return new AppError(message, 'NOT_FOUND', 404, details);
}

/**
 * Rate limited error (429)
 * @param {string} [message] - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function rateLimited(message = 'Rate limited', details) {
  return new AppError(message, 'RATE_LIMITED', 429, details);
}

/**
 * Internal server error (500)
 * @param {string} [message] - Error message
 * @param {Object} [details] - Additional context
 * @returns {AppError}
 */
export function internalError(message = 'Internal server error', details) {
  return new AppError(message, 'INTERNAL_ERROR', 500, details);
}

/**
 * Check if error is an AppError
 * @param {Error} error - Error to check
 * @returns {boolean}
 */
export function isAppError(error) {
  return error instanceof AppError;
}
