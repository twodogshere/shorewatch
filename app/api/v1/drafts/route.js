import { validateSession } from '@/lib/auth/session';
import { getThread } from '@/lib/models/thread';
import { createDraft } from '@/lib/models/draft';
import { generateAIDraft } from '@/lib/ai/pipeline';
import { logActivity } from '@/lib/models/activity';

export async function POST(request) {
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

    const body = await request.json();
    const { threadId } = body;

    if (!threadId) {
      return Response.json(
        { error: { code: 'INVALID_THREAD', message: 'threadId is required' } },
        { status: 400 }
      );
    }

    // Fetch thread
    const thread = await getThread(threadId);
    if (!thread || thread.teamId !== session.teamId) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    // Generate AI draft
    const generatedText = await generateAIDraft(threadId, thread);

    // Create draft record
    const draft = await createDraft(threadId, generatedText, session.userId);

    // Log activity
    await logActivity(session.teamId, session.userId, 'draft_generated', {
      threadId,
    });

    return Response.json(
      {
        draft: {
          id: draft.id,
          threadId: draft.threadId,
          text: draft.text,
          version: draft.version,
          status: draft.status,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
