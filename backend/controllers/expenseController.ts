import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const total = await (prisma as any).projectExpense.count();
    const rows = await (prisma as any).projectExpense.findMany({
      skip: offset,
      take: limit,
      orderBy: { id: 'desc' },
      include: {
        project: { select: { name: true } }
      }
    });
    return paginated(res, rows, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await (prisma as any).projectExpense.findUnique({ where: { id } });
    if (!row) return error(res, 'Not found', 404);
    return success(res, row);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { project_id, category, amount, description, incurred_by, expense_date } = req.body;
    
    const row = await prisma.projectExpense.create({
      data: {
        category,
        amount: Number(amount),
        description: description || null,
        incurredBy: incurred_by || null,
        expenseDate: new Date(expense_date),
        project: { connect: { id: parseInt(project_id, 10) } },
        recorder: { connect: { id: (req as any).user.id } }
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
    const { project_id, category, amount, description, incurred_by, expense_date } = req.body;
    
    const row = await prisma.projectExpense.update({
      where: { id },
      data: {
        category: category || undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        description: description !== undefined ? description : undefined,
        incurredBy: incurred_by !== undefined ? incurred_by : undefined,
        expenseDate: expense_date ? new Date(expense_date) : undefined,
        project: project_id ? { connect: { id: parseInt(project_id, 10) } } : undefined
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
    await (prisma as any).projectExpense.delete({ where: { id } });
    return success(res, null, 'Deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};