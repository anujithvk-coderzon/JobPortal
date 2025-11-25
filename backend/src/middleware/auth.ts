import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken, verifyAdminToken } from '../utils/jwt';
import prisma from '../config/database';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login to continue.',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);

      // Check if user still exists and is not blocked
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isBlocked: true,
        },
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'User account not found. Please contact support.',
          code: 'USER_DELETED',
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been blocked. Please contact support.',
          code: 'USER_BLOCKED',
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // If no token, continue without setting req.user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      // If token is invalid, continue without user (don't block the request)
      req.user = undefined;
      next();
    }
  } catch (error) {
    // On error, continue without user
    req.user = undefined;
    next();
  }
};

// Admin authentication middleware
export const authenticateAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please login.',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyAdminToken(token);
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please login again.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

// Require super admin role
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  if (req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required',
    });
  }

  next();
};
