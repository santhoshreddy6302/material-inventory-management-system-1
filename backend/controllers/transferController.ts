import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode_with_timestamp } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const status = req.query.status as string;
    const fromSiteId = req.query.from_site_id as string;
    const toSiteId = req.query.to_site_id as string;

    const where: Prisma.StockTransferWhereInput = {};
    if (status) where.status = status as any;
    if (fromSiteId) where.fromSiteId = parseInt(fromSiteId, 10);
    if (toSiteId) where.toSiteId = parseInt(toSiteId, 10);

    const total = await prisma.stockTransfer.count({ where });
    const transfers = await prisma.stockTransfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        fromSite: { select: { name: true } },
        toSite: { select: { name: true } },
        material: { select: { name: true, unit: true, materialCode: true } },
        requester: { select: { name: true } },
        approver: { select: { name: true } }
      }
    });

    const formatted = transfers.map(t => ({
      ...t,
      from_site_name: t.fromSite?.name,
      to_site_name: t.toSite?.name,
      material_name: t.material?.name,
      unit: t.material?.unit,
      material_code: t.material?.materialCode,
      requested_by_name: t.requester?.name,
      approved_by_name: t.approver?.name
    }));

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { from_site_id, to_site_id, material_id, quantity, transfer_date, reason } = req.body;
    
    if (from_site_id === to_site_id) {
      return error(res, 'Source and destination sites cannot be the same', 400);
    }
    
    const fId = parseInt(from_site_id, 10);
    const tId = parseInt(to_site_id, 10);
    const mId = parseInt(material_id, 10);
    const qty = parseFloat(quantity);
    
    const inv = await prisma.inventory.findFirst({
      where: { materialId: mId, siteId: fId }
    });
    
    if (!inv || Number(inv.currentStock) < qty) {
      return error(res, `Insufficient stock. Available: ${inv ? inv.currentStock : 0}`, 400);
    }
    
    const code = generateCode_with_timestamp('TRF');
    const transfer = await prisma.stockTransfer.create({
      data: {
        transferCode: code,
        fromSiteId: fId,
        toSiteId: tId,
        materialId: mId,
        quantity: qty,
        transferDate: new Date(transfer_date),
        reason: reason || null,
        requestedBy: (req as any).user.id,
        status: 'pending'
      }
    });
    
    return created(res, { id: transfer.id, transfer_code: code }, 'Transfer request created');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) return error(res, 'Transfer not found', 404);
    
    if (status === 'completed' && transfer.status !== 'in_transit' && transfer.status !== 'pending') {
      return error(res, 'Invalid status transition', 400);
    }
    
    await prisma.$transaction(async (tx) => {
      if (status === 'completed') {
        const srcInv = await tx.inventory.findFirst({
          where: { materialId: transfer.materialId, siteId: transfer.fromSiteId }
        });
        
        if (!srcInv || Number(srcInv.currentStock) < Number(transfer.quantity)) {
          throw new Error('Insufficient stock at source site');
        }
        
        const newSrcStock = Number(srcInv.currentStock) - Number(transfer.quantity);
        await tx.inventory.update({
          where: { id: srcInv.id },
          data: { currentStock: newSrcStock }
        });
        
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: srcInv.id,
            materialId: transfer.materialId,
            siteId: transfer.fromSiteId,
            transactionType: 'transfer_out',
            quantity: -Number(transfer.quantity),
            balanceAfter: newSrcStock,
            referenceId: transfer.id,
            referenceType: 'stock_transfer',
            notes: 'Transfer to site',
            createdBy: (req as any).user.id
          }
        });
        
        let dstInv = await tx.inventory.findFirst({
          where: { materialId: transfer.materialId, siteId: transfer.toSiteId }
        });
        
        let newDstStock = Number(transfer.quantity);
        let dstInvId = 0;
        
        if (!dstInv) {
          const newInv = await tx.inventory.create({
            data: {
              materialId: transfer.materialId,
              siteId: transfer.toSiteId,
              currentStock: newDstStock
            }
          });
          dstInvId = newInv.id;
        } else {
          newDstStock = Number(dstInv.currentStock) + Number(transfer.quantity);
          const updated = await tx.inventory.update({
            where: { id: dstInv.id },
            data: { currentStock: newDstStock }
          });
          dstInvId = updated.id;
        }
        
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: dstInvId,
            materialId: transfer.materialId,
            siteId: transfer.toSiteId,
            transactionType: 'transfer_in',
            quantity: Number(transfer.quantity),
            balanceAfter: newDstStock,
            referenceId: transfer.id,
            referenceType: 'stock_transfer',
            notes: 'Transfer from site',
            createdBy: (req as any).user.id
          }
        });
        
        await tx.stockTransfer.update({
          where: { id },
          data: { status, approvedBy: (req as any).user.id }
        });
      } else {
        await tx.stockTransfer.update({
          where: { id },
          data: { status }
        });
      }
    }, {
      timeout: 20000
    });
    
    return success(res, null, 'Transfer status updated');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
