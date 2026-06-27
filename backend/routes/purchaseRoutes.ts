import express from 'express';
import { body } from 'express-validator';
import { getAll, getOne, create, updateStatus, remove } from '../controllers/purchaseController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authorize('admin', 'project_manager', 'procurement_staff'), [
  body('supplier_id').isInt().withMessage('Supplier required'),
  body('order_date').notEmpty().withMessage('Valid date required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required')
], validate, create);
router.patch('/:id/status', authorize('admin', 'project_manager', 'procurement_staff'), updateStatus);
router.put('/:id/status', authorize('admin', 'project_manager', 'procurement_staff'), updateStatus);
router.delete('/:id', authorize('admin', 'procurement_staff'), remove);

export default router;
