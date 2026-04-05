import { validateSession, requirePermission } from '@/lib/auth/session';
import { createInvite } from '@/lib/models/team';
import { validateEmail, validateRequired } from '@/lib/utils/validation';
import { logActivity } from '@/lib/models/activity';

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

    // Check permission
    requirePermission(session.permissions, 'team:invite');

    const body = await request.json();
    const { email, role } = body;

    // Validate input
    if (!validateEmail(email)) {
      return Response.json(
        { error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    if (!validateRequired(role)) {
      return Response.json(
        { error: { code: 'INVALID_ROLE', message: 'Role is required' } },
        { status: 400 }
      );
    }

    // Create invite with 7-day TTL
    const invite = await createInvite(session.teamId, email, role);

    // Log activity
    await logActivity(session.teamId, session.userId, 'invite_sent', {
      email,
      role,
    });

    // Build invite URL (assumes frontend is at origin)
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${invite.token}`;

    return Response.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          inviteUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
