import express from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', authorize('admin', 'project_manager'), create);
router.put('/:id', authorize('admin', 'project_manager'), update);
router.delete('/:id', authorize('admin'), remove);

export default router;
