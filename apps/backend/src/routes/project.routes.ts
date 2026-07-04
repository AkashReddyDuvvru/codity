import { Router } from 'express';
import { createProject, listProjects, deleteProject } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/:orgId', createProject);
router.get('/:orgId', listProjects);
router.delete('/:id', deleteProject);

export default router;
