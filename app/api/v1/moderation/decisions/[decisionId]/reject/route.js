import { validateSession, requirePermission } from '@/lib/auth/session';
import { getDecision, rejectDecision } from '@/lib/models/moderation';
import { getThread, updateThread } from '@/lib/models/thread';
import { logActivity } from '@/lib/models/activity';

export async function POST(request, { params }) {
  try {
    const token =
      request.headers.get('authorization')?.split('Bearer ')[1] ||
      request.cookies.get('sessionToken')?.value;

    if (!token) {
      return Response.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing auth token' } },
        { status: 401 }
      );
    }

    const session = await validateSession(token);

    // Check permission
    requirePermission(session.permissions, 'moderation:review');

    const { decisionId } = await params;

    const body = await request.json();
    const { reason, notes, hideComment } = body;

    if (!reason) {
      return Response.json(
        { error: { code: 'INVALID_REASON', message: 'Reason is required' } },
        { status: 400 }
      );
    }

    // Fetch decision
    const decision = await getDecision(decisionId);
    if (!decision) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      );
    }

    // Reject decision
    const rejectedDecision = await rejectDecision(decisionId, {
      rejectedBy: session.userId,
      rejectedAt: Date.now(),
      reason,
      notes,
    });

    // Optionally hide comment via Meta API if hideComment is true
    if (hideComment && decision.parentId) {
      try {
        // This would call Meta API to hide the comment
        // Implementation depends on Meta API client availability
        // For now, we'll just log it as attempted
        logActivity(session.teamId, session.userId, 'comment_hide_attempted', {
          parentId: decision.parentId,
        });
      } catch (metaError) {
        // Log but don't fail the request
        logActivity(session.teamId, session.userId, 'comment_hide_failed', {
          parentId: decision.parentId,
          error: metaError.message,
        });
      }
    }

    // Update associated thread
    const thread = await getThread(decision.threadId);
    if (thread) {
      await updateThread(thread.id, {
        status: 'rejected',
        moderationStatus: rejectedDecision.status,
      });
    }

    // Log activity
    await logActivity(session.teamId, session.userId, 'decision_rejected', {
      decisionId,
      threadId: decision.threadId,
      reason,
      notes,
      hideComment,
    });

    return Response.json(
      {
        decision: {
          id: rejectedDecision.id,
          status: rejectedDecision.status,
          rejectedBy: rejectedDecision.rejectedBy,
          rejectedAt: rejectedDecision.rejectedAt,
          reason: rejectedDecision.reason,
          notes: rejectedDecision.notes,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
