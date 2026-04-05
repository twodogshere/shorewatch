const META_GRAPH_API_VERSION = 'v18.0';
const META_GRAPH_URL = 'https://graph.instagram.com';

/**
 * Fetch a comment from Meta Graph API
 * @param {string} commentId - Comment ID
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} Comment data
 * @throws {Error} If fetch fails
 */
export async function fetchComment(commentId, accessToken) {
  try {
    const url = `${META_GRAPH_URL}/${META_GRAPH_API_VERSION}/${commentId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to fetch comment: ${error.message}`);
  }
}

/**
 * Reply to a comment via Meta Graph API
 * @param {string} commentId - Comment ID to reply to
 * @param {string} message - Reply message text
 * @param {string} accessToken - Meta access token
 * @returns {Promise<Object>} { id: commentId }
 * @throws {Error} If reply fails
 */
export async function replyToComment(commentId, message, accessToken) {
  try {
    const url = `${META_GRAPH_URL}/${META_GRAPH_API_VERSION}/${commentId}/comments`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { id: data.id };
  } catch (error) {
    throw new Error(`Failed to reply to comment: ${error.message}`);
  }
}

/**
 * Hide a comment via Meta Graph API
 * @param {string} commentId - Comment ID to hide
 * @param {string} accessToken - Meta access token
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If hide fails
 */
export async function hideComment(commentId, accessToken) {
  try {
    const url = `${META_GRAPH_URL}/${META_GRAPH_API_VERSION}/${commentId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        is_hidden: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API error: ${error.error?.message || response.statusText}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to hide comment: ${error.message}`);
  }
}

/**
 * Delete a comment via Meta Graph API
 * @param {string} commentId - Comment ID to delete
 * @param {string} accessToken - Meta access token
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If deletion fails
 */
export async function deleteComment(commentId, accessToken) {
  try {
    const url = `${META_GRAPH_URL}/${META_GRAPH_API_VERSION}/${commentId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API error: ${error.error?.message || response.statusText}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}
