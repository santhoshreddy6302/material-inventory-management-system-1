import express from 'express';
import { body } from 'express-validator';
import { getAll, create, getStats } from '../controllers/wastageController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/stats', getStats);
router.post('/', authorize('admin','site_engineer','project_manager'), [
  body('site_id').isInt(),
  body('material_id').isInt(),
  body('quantity_wasted').isFloat({ min: 0.01 }),
  body('wastage_date').notEmpty(),
  body('reason').notEmpty()
], validate, create);

export default router;
