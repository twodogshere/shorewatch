import { validateSession } from '@/lib/auth/session';
import { listThreads } from '@/lib/models/thread';

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

    // Parse query parameters
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all'; // all, unread, flagged, needs_attention
    const sort = url.searchParams.get('sort') || 'recent'; // recent, sentiment, priority
    const channel = url.searchParams.get('channel') || 'both'; // parent, provider, both
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch threads with filters
    const result = await listThreads(session.teamId, {
      filter,
      sort,
      channel,
      limit,
      offset,
    });

    // Build summary stats
    const summary = {
      total: result.total || 0,
      unread: result.unread || 0,
      flagged: result.flagged || 0,
      needsAttention: result.needsAttention || 0,
    };

    return Response.json(
      {
        threads: result.threads || [],
        pagination: {
          limit,
          offset,
          total: result.total || 0,
          hasMore: offset + limit < (result.total || 0),
        },
        summary,
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
