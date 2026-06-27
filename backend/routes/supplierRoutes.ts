import express from 'express';
import { getAll, getAll_simple, create, update, remove } from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/all', getAll_simple);
router.get('/', getAll);
router.post('/', authorize('admin', 'procurement_staff'), create);
router.put('/:id', authorize('admin', 'procurement_staff'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
