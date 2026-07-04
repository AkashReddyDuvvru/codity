import { Router } from 'express';
import { getMetrics } from '../controllers/metrics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/:orgId', getMetrics);

export default router;
