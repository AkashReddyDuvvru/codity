import { Router } from 'express';
import { submitJob, listJobs, getJobDetails } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/:queueId', submitJob);
router.get('/:queueId', listJobs);
router.get('/detail/:id', getJobDetails);

export default router;
