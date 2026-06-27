const fs = require('fs');
const path = require('path');

const modules = [
  { name: 'labour', model: 'labourAttendance', Controller: 'labourController', Routes: 'labourRoutes' },
  { name: 'expense', model: 'projectExpense', Controller: 'expenseController', Routes: 'expenseRoutes' },
  { name: 'enquiry', model: 'clientEnquiry', Controller: 'enquiryController', Routes: 'enquiryRoutes' },
  { name: 'milestone', model: 'paymentMilestone', Controller: 'milestoneController', Routes: 'milestoneRoutes' },
  { name: 'subcontractor', model: 'subcontractorTask', Controller: 'subcontractorController', Routes: 'subcontractorRoutes' },
  { name: 'machinery', model: 'equipmentMachinery', Controller: 'machineryController', Routes: 'machineryRoutes' },
  { name: 'progress', model: 'siteProgress', Controller: 'progressController', Routes: 'progressRoutes' }
];

modules.forEach(m => {
  const cPath = path.join(__dirname, 'backend', 'controllers', `${m.Controller}.ts`);
  const rPath = path.join(__dirname, 'backend', 'routes', `${m.Routes}.ts`);

  const controllerCode = `
import { Request, Response } from 'express';
import prisma from '../config/database';
import { success, created, error, paginated } from '../utils/responseHelper';
import { parseFilters } from '../utils/helpers';

export const getAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parseFilters(req.query);
    const total = await (prisma as any).${m.model}.count();
    const rows = await (prisma as any).${m.model}.findMany({
      skip: offset,
      take: limit,
      orderBy: { id: 'desc' }
    });
    return paginated(res, rows, total, page, limit);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await (prisma as any).${m.model}.findUnique({ where: { id } });
    if (!row) return error(res, 'Not found', 404);
    return success(res, row);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const formattedData: any = {};
    for (const [k, v] of Object.entries(req.body)) {
      const camel = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
      if (camel.toLowerCase().includes('date') && typeof v === 'string') {
        formattedData[camel] = new Date(v);
      } else {
        formattedData[camel] = v;
      }
    }

    const row = await (prisma as any).${m.model}.create({ data: formattedData });
    return created(res, row, 'Created successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const formattedData: any = {};
    for (const [k, v] of Object.entries(req.body)) {
      const camel = k.replace(/_([a-z])/g, g => g[1].toUpperCase());
      if (camel.toLowerCase().includes('date') && typeof v === 'string') {
        formattedData[camel] = new Date(v);
      } else {
        formattedData[camel] = v;
      }
    }

    const row = await (prisma as any).${m.model}.update({
      where: { id },
      data: formattedData
    });
    return success(res, row, 'Updated successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await (prisma as any).${m.model}.delete({ where: { id } });
    return success(res, null, 'Deleted successfully');
  } catch (err: any) {
    return error(res, err.message, 500);
  }
};
`;

  const routeCode = `
import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/${m.Controller}';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
`;

  fs.writeFileSync(cPath, controllerCode.trim());
  fs.writeFileSync(rPath, routeCode.trim());
});

console.log('ERP modules generated');
