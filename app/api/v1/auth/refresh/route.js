import { validateSession, refreshSession } from '@/lib/auth/session';

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

    // Validate existing session
    const session = await validateSession(token);

    // Refresh session (extend TTL)
    const newSession = await refreshSession(token);

    return Response.json(
      {
        sessionToken: newSession.token,
        expiresAt: newSession.expiresAt,
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
