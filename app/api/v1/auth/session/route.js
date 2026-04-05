import { kv } from '@/lib/kv';
import { createSession, validateSession, revokeSession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { validateEmail, validateRequired } from '@/lib/utils/validation';
import { AppError, badRequest, unauthorized } from '@/lib/utils/errors';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!validateEmail(email)) {
      return Response.json(
        { error: { code: 'INVALID_EMAIL', message: 'Invalid email format' } },
        { status: 400 }
      );
    }
    if (!validateRequired(password)) {
      return Response.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Password is required' } },
        { status: 400 }
      );
    }

    // Lookup user by email
    const userKey = `user:${email}`;
    const user = await kv.get(userKey);

    if (!user) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return Response.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id, user.teamId, user.permissions || []);

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
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(request) {
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

    // Validate session exists
    const session = await validateSession(token);

    // Revoke session
    await revokeSession(token);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
