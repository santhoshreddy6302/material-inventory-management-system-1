import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode_with_timestamp } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const siteId = req.query.site_id as string;
    const materialId = req.query.material_id as string;
    const reason = req.query.reason as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.WastageRecordWhereInput = {};
    if (siteId) where.siteId = parseInt(siteId, 10);
    if (materialId) where.materialId = parseInt(materialId, 10);
    if (reason) where.reason = reason as any;
    
    if (fromDate || toDate) {
      where.wastageDate = {};
      if (fromDate) where.wastageDate.gte = new Date(fromDate);
      if (toDate) where.wastageDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }
    
    if (search) {
      where.OR = [
        { material: { name: { contains: search } } },
        { site: { name: { contains: search } } }
      ];
    }

    const total = await prisma.wastageRecord.count({ where });
    const records = await prisma.wastageRecord.findMany({
      where,
      orderBy: { wastageDate: 'desc' },
      skip: offset,
      take: limit,
      include: {
        material: { select: { name: true, unit: true, materialCode: true } },
        site: { select: { name: true } },
        recorder: { select: { name: true } }
      }
    });

    const formatted = records.map(w => ({
      ...w,
      material_name: w.material?.name,
      unit: w.material?.unit,
      material_code: w.material?.materialCode,
      site_name: w.site?.name,
      recorded_by_name: w.recorder?.name
    }));

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { site_id, material_id, quantity_wasted, wastage_date, reason, description, preventable, remarks } = req.body;
    const qty = parseFloat(quantity_wasted);
    const mId = parseInt(material_id, 10);
    const sId = parseInt(site_id, 10);
    
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findFirst({
        where: { materialId: mId, siteId: sId }
      });
      
      if (!inv || Number(inv.currentStock) < qty) {
        throw new Error(`Insufficient stock. Available: ${inv ? inv.currentStock : 0}`);
      }
      
      const material = await tx.material.findUnique({ where: { id: mId } });
      const unitCost = material ? Number(material.costPerUnit) : 0;
      const totalCost = unitCost * qty;
      const code = generateCode_with_timestamp('WST');
      
      const record = await tx.wastageRecord.create({
        data: {
          wastageCode: code,
          siteId: sId,
          materialId: mId,
          quantityWasted: qty,
          unitCost,
          totalCost,
          wastageDate: new Date(wastage_date),
          reason,
          description: description || null,
          preventable: Boolean(preventable),
          remarks: remarks || null,
          recordedBy: (req as any).user.id
        }
      });
      
      const newStock = Number(inv.currentStock) - qty;
      await tx.inventory.update({
        where: { id: inv.id },
        data: { currentStock: newStock }
      });
      
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inv.id,
          materialId: mId,
          siteId: sId,
          transactionType: 'wastage',
          quantity: -qty,
          balanceAfter: newStock,
          unitCost,
          totalCost,
          referenceId: record.id,
          referenceType: 'wastage_record',
          createdBy: (req as any).user.id
        }
      });
      
      if (material) {
        const threshold = Number(material.minimumThreshold);
        if (newStock <= 0) {
          await tx.alert.create({
            data: {
              type: 'out_of_stock',
              title: `Out of Stock: ${material.name}`,
              message: `Material "${material.name}" is out of stock at site`,
              materialId: mId,
              siteId: sId,
              severity: 'critical'
            }
          });
        } else if (newStock <= threshold) {
          await tx.alert.create({
            data: {
              type: 'low_stock',
              title: `Low Stock: ${material.name}`,
              message: `Material "${material.name}" is below minimum threshold (${threshold})`,
              materialId: mId,
              siteId: sId,
              severity: 'high'
            }
          });
        }
      }
      
      return { id: record.id, code };
    }, {
      timeout: 20000
    });
    
    return created(res, result, 'Wastage recorded successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const siteId = req.query.site_id as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.WastageRecordWhereInput = {};
    if (siteId) where.siteId = parseInt(siteId, 10);
    if (fromDate || toDate) {
      where.wastageDate = {};
      if (fromDate) where.wastageDate.gte = new Date(fromDate);
      if (toDate) where.wastageDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const wastages = await prisma.wastageRecord.findMany({
      where,
      include: { material: true }
    });

    const reasonGroup: Record<string, any> = {};
    const matGroup: Record<string, any> = {};
    const monthGroup: Record<string, any> = {};

    wastages.forEach(w => {
      // By Reason
      const r = w.reason || 'other';
      if (!reasonGroup[r]) reasonGroup[r] = { reason: r, count: 0, total_cost: 0 };
      reasonGroup[r].count++;
      reasonGroup[r].total_cost += Number(w.totalCost || 0);

      // By Material
      const mName = w.material?.name || 'Unknown';
      if (!matGroup[mName]) matGroup[mName] = { name: mName, unit: w.material?.unit, total_qty: 0, total_cost: 0 };
      matGroup[mName].total_qty += Number(w.quantityWasted);
      matGroup[mName].total_cost += Number(w.totalCost || 0);

      // Monthly
      const month = w.wastageDate.toISOString().substring(0, 7);
      if (!monthGroup[month]) monthGroup[month] = { month, total_cost: 0 };
      monthGroup[month].total_cost += Number(w.totalCost || 0);
    });

    const byReason = Object.values(reasonGroup).sort((a, b) => b.total_cost - a.total_cost);
    const byMaterial = Object.values(matGroup).sort((a, b) => b.total_cost - a.total_cost).slice(0, 10);
    const monthly = Object.values(monthGroup).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);

    return success(res, { byReason, byMaterial, monthly });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
