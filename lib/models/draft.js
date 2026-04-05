import kv from '../kv.js';
import { generateDraftId } from '../auth/tokens.js';

const DRAFT_KEY_PREFIX = 'draft:';
const THREAD_DRAFT_KEY_PREFIX = 'thread:draft:';

/**
 * Draft object shape
 * @typedef {Object} Draft
 * @property {string} draftId - Unique draft identifier
 * @property {string} threadId - Associated thread ID
 * @property {string} channelType - Channel type (parent|provider)
 * @property {string} text - Generated/edited response text
 * @property {string} status - Draft status (generated|edited|published|discarded)
 * @property {string} tone - Detected tone (warm|professional|casual)
 * @property {number} confidence - AI confidence score (0-1)
 * @property {number} version - Version number
 * @property {string} createdBy - User ID who created
 * @property {string} [editedBy] - User ID who last edited
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Timestamp
 */

/**
 * Create a new draft
 * @param {Object} draftData - Draft data
 * @returns {Promise<Draft>} Created draft
 * @throws {Error} If creation fails
 */
export async function createDraft(draftData) {
  try {
    const now = Date.now();
    const draft = {
      ...draftData,
      draftId: generateDraftId(),
      status: draftData.status || 'generated',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Store draft
    const key = `${DRAFT_KEY_PREFIX}${draft.draftId}`;
    await kv.set(key, JSON.stringify(draft));

    // Create reference from thread to draft
    const threadDraftKey = `${THREAD_DRAFT_KEY_PREFIX}${draftData.threadId}`;
    await kv.set(threadDraftKey, draft.draftId);

    return draft;
  } catch (error) {
    throw new Error(`Failed to create draft: ${error.message}`);
  }
}

/**
 * Get a specific draft
 * @param {string} draftId - Draft ID
 * @returns {Promise<Draft|null>} Draft object or null
 * @throws {Error} If fetch fails
 */
export async function getDraft(draftId) {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new Error(`Failed to get draft: ${error.message}`);
  }
}

/**
 * Update draft properties
 * @param {string} draftId - Draft ID
 * @param {Object} updates - Properties to update
 * @returns {Promise<Draft>} Updated draft
 * @throws {Error} If update fails
 */
export async function updateDraft(draftId, updates) {
  try {
    const draft = await getDraft(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const updated = {
      ...draft,
      ...updates,
      version: draft.version + 1,
      updatedAt: Date.now(),
    };

    const key = `${DRAFT_KEY_PREFIX}${draftId}`;
    await kv.set(key, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to update draft: ${error.message}`);
  }
}

/**
 * Get active draft for a thread
 * @param {string} threadId - Thread ID
 * @returns {Promise<Draft|null>} Active draft or null
 * @throws {Error} If fetch fails
 */
export async function getThreadDraft(threadId) {
  try {
    const threadDraftKey = `${THREAD_DRAFT_KEY_PREFIX}${threadId}`;
    const draftId = await kv.get(threadDraftKey);

    if (!draftId) {
      return null;
    }

    const draft = await getDraft(draftId);

    // Check if draft is still active (not published or discarded)
    if (draft && (draft.status === 'published' || draft.status === 'discarded')) {
      return null;
    }

    return draft;
  } catch (error) {
    throw new Error(`Failed to get thread draft: ${error.message}`);
  }
}

/**
 * Publish a draft
 * @param {string} draftId - Draft ID to publish
 * @returns {Promise<Draft>} Published draft
 * @throws {Error} If publish fails
 */
export async function publishDraft(draftId) {
  try {
    return updateDraft(draftId, { status: 'published' });
  } catch (error) {
    throw new Error(`Failed to publish draft: ${error.message}`);
  }
}

/**
 * Discard a draft
 * @param {string} draftId - Draft ID to discard
 * @returns {Promise<Draft>} Discarded draft
 * @throws {Error} If discard fails
 */
export async function discardDraft(draftId) {
  try {
    return updateDraft(draftId, { status: 'discarded' });
  } catch (error) {
    throw new Error(`Failed to discard draft: ${error.message}`);
  }
}
