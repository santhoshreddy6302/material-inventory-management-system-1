import express from 'express';
import { getStats, getInventoryTrend, getUsageByCategory, getWastageAnalysis, getSiteConsumption, getMonthlyTrend, getRecentActivity, getLowStockItems } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.get('/stats', getStats);
router.get('/inventory-trend', getInventoryTrend);
router.get('/trend/inventory', getInventoryTrend);
router.get('/usage-by-category', getUsageByCategory);
router.get('/wastage-analysis', getWastageAnalysis);
router.get('/site-consumption', getSiteConsumption);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/recent-activity', getRecentActivity);
router.get('/low-stock', getLowStockItems);

export default router;
