import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const logActivity = (action: string, entityType: string) => async (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body && body.success && req.user) {
      prisma.activityLog.create({
        data: {
          userId: req.user.id,
          userName: req.user.name,
          action,
          entityType,
          entityId: body.data?.id || null,
          entityName: body.data?.name || body.data?.poNumber || body.data?.po_number || null,
          ipAddress: req.ip || null
        }
      }).catch(() => {
        // Silent fail for logging
      });
    }
    return originalJson(body);
  };
  next();
};
