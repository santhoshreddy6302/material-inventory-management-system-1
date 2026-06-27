import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const type = req.query.type as string;
    const severity = req.query.severity as string;
    const isReadStr = req.query.is_read as string;
    const isResolvedStr = req.query.is_resolved as string;

    const where: Prisma.AlertWhereInput = {};
    if (type) where.type = type as any;
    if (severity) where.severity = severity as any;
    if (isReadStr !== undefined) where.isRead = isReadStr === 'true';
    if (isResolvedStr !== undefined) where.isResolved = isResolvedStr === 'true';

    const total = await prisma.alert.count({ where });
    const alerts = await prisma.alert.findMany({
      where,
      include: {
        material: { select: { name: true, unit: true } },
        site: { select: { name: true } },
        purchaseOrder: { select: { poNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    const formatted = alerts.map(a => ({
      ...a,
      material_name: a.material?.name,
      unit: a.material?.unit,
      site_name: a.site?.name,
      po_number: a.purchaseOrder?.poNumber,
      is_read: a.isRead,
      is_resolved: a.isResolved,
      resolved_at: a.resolvedAt,
      created_at: a.createdAt
    }));

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length) {
      await prisma.alert.updateMany({
        where: { id: { in: ids.map((id: any) => parseInt(id, 10)) } },
        data: { isRead: true }
      });
    } else {
      await prisma.alert.updateMany({
        data: { isRead: true }
      });
    }
    return success(res, null, 'Alerts marked as read');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const resolve = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.alert.update({
      where: { id },
      data: { isResolved: true, isRead: true, resolvedAt: new Date() }
    });
    return success(res, null, 'Alert resolved');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.alert.count({
      where: { isRead: false, isResolved: false }
    });
    return success(res, { count });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
