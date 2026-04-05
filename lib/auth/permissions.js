import { AppError } from '../utils/errors.js';

/**
 * Check if permissions array contains a required permission
 * @param {string[]} permissions - Array of granted permissions
 * @param {string} required - Required permission to check
 * @returns {boolean} True if permission is present
 */
export function hasPermission(permissions, required) {
  return Array.isArray(permissions) && permissions.includes(required);
}

/**
 * Create a permission requirement middleware
 * @param {string|string[]} permission - Single permission or array of permissions
 * @returns {Function} Middleware function that checks request.permissions
 * @throws {AppError} If permission is not granted
 */
export function requirePermission(permission) {
  return function checkPermission(request) {
    const permissions = request.permissions || [];
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    // For array of permissions, require at least one (OR logic)
    const hasRequiredPermission = requiredPermissions.some((perm) =>
      hasPermission(permissions, perm)
    );

    if (!hasRequiredPermission) {
      throw new AppError(
        'Insufficient permissions',
        'FORBIDDEN',
        403,
        {
          required: requiredPermissions,
          granted: permissions,
        }
      );
    }

    return true;
  };
}

/**
 * Create a strict permission checker (requires ALL permissions)
 * @param {string[]} permissions - Array of all required permissions
 * @returns {Function} Middleware function that checks request.permissions
 * @throws {AppError} If any required permission is missing
 */
export function requireAllPermissions(permissions) {
  return function checkAllPermissions(request) {
    const grantedPermissions = request.permissions || [];

    const allPresent = permissions.every((perm) =>
      hasPermission(grantedPermissions, perm)
    );

    if (!allPresent) {
      throw new AppError(
        'Insufficient permissions',
        'FORBIDDEN',
        403,
        {
          required: permissions,
          granted: grantedPermissions,
        }
      );
    }

    return true;
  };
}
