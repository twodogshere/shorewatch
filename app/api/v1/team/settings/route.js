import { validateSession, requirePermission } from '@/lib/auth/session';
import { getTeam, updateTeamSettings } from '@/lib/models/team';
import { logActivity } from '@/lib/models/activity';

export async function PATCH(request) {
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
    requirePermission(session.permissions, 'team:settings');

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return Response.json(
        { error: { code: 'INVALID_SETTINGS', message: 'Settings object is required' } },
        { status: 400 }
      );
    }

    // Get current team
    const team = await getTeam(session.teamId);
    if (!team) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      );
    }

    // Merge and update settings
    const updatedSettings = {
      ...team.settings,
      ...settings,
    };

    const updatedTeam = await updateTeamSettings(session.teamId, updatedSettings);

    // Log activity
    await logActivity(session.teamId, session.userId, 'team_settings_updated', {
      changes: settings,
    });

    return Response.json(
      {
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          settings: updatedTeam.settings,
          updatedAt: updatedTeam.updatedAt,
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
