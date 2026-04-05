import { validateSession } from '@/lib/auth/session';
import { kv } from '@/lib/kv';

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
    const teamId = session.teamId;

    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sortKey = `thread:sort:parent:${teamId}:by_recent`;
    const total = await kv.zcard(sortKey) || 0;

    let threadIds = [];
    if (limit > 0) {
      threadIds = await kv.zrange(sortKey, offset, offset + limit - 1, { rev: true }) || [];
    } else {
      threadIds = await kv.zrange(sortKey, 0, -1, { rev: true }) || [];
    }

    const threads = [];
    let unreadCount = 0;
    let flaggedCount = 0;
    let needsAttentionCount = 0;

    for (const threadId of threadIds) {
      const raw = await kv.get(`thread:${threadId}`);
      if (!raw) continue;
      const thread = typeof raw === 'string' ? JSON.parse(raw) : raw;

      if (!thread.readBy || thread.readBy.length === 0) unreadCount++;
      if (thread.flaggedReason) flaggedCount++;
      if (thread.status === 'needs_attention') needsAttentionCount++;

      if (filter === 'all' || filter === thread.status) {
        threads.push(thread);
      }
    }

    return Response.json({
      threads: limit > 0 ? threads.slice(0, limit) : [],
      pagination: { limit, offset, total, hasMore: offset + limit < total },
      summary: { total, unread: unreadCount, flagged: flaggedCount, needsAttention: needsAttentionCount },
      unreadCount,
      flaggedCount,
      needsAttention: needsAttentionCount,
      avgResponseTime: 0,
      sentiment: 0,
    });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
