import { kv } from '@/lib/kv';
import { hashPassword } from '@/lib/auth/password';
import { generateUserId, generateTeamId } from '@/lib/auth/tokens';

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
      description: 'Shorewatch social intelligence team',
      website: 'https://joincoralcare.com',
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
    await kv.hset(`team:members:${teamId}`, {
      [userId]: JSON.stringify({
        userId, email, name, role: 'team_lead',
        permissions: ['read', 'write', 'approve', 'admin', 'invite'],
        joinedAt: Date.now(),
      }),
    });

    await kv.set('setup:completed', 'true');

    return Response.json({
      success: true,
      user: { id: userId, email, name, role: 'team_lead', teamId },
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
