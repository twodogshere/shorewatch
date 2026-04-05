import { kv } from '@/lib/kv';
import { hashPassword } from '@/lib/auth/password';
import { generateUserId, generateTeamId } from '@/lib/auth/tokens';

/**
 * Bootstrap setup route - creates the first admin user and team
 * This route only works once. After the first admin is created,
 * it will return a 403 error.
 *
 * POST /api/v1/setup
 * Body: { email, password, name }
 */
export async function POST(request) {
  try {
    // Check if setup has already been completed
    const setupDone = await kv.get('setup:completed');
    if (setupDone) {
      return Response.json(
        { error: { code: 'SETUP_COMPLETE', message: 'Setup has already been completed. This endpoint is disabled.' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return Response.json(
        { error: { code: 'MISSING_FIELDS', message: 'email, password, and name are required' } },
        { status: 400 }
      );
    }

    // Create team
    const teamId = generateTeamId();
    const team = {
      teamId,
      name: 'Coral Care',
      description: 'Shorewatch social intelligence team',
      website: 'https://joincoralcare.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // @vercel/kv v3: auto-serializes objects, don't JSON.stringify
    await kv.set(`team:${teamId}`, team);

    // Create admin user
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

    // Store user by email (for login lookup) - don't JSON.stringify
    await kv.set(`user:${email}`, user);
    // Store user by ID (for session lookups) - don't JSON.stringify
    await kv.set(`user:id:${userId}`, user);

    // Add user as team member - use hset with object syntax for v3
    await kv.hset(`team:members:${teamId}`, {
      [userId]: {
        userId,
        email,
        name,
        role: 'team_lead',
        permissions: ['read', 'write', 'approve', 'admin', 'invite'],
        joinedAt: Date.now(),
      }
    });

    // Mark setup as complete
    await kv.set('setup:completed', 'true');

    return Response.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: userId,
        email,
        name,
        role: 'team_lead',
        teamId,
      },
      team: {
        teamId,
        name: 'Coral Care',
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const setupDone = await kv.get('setup:completed');
    return Response.json({
      setupRequired: !setupDone,
      message: setupDone ? 'Setup already completed' : 'Setup required - POST to this endpoint with email, password, and name',
    });
  } catch (error) {
    return Response.json({
      setupRequired: true,
      message: 'Setup required',
    });
  }
}
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
