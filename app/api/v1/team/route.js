import { validateSession } from '@/lib/auth/session';
import { getTeam, getTeamMembers } from '@/lib/models/team';

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

    // Fetch team and members
    const team = await getTeam(session.teamId);
    if (!team) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      );
    }

    const members = await getTeamMembers(session.teamId);

    return Response.json(
      {
        team: {
          id: team.id,
          name: team.name,
          settings: team.settings || {},
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
        },
        members: members || [],
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
