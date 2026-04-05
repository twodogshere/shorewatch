import { kv } from '@/lib/kv';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { generateUserId, generateTeamId, generateSessionToken } from '@/lib/auth/tokens';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: { code: 'MISSING_FIELDS', message: 'email, password, and name are required' } },
        { status: 400 }
      );
    }

    const teamId = generateTeamId();
    await kv.set(`team:${teamId}`, {
      teamId,
      name: 'Coral Care',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const user = {
      id: userId,
      userId,
      email,
      name,
      role: 'team_lead',
      teamId,
      passwordHash,
      permissions: ['read', 'write', 'approve', 'admin', 'invite'],
      createdAt: Date.now(),
    };

    await kv.set(`user:${email}`, user);
    await kv.set(`user:id:${userId}`, user);

    const sessionToken = generateSessionToken();
    const now = Date.now();
    const session = {
      sessionToken,
      userId,
      teamId,
      email,
      name,
      role: 'team_lead',
      permissions: ['read', 'write', 'approve', 'admin', 'invite'],
      createdAt: now,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      lastAccessedAt: now,
    };

    await kv.set(`session:${sessionToken}`, session, { ex: 30 * 24 * 60 * 60 });

    return Response.json({
      success: true,
      sessionToken,
      user: { id: userId, email, name, role: 'team_lead', teamId },
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
