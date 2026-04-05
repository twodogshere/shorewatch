import { kv } from '@/lib/kv';
import { createThread } from '@/lib/models/thread';
import { createDecision } from '@/lib/models/moderation';
import { verifyWebhookSignature, parseWebhookEvent } from '@/lib/integrations/meta/webhook';
import { moderateComment } from '@/lib/ai/pipeline';
import { generateAIDraft } from '@/lib/ai/pipeline';
import { sendSlackAlert } from '@/lib/integrations/slack/alerts';
import { logActivity } from '@/lib/models/activity';

export async function GET(request) {
  try {
    // Meta webhook verification
    const url = new URL(request.url);
    const hubChallenge = url.searchParams.get('hub.challenge');
    const hubVerifyToken = url.searchParams.get('hub.verify_token');

    if (!hubVerifyToken || hubVerifyToken !== process.env.META_WEBHOOK_VERIFY_TOKEN) {
      return Response.json(
        { error: 'Invalid verify token' },
        { status: 403 }
      );
    }

    return new Response(hubChallenge);
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    if (!verifyWebhookSignature(body, signature)) {
      return Response.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse webhook event
    const event = parseWebhookEvent(body);

    if (!event) {
      return Response.json({ status: 'received' }, { status: 200 });
    }

    // Get team (assume single team for now, or use mapping)
    // In production, this would look up the team by Instagram account ID
    const teamKey = `team:${event.instagramAccountId}`;
    const team = await kv.get(teamKey);

    if (!team) {
      // Team not found, skip processing
      return Response.json({ status: 'received' }, { status: 200 });
    }

    const teamId = team.id;

    // Process each comment event
    if (event.type === 'comment' && event.comments) {
      for (const comment of event.comments) {
        try {
          // Create thread from comment
          const thread = await createThread(teamId, {
            parentId: comment.id,
            provider: 'instagram',
            title: comment.from?.name || 'Instagram Comment',
            body: comment.text,
            author: {
              id: comment.from?.id,
              name: comment.from?.name,
              username: comment.from?.username,
            },
            metadata: {
              timestamp: comment.timestamp,
              permalink: comment.permalink_url,
            },
          });

          // Run moderation AI to generate decision
          const moderation = await moderateComment(comment.text, thread.id);

          // Create moderation decision
          const decision = await createDecision(teamId, {
            threadId: thread.id,
            parentId: comment.id,
            recommendedAction: moderation.action,
            confidence: moderation.confidence,
            reasons: moderation.reasons,
            priority: moderation.priority || 'medium',
          });

          // Update thread with decision reference
          thread.decisionId = decision.id;
          await kv.set(`thread:${thread.id}`, thread);

          // Generate AI draft in background
          const draft = await generateAIDraft(thread.id, thread);

          // Send Slack alert if high priority
          if (moderation.priority === 'high') {
            await sendSlackAlert(teamId, {
              type: 'moderation_alert',
              thread,
              decision,
              draft,
            });
          }

          // Log activity
          await logActivity(teamId, 'system', 'webhook_comment_processed', {
            commentId: comment.id,
            threadId: thread.id,
            decisionId: decision.id,
          });
        } catch (commentError) {
          console.error('Error processing comment:', commentError);
          // Log error but continue processing other comments
          await logActivity(teamId, 'system', 'webhook_comment_error', {
            commentId: comment.id,
            error: commentError.message,
          });
        }
      }
    }

    // Return immediately with success (processing happens asynchronously)
    return Response.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
