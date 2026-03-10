import rateLimit from 'express-rate-limit';

// Standard error response
const rateLimitResponse = {
  success: false,
  error: 'Too many requests. Please try again later.',
};

// ─── Strict: Auth endpoints (login, register) ───
// 5 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// ─── Strict: Verification code requests ───
// 3 per 10 minutes per IP (prevents email spam)
export const verificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification code requests. Please try again after 10 minutes.',
  },
});

// ─── Strict: Password change ───
// 5 per hour per IP
export const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many password change attempts. Please try again later.',
  },
});

// ─── Moderate: Write operations (create/update/delete) ───
// 30 per minute per IP
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

// ─── Moderate: File uploads ───
// 10 per minute per IP
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many uploads. Please try again after a minute.',
  },
});

// ─── Relaxed: General API requests ───
// 500 per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

// ─── Strict: Admin auth ───
// 5 per 15 minutes per IP
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many admin login attempts. Please try again after 15 minutes.',
  },
});

// ─── Very strict: Setup endpoint ───
// 3 per hour per IP
export const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many setup attempts. Please try again later.',
  },
});

// ─── Moderate: Report submission ───
// 10 per hour per IP
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many reports submitted. Please try again later.',
  },
});
