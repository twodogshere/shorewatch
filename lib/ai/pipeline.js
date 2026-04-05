import Anthropic from '@anthropic-ai/sdk';
import { buildModerationPrompt, isValidModerationAnalysis } from './prompts/moderation.js';
import { buildDraftPrompt, isValidDraftResponse } from './prompts/draft.js';

const client = new Anthropic();
const MODEL = 'claude-sonnet-4-20250514';

/**
 * Moderate a comment using Claude
 * @param {string} threadId - Thread ID (for logging)
 * @param {string} content - Comment content to moderate
 * @param {Object} context - Moderation context (author, post, etc.)
 * @returns {Promise<Object>} Moderation analysis object
 * @throws {Error} If moderation fails
 */
export async function moderateComment(threadId, content, context) {
  try {
    const { system, user } = buildModerationPrompt({
      content,
      ...context,
    });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
      system,
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(textContent.text);
    } catch (parseError) {
      console.error('Failed to parse moderation response:', textContent.text);
      // Return safe default if parsing fails
      analysis = {
        sentiment: 'neutral',
        toxicity: 'mild',
        spam: false,
        topic_relevance: 'on_topic',
        requires_response: false,
        requires_escalation: true,
        reasoning: 'Parse error - escalating for manual review',
      };
    }

    // Validate analysis
    if (!isValidModerationAnalysis(analysis)) {
      console.warn('Invalid moderation analysis structure:', analysis);
      analysis.requires_escalation = true;
    }

    return analysis;
  } catch (error) {
    console.error(`Moderation failed for thread ${threadId}:`, error.message);
    // Return escalation on error
    return {
      sentiment: 'neutral',
      toxicity: 'severe',
      spam: false,
      topic_relevance: 'on_topic',
      requires_response: false,
      requires_escalation: true,
      reasoning: `Moderation error: ${error.message}`,
    };
  }
}

/**
 * Generate a response draft using Claude
 * @param {string} threadId - Thread ID
 * @param {Object} context - Generation context (channelType, post, comments, analysis, etc.)
 * @returns {Promise<Object>} { text, tone, confidence } or null if escalated
 * @throws {Error} If generation fails
 */
export const generateAIDraft = generateDraft;
export async function generateDraft(threadId, context) {
  try {
    // Check if should escalate instead of draft
    if (context.analysis?.requires_escalation) {
      return {
        text: null,
        tone: 'escalated',
        confidence: 0,
        reason: 'Content requires manual review',
      };
    }

    const { system, user } = buildDraftPrompt(context);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
      system,
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let draftResponse;
    try {
      draftResponse = JSON.parse(textContent.text);
    } catch (parseError) {
      console.error('Failed to parse draft response:', textContent.text);
      return {
        text: null,
        tone: 'escalated',
        confidence: 0,
        reason: 'Draft generation parse error',
      };
    }

    // Validate response
    if (!isValidDraftResponse(draftResponse)) {
      console.warn('Invalid draft response structure:', draftResponse);
      return {
        text: null,
        tone: 'escalated',
        confidence: 0,
        reason: 'Invalid response format',
      };
    }

    return draftResponse;
  } catch (error) {
    console.error(`Draft generation failed for thread ${threadId}:`, error.message);
    return {
      text: null,
      tone: 'escalated',
      confidence: 0,
      reason: `Generation error: ${error.message}`,
    };
  }
}
