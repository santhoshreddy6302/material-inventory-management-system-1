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
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.MaterialUsageWhereInput = {};
    if (siteId) where.siteId = parseInt(siteId, 10);
    if (materialId) where.materialId = parseInt(materialId, 10);
    
    if (fromDate || toDate) {
      where.usageDate = {};
      if (fromDate) where.usageDate.gte = new Date(fromDate);
      if (toDate) where.usageDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }
    
    if (search) {
      where.OR = [
        { purpose: { contains: search } },
        { material: { name: { contains: search } } },
        { site: { name: { contains: search } } }
      ];
    }

    const total = await prisma.materialUsage.count({ where });
    const usage = await prisma.materialUsage.findMany({
      where,
      orderBy: [
        { usageDate: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit,
      include: {
        material: { select: { name: true, unit: true, materialCode: true, costPerUnit: true } },
        site: {
          select: {
            name: true,
            project: { select: { name: true } }
          }
        },
        recorder: { select: { name: true } }
      }
    });

    const formatted = usage.map(u => ({
      ...u,
      material_name: u.material?.name,
      unit: u.material?.unit,
      material_code: u.material?.materialCode,
      cost_per_unit: u.material?.costPerUnit,
      site_name: u.site?.name,
      project_name: u.site?.project?.name,
      recorded_by_name: u.recorder?.name
    }));

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { site_id, material_id, quantity_used, usage_date, purpose, work_type, floor_level, remarks } = req.body;
    const qty = parseFloat(quantity_used);
    const mId = parseInt(material_id, 10);
    const sId = parseInt(site_id, 10);
    
    const newUsage = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findFirst({
        where: { materialId: mId, siteId: sId }
      });
      
      if (!inv || Number(inv.currentStock) < qty) {
        throw new Error(`Insufficient stock. Available: ${inv ? inv.currentStock : 0}`);
      }
      
      const material = await tx.material.findUnique({ where: { id: mId } });
      const unitCost = material ? Number(material.costPerUnit) : 0;
      const totalCost = unitCost * qty;
      const code = generateCode_with_timestamp('USE');
      
      const usageRec = await tx.materialUsage.create({
        data: {
          usageCode: code,
          siteId: sId,
          materialId: mId,
          quantityUsed: qty,
          unitCost,
          totalCost,
          usageDate: new Date(usage_date),
          purpose: purpose || null,
          workType: work_type || null,
          floorLevel: floor_level || null,
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
          transactionType: 'usage',
          quantity: -qty,
          balanceAfter: newStock,
          unitCost,
          totalCost,
          referenceId: usageRec.id,
          referenceType: 'material_usage',
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
      
      return usageRec;
    }, {
      timeout: 20000
    });
    
    return created(res, newUsage, 'Usage recorded successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const siteId = req.query.site_id as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.MaterialUsageWhereInput = {};
    if (siteId) where.siteId = parseInt(siteId, 10);
    if (fromDate || toDate) {
      where.usageDate = {};
      if (fromDate) where.usageDate.gte = new Date(fromDate);
      if (toDate) where.usageDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const usages = await prisma.materialUsage.findMany({
      where,
      include: { material: true, site: true }
    });

    const matGroup: Record<string, any> = {};
    const siteGroup: Record<string, any> = {};
    const monthGroup: Record<string, any> = {};

    usages.forEach(u => {
      // By Material
      const mName = u.material?.name || 'Unknown';
      if (!matGroup[mName]) {
        matGroup[mName] = { name: mName, unit: u.material?.unit, total_qty: 0, total_cost: 0 };
      }
      matGroup[mName].total_qty += Number(u.quantityUsed);
      matGroup[mName].total_cost += Number(u.totalCost || 0);

      // By Site
      const sName = u.site?.name || 'Unknown';
      if (!siteGroup[sName]) {
        siteGroup[sName] = { site_name: sName, total_cost: 0, records: 0 };
      }
      siteGroup[sName].total_cost += Number(u.totalCost || 0);
      siteGroup[sName].records += 1;

      // Monthly
      const month = u.usageDate.toISOString().substring(0, 7);
      if (!monthGroup[month]) {
        monthGroup[month] = { month, total_cost: 0, total_qty: 0 };
      }
      monthGroup[month].total_cost += Number(u.totalCost || 0);
      monthGroup[month].total_qty += Number(u.quantityUsed);
    });

    const byMaterial = Object.values(matGroup).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);
    const bySite = Object.values(siteGroup).sort((a, b) => b.total_cost - a.total_cost);
    const monthly = Object.values(monthGroup).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);

    return success(res, { byMaterial, bySite, monthly });
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
