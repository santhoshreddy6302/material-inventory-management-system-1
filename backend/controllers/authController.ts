import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { success, created, error } from '../utils/responseHelper';


const JWT_SECRET = process.env.JWT_SECRET || 'mims_super_secret_jwt_key_change_in_production_min_32_chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mims_super_secret_refresh_jwt_key_change_in_production_min_64_chars';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return error(res, 'Account deactivated. Contact administrator.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Sign Access & Refresh Tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    const { password: _, ...userData } = user;
    
    return success(res, {
      token: accessToken,
      refreshToken,
      user: userData
    }, 'Login successful');
  } catch (err: any) {
    const debugInfo = `JWT_SECRET: ${typeof JWT_SECRET} (len: ${JWT_SECRET?.length}), JWT_REFRESH_SECRET: ${typeof JWT_REFRESH_SECRET} (len: ${JWT_REFRESH_SECRET?.length})`;
    return error(res, `${err.message} (${debugInfo})`, 500);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (exists) {
      return error(res, 'Email already registered', 409);
    }

    const hashedPwd = await bcrypt.hash(password, 12);
    
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPwd,
        role: (role as string) || "site_engineer",
        phone: phone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      }
    });

    return created(res, newUser, 'User registered successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return error(res, 'Refresh token required', 400);
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return error(res, 'User not found or account deactivated', 401);
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );return success(res, {
      token: newAccessToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');
  } catch (err: any) {
    return error(res, 'Invalid or expired refresh token', 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!(req as any).user) {
      return error(res, 'Unauthenticated', 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });
    if (!user) {
      return error(res, 'User not found', 404);
    }
    return success(res, user);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    if (!(req as any).user) {
      return error(res, 'Unauthenticated', 401);
    }
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id }
    });

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return error(res, 'Current password is incorrect', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { password: hashed }
    });

    return success(res, null, 'Password updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!(req as any).user) {
      return error(res, 'Unauthenticated', 401);
    }
    const { name, phone } = req.body;
    
    const updated = await prisma.user.update({
      where: { id: (req as any).user.id },
      data: {
        name,
        phone: phone || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true
      }
    });

    return success(res, updated, 'Profile updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
