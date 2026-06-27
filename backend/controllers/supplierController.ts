import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const isActiveStr = req.query.is_active as string;

    const where: Prisma.SupplierWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { supplierCode: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (isActiveStr !== undefined) {
      where.isActive = isActiveStr === 'true';
    }

    const total = await prisma.supplier.count({ where });

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        purchaseOrders: {
          where: {
            status: { notIn: ['cancelled', 'draft'] }
          },
          select: { totalAmount: true }
        }
      }
    });

    const formattedSuppliers = suppliers.map(s => {
      const total_orders = s.purchaseOrders.length;
      const total_purchased = s.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
      
      const { purchaseOrders, ...supplierData } = s;
      
      return {
        ...supplierData,
        total_orders,
        total_purchased
      };
    });

    return paginated(res, formattedSuppliers, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getAll_simple = async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        supplierCode: true,
        phone: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });
    return success(res, suppliers);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, contact_person, email, phone, address, city, state, gst_number, payment_terms, credit_limit, notes } = req.body;
    const code = generateCode('SUP');
    
    const newSupplier = await prisma.supplier.create({
      data: {
        supplierCode: code,
        name: name.trim(),
        contactPerson: contact_person || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        gstNumber: gst_number || null,
        paymentTerms: payment_terms || null,
        creditLimit: credit_limit || 0,
        notes: notes || null
      }
    });
    
    return created(res, newSupplier, 'Supplier created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, contact_person, email, phone, address, city, state, gst_number, payment_terms, credit_limit, notes, is_active, rating } = req.body;
    
    const exists = await prisma.supplier.findUnique({ where: { id } });
    if (!exists) return error(res, 'Supplier not found', 404);
    
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name?.trim(),
        contactPerson: contact_person !== undefined ? contact_person : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        gstNumber: gst_number !== undefined ? gst_number : undefined,
        paymentTerms: payment_terms !== undefined ? payment_terms : undefined,
        creditLimit: credit_limit !== undefined ? credit_limit : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: is_active !== undefined ? Boolean(is_active) : undefined,
        rating: rating !== undefined ? rating : undefined
      }
    });
    
    return success(res, updated, 'Supplier updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    const orders = await prisma.purchaseOrder.findFirst({
      where: { supplierId: id }
    });
    
    if (orders) return error(res, 'Cannot delete supplier with purchase orders', 409);
    
    try {
      await prisma.supplier.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') return error(res, 'Supplier not found', 404);
      throw e;
    }
    
    return success(res, null, 'Supplier deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
