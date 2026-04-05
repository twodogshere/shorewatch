import { validateSession } from '@/lib/auth/session';
import { markThreadRead } from '@/lib/models/thread';

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

    // Mark thread as read for current user
    const thread = await markThreadRead(threadId, session.userId);

    if (!thread) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Thread not found' } },
        { status: 404 }
      );
    }

    return Response.json(
      {
        thread: {
          id: thread.id,
          isRead: thread.isRead,
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
