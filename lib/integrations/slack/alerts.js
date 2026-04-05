/**
 * Send a Slack alert via webhook
 * @param {Object} params - Alert parameters
 * @param {string} params.webhookUrl - Slack webhook URL
 * @param {string} params.text - Simple text message
 * @param {Array} [params.blocks] - Slack Block Kit blocks for rich formatting
 * @returns {Promise<void>}
 * @throws {Error} If send fails
 */
export async function sendSlackAlert({ webhookUrl, text, blocks }) {
  try {
    const payload = {
      text,
    };

    if (blocks && Array.isArray(blocks)) {
      payload.blocks = blocks;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Slack API error: ${error}`);
    }
  } catch (error) {
    throw new Error(`Failed to send Slack alert: ${error.message}`);
  }
}

/**
 * Create a moderation alert block
 * @param {Object} context - Alert context
 * @param {string} context.decisionId - Decision ID
 * @param {string} context.content - Content excerpt
 * @param {string} context.author - Author name
 * @param {Object} context.analysis - Moderation analysis
 * @returns {Array} Slack blocks
 */
export function createModerationAlertBlock({
  decisionId,
  content,
  author,
  analysis,
}) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Moderation Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Author*\n${author}`,
        },
        {
          type: 'mrkdwn',
          text: `*Toxicity*\n${analysis.toxicity}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Content*\n>${content}`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Review',
            emoji: true,
          },
          value: decisionId,
          action_id: `moderation_review_${decisionId}`,
        },
      ],
    },
  ];
}

/**
 * Create a draft published alert block
 * @param {Object} context - Alert context
 * @param {string} context.draftId - Draft ID
 * @param {string} context.threadId - Thread ID
 * @param {string} context.author - Author name
 * @returns {Array} Slack blocks
 */
export function createDraftAlertBlock({ draftId, threadId, author }) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Draft Published',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Published by*\n${author}`,
        },
        {
          type: 'mrkdwn',
          text: `*Thread*\n${threadId}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Thread',
            emoji: true,
          },
          value: threadId,
          action_id: `view_thread_${threadId}`,
        },
      ],
    },
  ];
}
