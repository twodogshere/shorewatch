import kv from '../kv.js';
import { generateThreadId } from '../auth/tokens.js';

const THREAD_KEY_PREFIX = 'thread:';
const THREAD_LIST_KEY_PREFIX = 'thread:list:';
const THREAD_SORT_KEY_PREFIX = 'thread:sort:';

/**
 * Thread object shape
 * @typedef {Object} Thread
 * @property {string} threadId - Unique thread identifier
 * @property {string} channelType - Channel type (parent|provider)
 * @property {string} accountId - Account/team ID
 * @property {string} postId - Facebook post ID
 * @property {string} [commentId] - Optional comment ID if nested
 * @property {string} authorId - Facebook user ID
 * @property {string} authorName - Author display name
 * @property {string} content - Comment/post text
 * @property {string} status - Thread status (needs_attention|in_progress|done)
 * @property {string[]} readBy - User IDs who have read this thread
 * @property {string} flaggedReason - Optional flag reason
 * @property {string} flaggedBy - User ID who flagged
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Timestamp
 */

/**
 * Create a new thread
 * @param {Object} threadData - Thread data to store
 * @returns {Promise<Thread>} Created thread object
 * @throws {Error} If creation fails
 */
export async function createThread(threadData) {
  try {
    const now = Date.now();
    const thread = {
      ...threadData,
      threadId: generateThreadId(threadData.channelType, threadData.postId, threadData.commentId),
      createdAt: now,
      updatedAt: now,
      readBy: [],
      status: threadData.status || 'needs_attention',
    };

    // Store thread
    const key = `${THREAD_KEY_PREFIX}${thread.threadId}`;
    await kv.set(key, JSON.stringify(thread));

    // Add to sorted set for listing by channel + account
    const sortKey = `${THREAD_SORT_KEY_PREFIX}${threadData.channelType}:${threadData.accountId}:by_recent`;
    await kv.zadd(sortKey, { score: now, member: thread.threadId });

    return thread;
  } catch (error) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

/**
 * Get a specific thread
 * @param {string} channelType - Channel type
 * @param {string} threadId - Thread ID to fetch
 * @returns {Promise<Thread|null>} Thread object or null if not found
 * @throws {Error} If fetch fails
 */
export async function getThread(channelType, threadId) {
  try {
    const key = `${THREAD_KEY_PREFIX}${threadId}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new Error(`Failed to get thread: ${error.message}`);
  }
}

/**
 * Update thread properties
 * @param {string} channelType - Channel type
 * @param {string} threadId - Thread ID
 * @param {Object} updates - Properties to update
 * @returns {Promise<Thread>} Updated thread object
 * @throws {Error} If update fails
 */
export async function updateThread(channelType, threadId, updates) {
  try {
    const thread = await getThread(channelType, threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    const updated = {
      ...thread,
      ...updates,
      updatedAt: Date.now(),
    };

    const key = `${THREAD_KEY_PREFIX}${threadId}`;
    await kv.set(key, JSON.stringify(updated));

    return updated;
  } catch (error) {
    throw new Error(`Failed to update thread: ${error.message}`);
  }
}

/**
 * List threads with pagination and filtering
 * @param {string} channelType - Channel type
 * @param {string} accountId - Account ID
 * @param {Object} options - Query options
 * @param {string} [options.filter] - Status filter (needs_attention|in_progress|done)
 * @param {string} [options.sort] - Sort field (recent|oldest)
 * @param {number} [options.limit] - Max results (default 20)
 * @param {number} [options.offset] - Pagination offset (default 0)
 * @returns {Promise<Object>} { threads: Thread[], total: number }
 * @throws {Error} If list fails
 */
export async function listThreads(channelType, accountId, options = {}) {
  try {
    const { filter, sort = 'recent', limit = 20, offset = 0 } = options;

    const sortKey = `${THREAD_SORT_KEY_PREFIX}${channelType}:${accountId}:by_recent`;

    // Get thread IDs in order (recent by default)
    const isReverse = sort === 'recent';
    const threadIds = await kv.zrange(sortKey, offset, offset + limit - 1, {
      rev: isReverse,
    });

    // Fetch full thread objects
    const threads = [];
    for (const threadId of threadIds) {
      const thread = await getThread(channelType, threadId);
      if (thread) {
        // Apply filter if specified
        if (!filter || thread.status === filter) {
          threads.push(thread);
        }
      }
    }

    // Get total count
    const total = await kv.zcard(sortKey);

    return { threads, total };
  } catch (error) {
    throw new Error(`Failed to list threads: ${error.message}`);
  }
}

/**
 * Mark thread as read by a user
 * @param {string} channelType - Channel type
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID
 * @returns {Promise<Thread>} Updated thread
 * @throws {Error} If marking fails
 */
export async function markThreadRead(channelType, threadId, userId) {
  try {
    const thread = await getThread(channelType, threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }

    if (!thread.readBy.includes(userId)) {
      thread.readBy.push(userId);
    }

    return updateThread(channelType, threadId, { readBy: thread.readBy });
  } catch (error) {
    throw new Error(`Failed to mark thread as read: ${error.message}`);
  }
}

/**
 * Flag a thread for review
 * @param {string} channelType - Channel type
 * @param {string} threadId - Thread ID
 * @param {string} reason - Flag reason
 * @param {string} userId - User ID flagging
 * @returns {Promise<Thread>} Updated thread
 * @throws {Error} If flagging fails
 */
export async function flagThread(channelType, threadId, reason, userId) {
  try {
    const updates = {
      flaggedReason: reason,
      flaggedBy: userId,
      flaggedAt: Date.now(),
      status: 'needs_attention',
    };

    return updateThread(channelType, threadId, updates);
  } catch (error) {
    throw new Error(`Failed to flag thread: ${error.message}`);
  }
}
