import { kv } from '../kv.js';
import { generateSessionToken } from './tokens.js';

const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_KEY_PREFIX = 'session:';

/**
 * Session object shape
 * @typedef {Object} Session
 * @property {string} sessionToken - Unique session identifier
 * @property {string} userId - User ID
 * @property {string} teamId - Team ID
 * @property {string} email - User email
 * @property {string} name - User display name
 * @property {string} role - User role
 * @property {string[]} permissions - Array of granted permissions
 * @property {number} createdAt - Timestamp when session was created
 * @property {number} expiresAt - Timestamp when session expires
 * @property {number} lastAccessedAt - Timestamp of last access
 */

/**
 * Create a new session for a user
 * @param {string} userId - User ID
 * @param {string} teamId - Team ID
 * @param {string[]} permissions - Array of permissions
 * @param {Object} user - User object with email, name, role (optional, for session data)
 * @returns {Promise<Session>} Created session object
 * @throws {Error} If session creation fails
 */
export async function createSession(userId, teamId, permissions, user = {}) {
  try {
    const sessionToken = generateSessionToken();
    const now = Date.now();
    const expiresAt = now + SESSION_TTL * 1000;

    const session = {
      sessionToken,
      userId,
      teamId,
      email: user.email || '',
      name: user.name || '',
      role: user.role || '',
      permissions: permissions || [],
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
    };

    // Store in KV with TTL (v3 uses { ex: ttl } for expiration)
    const key = `${SESSION_KEY_PREFIX}${sessionToken}`;
    await kv.set(key, session, { ex: SESSION_TTL });

    return session;
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

/**
 * Validate and retrieve a session
 * @param {string} sessionToken - Session token to validate
 * @returns {Promise<Session>} Session object
 * @throws {Error} If session is invalid or expired
 */
export async function validateSession(sessionToken) {
  try {
    const key = `${SESSION_KEY_PREFIX}${sessionToken}`;
    const sessionData = await kv.get(key);

    if (!sessionData) {
      throw new Error('Session not found or expired');
    }

    // kv.get returns deserialized object, no need to JSON.parse
    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const now = Date.now();

    if (now > session.expiresAt) {
      await kv.del(key);
      throw new Error('Session expired');
    }

    // Update last accessed time
    session.lastAccessedAt = now;
    await kv.set(key, session, { ex: SESSION_TTL });

    return session;
  } catch (error) {
    if (error.message.includes('Session')) {
      throw error;
    }
    throw new Error(`Failed to validate session: ${error.message}`);
  }
}

/**
 * Revoke a session
 * @param {string} sessionToken - Session token to revoke
 * @param {string} userId - User ID (for audit logging)
 * @returns {Promise<void>}
 * @throws {Error} If revocation fails
 */
export async function revokeSession(sessionToken, userId) {
  try {
    const key = `${SESSION_KEY_PREFIX}${sessionToken}`;
    await kv.del(key);
  } catch (error) {
    throw new Error(`Failed to revoke session: ${error.message}`);
  }
}

/**
 * Refresh a session by extending its TTL
 * @param {string} sessionToken - Session token to refresh
 * @returns {Promise<Session>} Updated session object
 * @throws {Error} If refresh fails
 */
export async function refreshSession(sessionToken) {
  try {
    const key = `${SESSION_KEY_PREFIX}${sessionToken}`;
    const sessionData = await kv.get(key);

    if (!sessionData) {
      throw new Error('Session not found');
    }

    // kv.get returns deserialized object, no need to JSON.parse
    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const now = Date.now();

    // Check if already expired
    if (now > session.expiresAt) {
      await kv.del(key);
      throw new Error('Session expired');
    }

    // Extend TTL
    session.expiresAt = now + SESSION_TTL * 1000;
    session.lastAccessedAt = now;
    await kv.set(key, session, { ex: SESSION_TTL });

    return session;
  } catch (error) {
    if (error.message.includes('Session')) {
      throw error;
    }
    throw new Error(`Failed to refresh session: ${error.message}`);
  }
}

