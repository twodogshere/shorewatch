import { validateSession, requirePermission } from '@/lib/auth/session';
import { getQueue } from '@/lib/models/moderation';

export async function GET(request) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const priority = url.searchParams.get('priority'); // high, medium, low
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch moderation queue
    const result = await getQueue(session.teamId, {
      priority,
      limit,
      offset,
    });

    return Response.json(
      {
        decisions: result.decisions || [],
        pagination: {
          limit,
          offset,
          total: result.total || 0,
          hasMore: offset + limit < (result.total || 0),
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
