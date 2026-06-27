import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const total = await (prisma as any).labourAttendance.count();
    const rows = await (prisma as any).labourAttendance.findMany({
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
    const row = await (prisma as any).labourAttendance.findUnique({ where: { id } });
    if (!row) return error(res, 'Not found', 404);
    return success(res, row);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const row = await (prisma as any).labourAttendance.create({
      data: {
        siteId: parseInt(data.site_id, 10),
        date: new Date(data.date),
        totalWorkers: parseInt(data.total_workers, 10),
        skilledWorkers: parseInt(data.skilled_workers, 10),
        unskilledWorkers: parseInt(data.unskilled_workers, 10),
        contractorName: data.contractor_name || null,
        notes: data.notes || null,
        recordedBy: (req as any).user.id
      }
    });
    return created(res, row, 'Created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = req.body;
    const row = await (prisma as any).labourAttendance.update({
      where: { id },
      data: {
        siteId: parseInt(data.site_id, 10),
        date: new Date(data.date),
        totalWorkers: parseInt(data.total_workers, 10),
        skilledWorkers: parseInt(data.skilled_workers, 10),
        unskilledWorkers: parseInt(data.unskilled_workers, 10),
        contractorName: data.contractor_name || null,
        notes: data.notes || null
      }
    });
    return success(res, row, 'Updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await (prisma as any).labourAttendance.delete({ where: { id } });
    return success(res, null, 'Deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};