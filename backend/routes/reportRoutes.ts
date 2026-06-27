import express from 'express';
import { getInventoryReport, getPurchaseReport, getUsageReport, getWastageReport, getActivityLogs } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/inventory', getInventoryReport);
router.get('/purchase', getPurchaseReport);
router.get('/usage', getUsageReport);
router.get('/wastage', getWastageReport);
router.get('/activity-logs', getActivityLogs);

export default router;
