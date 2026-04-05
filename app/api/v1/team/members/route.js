import { validateSession } from '@/lib/auth/session';
import { getTeamMembers } from '@/lib/models/team';

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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const roleFilter = url.searchParams.get('role');

    // Fetch all team members
    const allMembers = await getTeamMembers(session.teamId);

    // Filter by role if specified
    let members = allMembers || [];
    if (roleFilter) {
      members = members.filter((m) => m.role === roleFilter);
    }

    // Apply pagination
    const paginatedMembers = members.slice(offset, offset + limit);

    return Response.json(
      {
        members: paginatedMembers,
        pagination: {
          limit,
          offset,
          total: members.length,
          hasMore: offset + limit < members.length,
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
