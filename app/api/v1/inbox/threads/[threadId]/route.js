import { validateSession } from '@/lib/auth/session';
import { getThread, updateThread } from '@/lib/models/thread';
import { getDecision } from '@/lib/models/moderation';
import { getDraft } from '@/lib/models/draft';
import { logActivity } from '@/lib/models/activity';

export async function GET(request, { params }) {
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

    // Fetch thread
    const thread = await getThread(threadId);

    if (!thread || thread.teamId !== session.teamId) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    // Fetch associated moderation decision if exists
    let decision = null;
    if (thread.decisionId) {
      decision = await getDecision(thread.decisionId);
    }

    // Fetch draft if exists
    let draft = null;
    if (thread.draftId) {
      draft = await getDraft(thread.draftId);
    }

    return Response.json(
      {
        thread: {
          id: thread.id,
          parentId: thread.parentId,
          provider: thread.provider,
          title: thread.title,
          body: thread.body,
          author: thread.author,
          sentiment: thread.sentiment,
          isRead: thread.isRead,
          isFlagged: thread.isFlagged,
          status: thread.status,
          assignedTo: thread.assignedTo,
          tags: thread.tags || [],
          messages: thread.messages || [],
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
        },
        moderation: decision || null,
        draft: draft || null,
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

export async function PATCH(request, { params }) {
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

    // Fetch thread
    const thread = await getThread(threadId);

    if (!thread || thread.teamId !== session.teamId) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, assignedTo, tags } = body;

    // Build update object
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (tags !== undefined) updates.tags = tags;

    // Update thread
    const updatedThread = await updateThread(threadId, updates);

    // Log activity
    await logActivity(session.teamId, session.userId, 'thread_updated', {
      threadId,
      changes: updates,
    });

    return Response.json(
      {
        thread: {
          id: updatedThread.id,
          status: updatedThread.status,
          assignedTo: updatedThread.assignedTo,
          tags: updatedThread.tags,
          updatedAt: updatedThread.updatedAt,
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
