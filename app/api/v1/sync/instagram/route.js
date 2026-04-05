import { kv } from '@/lib/kv';
import { validateSession } from '@/lib/auth/session';

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

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
    const teamId = session.teamId;

    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return Response.json(
        { error: { code: 'CONFIG_ERROR', message: 'Missing META_PAGE_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID' } },
        { status: 500 }
      );
    }

    const mediaUrl = `${GRAPH_API_BASE}/${igAccountId}/media?fields=id,caption,timestamp,permalink,media_type,like_count,comments_count&limit=25&access_token=${accessToken}`;
    const mediaRes = await fetch(mediaUrl);

    if (!mediaRes.ok) {
      const err = await mediaRes.json();
      return Response.json(
        { error: { code: 'META_API_ERROR', message: err.error?.message || 'Failed to fetch media' } },
        { status: 502 }
      );
    }

    const mediaData = await mediaRes.json();
    const media = mediaData.data || [];
    let threadsCreated = 0;
    let commentsImported = 0;
    const errors = [];

    for (const post of media) {
      try {
        const commentsUrl = `${GRAPH_API_BASE}/${post.id}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}&limit=50&access_token=${accessToken}`;
        const commentsRes = await fetch(commentsUrl);

        if (!commentsRes.ok) {
          const err = await commentsRes.json();
          errors.push(`Post ${post.id}: ${err.error?.message}`);
          continue;
        }

        const commentsData = await commentsRes.json();
        const comments = commentsData.data || [];

        for (const comment of comments) {
          const threadId = `thread_parent_${post.id}_${comment.id}`;
          const now = Date.now();
          const commentTime = new Date(comment.timestamp).getTime();

          const thread = {
            threadId, channelType: 'parent', accountId: teamId,
            postId: post.id, commentId: comment.id,
            authorName: comment.username || 'Unknown',
            authorId: comment.username || 'unknown',
            content: comment.text || '',
            postCaption: post.caption || '',
            postPermalink: post.permalink || '',
            status: 'needs_attention', readBy: [],
            createdAt: commentTime || now, updatedAt: now,
            source: 'instagram', likeCount: comment.like_count || 0,
            replies: (comment.replies?.data || []).map(r => ({
              id: r.id, text: r.text, username: r.username, timestamp: r.timestamp,
            })),
          };

          await kv.set(`thread:${threadId}`, JSON.stringify(thread));
          await kv.zadd(`thread:sort:parent:${teamId}:by_recent`, { score: commentTime || now, member: threadId });
          threadsCreated++;
          commentsImported++;
        }

        if (comments.length === 0 && (post.comments_count > 0 || post.like_count > 5)) {
          const threadId = `thread_parent_${post.id}`;
          const postTime = new Date(post.timestamp).getTime();
          const thread = {
            threadId, channelType: 'parent', accountId: teamId,
            postId: post.id, authorName: 'Coral Care', authorId: 'self',
            content: post.caption || '(no caption)',
            postPermalink: post.permalink || '',
            status: 'done', readBy: [],
            createdAt: postTime, updatedAt: Date.now(),
            source: 'instagram', likeCount: post.like_count || 0,
            commentsCount: post.comments_count || 0,
          };
          await kv.set(`thread:${threadId}`, JSON.stringify(thread));
          await kv.zadd(`thread:sort:parent:${teamId}:by_recent`, { score: postTime, member: threadId });
          threadsCreated++;
        }
      } catch (postErr) {
        errors.push(`Post ${post.id}: ${postErr.message}`);
      }
    }

    return Response.json({
      success: true,
      stats: { postsScanned: media.length, threadsCreated, commentsImported, errors: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
