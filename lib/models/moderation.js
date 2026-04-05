import kv from '../kv.js';
import { generateDecisionId } from '../auth/tokens.js';

const DECISION_KEY_PREFIX = 'decision:';
const QUEUE_KEY_PREFIX = 'queue:';

/**
 * Moderation decision object shape
 * @typedef {Object} ModerationDecision
 * @property {string} decisionId - Unique decision identifier
 * @property {string} threadId - Associated thread ID
 * @property {string} teamId - Team ID
 * @property {string} content - Content being moderated
 * @property {string} status - Decision status (pending|approved|rejected|escalated)
 * @property {Object} analysis - Moderation analysis from Claude
 * @property {string} [approvedBy] - User ID who approved
 * @property {string} [rejectionReason] - Reason if rejected
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Timestamp
 */

/**
 * Create a moderation decision
 * @param {Object} decisionData - Decision data
 * @returns {Promise<ModerationDecision>} Created decision
 * @throws {Error} If creation fails
 */
export async function createDecision(decisionData) {
  try {
    const now = Date.now();
    const decision = {
      ...decisionData,
      decisionId: generateDecisionId(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Store decision
    const key = `${DECISION_KEY_PREFIX}${decision.decisionId}`;
    await kv.set(key, JSON.stringify(decision));

    // Add to moderation queue
    const queueKey = `${QUEUE_KEY_PREFIX}${decisionData.teamId}:by_recent`;
    const priority = decisionData.analysis?.requires_escalation ? 100 : 50;
    await kv.zadd(queueKey, { score: now + (1000 - priority), member: decision.decisionId });

    return decision;
  } catch (error) {
    throw new Error(`Failed to create decision: ${error.message}`);
  }
}

/**
 * Get a specific decision
 * @param {string} decisionId - Decision ID
 * @returns {Promise<ModerationDecision|null>} Decision or null
 * @throws {Error} If fetch fails
 */
export async function getDecision(decisionId) {
  try {
    const key = `${DECISION_KEY_PREFIX}${decisionId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new Error(`Failed to get decision: ${error.message}`);
  }
}

/**
 * Approve a moderation decision
 * @param {string} decisionId - Decision ID
 * @param {string} userId - User ID approving
 * @param {string} [notes] - Optional approval notes
 * @returns {Promise<ModerationDecision>} Updated decision
 * @throws {Error} If approval fails
 */
export async function approveDecision(decisionId, userId, notes) {
  try {
    const decision = await getDecision(decisionId);
    if (!decision) {
      throw new Error('Decision not found');
    }

    const updated = {
      ...decision,
      status: 'approved',
      approvedBy: userId,
      approvalNotes: notes,
      updatedAt: Date.now(),
    };

    const key = `${DECISION_KEY_PREFIX}${decisionId}`;
    await kv.set(key, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to approve decision: ${error.message}`);
  }
}

/**
 * Reject a moderation decision
 * @param {string} decisionId - Decision ID
 * @param {string} userId - User ID rejecting
 * @param {string} reason - Rejection reason
 * @returns {Promise<ModerationDecision>} Updated decision
 * @throws {Error} If rejection fails
 */
export async function rejectDecision(decisionId, userId, reason) {
  try {
    const decision = await getDecision(decisionId);
    if (!decision) {
      throw new Error('Decision not found');
    }

    const updated = {
      ...decision,
      status: 'rejected',
      rejectedBy: userId,
      rejectionReason: reason,
      updatedAt: Date.now(),
    };

    const key = `${DECISION_KEY_PREFIX}${decisionId}`;
    await kv.set(key, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to reject decision: ${error.message}`);
  }
}

/**
 * Get moderation queue for a team
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @param {string} [options.priority] - Filter by priority (high|normal|low)
 * @param {number} [options.limit] - Max results (default 20)
 * @param {number} [options.offset] - Pagination offset (default 0)
 * @returns {Promise<Object>} { decisions: ModerationDecision[], total: number }
 * @throws {Error} If fetch fails
 */
export async function getQueue(teamId, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    const queueKey = `${QUEUE_KEY_PREFIX}${teamId}:by_recent`;

    // Get decision IDs in priority order (most recent/high priority first)
    const decisionIds = await kv.zrange(queueKey, offset, offset + limit - 1, {
      rev: true,
    });

    // Fetch full decision objects
    const decisions = [];
    for (const decisionId of decisionIds) {
      const decision = await getDecision(decisionId);
      if (decision && decision.status === 'pending') {
        decisions.push(decision);
      }
    }

    // Get total pending count
    const allIds = await kv.zrange(queueKey, 0, -1);
    let totalPending = 0;
    for (const id of allIds) {
      const decision = await getDecision(id);
      if (decision && decision.status === 'pending') {
        totalPending++;
      }
    }

    return { decisions, total: totalPending };
  } catch (error) {
    throw new Error(`Failed to get queue: ${error.message}`);
  }
}
