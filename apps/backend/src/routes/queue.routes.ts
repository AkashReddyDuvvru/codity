import { Router } from 'express';
import { createQueue, listQueues, pauseQueue, resumeQueue, deleteQueue } from '../controllers/queue.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/:projectId', createQueue);
router.get('/:projectId', listQueues);
router.put('/:id/pause', pauseQueue);
router.put('/:id/resume', resumeQueue);
router.delete('/:id', deleteQueue);

export default router;
