import { validateSession } from '@/lib/auth/session';
import { getDraft, updateDraft } from '@/lib/models/draft';
import { getThread, updateThread } from '@/lib/models/thread';
import { replyToComment } from '@/lib/integrations/meta/comments';
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
    const { draftId } = await params;

    // Fetch draft
    const draft = await getDraft(draftId);
    if (!draft) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Fetch thread
    const thread = await getThread(draft.threadId);
    if (!thread || thread.teamId !== session.teamId) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    // Send reply to Meta
    const metaResponse = await replyToComment(thread.parentId, draft.text);

    if (!metaResponse.success) {
      return Response.json(
        { error: { code: 'META_API_ERROR', message: 'Failed to publish to Meta' } },
        { status: 500 }
      );
    }

    // Update draft status to published
    const publishedDraft = await updateDraft(draftId, {
      status: 'published',
      metaCommentId: metaResponse.commentId,
      publishedAt: Date.now(),
    });

    // Update thread to reflect published comment
    await updateThread(thread.id, {
      status: 'replied',
      lastCommentId: metaResponse.commentId,
    });

    // Log activity
    await logActivity(session.teamId, session.userId, 'draft_published', {
      draftId,
      threadId: thread.id,
      metaCommentId: metaResponse.commentId,
    });

    return Response.json(
      {
        draft: {
          id: publishedDraft.id,
          status: publishedDraft.status,
          metaCommentId: publishedDraft.metaCommentId,
          publishedAt: publishedDraft.publishedAt,
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
