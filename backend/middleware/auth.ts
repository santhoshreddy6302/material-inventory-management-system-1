import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { error } from '../utils/responseHelper';

const JWT_SECRET = process.env.JWT_SECRET || 'mims_super_secret_jwt_key_change_in_production_min_32_chars';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user || !user.isActive) {
      return error(res, 'User not found or account deactivated.', 401);
    }

    (req as any).user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token expired.', 401);
    if (err.name === 'JsonWebTokenError') return error(res, 'Invalid token.', 401);
    return error(res, 'Authentication failed.', 500);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) return error(res, 'Not authenticated.', 401);
    if (!roles.includes((req as any).user.role)) {
      return error(res, `Access denied. Required roles: ${roles.join(', ')}`, 403);
    }
    next();
  };
};
