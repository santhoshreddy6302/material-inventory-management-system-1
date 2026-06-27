import express from 'express';
import { getAll, create, updateStatus } from '../controllers/transferController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.post('/', authorize('admin', 'site_engineer', 'project_manager'), create);
router.put('/:id/status', authorize('admin', 'project_manager'), updateStatus);

export default router;
