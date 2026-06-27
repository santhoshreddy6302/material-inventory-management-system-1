import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';


export const getAll = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const { role, is_active } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (role) {
      where.role = role as string;
    }
    if (is_active !== undefined) {
      where.isActive = is_active === 'true';
    }

    const total = await prisma.user.count({ where });
    const rows = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return paginated(res, rows, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, role, phone } = req.body;
    const emailLower = email.toLowerCase();
    
    const exists = await prisma.user.findUnique({
      where: { email: emailLower }
    });
    if (exists) return error(res, 'Email already registered', 409);
    
    const hashed = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        name,
        email: emailLower,
        password: hashed,
        role: role as string,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      }
    });

    return created(res, newUser, 'User created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return error(res, 'Invalid user ID', 400);

    const { name, email, role, phone, is_active } = req.body;
    
    const exists = await prisma.user.findUnique({
      where: { id }
    });
    if (!exists) return error(res, 'User not found', 404);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        email: email ? email.toLowerCase() : undefined,
        role: role ? (role as string) : undefined,
        phone: phone !== undefined ? phone : null,
        isActive: is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
      }
    });

    return success(res, updated, 'User updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return error(res, 'Invalid user ID', 400);

    const { password } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    
    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return success(res, null, 'Password reset successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
