import { validateSession } from '@/lib/auth/session';
import { getDraft, updateDraft } from '@/lib/models/draft';

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
    const { draftId } = await params;

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return Response.json(
        { error: { code: 'INVALID_TEXT', message: 'text is required' } },
        { status: 400 }
      );
    }

    // Fetch draft
    const draft = await getDraft(draftId);
    if (!draft) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Draft not found' } },
        { status: 404 }
      );
    }

    // Update draft text and increment version
    const updatedDraft = await updateDraft(draftId, {
      text,
      version: (draft.version || 0) + 1,
    });

    return Response.json(
      {
        draft: {
          id: updatedDraft.id,
          threadId: updatedDraft.threadId,
          text: updatedDraft.text,
          version: updatedDraft.version,
          status: updatedDraft.status,
          updatedAt: updatedDraft.updatedAt,
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
