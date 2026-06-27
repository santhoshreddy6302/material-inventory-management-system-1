import express from 'express';
import { getInsights } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.post('/insights', getInsights);

export default router;
