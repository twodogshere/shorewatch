import kv from '../kv.js';
import { generateInviteToken, generateTeamId } from '../auth/tokens.js';

const TEAM_KEY_PREFIX = 'team:';
const TEAM_MEMBERS_KEY_PREFIX = 'team:members:';
const INVITE_KEY_PREFIX = 'invite:';
const INVITE_TTL = 7 * 24 * 60 * 60; // 7 days

/**
 * Team object shape
 * @typedef {Object} Team
 * @property {string} teamId - Unique team identifier
 * @property {string} name - Team name
 * @property {string} [description] - Team description
 * @property {string} [website] - Organization website
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Timestamp
 */

/**
 * Team member object shape
 * @typedef {Object} TeamMember
 * @property {string} userId - User ID
 * @property {string} email - User email
 * @property {string} name - Display name
 * @property {string} role - User role (team_lead|content_lead|content_creator|analyst)
 * @property {string[]} permissions - Granted permissions
 * @property {number} joinedAt - Timestamp
 */

/**
 * Get a team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise<Team|null>} Team object or null
 * @throws {Error} If fetch fails
 */
export async function getTeam(teamId) {
  try {
    const key = `${TEAM_KEY_PREFIX}${teamId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new Error(`Failed to get team: ${error.message}`);
  }
}

/**
 * Get all members of a team
 * @param {string} teamId - Team ID
 * @returns {Promise<TeamMember[]>} Array of team members
 * @throws {Error} If fetch fails
 */
export async function getTeamMembers(teamId) {
  try {
    const key = `${TEAM_MEMBERS_KEY_PREFIX}${teamId}`;
    const data = await kv.hgetall(key);
    return Object.values(data || {}).map((member) => JSON.parse(member));
  } catch (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }
}

/**
 * Add a member to a team
 * @param {string} teamId - Team ID
 * @param {Object} memberData - Member data
 * @returns {Promise<TeamMember>} Created member
 * @throws {Error} If add fails
 */
export async function addTeamMember(teamId, memberData) {
  try {
    const member = {
      ...memberData,
      joinedAt: Date.now(),
    };

    const key = `${TEAM_MEMBERS_KEY_PREFIX}${teamId}`;
    await kv.hset(key, memberData.userId, JSON.stringify(member));

    return member;
  } catch (error) {
    throw new Error(`Failed to add team member: ${error.message}`);
  }
}

/**
 * Remove a member from a team
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<void>}
 * @throws {Error} If removal fails
 */
export async function removeTeamMember(teamId, userId) {
  try {
    const key = `${TEAM_MEMBERS_KEY_PREFIX}${teamId}`;
    await kv.hdel(key, userId);
  } catch (error) {
    throw new Error(`Failed to remove team member: ${error.message}`);
  }
}

/**
 * Update a team member's properties
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID
 * @param {Object} updates - Properties to update
 * @returns {Promise<TeamMember>} Updated member
 * @throws {Error} If update fails
 */
export async function updateTeamMember(teamId, userId, updates) {
  try {
    const key = `${TEAM_MEMBERS_KEY_PREFIX}${teamId}`;
    const data = await kv.hget(key, userId);

    if (!data) {
      throw new Error('Team member not found');
    }

    const member = JSON.parse(data);
    const updated = { ...member, ...updates };

    await kv.hset(key, userId, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to update team member: ${error.message}`);
  }
}

/**
 * Update team settings
 * @param {string} teamId - Team ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Team>} Updated team
 * @throws {Error} If update fails
 */
export async function updateTeamSettings(teamId, settings) {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const updated = {
      ...team,
      ...settings,
      updatedAt: Date.now(),
    };

    const key = `${TEAM_KEY_PREFIX}${teamId}`;
    await kv.set(key, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to update team settings: ${error.message}`);
  }
}

/**
 * Create a team invite
 * @param {string} teamId - Team ID
 * @param {string} email - Email to invite
 * @param {string} role - Role for new member
 * @param {string} invitedBy - User ID who created invite
 * @returns {Promise<Object>} { inviteToken, expiresAt }
 * @throws {Error} If creation fails
 */
export async function createInvite(teamId, email, role, invitedBy) {
  try {
    const inviteToken = generateInviteToken();
    const now = Date.now();
    const expiresAt = now + INVITE_TTL * 1000;

    const invite = {
      inviteToken,
      teamId,
      email,
      role,
      invitedBy,
      createdAt: now,
      expiresAt,
    };

    const key = `${INVITE_KEY_PREFIX}${inviteToken}`;
    await kv.setex(key, INVITE_TTL, JSON.stringify(invite));

    return { inviteToken, expiresAt };
  } catch (error) {
    throw new Error(`Failed to create invite: ${error.message}`);
  }
}

/**
 * Get an invite by token
 * @param {string} inviteToken - Invite token
 * @returns {Promise<Object|null>} Invite object or null
 * @throws {Error} If fetch fails
 */
export async function getInvite(inviteToken) {
  try {
    const key = `${INVITE_KEY_PREFIX}${inviteToken}`;
    const data = await kv.get(key);

    if (!data) {
      return null;
    }

    const invite = JSON.parse(data);
    const now = Date.now();

    if (now > invite.expiresAt) {
      await kv.del(key);
      throw new Error('Invite expired');
    }

    return invite;
  } catch (error) {
    if (error.message === 'Invite expired') {
      throw error;
    }
    throw new Error(`Failed to get invite: ${error.message}`);
  }
}

/**
 * Accept an invite and create user
 * @param {string} inviteToken - Invite token
 * @param {string} name - User display name
 * @param {string} passwordHash - Hashed password
 * @returns {Promise<TeamMember>} Created member
 * @throws {Error} If acceptance fails
 */
export async function acceptInvite(inviteToken, name, passwordHash) {
  try {
    const invite = await getInvite(inviteToken);
    if (!invite) {
      throw new Error('Invalid or expired invite');
    }

    // This function stores the member, actual user creation
    // happens in the auth flow
    const member = {
      email: invite.email,
      name,
      role: invite.role,
      permissions: [],
    };

    // Delete used invite
    const key = `${INVITE_KEY_PREFIX}${inviteToken}`;
    await kv.del(key);

    return member;
  } catch (error) {
    throw new Error(`Failed to accept invite: ${error.message}`);
  }
}
