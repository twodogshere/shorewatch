import { validateSession, requirePermission } from '@/lib/auth/session';
import { updateTeamMember, removeTeamMember } from '@/lib/models/team';
import { getRolePermissions } from '@/lib/constants/roles';
import { logActivity } from '@/lib/models/activity';

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

    // Check permission
    requirePermission(session.permissions, 'team:manage');

    const { userId } = await params;

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return Response.json(
        { error: { code: 'INVALID_ROLE', message: 'Role is required' } },
        { status: 400 }
      );
    }

    // Get new permissions based on role
    const permissions = getRolePermissions(role);

    // Update team member
    const updatedMember = await updateTeamMember(session.teamId, userId, role, permissions);

    if (!updatedMember) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Team member not found' } },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity(session.teamId, session.userId, 'member_role_updated', {
      targetUserId: userId,
      newRole: role,
    });

    return Response.json(
      {
        member: {
          userId: updatedMember.userId,
          role: updatedMember.role,
          permissions: updatedMember.permissions,
          joinedAt: updatedMember.joinedAt,
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

export async function DELETE(request, { params }) {
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
    requirePermission(session.permissions, 'team:manage');

    const { userId } = await params;

    // Cannot remove yourself
    if (userId === session.userId) {
      return Response.json(
        { error: { code: 'INVALID_ACTION', message: 'Cannot remove yourself from team' } },
        { status: 400 }
      );
    }

    // Remove member
    const removed = await removeTeamMember(session.teamId, userId);

    if (!removed) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: 'Team member not found' } },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity(session.teamId, session.userId, 'member_removed', {
      removedUserId: userId,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
