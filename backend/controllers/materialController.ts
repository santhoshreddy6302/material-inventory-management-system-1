import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode } from '../utils/helpers';
import { Prisma } from '@prisma/client';

const formatMaterial = (m: any) => ({
  ...m,
  material_code: m.materialCode,
  category_id: m.categoryId,
  cost_per_unit: Number(m.costPerUnit),
  minimum_threshold: Number(m.minimumThreshold),
  reorder_quantity: Number(m.reorderQuantity),
  supplier_id: m.supplierId,
  is_active: m.isActive,
  category_name: m.category?.name,
  category_color: m.category?.color,
  supplier_name: m.supplier?.name,
  supplier_phone: m.supplier?.phone
});

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search, sort, order } = parseFilters(req.query);
    const categoryId = req.query.category_id as string;
    const isActiveStr = req.query.is_active as string;

    const where: Prisma.MaterialWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { materialCode: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }
    if (isActiveStr !== undefined) {
      where.isActive = isActiveStr === 'true';
    }

    const total = await prisma.material.count({ where });
    
    // Sort logic mapping
    const orderBy: Prisma.MaterialOrderByWithRelationInput = {};
    if (sort && order) {
      if (['name', 'materialCode', 'unit', 'costPerUnit', 'minimumThreshold', 'reorderQuantity', 'isActive', 'createdAt'].includes(sort)) {
        orderBy[sort as keyof Prisma.MaterialOrderByWithRelationInput] = order as Prisma.SortOrder;
      } else {
        orderBy.createdAt = 'desc';
      }
    } else {
      orderBy.createdAt = 'desc';
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        category: {
          select: { name: true, color: true }
        },
        supplier: {
          select: { name: true, phone: true }
        }
      }
    });

    const formattedMaterials = materials.map(formatMaterial);

    return paginated(res, formattedMaterials, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        category: { select: { name: true } },
        supplier: { select: { name: true } }
      }
    });
    
    if (!material) return error(res, 'Material not found', 404);
    
    const formatted = formatMaterial(material);

    return success(res, formatted);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, category_id, unit, description, cost_per_unit, minimum_threshold, reorder_quantity, supplier_id, specifications } = req.body;
    const code = generateCode('MAT');
    
    const newMaterial = await prisma.material.create({
      data: {
        materialCode: code,
        name: name.trim(),
        categoryId: category_id ? parseInt(category_id, 10) : null,
        unit,
        description: description || null,
        costPerUnit: cost_per_unit || 0,
        minimumThreshold: minimum_threshold || 0,
        reorderQuantity: reorder_quantity || 0,
        supplierId: supplier_id ? parseInt(supplier_id, 10) : null,
        specifications: specifications || null
      },
      include: {
        category: { select: { name: true } }
      }
    });

    const formatted = formatMaterial(newMaterial);

    return created(res, formatted, 'Material created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { name, category_id, unit, description, cost_per_unit, minimum_threshold, reorder_quantity, supplier_id, specifications, is_active } = req.body;
    const id = parseInt(req.params.id, 10);
    
    const exists = await prisma.material.findUnique({ where: { id } });
    if (!exists) return error(res, 'Material not found', 404);
    
    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: {
        name: name?.trim(),
        categoryId: category_id ? parseInt(category_id, 10) : null,
        unit,
        description: description || null,
        costPerUnit: cost_per_unit !== undefined ? cost_per_unit : undefined,
        minimumThreshold: minimum_threshold !== undefined ? minimum_threshold : undefined,
        reorderQuantity: reorder_quantity !== undefined ? reorder_quantity : undefined,
        supplierId: supplier_id ? parseInt(supplier_id, 10) : null,
        specifications: specifications || null,
        isActive: is_active !== undefined ? Boolean(is_active) : undefined
      },
      include: {
        category: { select: { name: true } }
      }
    });

    const formatted = formatMaterial(updatedMaterial);

    return success(res, formatted, 'Material updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    const usage = await prisma.inventory.findFirst({
      where: { materialId: id }
    });
    
    if (usage) return error(res, 'Cannot delete material with inventory records', 409);
    
    try {
      await prisma.material.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') return error(res, 'Material not found', 404);
      throw e;
    }
    
    return success(res, null, 'Material deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.materialCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return success(res, categories);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;
    
    const cat = await prisma.materialCategory.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || '#6B7280'
      }
    });
    
    return created(res, cat, 'Category created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getLowStock = async (req: Request, res: Response) => {
  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      include: {
        inventory: true,
        category: { select: { name: true } }
      }
    });
    
    const lowStockMaterials = materials.map(m => {
      const totalStock = m.inventory.reduce((sum, inv) => sum + Number(inv.currentStock), 0);
      return {
        id: m.id,
        name: m.name,
        materialCode: m.materialCode,
        unit: m.unit,
        minimumThreshold: Number(m.minimumThreshold),
        total_stock: totalStock,
        category_name: m.category?.name
      };
    }).filter(m => m.total_stock <= m.minimumThreshold).sort((a, b) => a.total_stock - b.total_stock);

    return success(res, lowStockMaterials);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
