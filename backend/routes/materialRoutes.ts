import express from 'express';
import { body } from 'express-validator';
import { getAll, getOne, create, update, remove, getCategories, createCategory, getLowStock } from '../controllers/materialController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/low-stock', getLowStock);
router.get('/categories', getCategories);
router.post('/categories', authorize('admin', 'procurement_staff'), [
  body('name').trim().notEmpty().withMessage('Category name required')
], validate, createCategory);
router.get('/:id', getOne);
router.post('/', authorize('admin', 'procurement_staff'), [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('unit').notEmpty().withMessage('Unit required'),
  body('cost_per_unit').isNumeric().withMessage('Valid cost required'),
  body('minimum_threshold').isNumeric().withMessage('Valid threshold required')
], validate, create);
router.put('/:id', authorize('admin', 'procurement_staff'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
