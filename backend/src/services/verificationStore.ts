import { cacheSet, cacheGetDirect, cacheDel, cacheExists, TTL } from '../utils/cache';
import { CacheKeys } from '../utils/cache';

interface VerificationData {
  code: string;
  email: string;
  name: string;
  password: string;
  mobile?: string;
  expiresAt: number;
}

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, VerificationData>();

const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Clean up expired codes from memory fallback periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of memoryStore.entries()) {
    if (data.expiresAt < now) {
      memoryStore.delete(email);
    }
  }
}, 60 * 1000);

export const storeVerificationCode = async (
  email: string,
  code: string,
  userData: { name: string; password: string; mobile?: string }
): Promise<void> => {
  const data: VerificationData = {
    code,
    email,
    name: userData.name,
    password: userData.password,
    mobile: userData.mobile,
    expiresAt: Date.now() + EXPIRATION_TIME,
  };

  // Store in Redis with TTL
  await cacheSet(CacheKeys.verification(email), data, TTL.VERIFICATION);

  // Also store in memory as fallback
  memoryStore.set(email, data);
};

export const verifyCode = async (email: string, code: string): Promise<VerificationData | null> => {
  // Try Redis first
  let data = await cacheGetDirect<VerificationData>(CacheKeys.verification(email));

  // Fall back to memory
  if (!data) {
    data = memoryStore.get(email) || null;
  }

  if (!data) {
    return null;
  }

  // Check if code has expired
  if (data.expiresAt < Date.now()) {
    await cacheDel(CacheKeys.verification(email));
    memoryStore.delete(email);
    return null;
  }

  // Check if code matches
  if (data.code !== code) {
    return null;
  }

  return data;
};

export const deleteVerificationCode = async (email: string): Promise<void> => {
  await cacheDel(CacheKeys.verification(email));
  memoryStore.delete(email);
};

export const hasVerificationCode = async (email: string): Promise<boolean> => {
  // Try Redis first
  const redisExists = await cacheExists(CacheKeys.verification(email));
  if (redisExists) return true;

  // Fall back to memory
  const data = memoryStore.get(email);
  if (!data) return false;

  if (data.expiresAt < Date.now()) {
    memoryStore.delete(email);
    return false;
  }

  return true;
};
