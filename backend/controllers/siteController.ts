import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const projectId = req.query.project_id as string;
    const isActiveStr = req.query.is_active as string;

    const where: Prisma.SiteWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { siteCode: { contains: search } }
      ];
    }
    if (projectId) {
      where.projectId = parseInt(projectId, 10);
    }
    if (isActiveStr !== undefined) {
      where.isActive = isActiveStr === 'true';
    }

    const total = await prisma.site.count({ where });
    const sites = await prisma.site.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        project: { select: { name: true } },
        engineer: { select: { name: true } }
      }
    });

    const formattedSites = sites.map(s => ({
      ...s,
      project_name: s.project?.name,
      engineer_name: s.engineer?.name
    }));

    return paginated(res, formattedSites, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getAll_simple = async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        siteCode: true,
        projectId: true
      },
      orderBy: { name: 'asc' }
    });
    return success(res, sites);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, location, address, project_id, engineer_id } = req.body;
    const code = generateCode('SITE');
    
    const newSite = await prisma.site.create({
      data: {
        siteCode: code,
        name: name.trim(),
        location: location || null,
        address: address || null,
        projectId: project_id ? parseInt(project_id, 10) : null,
        engineerId: engineer_id ? parseInt(engineer_id, 10) : null
      },
      include: {
        project: { select: { name: true } }
      }
    });
    
    const formatted = {
      ...newSite,
      project_name: newSite.project?.name
    };
    
    return created(res, formatted, 'Site created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, location, address, project_id, engineer_id, is_active } = req.body;
    
    const exists = await prisma.site.findUnique({ where: { id } });
    if (!exists) return error(res, 'Site not found', 404);
    
    const updated = await prisma.site.update({
      where: { id },
      data: {
        name: name?.trim(),
        location: location !== undefined ? location : undefined,
        address: address !== undefined ? address : undefined,
        projectId: project_id ? parseInt(project_id, 10) : null,
        engineerId: engineer_id ? parseInt(engineer_id, 10) : null,
        isActive: is_active !== undefined ? Boolean(is_active) : undefined
      }
    });
    
    return success(res, updated, 'Site updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    const inv = await prisma.inventory.findFirst({
      where: { siteId: id }
    });
    
    if (inv) return error(res, 'Cannot delete site with inventory records', 409);
    
    try {
      await prisma.site.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') return error(res, 'Site not found', 404);
      throw e;
    }
    
    return success(res, null, 'Site deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
