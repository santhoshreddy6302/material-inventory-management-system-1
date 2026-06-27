import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { error } from '../utils/responseHelper';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Validation failed', 422, errors.array().map(e => ({
      field: (e as any).path || (e as any).param,
      message: e.msg
    })));
  }
  next();
};

export default validate;
