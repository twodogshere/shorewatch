import { validateSession, requirePermission } from '@/lib/auth/session';
import { getDecision, approveDecision } from '@/lib/models/moderation';
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
    const { notes } = body;

    // Fetch decision
    const decision = await getDecision(decisionId);
    if (!decision) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Decision not found' } },
        { status: 404 }
      );
    }

    // Approve decision
    const approvedDecision = await approveDecision(decisionId, {
      approvedBy: session.userId,
      approvedAt: Date.now(),
      notes,
    });

    // Update associated thread
    const thread = await getThread(decision.threadId);
    if (thread) {
      await updateThread(thread.id, {
        status: 'approved',
        moderationStatus: approvedDecision.status,
      });
    }

    // Log activity
    await logActivity(session.teamId, session.userId, 'decision_approved', {
      decisionId,
      threadId: decision.threadId,
      notes,
    });

    return Response.json(
      {
        decision: {
          id: approvedDecision.id,
          status: approvedDecision.status,
          approvedBy: approvedDecision.approvedBy,
          approvedAt: approvedDecision.approvedAt,
          notes: approvedDecision.notes,
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
