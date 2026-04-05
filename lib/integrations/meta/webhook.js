import crypto from 'crypto';

/**
 * Verify Meta webhook signature
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - X-Hub-Signature header value
 * @param {string} appSecret - Meta app secret
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(body, signature, appSecret) {
  try {
    // Meta signature format: sha1=<hash>
    const [algorithm, hash] = signature.split('=');

    if (algorithm !== 'sha1') {
      console.warn(`Unknown signature algorithm: ${algorithm}`);
      return false;
    }

    // Calculate expected hash
    const bodyString = typeof body === 'string' ? body : body.toString('utf-8');
    const expectedHash = crypto
      .createHmac('sha1', appSecret)
      .update(bodyString)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(hash, expectedHash);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return false;
  }
}

/**
 * Parse Meta webhook event payload
 * @param {Object} body - Webhook request body (already parsed JSON)
 * @returns {Object} Extracted event data or null
 */
export function parseWebhookEvent(body) {
  try {
    const { object, entry } = body;

    if (object !== 'page') {
      console.debug(`Ignoring non-page webhook: ${object}`);
      return null;
    }

    if (!entry || entry.length === 0) {
      return null;
    }

    // Handle multiple entries
    const events = [];

    for (const evt of entry) {
      const { changes } = evt;

      if (!changes || changes.length === 0) {
        continue;
      }

      for (const change of changes) {
        const { field, value } = change;

        if (field === 'feed') {
          // Post or comment on page
          events.push({
            type: 'feed',
            field,
            postId: value.post_id,
            commentId: value.comment_id,
            message: value.message,
            authorId: value.from?.id,
            authorName: value.from?.name,
            timestamp: value.created_time,
            raw: value,
          });
        } else if (field === 'messages') {
          // Direct message
          events.push({
            type: 'message',
            field,
            senderId: value.from,
            message: value.text,
            pageId: evt.id,
            timestamp: Date.now(),
            raw: value,
          });
        } else if (field === 'comments') {
          // Comment on page asset
          events.push({
            type: 'comment',
            field,
            commentId: value.id,
            objectId: value.object_id,
            message: value.message,
            authorId: value.from?.id,
            authorName: value.from?.name,
            timestamp: value.created_time,
            raw: value,
          });
        }
      }
    }

    return events.length > 0 ? events : null;
  } catch (error) {
    console.error('Failed to parse webhook event:', error.message);
    return null;
  }
}

/**
 * Map Meta event to Shorewatch channel
 * @param {Object} event - Parsed event
 * @returns {string|null} Channel type (parent|provider) or null
 */
export function mapEventToChannel(event) {
  // This would typically check which Facebook page the event came from
  // and map it to joincoralcare (parent) or growwithcoral (provider)
  // For now, return null to indicate mapping needed
  return null;
}
