import express from 'express';
import { getAll, markRead, resolve, getUnreadCount } from '../controllers/alertController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markRead);
router.put('/:id/resolve', resolve);

export default router;
