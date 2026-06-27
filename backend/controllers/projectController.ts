import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters, generateCode } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset, search } = parseFilters(req.query);
    const status = req.query.status as string;

    const where: Prisma.ProjectWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { projectCode: { contains: search } },
        { clientName: { contains: search } },
      ];
    }
    if (status) {
      where.status = status as any;
    }

    const total = await prisma.project.count({ where });
    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        manager: { select: { name: true } },
        _count: {
          select: { sites: true }
        }
      }
    });

    const formattedProjects = projects.map(p => {
      const { _count, ...projectData } = p;
      return {
        ...projectData,
        manager_name: p.manager?.name,
        site_count: _count.sites
      };
    });

    return paginated(res, formattedProjects, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: { select: { name: true } },
        sites: {
          include: {
            engineer: { select: { name: true } }
          }
        }
      }
    });
    
    if (!project) return error(res, 'Project not found', 404);
    
    const formattedSites = project.sites.map(s => ({
      ...s,
      engineer_name: s.engineer?.name
    }));

    const formattedProject = {
      ...project,
      manager_name: project.manager?.name,
      sites: formattedSites
    };
    
    return success(res, formattedProject);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { name, description, location, client_name, start_date, end_date, budget, status, manager_id } = req.body;
    const code = generateCode('PRJ');
    
    const newProject = await prisma.project.create({
      data: {
        projectCode: code,
        name: name.trim(),
        description: description || null,
        location: location || null,
        clientName: client_name || null,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        budget: budget || 0,
        status: status || 'planning',
        managerId: manager_id ? parseInt(manager_id, 10) : null,
        createdBy: (req as any).user.id
      },
      include: {
        manager: { select: { name: true } }
      }
    });
    
    const formatted = {
      ...newProject,
      manager_name: newProject.manager?.name
    };
    
    return created(res, formatted, 'Project created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, location, client_name, start_date, end_date, budget, status, manager_id } = req.body;
    
    const exists = await prisma.project.findUnique({ where: { id } });
    if (!exists) return error(res, 'Project not found', 404);
    
    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        clientName: client_name !== undefined ? client_name : undefined,
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
        budget: budget !== undefined ? budget : undefined,
        status: status !== undefined ? status : undefined,
        managerId: manager_id ? parseInt(manager_id, 10) : null
      },
      include: {
        manager: { select: { name: true } }
      }
    });
    
    const formatted = {
      ...updated,
      manager_name: updated.manager?.name
    };
    
    return success(res, formatted, 'Project updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    const sites = await prisma.site.findFirst({
      where: { projectId: id }
    });
    
    if (sites) return error(res, 'Cannot delete project with associated sites', 409);
    
    try {
      await prisma.project.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') return error(res, 'Project not found', 404);
      throw e;
    }
    
    return success(res, null, 'Project deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
