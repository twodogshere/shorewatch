/**
 * Role definitions and permission mappings for Shorewatch
 * Four role tiers with specific permission sets
 */

export const ROLES = {
  TEAM_LEAD: 'team_lead',
  CONTENT_LEAD: 'content_lead',
  CONTENT_CREATOR: 'content_creator',
  ANALYST: 'analyst',
};

export const PERMISSIONS = {
  // Inbox permissions
  INBOX_VIEW: 'inbox:view',
  INBOX_MANAGE: 'inbox:manage',

  // Content permissions
  CONTENT_VIEW: 'content:view',
  CONTENT_CREATE: 'content:create',
  CONTENT_EDIT: 'content:edit',
  CONTENT_DELETE: 'content:delete',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',

  // Moderation permissions
  MODERATION_VIEW: 'moderation:view',
  MODERATION_APPROVE: 'moderation:approve',
  MODERATION_REJECT: 'moderation:reject',

  // Team management
  TEAM_MANAGE: 'team:manage',
  TEAM_VIEW_MEMBERS: 'team:view_members',
  TEAM_INVITE: 'team:invite',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
};

/**
 * Role to permissions mapping
 * @type {Object<string, string[]>}
 */
export const rolePermissions = {
  team_lead: [
    PERMISSIONS.INBOX_VIEW,
    PERMISSIONS.INBOX_MANAGE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.MODERATION_VIEW,
    PERMISSIONS.MODERATION_APPROVE,
    PERMISSIONS.MODERATION_REJECT,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.TEAM_VIEW_MEMBERS,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],
  content_lead: [
    PERMISSIONS.INBOX_VIEW,
    PERMISSIONS.INBOX_MANAGE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.MODERATION_VIEW,
    PERMISSIONS.TEAM_VIEW_MEMBERS,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  content_creator: [
    PERMISSIONS.INBOX_VIEW,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_EDIT,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  analyst: [
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
  ],
};

/**
 * Get permissions for a specific role
 * @param {string} role - Role identifier
 * @returns {string[]} Array of permissions granted to role
 */
export function getRolePermissions(role) {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 * @param {string} role - Role identifier
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
export function roleHasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}
