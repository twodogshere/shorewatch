import kv from '../kv.js';

const ACTIVITY_KEY_PREFIX = 'activity:';
const ACTIVITY_LOG_KEY_PREFIX = 'activity:log:';
const ACTIVITY_TTL = 90 * 24 * 60 * 60; // 90 days

/**
 * Activity object shape
 * @typedef {Object} Activity
 * @property {string} activityId - Unique activity identifier
 * @property {string} teamId - Team ID
 * @property {string} type - Activity type (thread_created|draft_published|decision_approved|member_added)
 * @property {string} userId - User ID who performed action
 * @property {string} [targetId] - ID of affected resource (thread, draft, etc.)
 * @property {string} [description] - Human-readable description
 * @property {Object} [metadata] - Additional activity data
 * @property {number} timestamp - Timestamp
 */

/**
 * Log an activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<Activity>} Created activity
 * @throws {Error} If logging fails
 */
export async function logActivity(activityData) {
  try {
    const timestamp = Date.now();
    const activityId = `activity_${timestamp}_${Math.random().toString(36).substring(7)}`;

    const activity = {
      ...activityData,
      activityId,
      timestamp,
    };

    // Store activity
    const key = `${ACTIVITY_KEY_PREFIX}${activityId}`;
    await kv.setex(key, ACTIVITY_TTL, JSON.stringify(activity));

    // Add to activity log sorted set
    const logKey = `${ACTIVITY_LOG_KEY_PREFIX}${activityData.teamId}:by_recent`;
    await kv.zadd(logKey, { score: timestamp, member: activityId });

    return activity;
  } catch (error) {
    throw new Error(`Failed to log activity: ${error.message}`);
  }
}

/**
 * Get activities for a team
 * @param {string} teamId - Team ID
 * @param {Object} options - Query options
 * @param {string} [options.type] - Filter by activity type
 * @param {number} [options.limit] - Max results (default 50)
 * @param {number} [options.offset] - Pagination offset (default 0)
 * @returns {Promise<Object>} { activities: Activity[], total: number }
 * @throws {Error} If fetch fails
 */
export async function getActivities(teamId, options = {}) {
  try {
    const { type, limit = 50, offset = 0 } = options;

    const logKey = `${ACTIVITY_LOG_KEY_PREFIX}${teamId}:by_recent`;

    // Get activity IDs in reverse chronological order (most recent first)
    const activityIds = await kv.zrange(logKey, offset, offset + limit - 1, {
      rev: true,
    });

    // Fetch full activity objects
    const activities = [];
    for (const activityId of activityIds) {
      const key = `${ACTIVITY_KEY_PREFIX}${activityId}`;
      const data = await kv.get(key);

      if (data) {
        const activity = JSON.parse(data);
        // Apply type filter if specified
        if (!type || activity.type === type) {
          activities.push(activity);
        }
      }
    }

    // Get total count
    const total = await kv.zcard(logKey);

    return { activities, total };
  } catch (error) {
    throw new Error(`Failed to get activities: ${error.message}`);
  }
}

/**
 * Get activities by user
 * @param {string} teamId - Team ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Max results (default 30)
 * @returns {Promise<Activity[]>} Array of activities
 * @throws {Error} If fetch fails
 */
export async function getUserActivities(teamId, userId, options = {}) {
  try {
    const { limit = 30 } = options;

    const { activities } = await getActivities(teamId, { limit: limit * 2 });

    return activities.filter((activity) => activity.userId === userId).slice(0, limit);
  } catch (error) {
    throw new Error(`Failed to get user activities: ${error.message}`);
  }
}
