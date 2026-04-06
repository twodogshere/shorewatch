import { kv } from '@/lib/kv';
import { createThread } from '@/lib/models/thread';
import { createDecision } from '@/lib/models/moderation';
import { parseWebhookEvent } from '@/lib/integrations/meta/webhook';
import { moderateComment } from '@/lib/ai/pipeline';
import { generateAIDraft } from '@/lib/ai/pipeline';
import { sendSlackAlert } from '@/lib/integrations/slack/alerts';
import { logActivity } from '@/lib/models/activity';
import crypto from 'crypto';

// n8n webhook URL for automated comment moderation
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://shorewatch.app.n8n.cloud/webhook/instagram-comment';

/**
 * Verify Meta webhook signature using SHA-256
 * Meta sends X-Hub-Signature-256 header with sha256=<hash>
 */
function verifySignature(rawBody, signature, appSecret) {
  if (!signature || !appSecret) return false;
  try {
    const [algorithm, hash] = signature.split('=');
    if (algorithm !== 'sha256' || !hash) return false;

    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    // Constant-time comparison
    const hashBuffer = Buffer.from(hash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    if (hashBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return false;
  }
}

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
    // Read raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = process.env.META_APP_SECRET;

    if (!verifySignature(rawBody, signature, appSecret)) {
      console.warn('Invalid webhook signature');
      return Response.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Forward to n8n for automated comment moderation (non-blocking)
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(err => console.error('n8n forward failed:', err.message));

    // Parse webhook event
    const event = parseWebhookEvent(body);

    if (!event) {
      return Response.json({ status: 'received' }, { status: 200 });
    }

    // Get team (assume single team for now, or use mapping)
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

          const moderation = await moderateComment(comment.text, thread.id);

          const decision = await createDecision(teamId, {
            threadId: thread.id,
            parentId: comment.id,
            recommendedAction: moderation.action,
            confidence: moderation.confidence,
            reasons: moderation.reasons,
            priority: moderation.priority || 'medium',
          });

          thread.decisionId = decision.id;
          await kv.set(`thread:${thread.id}`, thread);

          const draft = await generateAIDraft(thread.id, thread);

          if (moderation.priority === 'high') {
            await sendSlackAlert(teamId, {
              type: 'moderation_alert',
              thread,
              decision,
              draft,
            });
          }

          await logActivity(teamId, 'system', 'webhook_comment_processed', {
            commentId: comment.id,
            threadId: thread.id,
            decisionId: decision.id,
          });
        } catch (commentError) {
          console.error('Error processing comment:', commentError);
          await logActivity(teamId, 'system', 'webhook_comment_error', {
            commentId: comment.id,
            error: commentError.message,
          });
        }
      }
    }

    return Response.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
