import express from 'express';
import { getAll, getSiteInventory, getTransactions, adjustStock } from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/', getAll);
router.get('/transactions', getTransactions);
router.get('/site/:site_id', getSiteInventory);
router.post('/', authorize('admin', 'site_engineer'), adjustStock);
router.post('/adjust', authorize('admin', 'site_engineer'), adjustStock);

export default router;
