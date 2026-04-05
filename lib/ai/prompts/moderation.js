/**
 * Moderation prompt builder for Claude
 * Classifies comments on sentiment, toxicity, spam, topic, and required actions
 */

/**
 * Build a moderation prompt for Claude
 * @param {Object} context - Moderation context
 * @param {string} context.content - Comment text to analyze
 * @param {Object} context.author - Author information
 * @param {string} context.author.name - Author name
 * @param {string} context.author.id - Facebook user ID
 * @param {Object} context.post - Original post context
 * @param {string} context.post.text - Post text
 * @param {string} context.post.author - Post author name
 * @param {string} [context.channelType] - Channel type (parent|provider)
 * @returns {Object} { system: string, user: string } message pair for Claude
 */
export function buildModerationPrompt(context) {
  const { content, author, post, channelType = 'parent' } = context;

  const systemPrompt = `You are a moderation expert for Coral Care, a community platform for pediatric therapy support.

Your task is to analyze comments for potential moderation issues. Classify each comment on:

1. **sentiment**: positive, neutral, negative
2. **toxicity**: none, mild, severe (rude language, personal attacks, hate speech)
3. **spam**: boolean (promotional content, off-topic links, duplicate posts)
4. **topic_relevance**: on_topic, off_topic, slightly_off
5. **requires_response**: boolean (does this need a team response?)
6. **requires_escalation**: boolean (does this need immediate attention?)

Context clues for judgment:
- Coral Care focuses on in-home pediatric physical therapy and related healthcare
- Parents often express concerns, frustrations, questions about therapy and health
- Constructive criticism and difficult emotions are normal and acceptable
- Medical misinformation, harmful advice, and abuse require escalation

Respond with JSON only. No markdown, no explanations.`;

  const userPrompt = `Analyze this comment:

Author: ${author.name}
Channel: ${channelType}

Post being responded to:
"${post.text}"
— ${post.author}

Comment to analyze:
"${content}"

Respond with valid JSON matching this schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "toxicity": "none" | "mild" | "severe",
  "spam": false | true,
  "topic_relevance": "on_topic" | "off_topic" | "slightly_off",
  "requires_response": false | true,
  "requires_escalation": false | true,
  "reasoning": "brief explanation of classification"
}`;

  return {
    system: systemPrompt,
    user: userPrompt,
  };
}

/**
 * Validate moderation analysis response
 * @param {Object} analysis - Response from Claude
 * @returns {boolean} True if analysis has required fields
 */
export function isValidModerationAnalysis(analysis) {
  return (
    analysis &&
    ['positive', 'neutral', 'negative'].includes(analysis.sentiment) &&
    ['none', 'mild', 'severe'].includes(analysis.toxicity) &&
    typeof analysis.spam === 'boolean' &&
    ['on_topic', 'off_topic', 'slightly_off'].includes(analysis.topic_relevance) &&
    typeof analysis.requires_response === 'boolean' &&
    typeof analysis.requires_escalation === 'boolean'
  );
}
