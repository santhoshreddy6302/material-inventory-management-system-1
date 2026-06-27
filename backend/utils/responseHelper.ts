import { Response } from 'express';

export const success = (res: Response, data: any = null, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const created = (res: Response, data: any = null, message: string = 'Created successfully') => {
  return success(res, data, message, 201);
};

export const error = (res: Response, message: string = 'Internal server error', statusCode: number = 500, errors: any = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

export const paginated = (res: Response, data: any[], total: number, page: number | string, limit: number | string, message: string = 'Success') => {
  const p = typeof page === 'string' ? parseInt(page, 10) : page;
  const l = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    },
    timestamp: new Date().toISOString()
  });
};
