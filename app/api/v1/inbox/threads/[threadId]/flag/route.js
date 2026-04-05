import { validateSession } from '@/lib/auth/session';
import { flagThread } from '@/lib/models/thread';
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
    const { threadId } = await params;

    const body = await request.json();
    const { reason, notes } = body;

    // Flag thread
    const thread = await flagThread(threadId, {
      reason,
      notes,
      flaggedBy: session.userId,
      flaggedAt: Date.now(),
    });

    if (!thread) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity(session.teamId, session.userId, 'thread_flagged', {
      threadId,
      reason,
      notes,
    });

    return Response.json(
      {
        thread: {
          id: thread.id,
          isFlagged: thread.isFlagged,
          flagMetadata: thread.flagMetadata,
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
