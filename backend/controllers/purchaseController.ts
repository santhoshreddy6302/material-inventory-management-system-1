import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generatePONumber } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const status = req.query.status as string;
    const supplierId = req.query.supplier_id as string;
    const fromDate = req.query.from_date as string;
    const toDate = req.query.to_date as string;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (search) {
      where.OR = [
        { poNumber: { contains: search } },
        { supplier: { name: { contains: search } } }
      ];
    }
    if (status) where.status = status as any;
    if (supplierId) where.supplierId = parseInt(supplierId, 10);
    
    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const total = await prisma.purchaseOrder.count({ where });
    const pos = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        supplier: { select: { name: true, phone: true } },
        project: { select: { name: true } },
        site: { select: { name: true } },
        creator: { select: { name: true } },
        approver: { select: { name: true } },
        _count: { select: { items: true } }
      }
    });

    const formatted = pos.map(po => {
      const { _count, ...poData } = po;
      return {
        ...poData,
        supplier_name: po.supplier?.name,
        supplier_phone: po.supplier?.phone,
        project_name: po.project?.name,
        site_name: po.site?.name,
        created_by_name: po.creator?.name,
        approved_by_name: po.approver?.name,
        item_count: _count.items
      };
    });

    return paginated(res, formatted, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true, email: true, phone: true, address: true, gstNumber: true } },
        project: { select: { name: true } },
        site: { select: { name: true } },
        creator: { select: { name: true } },
        approver: { select: { name: true } },
        items: {
          include: {
            material: { select: { name: true, unit: true, materialCode: true } }
          }
        }
      }
    });

    if (!po) return error(res, 'Purchase order not found', 404);

    const formattedItems = po.items.map(i => ({
      ...i,
      material_name: i.material?.name,
      unit: i.material?.unit,
      material_code: i.material?.materialCode
    }));

    const formatted = {
      ...po,
      supplier_name: po.supplier?.name,
      supplier_email: po.supplier?.email,
      supplier_phone: po.supplier?.phone,
      supplier_address: po.supplier?.address,
      gst_number: po.supplier?.gstNumber,
      project_name: po.project?.name,
      site_name: po.site?.name,
      created_by_name: po.creator?.name,
      approved_by_name: po.approver?.name,
      items: formattedItems
    };

    return success(res, formatted);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { supplier_id, project_id, site_id, order_date, expected_delivery, notes, items, delivery_address, terms_conditions } = req.body;
    
    if (!items || !items.length) return error(res, 'At least one item is required', 400);
    
    let subtotal = 0;
    items.forEach((item: any) => { subtotal += parseFloat(item.quantity) * parseFloat(item.unit_price); });
    
    const po_number = generatePONumber();
    
    const newPo = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber: po_number,
          supplierId: parseInt(supplier_id, 10),
          projectId: project_id ? parseInt(project_id, 10) : null,
          siteId: site_id ? parseInt(site_id, 10) : null,
          orderDate: new Date(order_date),
          expectedDelivery: expected_delivery ? new Date(expected_delivery) : null,
          subtotal: subtotal,
          totalAmount: subtotal,
          notes: notes || null,
          deliveryAddress: delivery_address || null,
          termsConditions: terms_conditions || null,
          createdBy: (req as any).user.id,
          status: 'draft',
          items: {
            create: items.map((item: any) => ({
              materialId: parseInt(item.material_id, 10),
              quantity: parseFloat(item.quantity),
              unitPrice: parseFloat(item.unit_price),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unit_price),
              taxPercentage: item.tax_percentage ? parseFloat(item.tax_percentage) : 0
            }))
          }
        }
      });
      
      await tx.alert.create({
        data: {
          type: 'po_approval',
          title: `PO Approval Required: ${po_number}`,
          message: `New purchase order ${po_number} requires approval`,
          poId: po.id,
          severity: 'medium'
        }
      });
      
      return po;
    });
    
    return created(res, newPo, 'Purchase order created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const id = parseInt(req.params.id, 10);
    
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!po) return error(res, 'Purchase order not found', 404);
    
    const validTransitions: Record<string, string[]> = {
      draft: ['pending_approval', 'cancelled'],
      pending_approval: ['approved', 'cancelled'],
      approved: ['ordered', 'cancelled'],
      ordered: ['partially_received', 'received', 'cancelled'],
      partially_received: ['received', 'cancelled'],
      received: [],
      cancelled: []
    };
    
    if (!validTransitions[po.status]?.includes(status)) {
      return error(res, `Cannot transition from ${po.status} to ${status}`, 400);
    }
    
    const userRole = (req as any).user.role;
    if (status === 'approved' && userRole !== 'admin' && userRole !== 'project_manager') {
      return error(res, 'Access denied. Only Admin or Project Manager can approve purchase orders.', 403);
    }
    
    if (['received', 'partially_received', 'ordered'].includes(status) &&
        userRole !== 'admin' && userRole !== 'procurement_staff') {
      return error(res, `Access denied. Only Admin or Procurement Staff can transition to ${status}.`, 403);
    }
    
    await prisma.$transaction(async (tx) => {
      const updateData: any = { status };
      
      if (status === 'approved') {
        updateData.approvedBy = (req as any).user.id;
        updateData.approvedAt = new Date();
      }
      
      if (status === 'received' || status === 'partially_received') {
        updateData.actualDelivery = new Date();
        
        for (const item of po.items) {
          if (po.siteId) {
            const qty = status === 'received' ? Number(item.quantity) : Number(item.receivedQuantity); // Assume logic
            
            if (qty > 0) {
              const existingInv = await tx.inventory.findFirst({
                where: { materialId: item.materialId, siteId: po.siteId }
              });
              
              let invId = 0;
              let currentStock = 0;
              
              if (!existingInv) {
                const newInv = await tx.inventory.create({
                  data: {
                    materialId: item.materialId,
                    siteId: po.siteId,
                    currentStock: qty
                  }
                });
                invId = newInv.id;
                currentStock = qty;
              } else {
                currentStock = Number(existingInv.currentStock) + qty;
                await tx.inventory.update({
                  where: { id: existingInv.id },
                  data: { currentStock }
                });
                invId = existingInv.id;
              }
              
              await tx.inventoryTransaction.create({
                data: {
                  inventoryId: invId,
                  materialId: item.materialId,
                  siteId: po.siteId,
                  transactionType: 'purchase',
                  quantity: qty,
                  balanceAfter: currentStock,
                  unitCost: item.unitPrice,
                  totalCost: Number(item.unitPrice) * qty,
                  referenceId: id,
                  referenceType: 'purchase_order',
                  createdBy: (req as any).user.id
                }
              });
            }
          }
        }
      }
      
      await tx.purchaseOrder.update({
        where: { id },
        data: updateData
      });
    });
    
    return success(res, null, `Purchase order ${status.replace('_', ' ')} successfully`);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return error(res, 'Purchase order not found', 404);
    
    if (!['draft', 'cancelled'].includes(po.status)) {
      return error(res, 'Only draft or cancelled orders can be deleted', 400);
    }
    
    await prisma.purchaseOrder.delete({ where: { id } });
    return success(res, null, 'Purchase order deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
