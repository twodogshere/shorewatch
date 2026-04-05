import { kv } from '@/lib/kv';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { generateUserId } from '@/lib/auth/tokens';
import { getInvite, acceptInvite, addTeamMember } from '@/lib/models/team';
import { validateEmail, validatePassword, validateRequired } from '@/lib/utils/validation';
import { getRolePermissions } from '@/lib/constants/roles';

export async function POST(request) {
  try {
    const body = await request.json();
    const { inviteToken, password, name, email } = body;

    // Validate input
    if (!validateRequired(inviteToken)) {
      return Response.json(
        { error: { code: 'INVALID_INVITE', message: 'Invite token is required' } },
        { status: 400 }
      );
    }
    if (!validatePassword(password)) {
      return Response.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Password does not meet requirements' } },
        { status: 400 }
      );
    }
    if (!validateRequired(name)) {
      return Response.json(
        { error: { code: 'INVALID_NAME', message: 'Name is required' } },
        { status: 400 }
      );
    }
    if (!validateEmail(email)) {
      return Response.json(
        { error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Validate invite
    const invite = await getInvite(inviteToken);
    if (!invite) {
      return Response.json(
        { error: { code: 'INVALID_INVITE', message: 'Invite token not found or expired' } },
        { status: 404 }
      );
    }

    if (invite.expiresAt < Date.now()) {
      return Response.json(
        { error: { code: 'EXPIRED_INVITE', message: 'Invite has expired' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      return Response.json(
        { error: { code: 'USER_EXISTS', message: 'User with this email already exists' } },
        { status: 409 }
      );
    }

    // Create user
    const userId = await generateUserId();
    const passwordHash = await hashPassword(password);
    const permissions = getRolePermissions(invite.role);

    const user = {
      id: userId,
      email,
      name,
      role: invite.role,
      teamId: invite.teamId,
      permissions,
      passwordHash,
      createdAt: Date.now(),
    };

    // Store user
    await kv.set(`user:${email}`, user);
    await kv.set(`user:${userId}`, user);

    // Add user to team
    await addTeamMember(invite.teamId, userId, invite.role, permissions);

    // Mark invite as accepted
    await acceptInvite(inviteToken, userId);

    // Create session
    const session = await createSession(userId, invite.teamId, permissions);

    return Response.json(
      {
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamId: user.teamId,
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
