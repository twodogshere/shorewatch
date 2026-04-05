import { nanoid } from 'nanoid';
import crypto from 'crypto';

/**
 * Generate a cryptographically secure session token
 * Format: shw_sess_<48 random hex chars>
 * @returns {string} Session token
 */
export function generateSessionToken() {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `shw_sess_${randomHex}`;
}

/**
 * Generate an invite token for team membership
 * Format: shw_inv_<48 random hex chars>
 * @returns {string} Invite token
 */
export function generateInviteToken() {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `shw_inv_${randomHex}`;
}

/**
 * Generate a user ID
 * Format: user_<12 random chars from nanoid>
 * @returns {string} User ID
 */
export function generateUserId() {
  return `user_${nanoid(12)}`;
}

/**
 * Generate a thread ID from channel, post, and optional comment
 * @param {string} channelType - Channel type (parent|provider)
 * @param {string} postId - Facebook post ID
 * @param {string} [commentId] - Optional comment ID
 * @returns {string} Formatted thread ID
 */
export function generateThreadId(channelType, postId, commentId) {
  if (commentId) {
    return `thread_${channelType}_${postId}_${commentId}`;
  }
  return `thread_${channelType}_${postId}`;
}

/**
 * Generate a draft ID
 * Format: draft_<12 random chars from nanoid>
 * @returns {string} Draft ID
 */
export function generateDraftId() {
  return `draft_${nanoid(12)}`;
}

/**
 * Generate a decision ID
 * Format: decision_<12 random chars from nanoid>
 * @returns {string} Decision ID
 */
export function generateDecisionId() {
  return `decision_${nanoid(12)}`;
}

/**
 * Generate a team ID
 * Format: team_<12 random chars from nanoid>
 * @returns {string} Team ID
 */
export function generateTeamId() {
  return `team_${nanoid(12)}`;
}
