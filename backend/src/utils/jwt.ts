import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import redis, { isRedisConnected } from '../config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Access token: short-lived (15 minutes)
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh token: long-lived (7 days)
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MODERATOR';
}

// ---- Access Token ----

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as any);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

// ---- Refresh Token (User) ----
// Redis keys:
//   refresh:token:<refreshToken> → JSON payload {userId, email, createdAt}
//   refresh:user:<userId>        → Redis SET of refresh tokens for revokeAll

/**
 * Generate a secure refresh token and store it in Redis.
 */
export const generateRefreshToken = async (payload: TokenPayload): Promise<string> => {
  const refreshToken = crypto.randomBytes(40).toString('hex');

  if (isRedisConnected()) {
    const tokenKey = `refresh:token:${refreshToken}`;
    const userSetKey = `refresh:user:${payload.userId}`;

    await redis.setex(tokenKey, REFRESH_TOKEN_EXPIRY, JSON.stringify({
      userId: payload.userId,
      email: payload.email,
      createdAt: Date.now(),
    }));
    // Track this token under the user's set (for revokeAll)
    await redis.sadd(userSetKey, refreshToken);
    await redis.expire(userSetKey, REFRESH_TOKEN_EXPIRY);
  }

  return refreshToken;
};

/**
 * Verify a refresh token from Redis (no userId needed from client).
 * Returns the payload if valid, null if invalid/expired.
 */
export const verifyRefreshToken = async (
  refreshToken: string
): Promise<TokenPayload | null> => {
  if (!isRedisConnected()) return null;

  const tokenKey = `refresh:token:${refreshToken}`;
  const data = await redis.get(tokenKey);

  if (!data) return null;

  try {
    const payload = JSON.parse(data);
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
};

/**
 * Rotate refresh token: delete old one and create a new one.
 */
export const rotateRefreshToken = async (
  oldRefreshToken: string,
  payload: TokenPayload
): Promise<string | null> => {
  if (!isRedisConnected()) return null;

  const oldTokenKey = `refresh:token:${oldRefreshToken}`;
  const exists = await redis.del(oldTokenKey);

  if (exists === 0) {
    // Old token doesn't exist — possible reuse attack
    await revokeAllUserRefreshTokens(payload.userId);
    return null;
  }

  // Remove old token from user's set
  const userSetKey = `refresh:user:${payload.userId}`;
  await redis.srem(userSetKey, oldRefreshToken);

  // Generate new refresh token
  return generateRefreshToken(payload);
};

/**
 * Revoke a specific refresh token (e.g., on logout).
 */
export const revokeRefreshToken = async (
  refreshToken: string,
  userId?: string
): Promise<void> => {
  if (!isRedisConnected()) return;

  const tokenKey = `refresh:token:${refreshToken}`;

  // If userId not provided, look it up from the token data
  if (!userId) {
    const data = await redis.get(tokenKey);
    if (data) {
      try {
        const payload = JSON.parse(data);
        userId = payload.userId;
      } catch {}
    }
  }

  await redis.del(tokenKey);

  if (userId) {
    const userSetKey = `refresh:user:${userId}`;
    await redis.srem(userSetKey, refreshToken);
  }
};

/**
 * Revoke ALL refresh tokens for a user (e.g., on password change, block, delete).
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  if (!isRedisConnected()) return;

  const userSetKey = `refresh:user:${userId}`;
  const tokens = await redis.smembers(userSetKey);

  if (tokens.length > 0) {
    const tokenKeys = tokens.map(t => `refresh:token:${t}`);
    await redis.del(...tokenKeys);
  }

  await redis.del(userSetKey);
};

// ---- Admin Tokens ----
// Redis keys:
//   refresh:admin:token:<refreshToken> → JSON payload
//   refresh:admin:user:<adminId>       → Redis SET of refresh tokens

export const generateAdminToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as any);
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
};

export const generateAdminRefreshToken = async (payload: AdminTokenPayload): Promise<string> => {
  const refreshToken = crypto.randomBytes(40).toString('hex');

  if (isRedisConnected()) {
    const tokenKey = `refresh:admin:token:${refreshToken}`;
    const adminSetKey = `refresh:admin:user:${payload.adminId}`;

    await redis.setex(tokenKey, REFRESH_TOKEN_EXPIRY, JSON.stringify({
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
      createdAt: Date.now(),
    }));
    await redis.sadd(adminSetKey, refreshToken);
    await redis.expire(adminSetKey, REFRESH_TOKEN_EXPIRY);
  }

  return refreshToken;
};

export const verifyAdminRefreshToken = async (
  refreshToken: string
): Promise<AdminTokenPayload | null> => {
  if (!isRedisConnected()) return null;

  const tokenKey = `refresh:admin:token:${refreshToken}`;
  const data = await redis.get(tokenKey);

  if (!data) return null;

  try {
    const payload = JSON.parse(data);
    return { adminId: payload.adminId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
};

export const rotateAdminRefreshToken = async (
  oldRefreshToken: string,
  payload: AdminTokenPayload
): Promise<string | null> => {
  if (!isRedisConnected()) return null;

  const oldTokenKey = `refresh:admin:token:${oldRefreshToken}`;
  const exists = await redis.del(oldTokenKey);

  if (exists === 0) {
    await revokeAllAdminRefreshTokens(payload.adminId);
    return null;
  }

  const adminSetKey = `refresh:admin:user:${payload.adminId}`;
  await redis.srem(adminSetKey, oldRefreshToken);

  return generateAdminRefreshToken(payload);
};

export const revokeAdminRefreshToken = async (
  refreshToken: string,
  adminId?: string
): Promise<void> => {
  if (!isRedisConnected()) return;

  const tokenKey = `refresh:admin:token:${refreshToken}`;

  if (!adminId) {
    const data = await redis.get(tokenKey);
    if (data) {
      try {
        const payload = JSON.parse(data);
        adminId = payload.adminId;
      } catch {}
    }
  }

  await redis.del(tokenKey);

  if (adminId) {
    const adminSetKey = `refresh:admin:user:${adminId}`;
    await redis.srem(adminSetKey, refreshToken);
  }
};

export const revokeAllAdminRefreshTokens = async (adminId: string): Promise<void> => {
  if (!isRedisConnected()) return;

  const adminSetKey = `refresh:admin:user:${adminId}`;
  const tokens = await redis.smembers(adminSetKey);

  if (tokens.length > 0) {
    const tokenKeys = tokens.map(t => `refresh:admin:token:${t}`);
    await redis.del(...tokenKeys);
  }

  await redis.del(adminSetKey);
};
