import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const total = await (prisma as any).paymentMilestone.count();
    const rows = await (prisma as any).paymentMilestone.findMany({
      skip: offset,
      take: limit,
      orderBy: { id: 'desc' }
    });
    return paginated(res, rows, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await (prisma as any).paymentMilestone.findUnique({ where: { id } });
    if (!row) return error(res, 'Not found', 404);
    return success(res, row);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const formattedData: any = {};
    for (const [k, v] of Object.entries(req.body)) {
      const camel = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
      if (camel.toLowerCase().includes('date') && typeof v === 'string') {
        formattedData[camel] = new Date(v);
      } else {
        formattedData[camel] = v;
      }
    }

    const row = await (prisma as any).paymentMilestone.create({ data: formattedData });
    return created(res, row, 'Created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const formattedData: any = {};
    for (const [k, v] of Object.entries(req.body)) {
      const camel = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
      if (camel.toLowerCase().includes('date') && typeof v === 'string') {
        formattedData[camel] = new Date(v);
      } else {
        formattedData[camel] = v;
      }
    }

    const row = await (prisma as any).paymentMilestone.update({
      where: { id },
      data: formattedData
    });
    return success(res, row, 'Updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await (prisma as any).paymentMilestone.delete({ where: { id } });
    return success(res, null, 'Deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};