import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const siteId = req.query.site_id as string;
    const materialId = req.query.material_id as string;
    const lowStock = req.query.low_stock as string;

    const where: Prisma.InventoryWhereInput = {};
    if (siteId) {
      where.siteId = parseInt(siteId, 10);
    }
    if (materialId) {
      where.materialId = parseInt(materialId, 10);
    }
    if (search) {
      where.material = {
        OR: [
          { name: { contains: search } },
          { materialCode: { contains: search } }
        ]
      };
    }

    let fetchOptions: Prisma.InventoryFindManyArgs = {
      where,
      orderBy: { lastUpdated: 'desc' },
      skip: offset,
      take: limit,
      include: {
        material: {
          include: { category: true }
        },
        site: true
      }
    };

    const total = await prisma.inventory.count({ where });
    let inventory: any[] = await prisma.inventory.findMany(fetchOptions);

    if (lowStock === 'true') {
      inventory = inventory.filter(inv => Number(inv.currentStock) <= Number(inv.material.minimumThreshold));
    }

    const formattedInventory = inventory.map(i => {
      let stock_status = 'in_stock';
      const currentStockNum = Number(i.currentStock);
      const minThresholdNum = Number(i.material.minimumThreshold);
      
      if (currentStockNum <= 0) stock_status = 'out_of_stock';
      else if (currentStockNum <= minThresholdNum) stock_status = 'low_stock';

      return {
        ...i,
        material_name: i.material.name,
        material_code: i.material.materialCode,
        unit: i.material.unit,
        minimum_threshold: minThresholdNum,
        cost_per_unit: i.material.costPerUnit,
        category_name: i.material.category?.name,
        category_color: i.material.category?.color,
        site_name: i.site.name,
        stock_status
      };
    });

    return paginated(res, formattedInventory, lowStock === 'true' ? formattedInventory.length : total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getSiteInventory = async (req: Request, res: Response) => {
  try {
    const siteId = parseInt(req.params.site_id, 10);
    const inventory = await prisma.inventory.findMany({
      where: { siteId },
      include: {
        material: {
          include: { category: true }
        }
      },
      orderBy: {
        material: { name: 'asc' }
      }
    });

    const formatted = (inventory as any[]).map((i: any) => ({
      ...i,
      material_name: i.material.name,
      material_code: i.material.materialCode,
      unit: i.material.unit,
      minimum_threshold: i.material.minimumThreshold,
      cost_per_unit: i.material.costPerUnit,
      category_name: i.material.category?.name,
      category_color: i.material.category?.color
    }));

    return success(res, formatted);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const siteId = req.query.site_id as string;
    const materialId = req.query.material_id as string;
    const transactionType = req.query.transaction_type as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.InventoryTransactionWhereInput = {};
    if (siteId) where.siteId = parseInt(siteId, 10);
    if (materialId) where.materialId = parseInt(materialId, 10);
    if (transactionType) where.transactionType = transactionType as any;
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const total = await prisma.inventoryTransaction.count({ where });
    const txs = await prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        material: { select: { name: true, unit: true, materialCode: true } },
        site: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    const formatted = (txs as any[]).map((t: any) => ({
      ...t,
      material_name: t.material.name,
      unit: t.material.unit,
      material_code: t.material.materialCode,
      site_name: t.site.name,
      created_by_name: t.creator?.name
    }));

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { material_id, site_id, quantity, notes } = req.body;
    const mId = parseInt(material_id, 10);
    const sId = parseInt(site_id, 10);
    const qty = parseFloat(quantity);
    const userId = (req as any).user.id;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findFirst({
        where: { materialId: mId, siteId: sId }
      });

      let newStock = 0;
      let inventoryId = 0;

      if (!existing) {
        newStock = Math.max(0, qty);
        const newInv = await tx.inventory.create({
          data: {
            materialId: mId,
            siteId: sId,
            currentStock: newStock
          }
        });
        inventoryId = newInv.id;
      } else {
        newStock = Number(existing.currentStock) + qty;
        if (newStock < 0) throw new Error('Insufficient stock for adjustment');
        
        const updated = await tx.inventory.update({
          where: { id: existing.id },
          data: { currentStock: newStock }
        });
        inventoryId = updated.id;
      }

      await tx.inventoryTransaction.create({
        data: {
          inventoryId,
          materialId: mId,
          siteId: sId,
          transactionType: 'adjustment',
          quantity: qty,
          balanceAfter: newStock,
          notes: notes || null,
          createdBy: userId
        }
      });

      const material = await tx.material.findUnique({ where: { id: mId } });
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

      return { material_id: mId, site_id: sId, new_stock: newStock };
    }, {
      timeout: 20000
    });

    return success(res, result, 'Stock adjusted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
