import { getVoiceTemplate } from '../../constants/voice-templates.js';

/**
 * Build a draft prompt for Claude
 * Uses Coral Care voice guidelines to generate response drafts
 * @param {Object} context - Draft generation context
 * @param {string} context.threadId - Thread ID
 * @param {string} context.channelType - Channel type (parent|provider)
 * @param {string} context.postContent - Original post text
 * @param {Array} context.comments - Array of comments in thread
 * @param {Object} context.analysis - Moderation analysis result
 * @param {string} [context.tone] - Suggested tone
 * @returns {Object} { system: string, user: string } message pair for Claude
 */
export function buildDraftPrompt(context) {
  const {
    threadId,
    channelType,
    postContent,
    comments = [],
    analysis,
    tone = 'warm',
  } = context;

  const voiceTemplate = getVoiceTemplate(`${channelType}_voice`);

  if (!voiceTemplate) {
    throw new Error(`Invalid channel type: ${channelType}`);
  }

  // Build voice guidelines string
  const voiceGuidelines = voiceTemplate.guidelines.map((g) => `- ${g}`).join('\n');

  const systemPrompt = `You are a community manager for Coral Care, a platform supporting families in pediatric therapy.

You write responses in the "${voiceTemplate.name}" voice. This means:
${voiceGuidelines}

Target audience: ${voiceTemplate.target}

CRITICAL RULES:
- No em dashes (—)
- No AI phrasing or corporate language
- Warm, direct, honest
- Short sentences
- Sound like a real person, not an algorithm

${channelType === 'parent' ? "Sign off with '— The Coral Care Team' on first responses in a thread." : ''}

Response format: Return JSON with { text, tone, confidence } where:
- text: Your response (keep to 1-2 short paragraphs)
- tone: Detected tone (warm|professional|supportive|clinical)
- confidence: Your confidence in this response (0-1)`;

  const commentSummary =
    comments.length > 0
      ? comments.map((c) => `${c.author}: "${c.text}"`).join('\n\n')
      : 'No prior comments in thread.';

  const userPrompt = `Generate a response for this thread:

ORIGINAL POST:
"${postContent}"

COMMENT THREAD:
${commentSummary}

LATEST COMMENT ANALYSIS:
Sentiment: ${analysis.sentiment}
Toxicity: ${analysis.toxicity}
Requires escalation: ${analysis.requires_escalation}

Generate an appropriate response. If toxicity is severe or requires escalation, do not draft a response—return { text: null, tone: "escalated", confidence: 0 }.

Return ONLY valid JSON:
{
  "text": "Your response here" | null,
  "tone": "warm" | "professional" | "supportive" | "clinical" | "escalated",
  "confidence": 0.0 to 1.0
}`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

/**
 * Validate draft response
 * @param {Object} response - Response from Claude
 * @returns {boolean} True if response has required fields
 */
export function isValidDraftResponse(response) {
  return (
    response &&
    (response.text === null || typeof response.text === 'string') &&
    ['warm', 'professional', 'supportive', 'clinical', 'escalated'].includes(
      response.tone
    ) &&
    typeof response.confidence === 'number' &&
    response.confidence >= 0 &&
    response.confidence <= 1
  );
}
